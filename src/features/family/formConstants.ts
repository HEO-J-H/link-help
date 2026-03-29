import type { AssetAnswer, OccupationKind } from '@/types/family';

export const OCCUPATION_KIND_CHOICES: { value: OccupationKind; label: string; hint: string }[] = [
  { value: '', label: '선택 안 함', hint: '아직 정하지 않았거나 공고 직업 태그를 쓰지 않을 때' },
  { value: 'salaried', label: '근로·직장', hint: '회사·기관 소속 근로' },
  { value: 'self_employed', label: '사업·자영업', hint: '개인사업자·소상공인 등' },
  { value: 'freelancer', label: '프리랜서·용역', hint: '계약·프로젝트 단위 근로' },
  { value: 'homemaker', label: '가사·가족 돌봄', hint: '유급 일 없이 가사·육아 중심' },
  { value: 'student', label: '학생(직업)', hint: '학생 여부 카드와 함께 쓸 수 있습니다' },
  { value: 'job_seeking', label: '구직·실업', hint: '구직 중이거나 이직 공백' },
  { value: 'retired', label: '은퇴·연금 수급', hint: '노후·연금·퇴직 후' },
  { value: 'parental_leave', label: '육아·돌봄 휴직', hint: '육아휴직·가족돌봄 휴직' },
  { value: 'other', label: '기타', hint: '아래 칸에 짧게 적어 주세요' },
];

export const ASSET_CHOICES: { value: AssetAnswer; label: string }[] = [
  { value: 'unknown', label: '미입력' },
  { value: 'yes', label: '예' },
  { value: 'no', label: '아니오' },
];

export const INCOME_CHOICES: { value: string; label: string; hint: string }[] = [
  { value: '', label: '선택 안 함', hint: '소득 구간을 모르거나 아직 정하지 않은 경우' },
  {
    value: '기초수급',
    label: '기초생활수급자',
    hint: '국민기초생활보장(생계·의료·주거 등) 수급 가구에 해당할 때',
  },
  {
    value: '차상위',
    label: '차상위계층',
    hint: '의료비·교육비 등 별도 지원 대상으로 인정된 저소득 층(지자체·복지 공고 기준)',
  },
  {
    value: '중위소득150',
    label: '중위소득 150% 이하',
    hint: '가구 단위로 본 소득이 「중위소득」의 150% 이하일 때 쓰는 말입니다. 금액은 가구원 수·연도마다 달라 아래 도움말을 보세요.',
  },
  {
    value: '일반',
    label: '해당 없음·일반',
    hint: '위에 해당하지 않거나 중위소득을 넘는 경우',
  },
];
