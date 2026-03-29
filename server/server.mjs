/**
 * Link-Help production API — SQLite persistence for push subscriptions & welfare rows.
 * Run: cd server && npm install && copy .env.example .env (edit keys) && npm start
 */
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import { DatabaseSync } from 'node:sqlite';
import webpush from 'web-push';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });
const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'link-help.db');
const PORT = Number(process.env.PORT || 8787);
const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@link-help.local';

if (!VAPID_PUBLIC?.trim() || !VAPID_PRIVATE?.trim()) {
  console.error('[link-help-api] Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in server/.env');
  process.exit(1);
}

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC.trim(), VAPID_PRIVATE.trim());

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

const db = openDb();
seedWelfareFromPublic(db);

const app = express();
app.use(express.json({ limit: '512kb' }));

const corsRaw = process.env.CORS_ORIGIN?.trim();
if (corsRaw) {
  const origins = corsRaw.split(',').map((s) => s.trim()).filter(Boolean);
  app.use(
    cors({
      origin: origins.length === 1 ? origins[0] : origins,
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'X-Link-Help-Admin'],
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
      allowedHeaders: ['Content-Type', 'X-Link-Help-Admin'],
    })
  );
}

app.get('/health', (_req, res) => {
  const subs = db.prepare('SELECT COUNT(*) AS c FROM push_subscriptions').get();
  const wf = db.prepare('SELECT COUNT(*) AS c FROM welfare_items').get();
  res.json({ ok: true, subscriptions: subs.c, welfare_rows: wf.c });
});

app.get('/welfare', (_req, res) => {
  const rows = db.prepare('SELECT payload FROM welfare_items ORDER BY id').all();
  const items = rows.map((r) => JSON.parse(r.payload));
  res.json(items);
});

app.post('/push/subscribe', (req, res) => {
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
  console.log('[link-help-api] GET /health  GET /welfare  POST /push/subscribe  POST /push/send');
  if (process.env.ADMIN_PUSH_SECRET) {
    console.log('[link-help-api] POST /push/send requires header X-Link-Help-Admin');
  }
});
