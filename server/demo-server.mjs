/**
 * Demo API for Link-Help: GET /welfare, POST /push/subscribe, POST /push/send
 * Run from repo root: npm run server:demo
 *
 * Set VAPID_PRIVATE_KEY (and optionally VAPID_PUBLIC_KEY) to match the app's public key.
 * Defaults use the sample key pair committed for local testing only — rotate for production.
 */
import http from 'node:http';
import { URL } from 'node:url';
import webpush from 'web-push';

const PORT = Number(process.env.PORT || 8787);
const VAPID_PUBLIC =
  process.env.VAPID_PUBLIC_KEY ||
  'BEPApx4g9C_4YKc5MrSKSDP6oLYwYXVXJO6zUE7YDgUcBgowX14QgdwjgMvGKrdLpJUUDyOdsFFUoY_Oi4Dq3t0';
const VAPID_PRIVATE =
  process.env.VAPID_PRIVATE_KEY || 'a_d28g9yF-ayS6fDGn0cvlH3n74hCzMN89-ICxxCk30';

webpush.setVapidDetails('mailto:link-help@localhost', VAPID_PUBLIC, VAPID_PRIVATE);

/** @type {import('web-push').PushSubscription[]} */
const subscriptions = [];

const remoteWelfare = [
  {
    id: 'welfare_remote_001',
    title: '원격 연동 샘플 — 디지털 배움터 (예시)',
    description: '데모 서버에서 내려주는 추가 항목입니다.',
    region: ['전국'],
    target: ['청년'],
    age: ['무관'],
    income: ['무관'],
    tags: ['전국', '청년', '교육'],
    benefit: '온라인 강좌 (예시)',
    period: '2026-01-01 ~ 2026-12-31',
    apply_url: '',
    status: 'active',
    created_at: '2026-03-29',
    updated_at: '2026-03-29',
    source: 'demo-server',
    popularity: 40,
  },
];

function sendJson(res, status, obj) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(obj));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let buf = '';
    req.on('data', (c) => {
      buf += c;
      if (buf.length > 1e6) req.destroy();
    });
    req.on('end', () => resolve(buf));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  const url = new URL(req.url || '/', 'http://127.0.0.1');
  const path = url.pathname.replace(/\/$/, '') || '/';

  try {
    if (path === '/welfare' && req.method === 'GET') {
      sendJson(res, 200, remoteWelfare);
      return;
    }

    if (path === '/health' && req.method === 'GET') {
      sendJson(res, 200, { ok: true, subscriptions: subscriptions.length });
      return;
    }

    if (path === '/push/subscribe' && req.method === 'POST') {
      const raw = await readBody(req);
      const body = JSON.parse(raw || '{}');
      const sub = body.subscription;
      if (!sub || !sub.endpoint) {
        sendJson(res, 400, { error: 'missing subscription' });
        return;
      }
      const exists = subscriptions.some((s) => s.endpoint === sub.endpoint);
      if (!exists) subscriptions.push(sub);
      sendJson(res, 200, { ok: true, count: subscriptions.length });
      return;
    }

    if (path === '/push/send' && req.method === 'POST') {
      const raw = await readBody(req);
      const body = JSON.parse(raw || '{}');
      const title = body.title || 'Link-Help';
      const payload = JSON.stringify({ title, body: body.body || '' });
      const results = await Promise.allSettled(
        subscriptions.map((sub) => webpush.sendNotification(sub, payload))
      );
      const failed = results.filter((r) => r.status === 'rejected').length;
      sendJson(res, 200, { ok: true, sent: subscriptions.length - failed, failed });
      return;
    }

    sendJson(res, 404, { error: 'not found' });
  } catch (e) {
    sendJson(res, 500, { error: String(e?.message || e) });
  }
});

server.listen(PORT, () => {
  console.log(`Link-Help demo server http://localhost:${PORT}`);
  console.log('  GET  /welfare  GET /health');
  console.log('  POST /push/subscribe  POST /push/send {"title":"…","body":"…"}');
});
