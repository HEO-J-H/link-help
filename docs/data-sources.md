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

## 파일데이터(CSV) URL — 변경분만 받아 번들 JSON에 반영 (GitHub Actions)

포털 **파일데이터**는 데이터셋마다 열 이름·다운로드 URL이 다릅니다. 저장소에는 **URL + 컬럼 매핑**을 `scripts/data-go-kr-filedata.manifest.json`에 넣고, Actions가 **ETag / Last-Modified / 본문 해시**로 바뀐 파일만 다시 받아 `public/welfare-db/welfare/data-go-kr-filedata.json`을 갱신합니다.

1. CSV의 **직접 다운로드 URL**(브라우저에서 파일 링크 복사)과 **헤더 행의 열 이름**을 확인합니다.
2. `manifest.json`의 `sources`에 항목을 추가합니다. 예:

```json
{
  "id": "my_dataset_slug",
  "csvUrl": "https://example.invalid/path/to/data.csv",
  "detailPageUrl": "https://www.data.go.kr/data/XXXXXXXX/fileData.do",
  "publisher": "소관기관명",
  "recordIdPrefix": "dgk_my_dataset_",
  "hideFromMainList": false,
  "columns": {
    "id": "연번",
    "title": "사업명",
    "description": "사업개요",
    "benefit": "지원내용",
    "apply_url": "신청링크",
    "source": "담당부서",
    "period": "사업기간",
    "target": "대상"
  },
  "defaults": {
    "region": ["전국"],
    "tags": ["복지"]
  }
}
```

3. 로컬에서 `npm run data:sync:data-go-kr-files` 로 결과를 확인한 뒤 커밋합니다.
4. 워크플로: `.github/workflows/sync-data-go-kr-filedata.yml` — 기본 **매주 월요일**(UTC) + **수동 실행**. 변경이 있을 때만 `data-go-kr-filedata.json` / `scripts/data-go-kr-filedata.state.json` 이 커밋됩니다.
5. 전체 강제 재수집이 필요하면 저장소 **Variables**에 `FORCE_DATA_SYNC=1` 을 설정하거나 로컬에서 `set FORCE_DATA_SYNC=1` 후 동일 스크립트를 실행합니다.

전국 복지 API(`npm run data:welfare:national`)와는 별개입니다. API 쪽은 키가 필요하고 출력 파일도 다릅니다.
