/**
 * Link-Help API — SQLite welfare catalog, optional Web Push, AI analyze + crowd contribute.
 * Run: cd server && npm install && copy .env.example .env (edit) && npm start
 */
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import { DatabaseSync } from 'node:sqlite';
import webpush from 'web-push';
import crypto from 'node:crypto';
import { runSmartMatch } from './smartMatchCore.mjs';
import { parseContributionPayload } from './contributeValidate.mjs';
import { analyzeNoticeToRecord } from './analyzeNotice.mjs';
import { discoverWelfareOnWeb } from './webDiscovery.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });
const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'link-help.db');
const PORT = Number(process.env.PORT || 8787);
const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@link-help.local';

const PUSH_ENABLED = Boolean(VAPID_PUBLIC?.trim() && VAPID_PRIVATE?.trim());
if (PUSH_ENABLED) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC.trim(), VAPID_PRIVATE.trim());
} else {
  console.warn('[link-help-api] Web Push disabled (set VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY to enable).');
}

const API_SHARED_TOKEN = process.env.API_SHARED_TOKEN?.trim();

function requireApiToken(req, res, next) {
  if (!API_SHARED_TOKEN) return next();
  const auth = req.get('Authorization');
  const headerTok = req.get('X-Link-Help-Api-Token');
  const ok = auth === `Bearer ${API_SHARED_TOKEN}` || headerTok === API_SHARED_TOKEN;
  if (!ok) {
    return res.status(401).json({
      error: 'unauthorized',
      hint: 'Send Authorization: Bearer <API_SHARED_TOKEN> or X-Link-Help-Api-Token',
    });
  }
  next();
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function openDb() {
  ensureDataDir();
  const db = new DatabaseSync(DB_PATH);
  db.exec(`PRAGMA journal_mode = WAL;`);
  db.exec(`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      endpoint TEXT PRIMARY KEY,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS welfare_items (
      id TEXT PRIMARY KEY,
      payload TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS smart_match_runs (
      id TEXT PRIMARY KEY,
      profile_tags TEXT NOT NULL,
      include_keywords TEXT NOT NULL,
      exclude_keywords TEXT NOT NULL,
      result_ids TEXT NOT NULL,
      found_count INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS welfare_match_boost (
      welfare_id TEXT PRIMARY KEY,
      hit_count INTEGER NOT NULL DEFAULT 0,
      last_hit TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  return db;
}

function seedWelfareFromPublic(db) {
  const { c } = db.prepare('SELECT COUNT(*) AS c FROM welfare_items').get();
  if (c > 0) return;
  const welfareDir = path.join(__dirname, '../public/welfare-db/welfare');
  if (!fs.existsSync(welfareDir)) {
    console.warn('[link-help-api] No public/welfare-db/welfare — welfare table stays empty until you add rows.');
    return;
  }
  const insert = db.prepare(
    'INSERT OR REPLACE INTO welfare_items (id, payload) VALUES (?, ?)'
  );
  db.exec('BEGIN IMMEDIATE');
  try {
    for (const file of fs.readdirSync(welfareDir)) {
      if (!file.endsWith('.json')) continue;
      const raw = fs.readFileSync(path.join(welfareDir, file), 'utf8');
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) continue;
      for (const row of arr) {
        if (row && typeof row.id === 'string') insert.run(row.id, JSON.stringify(row));
      }
    }
    db.exec('COMMIT');
  } catch (e) {
    try {
      db.exec('ROLLBACK');
    } catch {
      /* ignore */
    }
    throw e;
  }
  const after = db.prepare('SELECT COUNT(*) AS c FROM welfare_items').get();
  console.log(`[link-help-api] Seeded ${after.c} welfare rows from public/welfare-db/welfare`);
}

/** @param {DatabaseSync} db */
function upsertWelfareItem(db, record) {
  const existing = db.prepare('SELECT payload FROM welfare_items WHERE id = ?').get(record.id);
  if (existing) {
    try {
      const old = JSON.parse(existing.payload);
      const nt = Date.parse(record.updated_at) || 0;
      const ot = Date.parse(old.updated_at || '') || 0;
      if (nt > 0 && ot > 0 && nt < ot) return false;
    } catch {
      /* replace */
    }
  }
  db.prepare('INSERT OR REPLACE INTO welfare_items (id, payload) VALUES (?, ?)').run(
    record.id,
    JSON.stringify(record)
  );
  return true;
}

const db = openDb();
seedWelfareFromPublic(db);

const app = express();
app.use(express.json({ limit: '2mb' }));

const corsRaw = process.env.CORS_ORIGIN?.trim();
if (corsRaw) {
  const origins = corsRaw.split(',').map((s) => s.trim()).filter(Boolean);
  app.use(
    cors({
      origin: origins.length === 1 ? origins[0] : origins,
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'X-Link-Help-Admin', 'X-Link-Help-Api-Token', 'Authorization'],
    })
  );
} else {
  console.warn(
    '[link-help-api] CORS_ORIGIN unset — reflecting request origin (set comma-separated origins for production).'
  );
  app.use(
    cors({
      origin: true,
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'X-Link-Help-Admin', 'X-Link-Help-Api-Token', 'Authorization'],
    })
  );
}

app.get('/health', (_req, res) => {
  const subs = db.prepare('SELECT COUNT(*) AS c FROM push_subscriptions').get();
  const wf = db.prepare('SELECT COUNT(*) AS c FROM welfare_items').get();
  res.json({
    ok: true,
    subscriptions: subs.c,
    welfare_rows: wf.c,
    push_enabled: PUSH_ENABLED,
    api_token_required: Boolean(API_SHARED_TOKEN),
    openai_configured: Boolean(process.env.OPENAI_API_KEY?.trim()),
    google_search_configured: Boolean(
      process.env.GOOGLE_SEARCH_API_KEY?.trim() && process.env.GOOGLE_SEARCH_ENGINE_ID?.trim()
    ),
  });
});

app.get('/welfare', (_req, res) => {
  const rows = db.prepare('SELECT payload FROM welfare_items ORDER BY id').all();
  const items = rows.map((r) => JSON.parse(r.payload));
  res.json(items);
});

/**
 * POST body: { text: string } — notice raw text → one WelfareRecord (OpenAI if key set, else heuristic).
 */
app.post('/welfare/analyze', requireApiToken, async (req, res) => {
  try {
    const { record, analysis_source } = await analyzeNoticeToRecord(req.body?.text, process.env);
    res.json({ ok: true, record, analysis_source });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'analyze_failed';
    if (msg === 'empty_text') return res.status(400).json({ error: msg });
    console.error('[link-help-api] /welfare/analyze', e);
    res.status(500).json({ error: msg });
  }
});

/**
 * POST body: { query: string, regionHint?: string, limit?: number }
 * Google Custom Search (keys in .env) + optional OpenAI summary of snippets.
 */
app.post('/welfare/discover-web', requireApiToken, async (req, res) => {
  try {
    const query = String(req.body?.query ?? '').trim();
    if (!query) return res.status(400).json({ error: 'query_required' });
    const regionHint =
      typeof req.body?.regionHint === 'string' ? req.body.regionHint.trim().slice(0, 120) : '';
    const limit = req.body?.limit;

    const out = await discoverWelfareOnWeb(query, regionHint, limit, process.env);
    res.json(out);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'discover_failed';
    console.error('[link-help-api] /welfare/discover-web', e);
    const detail = e instanceof Error && 'detail' in e ? String(e.detail) : '';
    res.status(502).json({ error: msg, detail: detail.slice(0, 500) });
  }
});

/**
 * POST body: { records: WelfareRecord[] } — merge into public SQLite catalog (no user PII).
 */
app.post('/welfare/contribute', requireApiToken, (req, res) => {
  try {
    const rows = parseContributionPayload(req.body);
    let accepted = 0;
    let skipped = 0;
    for (const r of rows) {
      if (upsertWelfareItem(db, r)) accepted += 1;
      else skipped += 1;
    }
    res.json({ ok: true, accepted, skipped, total: rows.length });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'bad_request';
    if (msg === 'records_must_be_array') return res.status(400).json({ error: msg });
    if (msg === 'too_many_records') return res.status(400).json({ error: msg });
    if (msg === 'no_valid_records') return res.status(400).json({ error: msg });
    res.status(400).json({ error: msg });
  }
});

/**
 * Smart match: either body.resultIds (client-computed) for persistence only,
 * or profileTags/includeKeywords/excludeKeywords only → server computes from SQLite welfare.
 */
app.post('/smart-match', (req, res) => {
  const profileTags = Array.isArray(req.body?.profileTags)
    ? req.body.profileTags.map((s) => String(s).trim()).filter(Boolean)
    : [];
  const includeKeywords = Array.isArray(req.body?.includeKeywords)
    ? req.body.includeKeywords.map((s) => String(s).trim()).filter(Boolean)
    : [];
  const excludeKeywords = Array.isArray(req.body?.excludeKeywords)
    ? req.body.excludeKeywords.map((s) => String(s).trim()).filter(Boolean)
    : [];

  let items = [];
  let resultIds = [];
  let foundCount = 0;

  if (Array.isArray(req.body?.resultIds)) {
    resultIds = req.body.resultIds.map((s) => String(s)).filter(Boolean);
    foundCount = Number(req.body?.foundCount);
    if (!Number.isFinite(foundCount)) foundCount = resultIds.length;
  } else {
    const rows = db.prepare('SELECT payload FROM welfare_items').all();
    const all = rows.map((r) => JSON.parse(r.payload));
    items = runSmartMatch(all, { profileTags, includeKeywords, excludeKeywords });
    resultIds = items.map((w) => w.id);
    foundCount = items.length;
  }

  const runId = crypto.randomUUID();
  db.prepare(
    `INSERT INTO smart_match_runs (id, profile_tags, include_keywords, exclude_keywords, result_ids, found_count)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    runId,
    JSON.stringify(profileTags),
    JSON.stringify(includeKeywords),
    JSON.stringify(excludeKeywords),
    JSON.stringify(resultIds),
    foundCount
  );

  const boost = db.prepare(
    `INSERT INTO welfare_match_boost (welfare_id, hit_count, last_hit) VALUES (?, 1, datetime('now'))
     ON CONFLICT(welfare_id) DO UPDATE SET hit_count = hit_count + 1, last_hit = datetime('now')`
  );
  for (const wid of resultIds) boost.run(wid);

  if (Array.isArray(req.body?.resultIds)) {
    return res.json({
      ok: true,
      runId,
      foundCount,
      persisted: true,
      stagesDone: ['smart_match_persist', 'welfare_match_boost'],
    });
  }

  res.json({
    ok: true,
    runId,
    foundCount,
    items,
    stagesDone: ['sqlite_welfare', 'smart_match_engine_v1', 'persist_run', 'boost_counts'],
  });
});

app.post('/push/subscribe', (req, res) => {
  if (!PUSH_ENABLED) {
    return res.status(503).json({ error: 'push_disabled', hint: 'Set VAPID keys in server/.env' });
  }
  const sub = req.body?.subscription;
  if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
    return res.status(400).json({ error: 'invalid subscription' });
  }
  db.prepare(
    `INSERT INTO push_subscriptions (endpoint, p256dh, auth) VALUES (?, ?, ?)
     ON CONFLICT(endpoint) DO UPDATE SET p256dh = excluded.p256dh, auth = excluded.auth`
  ).run(sub.endpoint, sub.keys.p256dh, sub.keys.auth);
  res.json({ ok: true });
});

app.post('/push/send', async (req, res) => {
  if (!PUSH_ENABLED) {
    return res.status(503).json({ error: 'push_disabled' });
  }
  const secret = process.env.ADMIN_PUSH_SECRET?.trim();
  if (secret && req.get('X-Link-Help-Admin') !== secret) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  const title = req.body?.title || 'Link-Help';
  const bodyText = req.body?.body ?? '';
  const payload = JSON.stringify({ title, body: bodyText });
  const rows = db.prepare('SELECT endpoint, p256dh, auth FROM push_subscriptions').all();
  let sent = 0;
  let failed = 0;
  for (const row of rows) {
    try {
      await webpush.sendNotification(
        { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
        payload
      );
      sent += 1;
    } catch {
      failed += 1;
    }
  }
  res.json({ ok: true, sent, failed });
});

app.use((_req, res) => {
  res.status(404).json({ error: 'not found' });
});

app.listen(PORT, () => {
  console.log(`[link-help-api] http://localhost:${PORT}`);
  console.log(
    '[link-help-api] GET /health  GET /welfare  POST /welfare/analyze  POST /welfare/discover-web  POST /welfare/contribute  POST /smart-match  POST /push/*'
  );
  if (API_SHARED_TOKEN) {
    console.log('[link-help-api] API_SHARED_TOKEN set — /welfare/analyze and /welfare/contribute require auth');
  } else {
    console.warn('[link-help-api] API_SHARED_TOKEN unset — analyze/contribute/discover-web are open (set token for production)');
  }
  if (process.env.ADMIN_PUSH_SECRET) {
    console.log('[link-help-api] POST /push/send requires header X-Link-Help-Admin');
  }
});
