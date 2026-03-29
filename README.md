# Link-Help

로컬 저장 기반 가족 복지·혜택 알림 웹앱입니다. 로그인 없이 브라우저에만 가족 프로필을 저장하고, 정적 복지 DB(JSON)와 태그 매칭으로 추천 목록을 보여 줍니다.

- **GitHub**: [https://github.com/HEO-J-H/link-help](https://github.com/HEO-J-H/link-help)
- **설계 메모**: 저장소 루트의 `복지 알림 시스템 Link-Help.txt`, `전체 앱 구조.txt`, `DB 구조 설계.txt`, `GitHub Repository 구조.txt`

## 기능 (MVP)

- 가족 구성원 추가·삭제, 프로필(생년월일·지역·소득 구간·학생·장애·포함/제외 태그)
- 혜택 목록·검색·상세 (`public/welfare-db`)
- 구성원별 추천(프로필에서 파생한 태그와 복지 항목 태그 교차)
- 가족 데이터 JSON보내기 / 불러오기 / 초기화
- 하단 탭: 가족 · 혜택 · 추천 · 타임라인 · 알림 · 설정
- PWA: `manifest.json` + 서비스 워커(프리캐시·`welfare-db` 런타임 캐시)
- 타임라인: 만 50·55·60… 도래 시점별 추천 미리보기
- 알림: 복지 기반 예약 목록, 브라우저 알림(설정에서 허용)
- 추천 점수: 태그 자카드 일치율(%) 표시, 혜택 목록 인기도(샘플) 정렬
- 태그 힌트: 공고문 붙여넣기 + 로컬 태그 사전 매칭(서버 없음)
- **원격 API**: 베이스 URL 설정 시 `GET /welfare`로 원격 복지를 불러와 로컬 JSON과 병합
- **Web Push**: `injectManifest` SW가 `push` 이벤트를 알림으로 표시. 설정에서 구독 시 `POST /push/subscribe` 호출
- **운영 API**: `npm run server:install` 후 `server/.env` 설정, `npm run server` → `server/README.md` 참고
- 설정에서 **서비스 안내**, **이용약관**, **개인정보 처리 안내**, **면책** 화면으로 이동 가능 (상용 전 법무 검토 권장)

## 기술 스택

React 19, TypeScript, Vite, React Router, IndexedDB(가족), `vite-plugin-pwa`

## 설치 및 실행

```bash
cd Link-Help
npm install
npm run dev
```

**앱 안에서** `/start` 또는 **설정 → 빠른 시작 안내**로 실행 순서를 볼 수 있습니다. 로컬 API까지 한 번에 켜려면(터미널 하나, `server/.env` 필요):

```bash
npm run dev:full
```

Windows에서는 `scripts\dev-full.cmd` 더블 클릭도 동일합니다(최초에 서버 패키지 자동 설치 시도).

빌드:

```bash
npm run build
npm run preview
```

**같은 Wi‑Fi에서 휴대폰으로 보려면** PC에서 `ipconfig`로 IPv4 주소를 확인한 뒤:

```bash
npm run build
npm run preview:lan
```

터미널에 나온 `Network:` 주소(예: `http://192.168.0.10:4173`)를 휴대폰 브라우저에서 엽니다. 방화벽에서 Node/Vite를 허용해야 할 수 있습니다.

원격·푸시 테스트(로컬):

1. `server/.env.example`을 복사해 VAPID 키·`CORS_ORIGIN` 등을 채웁니다.
2. 루트 `.env`에 `VITE_VAPID_PUBLIC_KEY`(서버 공개 키와 동일)를 넣습니다.
3. `npm run dev:full` (또는 터미널 두 개로 `npm run server` + `npm run dev` / `preview`)

앱 **설정**에서 **「로컬 API 주소 넣기」**를 누르거나, API 베이스 URL을 `http://localhost:8787`로 두고, **Web Push 구독** 후 터미널에서(관리 시크릿을 쓴 경우 헤더 추가):

`curl -X POST http://localhost:8787/push/send -H "Content-Type: application/json" -d "{\"title\":\"Link-Help\",\"body\":\"테스트\"}"`

## 프로젝트 구조 요약

- `src/core` — 저장소, 가족 도우미, 필터, 복지 로더
- `src/features` — 화면(가족·혜택·추천·설정)
- `src/components/layout` — 하단 네비게이션
- `public/welfare-db` — 복지·태그·지역·메타 JSON
- `src/sw.ts` — Workbox + Web Push / 알림 클릭
- `server/` — 운영 HTTP API (`/welfare`, `/push/*`, SQLite)
- `data/sample` — 샘플보내기 JSON

## 라이선스

MIT — `LICENSE` 참고.
