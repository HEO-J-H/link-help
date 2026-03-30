/**
 * Sync file-data (CSV) sources from URLs into bundled welfare JSON.
 * Skips download when ETag / Last-Modified / content SHA-256 matches last run (incremental by file).
 *
 * Manifest: scripts/data-go-kr-filedata.manifest.json
 * State (committed): scripts/data-go-kr-filedata.state.json
 * Output: public/welfare-db/welfare/data-go-kr-filedata.json
 *
 * Env:
 *   FORCE_DATA_SYNC=1 — ignore stored fingerprints and re-fetch all enabled sources
 *
 * npm run data:sync:data-go-kr-files
 */
import { parse } from 'csv-parse/sync';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const MANIFEST = path.join(__dirname, 'data-go-kr-filedata.manifest.json');
const STATE_PATH = path.join(__dirname, 'data-go-kr-filedata.state.json');
const OUT = path.join(ROOT, 'public/welfare-db/welfare/data-go-kr-filedata.json');

const FORCE = String(process.env.FORCE_DATA_SYNC ?? '').trim() === '1';

function readJson(p, fallback) {
  try {
    const t = fs.readFileSync(p, 'utf8');
    return JSON.parse(t);
  } catch {
    return fallback;
  }
}

function writeJson(p, v) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(v, null, 2), 'utf8');
}

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

async function probe(url) {
  try {
    const r = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    const etag = r.headers.get('etag');
    const lastModified = r.headers.get('last-modified');
    return { ok: r.ok, status: r.status, etag: etag || null, lastModified: lastModified || null };
  } catch (e) {
    return { ok: false, status: 0, etag: null, lastModified: null, error: String(e) };
  }
}

async function downloadBody(url) {
  const r = await fetch(url, { method: 'GET', redirect: 'follow' });
  const buf = Buffer.from(await r.arrayBuffer());
  return { ok: r.ok, status: r.status, buf };
}

function parseCsv(text, source) {
  const delimiter = source.delimiter ?? ',';
  const bom = true;
  const records = parse(text, {
    bom,
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_quotes: true,
    relax_column_count: true,
    delimiter,
  });
  return Array.isArray(records) ? records : [];
}

function rowVal(row, key) {
  if (key == null || key === '') return '';
  const v = row[key];
  if (v == null) return '';
  return String(v).trim();
}

function buildRecords(source, rows) {
  const col = source.columns || {};
  const prefix = (source.recordIdPrefix || `dgk_${source.id}_`).replace(/\s+/g, '_');
  const today = new Date().toISOString().slice(0, 10);
  const defaults = source.defaults || {};
  const hideFromMainList = Boolean(source.hideFromMainList);
  const detailUrl = String(source.detailPageUrl || source.detailUrl || '').trim();

  const out = [];
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const titleKey = col.title;
    const title = titleKey ? rowVal(row, titleKey) : '';
    if (!title) continue;

    let rid = col.id ? rowVal(row, col.id) : '';
    if (!rid) rid = String(i + 1);
    const safeId = `${prefix}${rid}`.replace(/[^\w\-_.가-힣]/g, '_').slice(0, 200);

    const desc = col.description ? rowVal(row, col.description) : '';
    const benefit = col.benefit ? rowVal(row, col.benefit) : desc.slice(0, 400);
    const apply = col.apply_url ? rowVal(row, col.apply_url) : '';
    const src = col.source ? rowVal(row, col.source) : '';
    const period = col.period ? rowVal(row, col.period) : '';
    const targetTxt = col.target ? rowVal(row, col.target) : '';
    const tagsExtra = Array.isArray(defaults.tags) ? defaults.tags : [];
    const region = Array.isArray(defaults.region) ? defaults.region : ['전국'];

    const target = [];
    if (targetTxt) target.push(targetTxt.slice(0, 120));

    const tags = [...new Set([...(defaults.extraTags || []), ...tagsExtra, '공공데이터', source.id].filter(Boolean))].slice(
      0,
      20
    );

    out.push({
      id: safeId,
      title: title.slice(0, 200),
      description: (desc || `${title} — 공공데이터포털 파일데이터 연계(자동 수집).`).slice(0, 1200),
      region,
      target: target.length ? target : ['참고'],
      age: Array.isArray(defaults.age) ? defaults.age : [],
      income: Array.isArray(defaults.income) ? defaults.income : [],
      tags,
      benefit: (benefit || '자세한 지원 내용·신청 방법은 출처·상세 페이지를 확인하세요.').slice(0, 500),
      period: period.slice(0, 120),
      apply_url: apply || detailUrl || 'https://www.data.go.kr',
      status: 'active',
      created_at: today,
      updated_at: today,
      source: src || source.publisher || '공공데이터포털',
      popularity: Number.isFinite(defaults.popularity) ? defaults.popularity : 35,
      source_url: detailUrl || apply || 'https://www.data.go.kr',
      schema_version: 1,
      catalog_origin: 'bundled',
      hide_from_main_list: hideFromMainList,
    });
  }
  return out;
}

function prefixForSource(source) {
  return (source.recordIdPrefix || `dgk_${source.id}_`).replace(/\s+/g, '_');
}

async function sourceNeedsFetch(source, state) {
  if (FORCE) return { needs: true, reason: 'FORCE_DATA_SYNC' };

  const url = String(source.csvUrl || '').trim();
  if (!url) return { needs: false, reason: 'no_csvUrl' };

  const prev = state[source.id] || {};
  const head = await probe(url);

  if (head.ok && (head.etag || head.lastModified)) {
    if (head.etag && prev.etag === head.etag) return { needs: false, reason: 'etag' };
    if (head.lastModified && prev.lastModified === head.lastModified) return { needs: false, reason: 'last-modified' };
    return { needs: true, reason: 'head-meta-changed', head };
  }

  return { needs: true, reason: head.ok ? 'no-cache-headers' : 'head-failed', head };
}

async function fetchAndIngestSource(source, state) {
  const url = String(source.csvUrl || '').trim();
  if (!url) {
    console.error(`[sync-data-go-kr-filedata] skip ${source.id}: missing csvUrl`);
    return { updated: false, records: [], statePatch: null };
  }

  const { ok, status, buf } = await downloadBody(url);
  if (!ok) {
    console.error(`[sync-data-go-kr-filedata] ${source.id}: GET ${status}`);
    return { updated: false, records: [], statePatch: null };
  }

  const digest = sha256(buf);
  const prev = state[source.id] || {};
  if (!FORCE && prev.contentSha256 === digest) {
    console.error(`[sync-data-go-kr-filedata] ${source.id}: unchanged body hash`);
    return { updated: false, records: [], statePatch: null };
  }

  // Assumes UTF-8 BOM handled by csv-parse. For EUC-KR files, convert to UTF-8 before wiring csvUrl.
  const text = buf.toString('utf8');

  const rows = parseCsv(text, source);
  const records = buildRecords(source, rows);

  let etag = prev.etag ?? null;
  let lastModified = prev.lastModified ?? null;
  const head = await probe(url);
  if (head.ok) {
    etag = head.etag || etag;
    lastModified = head.lastModified || lastModified;
  }

  console.error(
    `[sync-data-go-kr-filedata] ${source.id}: ${records.length} records (rows=${rows.length}) digest=${digest.slice(0, 12)}…`
  );

  return {
    updated: true,
    records,
    statePatch: {
      etag,
      lastModified,
      contentSha256: digest,
      csvUrl: url,
      syncedAt: new Date().toISOString(),
    },
  };
}

async function main() {
  const manifest = readJson(MANIFEST, null);
  if (!manifest || !Array.isArray(manifest.sources)) {
    console.error(`Missing or invalid manifest: ${path.relative(ROOT, MANIFEST)}`);
    process.exit(1);
  }

  const state = readJson(STATE_PATH, {});
  let existing = readJson(OUT, []);
  if (!Array.isArray(existing)) existing = [];

  let stateDirty = false;
  let catalogDirty = false;

  for (const source of manifest.sources) {
    if (source.disabled) {
      console.error(`[sync-data-go-kr-filedata] skip disabled: ${source.id}`);
      continue;
    }
    if (!source.id) {
      console.error('[sync-data-go-kr-filedata] skip source without id');
      continue;
    }

    const { needs, reason } = await sourceNeedsFetch(source, state);
    if (!needs) {
      console.error(`[sync-data-go-kr-filedata] ${source.id}: skip (${reason})`);
      continue;
    }

    const { updated, records, statePatch } = await fetchAndIngestSource(source, state);
    if (!updated || !statePatch) continue;

    const pfx = prefixForSource(source);
    existing = existing.filter((r) => !String(r.id || '').startsWith(pfx));
    existing.push(...records);
    catalogDirty = true;

    state[source.id] = { ...state[source.id], ...statePatch };
    stateDirty = true;
  }

  if (catalogDirty) {
    existing.sort((a, b) => String(a.id).localeCompare(String(b.id), 'ko'));
    writeJson(OUT, existing);
    console.log(`Wrote ${existing.length} records → ${path.relative(ROOT, OUT)}`);
  } else {
    console.log('Catalog unchanged (no source updates).');
  }

  if (stateDirty) {
    writeJson(STATE_PATH, state);
    console.log(`Updated state → ${path.relative(ROOT, STATE_PATH)}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
