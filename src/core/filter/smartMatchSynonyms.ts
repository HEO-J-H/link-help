/**
 * Topic clusters for OR-style matching: user types one word → match if blob has any related term.
 * Keeps matching closer to how people search (전기요금, 수도, 통신비, 장애인 등).
 */
export const TOPIC_CLUSTERS: string[][] = [
  ['전기요금', '전기', '전력', '한전', '에너지', '바우처', '전기료', '요금감면', '누진', '전기사용'],
  ['상하수도', '수도', '상수도', '하수도', '수도요금', '수도세', '물이용', '상수도요금'],
  ['휴대폰', '통신', '이동통신', '휴대전화', '스마트폰', '통신비', '단통', '요금지원'],
  ['장애인', '장애', '등록장애', '중증장애', '장애수당', '복지카드', '장애인복지'],
  ['차상위', '차상위계층', '차상위층'],
  ['자동차', '전기차', '하이브리드', '친환경차', '면세', '보조금', '차량'],
  ['청년', '청년층', '청년지원', '청년통장'],
  ['아동', '영유아', '육아', '보육'],
  ['노인', '어르신', '기초연금', '노령'],
  ['주거', '전세', '월세', '임대', '주택'],
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
