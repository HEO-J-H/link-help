/**
 * Topic clusters for OR-style matching: user types one word → match if blob has any related term.
 * Keeps matching closer to how people search (전기요금, 수도, 통신비, 장애인 등).
 */
export const TOPIC_CLUSTERS: string[][] = [
  ['전기요금', '전기', '전력', '한전', '에너지', '바우처', '전기료', '요금감면', '누진', '전기사용', '요금할인', '복지할인'],
  ['상하수도', '수도', '상수도', '하수도', '수도요금', '수도세', '물이용', '상수도요금', '수도감면'],
  ['가스요금', '가스', '도시가스', 'LPG', '난방', '연료비'],
  ['휴대폰', '통신', '이동통신', '휴대전화', '스마트폰', '통신비', '단통', '요금지원', '인터넷', 'IPTV'],
  ['장애인', '장애', '등록장애', '중증장애', '장애수당', '복지카드', '장애인복지', '활동지원', '특수교육', '발달장애'],
  ['차상위', '차상위계층', '차상위층', '차상위본인부담'],
  ['기초생활', '기초생활수급', '생계급여', '수급자', '국민기초'],
  ['긴급복지', '긴급지원', '위기가구', '위기지원', '생계위기'],
  ['주거급여', '주거지원', '임차', '임대료', '월세지원', '전세자금', '전세대출', '주거안정'],
  ['한부모', '미혼부', '미혼모', '양육', '양육수당', '자녀양육'],
  ['다자녀', '세자녀', '자녀수', '출산'],
  ['임신', '출산', '산전', '산후', '산모', '난임', '산전검진', '출산지원', '산후조리'],
  ['보육', '보육료', '어린이집', '육아휴직', '육아', '아동수당', '아동'],
  ['영유아', '유아', '초등', '청소년', '학생', '대학생'],
  ['노인', '어르신', '기초연금', '노령', '고령', '독거노인', '경로'],
  ['치매', '요양', '요양보험', '장기요양', '재가복지', '방문요양', '요양원'],
  ['청년', '청년층', '청년지원', '청년통장', '취업준비', '구직', '창업'],
  ['실업', '실업급여', '고용보험', '구직급여', '재취업'],
  ['국민연금', '퇴직', '연금', '노후'],
  ['주거', '전세', '월세', '임대', '주택', 'LH', 'SH', '청약', '분양', '무주택', '전세보증'],
  ['소상공인', '소상공', '자영업', '손실보전', '방역', '피해지원'],
  ['전통시장', '시장', '골목상권', '상인'],
  ['농업', '농업인', '농민', '농촌', '농어촌', '어업', '어업인', '어촌'],
  ['건강검진', '검진', '암검진', '의료비', '의료급여', '본인부담', '건강보험'],
  ['교육', '학비', '등록금', '장학', '교복', '급식', '독서'],
  ['자동차', '전기차', '하이브리드', '친환경차', '면세', '보조금', '차량', '자동차세'],
  [
    '대중교통',
    '교통',
    '버스',
    '시내버스',
    '지하철',
    '도시철도',
    '전철',
    '철도',
    'ktx',
    'srt',
    '무임승차',
    '교통비',
    '교통약자',
    '특별교통수단',
    '콜택시',
    '이동지원',
    '저상버스',
    '하이패스',
    '환급',
  ],
];

/** All lowercase-ish search needles derived from one user token + its cluster. */
export function relatedMatchTerms(userToken: string): string[] {
  const raw = userToken.trim();
  if (!raw) return [];
  const t = raw.toLowerCase();
  const bag = new Set<string>([t, raw]);
  for (const cluster of TOPIC_CLUSTERS) {
    const hit = cluster.some((c) => {
      const cl = c.toLowerCase();
      return cl.includes(t) || t.includes(cl);
    });
    if (hit) {
      for (const c of cluster) bag.add(c.toLowerCase());
    }
  }
  // e.g. "경기도" → also try "경기"
  if (raw.endsWith('도') && raw.length > 2) {
    bag.add(raw.slice(0, -1).toLowerCase());
  }
  if (raw.endsWith('시') && raw.length > 2) {
    bag.add(raw.slice(0, -1).toLowerCase());
  }
  return [...bag].filter(Boolean);
}

export function blobMatchesAnyTerm(blob: string, terms: string[]): boolean {
  const b = blob.toLowerCase();
  return terms.some((term) => term && b.includes(String(term).toLowerCase()));
}
