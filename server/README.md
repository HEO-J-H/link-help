# Demo server (welfare + Web Push)

From the repository root:

```bash
npm run server:demo
```

Endpoints (CORS `*`):

- `GET /welfare` — extra welfare rows merged in the app when **설정 → API 베이스 URL** is `http://localhost:8787`
- `POST /push/subscribe` — body `{ "subscription": { ...PushSubscription JSON } }`
- `POST /push/send` — body `{ "title": "...", "body": "..." }` sends a Web Push to all subscribed clients
- `GET /health` — `{ ok, subscriptions }`

Override keys with environment variables `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` (must match the public key baked into the client, or set `VITE_VAPID_PUBLIC_KEY` in the app). The defaults are for **local testing only**.

Test push after subscribing in the app:

```bash
curl -s -X POST http://localhost:8787/push/send -H "Content-Type: application/json" -d "{\"title\":\"Link-Help\",\"body\":\"테스트 푸시\"}"
```
