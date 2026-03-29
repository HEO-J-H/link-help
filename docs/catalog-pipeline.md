# 복지 카탈로그 파이프라인 (설계)

무료 맞춤 복지 안내를 위해 **공고문을 구조화한 JSON**이 **공용 복지 DB**로 쌓이고, 모든 사용자가 같은 카탈로그를 재사용하는 흐름을 정의합니다.  
현재 웹 앱은 **정적 JSON + 로컬 IndexedDB 병합**만 수행하며, 아래 **AI 분석 서버·공용 저장소**는 **향후/별도 배포** 단계입니다.

## 목표 구조

```text
[공고 입력]  원문·URL·첨부 (개인 프로필은 여기 포함하지 않음)
       ↓
[AI 분석 서버]  공고문 → 구조화 초안 + 신뢰도 메타
       ↓
[검증]  스키마 검사 · 중복 키(dedupe_key) · (선택) 사람 검수 · 신고 대응
       ↓
[공용 복지 DB]  버전·출처·갱신일 포함, 전 사용자 매칭의 단일 소스
       ↓
[클라이언트]  로컬 프로필+필터 → 매칭만 (프로필은 서버 미전송 가능)
```

## 사용자(로컬) vs 공용

| 구분 | 내용 | 저장 위치(권장) |
|------|------|-----------------|
| 가구·구성원 프로필 | 나이, 지역, 소득 구간 등 | 브라우저 sessionStorage 등 **로컬만** |
| 복지 항목 레코드 | 제목, 대상, 기간, 신청 URL… | **공용 DB** + 앱 번들/동기화 |

크라우드소싱 시 **매칭 결과만** 공용에 올릴 경우에도, 공용에는 **복지 메타(JSON)**만 두고 **프로필 스냅샷은 저장하지 않는** 것을 원칙으로 합니다.

## `WelfareRecord` 확장 필드 (AI·운영용)

앱 타입 `WelfareRecord`(`src/types/benefit.ts`)에 **선택(optional)** 필드로 정의됩니다. 기존 `public/welfare-db` 샘플은 필드 없이도 동작합니다.

| 필드 | 용도 |
|------|------|
| `schema_version` | 카탈로그 JSON 스키마 버전 (정수) |
| `dedupe_key` | 기관+제목+기간+URL 등으로 만든 중복 제거 키 |
| `source_url` | 공고 원문·안내 페이지 URL |
| `source_fetched_at` | 원문/메타를 가져온 시각 (ISO 8601 권장) |
| `source_text_digest` | 원문 전체 대신 SHA-256 등 다이제스트(선택) |
| `ai_confidence` | AI 파싱 신뢰도 0~1 (선택) |
| `catalog_origin` | `bundled` \| `crowd` \| `import` 등 출처 구분 (선택) |

## AI 출력 예시 (서버 계약 참고)

```json
{
  "id": "welfare_yongin_youth_housing_202603",
  "title": "용인 청년 주거 지원",
  "description": "만 19~39세 청년 대상 주거비 지원 사업 요약",
  "region": ["경기", "용인"],
  "target": ["청년"],
  "age": ["19세이상", "39세이하"],
  "income": ["중위소득150"],
  "tags": ["주거", "청년", "용인"],
  "benefit": "월 20만원 내외(예시)",
  "period": "2026-03-01 ~ 2026-05-31",
  "apply_url": "https://example.go.kr/apply",
  "created_at": "2026-03-29",
  "updated_at": "2026-03-29",
  "source": "용인시",
  "schema_version": 1,
  "dedupe_key": "sha256:…",
  "source_url": "https://example.go.kr/notice/123",
  "source_fetched_at": "2026-03-29T12:00:00+09:00",
  "ai_confidence": 0.86,
  "catalog_origin": "crowd"
}
```

## 운영 시 체크리스트

- **저작권·이용 범위**: 원문 전문 저장·재배포 시 기관 약관 준수.
- **개인정보**: 공용 DB 레코드에 주민번호·실명·연락처 등 금지.
- **동의**: 사용자 기여(검색 결과 공유 등) 시 목적·보관 기간을 안내하고 옵트인 권장.
- **품질**: 자동 반영만으로는 오류가 섞이므로 검수 큐 또는 신고 플로우 검토.

## 현재 코드베이스와의 관계

- 클라이언트는 `loadMergedWelfareCatalog()`로 **번들 JSON ∪ IndexedDB**를 병합합니다.
- **설정 화면**에서 이용자가 `WelfareRecord[]` JSON 파일을 고르면 같은 IndexedDB에 **upsert**되어 통합 목록에 합쳐집니다(서버 없음).
- 향후 공용 DB는 **주기적으로 정적 JSON을 생성**해 `welfare-db`와 병합하거나, **별도 엔드포인트**로 내려받도록 확장할 수 있습니다.

JSON 예시 파일: `docs/schemas/welfare-record.example.json`.
