# Link-Help API (선택·자가 호스팅용)

**GitHub Pages 정적 웹앱**은 이 서버 없이 동작합니다. 다만 **공용 복지 DB·공고 AI 분석·크라우드 기여**를 쓰려면 이 API를 띄우고, 앱 **설정**에 API URL(및 선택 토큰)을 넣습니다.

- `GET /welfare` — 공용 카탈로그(JSON 배열). 앱이 가져와 IndexedDB에 합칩니다.
- `POST /welfare/analyze` — 공고문 텍스트 → 한 건 `WelfareRecord` (환경에 `OPENAI_API_KEY` 있으면 LLM, 없으면 휴리스틱).
- `POST /welfare/contribute` — 클라이언트가 보낸 복지 메타 배열을 SQLite에 upsert (가족 프로필 없음).
- `POST /welfare/discover-web` — 포함 키워드로 **Google 맞춤 검색**(웹 후보). `GOOGLE_SEARCH_API_KEY`·`GOOGLE_SEARCH_ENGINE_ID` 필요. `OPENAI_API_KEY`가 있으면 스니펫 기반 참고 요약만 추가(링크 내용을 가져오지 않음).

`API_SHARED_TOKEN`을 설정하면 `analyze`/`contribute`/`discover-web`에 `Authorization: Bearer <token>` 또는 `X-Link-Help-Api-Token`이 필요합니다. 비우면 **로컬 개발만** 권장(공개 엔드포인트).

**Web Push**는 `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY`가 **둘 다** 있을 때만 활성화됩니다. 없으면 `/push/*`는 503입니다.

첫 기동 시 `public/welfare-db/welfare/*.json`이 비어 있으면 시드합니다. **이용자 가족 프로필은 서버에 저장하지 않습니다.**

**요구 사항:** Node.js **22.5 이상**(권장 24 LTS). DB는 [`node:sqlite`](https://nodejs.org/api/sqlite.html)를 사용합니다.

## 준비

```bash
cd server
npm install
copy .env.example .env   # Windows — macOS/Linux: cp .env.example .env
```

`.env`에서 최소한 `CORS_ORIGIN`(프론트 출처)을 맞춥니다. Push를 쓸 때만 VAPID 키를 생성합니다:

```bash
npx web-push generate-vapid-keys
```

프론트에서 Push를 쓰는 경우에만 루트 `.env`의 `VITE_VAPID_PUBLIC_KEY`를 공개 키와 맞춥니다.

## 실행

저장소 루트: `npm run server` 또는 `cd server && npm start`

- `PORT` 기본 `8787`
- `OPENAI_API_KEY` — 공고 분석·웹 검색 결과 요약(선택)
- `GOOGLE_SEARCH_API_KEY`, `GOOGLE_SEARCH_ENGINE_ID` — 숨은 복지 화면「웹에서 후보 찾기」(Programmable Search Engine, 전체 웹 검색 허용으로 생성)
- `ADMIN_PUSH_SECRET` — 설정 시 `POST /push/send`에 `X-Link-Help-Admin` 필요

## 엔드포인트 요약

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/health` | `welfare_rows`, `push_enabled`, `api_token_required`, `openai_configured`, `google_search_configured` |
| GET | `/welfare` | 전체 복지 JSON 배열 |
| POST | `/welfare/analyze` | `{ "text": "…" }` → `{ record, analysis_source }` |
| POST | `/welfare/discover-web` | `{ "query": "…", "regionHint?": "…", "limit?": 8 }` → `{ items[], source, llm_summary? }` |
| POST | `/welfare/contribute` | `{ "records": [ … ] }` → `{ accepted, skipped }` |
| POST | `/smart-match` | (선택) 서버 측 매칭·부스트·이력 |
| POST | `/push/subscribe`, `/push/send` | Push (VAPID 설정 시만) |

데이터베이스: `server/data/link-help.db` (Git 제외).

상세 계약: 저장소 `docs/catalog-pipeline.md`.
