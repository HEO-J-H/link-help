/**
 * Aligned with src/core/filter/smartMatchEngine.ts (keyword-required when include set).
 */

const TOPIC_CLUSTERS = [
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

function relatedMatchTerms(userToken) {
  const raw = String(userToken || '').trim();
  if (!raw) return [];
  const t = raw.toLowerCase();
  const bag = new Set([t, raw]);
  for (const cluster of TOPIC_CLUSTERS) {
    const hit = cluster.some((c) => {
      const cl = c.toLowerCase();
      return cl.includes(t) || t.includes(cl);
    });
    if (hit) for (const c of cluster) bag.add(c.toLowerCase());
  }
  if (raw.endsWith('도') && raw.length > 2) bag.add(raw.slice(0, -1).toLowerCase());
  if (raw.endsWith('시') && raw.length > 2) bag.add(raw.slice(0, -1).toLowerCase());
  return [...bag].filter(Boolean);
}

function blobMatchesAnyTerm(blob, terms) {
  const b = blob.toLowerCase();
  return terms.some((term) => term && b.includes(String(term).toLowerCase()));
}

function textBlob(w) {
  const parts = [
    w.title,
    w.description,
    w.benefit,
    w.period,
    ...(w.tags || []),
    ...(w.region || []),
    ...(w.target || []),
  ];
  return parts.join(' ').toLowerCase();
}

function isExpiredLike(w) {
  if (w.status === 'expired') return true;
  const period = (w.period || '').trim();
  const m = period
    .replace(/～|〜/g, '~')
    .match(/(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})\s*[~\-–]\s*(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/);
  if (!m) return false;
  const y = Number(m[4]);
  const mo = Number(m[5]) - 1;
  const d = Number(m[6]);
  const end = new Date(y, mo, d, 23, 59, 59, 999);
  const today = new Date();
  const sod = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate());
  return sod(today) > sod(end);
}

function profileMatchesBlob(w, blob, profileTags) {
  const hits = [];
  const tagBlob = (w.tags || []).join(' ').toLowerCase();
  const regionBlob = `${(w.region || []).join(' ')} ${(w.target || []).join(' ')}`.toLowerCase();
  const combined = `${blob} ${tagBlob} ${regionBlob}`;
  for (const tag of profileTags) {
    const terms = relatedMatchTerms(tag);
    if (blobMatchesAnyTerm(combined, terms)) hits.push(tag);
  }
  return hits;
}

function includeMatchDetail(blob, includeKeywords) {
  const b = blob.toLowerCase();
  const hits = [];
  let literalBonus = 0;
  for (const kw of includeKeywords) {
    const trimmed = String(kw || '').trim();
    if (!trimmed) continue;
    const terms = relatedMatchTerms(trimmed);
    if (!blobMatchesAnyTerm(b, terms)) continue;
    hits.push(trimmed);
    const kl = trimmed.toLowerCase();
    if (kl.length >= 2 && b.includes(kl)) literalBonus += 3;
    else if (kl.length === 1 && b.includes(kl)) literalBonus += 1;
  }
  return { hits, literalBonus };
}

function excludeHits(blob, excludeKeywords) {
  const hits = [];
  for (const ex of excludeKeywords) {
    const terms = relatedMatchTerms(ex);
    if (blobMatchesAnyTerm(blob, terms)) hits.push(ex);
  }
  return hits;
}

const MAX_BROAD_RESULTS = 200;

/**
 * @param {object[]} items — welfare records
 * @param {{ profileTags: string[], includeKeywords: string[], excludeKeywords: string[] }} q
 */
export function runSmartMatch(items, q) {
  const profileTags = (q.profileTags || []).map((s) => String(s).trim()).filter(Boolean);
  const includeKeywords = (q.includeKeywords || []).map((s) => String(s).trim()).filter(Boolean);
  const excludeKeywords = (q.excludeKeywords || []).map((s) => String(s).trim()).filter(Boolean);
  const includeMatchAll = q.includeMatchAll === true;

  const noProfile = profileTags.length === 0;
  const noInclude = includeKeywords.length === 0;

  const rows = [];

  for (const w of items) {
    if (!w || typeof w.id !== 'string') continue;
    if (isExpiredLike(w)) continue;

    const blob = textBlob(w);
    if (excludeHits(blob, excludeKeywords).length > 0) continue;

    const profHits = noProfile ? [] : profileMatchesBlob(w, blob, profileTags);
    const { hits: incHits, literalBonus } = noInclude
      ? { hits: [], literalBonus: 0 }
      : includeMatchDetail(blob, includeKeywords);

    let passes = false;
    if (noProfile && noInclude) passes = true;
    else if (!noInclude) {
      if (includeMatchAll && includeKeywords.length > 1) {
        passes = incHits.length === includeKeywords.length;
      } else {
        passes = incHits.length > 0;
      }
    } else passes = profHits.length > 0;

    if (!passes) continue;

    const pop = typeof w.popularity === 'number' && Number.isFinite(w.popularity) ? w.popularity : 0;
    const smartScore =
      pop +
      literalBonus +
      profHits.length * 12 +
      incHits.length * 10 +
      (w.tags?.length ?? 0) * 0.5;

    rows.push({ w, smartScore: Math.round(smartScore * 10) / 10, literalBonus });
  }

  rows.sort((a, b) => {
    const ld = b.literalBonus - a.literalBonus;
    if (ld !== 0) return ld;
    const d = b.smartScore - a.smartScore;
    if (d !== 0) return d;
    return (b.w.popularity ?? 0) - (a.w.popularity ?? 0);
  });

  const slice = noProfile && noInclude ? rows.slice(0, MAX_BROAD_RESULTS) : rows;
  return slice.map((r) => ({ ...r.w, smartScore: r.smartScore }));
}
