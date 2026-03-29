/**
 * Fetch central-government welfare list from data.go.kr (NationalWelfarelistV001).
 * Env: DATA_GO_KR_SERVICE_KEY or SERVICE_KEY — UTF-8 decoding key from 공공데이터포털.
 *
 * npm run data:welfare:national
 *
 * Output: public/welfare-db/welfare/national-from-api.json
 */
import { XMLParser } from 'fast-xml-parser';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'public/welfare-db/welfare/national-from-api.json');

const LIST_URL =
  'https://apis.data.go.kr/B554287/NationalWelfareInformationsV001/NationalWelfarelistV001';

const KEY = process.env.DATA_GO_KR_SERVICE_KEY || process.env.SERVICE_KEY;
if (!KEY?.trim()) {
  console.error('Missing DATA_GO_KR_SERVICE_KEY (or SERVICE_KEY). See docs/data-sources.md');
  process.exit(1);
}

const parser = new XMLParser({
  ignoreAttributes: false,
  trimValues: true,
  isArray: (tagName) => tagName === 'item',
});

function normalizeItem(it) {
  const servId = String(it.servId ?? it.serviceId ?? '').trim();
  const servNm = String(it.servNm ?? it.serviceNm ?? it.serviceName ?? '').trim();
  if (!servId || !servNm) return null;

  const expl = String(
    it.servDgstExpln ?? it.servDtlExpln ?? it.srvExpln ?? it.description ?? ''
  ).trim();
  const link = String(
    it.servDtlLink ?? it.linkUrl ?? it.servLink ?? it.serviceUrl ?? it.urlAddr ?? ''
  ).trim();
  const dept = String(it.buzDeptNm ?? it.deptNm ?? it.orgNm ?? it.mngDeptNm ?? '').trim();
  const life = String(it.lifeNm ?? it.lifeCycle ?? '').trim();
  const tgt = String(it.trgterIndvdlNm ?? it.trgterExpln ?? it.tgtNm ?? '').trim();

  const tags = ['전국'];
  if (life) tags.push(life);
  if (dept) tags.push(dept.slice(0, 24));

  const target = [];
  if (tgt) target.push(tgt.slice(0, 80));
  if (life) target.push(life);

  const today = new Date().toISOString().slice(0, 10);
  const portal = 'https://www.bokji.go.kr';

  return {
    id: `bokjiro_${servId}`,
    title: servNm.slice(0, 200),
    description:
      expl.slice(0, 1200) || `${servNm} — 중앙부처 복지·급여 안내(복지로·공공데이터 연계).`,
    region: ['전국'],
    target: [...new Set(target)].slice(0, 10),
    age: [],
    income: [],
    tags: [...new Set(tags)].slice(0, 14),
    benefit:
      expl.slice(0, 400) ||
      '지원 내용·신청 방법은 상세 링크 및 소관 기관 공고를 확인하세요.',
    period: '',
    apply_url: link || portal,
    status: 'active',
    created_at: today,
    updated_at: today,
    source: dept || '중앙행정기관',
    popularity: 55,
    source_url: link || portal,
    schema_version: 1,
    catalog_origin: 'bundled',
  };
}

async function fetchPage(pageNo, numOfRows) {
  const url = new URL(LIST_URL);
  url.searchParams.set('serviceKey', KEY.trim());
  url.searchParams.set('pageNo', String(pageNo));
  url.searchParams.set('numOfRows', String(numOfRows));

  const res = await fetch(url.toString());
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 300)}`);
  }

  const doc = parser.parse(text);
  const header = doc?.response?.header ?? {};
  const code = String(header.resultCode ?? header.resultcode ?? '');
  const msg = header.resultMsg ?? header.resultmsg ?? '';
  if (code && code !== '00') {
    throw new Error(`API resultCode=${code} ${msg}`);
  }

  const body = doc?.response?.body ?? {};
  const total = Number(body.totalCount ?? body.totalcount ?? 0);
  let items = body.items?.item;
  if (items == null) items = [];
  if (!Array.isArray(items)) items = [items];

  return { total, items };
}

async function main() {
  const numOfRows = 100;
  let pageNo = 1;
  let total = Infinity;
  const all = [];

  while ((pageNo - 1) * numOfRows < total) {
    const { total: t, items } = await fetchPage(pageNo, numOfRows);
    if (Number.isFinite(t) && t > 0) total = t;

    for (const it of items) {
      const r = normalizeItem(it);
      if (r) all.push(r);
    }

    console.error(
      `[fetch-national-welfare] page ${pageNo}, +${items.length} raw → ${all.length} valid, totalCount=${total}`
    );

    if (items.length === 0) break;
    pageNo += 1;
    if (pageNo > 600) {
      console.error('[fetch-national-welfare] safety stop at 600 pages');
      break;
    }
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(all, null, 2), 'utf8');
  console.log(`Wrote ${all.length} records → ${path.relative(ROOT, OUT)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
