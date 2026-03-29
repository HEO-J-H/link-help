# 복지 데이터 출처

## 번들 JSON (`public/welfare-db/welfare/`)

- **`national.json`**: 중앙행정·공공기관에서 운영·안내하는 대표 복지·급여·지원 사업을 **공식 안내 페이지 URL** 기준으로 정리했습니다. 금액·대상·기한은 **언제든 바뀔 수 있으므로** 신청 전 반드시 해당 기관 공고를 확인하세요.
- **`gyeonggi.json`**: 경기도 및 도 산하기관 안내 중심.
- **`yongin.json`**: 용인시 안내 중심.

이 저장소의 텍스트는 **법적·행정적 효력이 없는 참고용 요약**입니다.

## 공공데이터포털 API로 전국 목록 갱신 (선택)

한국사회보장정보원 **중앙부처 복지서비스** 오픈API(복지로 연계)로 목록을 받아 JSON을 생성할 수 있습니다.

1. [공공데이터포털](https://www.data.go.kr)에서 **한국사회보장정보원_중앙부처복지서비스** 활용 신청 후 **일반 인증키(UTF-8 디코딩)** 를 발급받습니다.
2. 저장소 루트에서:

```bash
set DATA_GO_KR_SERVICE_KEY=발급받은_키
npm run data:welfare:national
```

3. 생성된 `public/welfare-db/welfare/national-from-api.json`을 검토한 뒤, 필요하면 `national.json`과 병합하거나 교체합니다.

트래픽·이용약관은 공공데이터포털 및 제공 기관 정책을 따릅니다.
