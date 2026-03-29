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
