# Link-Help

로컬·세션 기반 가족 복지·혜택 웹앱입니다. **브라우저만** 열면 동작하며, 태그·프로필 매칭과 스마트 매칭은 **서버 전송 없이** 클라이언트에서만 처리합니다. 기간이 지난 항목은 추천에서 빼고 목록에서만 참고할 수 있게 합니다.

- **GitHub**: [https://github.com/HEO-J-H/link-help](https://github.com/HEO-J-H/link-help)
- **설계 메모**: 저장소 루트의 `복지 알림 시스템 Link-Help.txt`, `전체 앱 구조.txt`, `DB 구조 설계.txt`, `GitHub Repository 구조.txt`

## 기능 (MVP)

- 가족 구성원 추가·삭제, 프로필(생년월일·지역·소득 구간·학생·장애·포함/제외 태그)
- 혜택 목록·검색·상세 (`public/welfare-db`)
- 구성원별 추천(프로필에서 파생한 태그와 복지 항목 태그 교차)
- **스마트 매칭**(하단 스마트): 프로필 태그 + 포함·제외 키워드 조합, 단계별 진행 표시·발견 개수(전부 클라이언트만)
- 가족 데이터 JSON보내기 / 불러오기 / 초기화(탭·창을 닫으면 입력값은 사라지고, 불러오기로 복원)
- 하단 탭: 가족 · 혜택 · 추천 · 스마트 · 타임라인 · 설정 (예정 알림·브라우저 알림은 설정 안)
- PWA: Vite가 생성하는 `manifest.webmanifest` + 서비스 워커(프리캐시·`welfare-db` 런타임 캐시)
- 타임라인: 만 50·55·60… 도래 시점별 추천 미리보기
- 알림: 복지 기반 예약 목록·브라우저 알림 허용은 **설정** 화면에서
- 프로필·태그: 혜택 목록·상세에 **프로필 매칭 %**(자카드 겹침, 참고), 목록은 **정렬 참고 점수**(번들 메타)로 정렬 가능
- 태그 힌트: 공고문 붙여넣기 + 로컬 태그 사전 매칭(서버 없음)
- 복지 IndexedDB 누적: **스마트 매칭** 결과가 이 기기에 합쳐짐(설정에서 파일 가져오기 UI는 제거)
- **(선택) 자가 호스팅**: `server/` + 빌드 시 `VITE_LINK_HELP_API_BASE` 등 — 스마트 탭에서 동의 시 기여 등
- **예전 실험용 백엔드**: `server/` 폴더(Express·SQLite 등)는 저장소에 남아 있을 수 있으나 **현재 웹앱 필수 아님**
- 설정에서 **서비스 안내**, **이용약관**, **개인정보 처리 안내**, **면책** 화면으로 이동 가능 (상용 전 법무 검토 권장)

## 기술 스택

React 19, TypeScript, Vite, React Router, sessionStorage(가족·알림·세션), `vite-plugin-pwa`

## 설치 및 실행

```bash
cd Link-Help
npm install
npm run dev
```

**앱 안에서** `/start` 또는 **설정 → 빠른 시작 안내**로 실행 순서를 볼 수 있습니다.

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

## 프로젝트 구조 요약

- `src/core` — 저장소, 가족 도우미, 필터, 복지 로더
- `src/features` — 화면(가족·혜택·추천·설정)
- `src/components/layout` — 하단 네비게이션
- `public/welfare-db` — 복지·태그·지역·메타 JSON(전국·경기·용인 등 **공식 안내 기준** 요약, 출처는 `docs/data-sources.md`)
- `src/sw.ts` — Workbox 프리캐시·내비게이션 폴백·`welfare-db` 런타임 캐시
- `server/` — (선택·레거시) 자가 호스팅 API

## GitHub Pages (`https://<user>.github.io/link-help/`)

프로젝트 사이트는 **저장소 이름이 URL 경로**가 됩니다. 배포할 때는 반드시 **`base`를 `/link-help/`**로 빌드해야 JS·복지 JSON·라우팅이 맞습니다.

```bash
npm run build:gh
```

`dist/` 내용을 Pages에 올립니다. SPA 직접 주소(예: `…/link-help/settings`)는 **`404.html`**이 `index.html`과 같아야 하므로, `build:gh`가 빌드 후 `dist/404.html`을 자동으로 복사합니다.

**자동 배포(선택):** 저장소 **Settings → Pages → Build and deployment → Source: GitHub Actions**로 바꾼 뒤, `main`에 푸시하면 `.github/workflows/deploy-pages.yml`이 `build:gh` 결과를 게시합니다.

**참고:** GitHub Pages는 **정적 파일만** 호스팅합니다. 복지 데이터는 `public/welfare-db` 번들 JSON·IndexedDB 누적이며, 이용자가 설정에
**별도 API URL**을 넣으면 브라우저가 그 주소로 공용 목록·분석·기여 요청을 보낼 수 있습니다(CORS·서버
필요).

## 남은 작업·백로그

구현 여부와 우선순위는 [`docs/roadmap.md`](docs/roadmap.md)를 기준으로 합니다. **자가 호스팅 API**(`server/`: `GET /welfare`, `POST /welfare/analyze`, `POST /welfare/contribute`)와 앱 설정 연동은 구현되어 있습니다. 계약·흐름은 [`docs/catalog-pipeline.md`](docs/catalog-pipeline.md)를 참고하세요. **운영 검수·레이트리밋**, **공공 복지 API 실시간 연동**, **관리자**, **법무 확정** 등은 여전히 백로그입니다. 아키텍처는 [`docs/architecture.md`](docs/architecture.md)입니다.

## 스크립트

- `npm run test` — 단위 테스트(Vitest)
- `npm run build` / `npm run build:gh` — 일반 빌드 / GitHub Pages용

## 라이선스

MIT — `LICENSE` 참고.
