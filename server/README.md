# Link-Help API (production)

SQLite에 Web Push 구독과 복지 행을 저장하는 Express 서버입니다. 첫 기동 시 `public/welfare-db/welfare/*.json`을 읽어 `welfare_items` 테이블을 채웁니다. 운영에서는 **AI 검색·큐레이션 파이프라인**으로 이 테이블을 갱신하는 전제를 두고, **이용자 가족 프로필은 서버에 저장하지 않습니다.**

**요구 사항:** Node.js **22.5 이상**(권장 24 LTS). DB는 네이티브 애드온 없이 내장 모듈 [`node:sqlite`](https://nodejs.org/api/sqlite.html)를 사용합니다.

## 준비

```bash
cd server
npm install
copy .env.example .env   # Windows — macOS/Linux: cp .env.example .env
```

VAPID 키 생성(루트 또는 아무 곳에서):

```bash
npx web-push generate-vapid-keys
```

`.env`에 `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`를 넣고, **프론트** 루트 `.env`의 `VITE_VAPID_PUBLIC_KEY`는 공개 키와 동일하게 맞춥니다.

## 실행

저장소 루트에서:

```bash
npm run server
```

또는 `cd server && npm start`

- `PORT` 기본값 `8787`
- `CORS_ORIGIN`: 콤마로 구분한 허용 출처(미설정 시 경고 후 `origin: true` — 개발용)
- `ADMIN_PUSH_SECRET`을 설정하면 `POST /push/send`에 헤더 `X-Link-Help-Admin: <값>` 필요

## 엔드포인트

- `GET /health` — `{ ok, subscriptions, welfare_rows }`
- `GET /welfare` — 복지 행 배열(JSON)
- `POST /smart-match` — 스마트 매칭(키워드·제외, PII 없음)
  - **A)** 클라이언트가 이미 계산한 경우:  
    `profileTags`, `includeKeywords`, `excludeKeywords`, `resultIds`, `foundCount` → 실행 이력(`smart_match_runs`) + 항목별 누적(`welfare_match_boost`)만 저장.
  - **B)** `resultIds` 없이 위 태그 배열만내면: 서버 SQLite의 복지 행에 대해 동일 규칙으로 매칭 후 응답 `items` + 위와 같이 저장.  
  (외부 LLM은 이후 같은 엔드포인트 안에 끼울 수 있음.)
- `POST /push/subscribe` — body `{ "subscription": { …PushSubscription JSON } }`
- `POST /push/send` — body `{ "title": "…", "body": "…" }` (등록된 구독에 브로드캐스트)

테스트 발송 예시:

```bash
curl -s -X POST http://localhost:8787/push/send -H "Content-Type: application/json" \
  -H "X-Link-Help-Admin: your-secret" \
  -d "{\"title\":\"Link-Help\",\"body\":\"테스트 푸시\"}"
```

(`ADMIN_PUSH_SECRET`을 비워 두었다면 `X-Link-Help-Admin` 헤더는 생략 가능합니다.)

데이터베이스 파일은 `server/data/link-help.db`이며 Git에 포함되지 않습니다.
