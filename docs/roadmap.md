# Roadmap

## Done (current `main`)

- 가족·프로필·정적 복지 목록·검색·상세
- 구성원별 추천(태그 교차)·추천 점수·인기도(샘플)
- 타임라인(연령별 미리보기)
- 알림 예약 + 브라우저 알림 + Web Push(서버 연동 시)
- JSON 보내기/불러오기/초기화
- **sessionStorage** 세션 모델(탭·창 닫으면 비움), 예전 IndexedDB/localStorage 1회 마이그레이션
- PWA(injectManifest), GitHub Pages용 `build:gh` + `404.html` + Actions 배포 워크플로
- 운영 API: `/welfare`, `/push/*`, SQLite
- 법적/안내 화면(참고용 문구), `/start` 빠른 시작
- **기간·종료 처리**: `period` 파싱 + `status: expired`로 추천·타임라인에서 제외, 혜택 목록에서 선택적으로 표시
- **스마트 매칭**: 프로필+포함·제외 키워드, 진행 UI, `POST /smart-match`로 이력·`welfare_match_boost` 누적(PII 없음)

## Backlog (not implemented)

- **복지 DB 파이프라인**: AI 검색·큐레이션·크롤 후 `welfare_items` 자동 갱신(정책만 문서화, 코드 파이프라인 없음)
- **앱 내 “AI 검색” UX**: 검색 결과를 서버에 선별 저장하는 흐름(무인증 시 스팸·남용 대책 필요)
- **회원·클라우드 동기화**: 의도적으로 범위 밖
- **공식 복지 API** 실시간 연동·검수 프로세스
- **관리자 화면**·역할·감사 로그
- **자동 테스트** 확대(현재 최소 단위 테스트만 권장)
- **법무 검토** 후 이용약관·개인정보·면책·문의처 확정
- **npm audit** 잔여 이슈 점검(major 업그레이드는 별도 검토)

## Version labels (rough)

- **v0.1** — MVP 골격 (위 “Done” 기준 충족)
- **v0.2** — 필터 엔진 고도화, 만료·중복 규칙
- **v1.0** — 운영 파이프라인·모바일 품질·보안 하드닝 등 상용 준비
