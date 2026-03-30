import type { WelfareRecord } from '@/types/benefit';
import type { MemberProfile, OccupationKind } from '@/types/family';
import { isWelfareEffectivelyExpired } from '@/core/welfare/welfareLifecycle';
import { ageCategory, ageFromBirthDate } from '@/utils/date';
import { blobMatchesAnyTerm, relatedMatchTerms } from './smartMatchSynonyms';

const OCC_KIND_TAGS: Partial<Record<OccupationKind, readonly string[]>> = {
  salaried: ['직장인'],
  self_employed: ['자영업'],
  freelancer: ['프리랜서'],
  homemaker: ['전업주부'],
  student: ['학생'],
  job_seeking: ['구직'],
  retired: ['은퇴'],
  parental_leave: ['육아휴직'],
};

/**
 * 복지로·보건복지부·정부24 안내의 복지 영역 분류를 참고해 구성(8개 이상).
 * 체크만으로 대표 태그가 프로필에 합쳐져 혜택 「100% 태그 일치」에 반영됩니다.
 */
export const WELFARE_INTEREST_CATEGORY_DEFS = [
  { id: 'work', label: '일자리·취업', hint: '실업급여·취업지원·내일배움 등', tags: ['취업', '일자리', '고용'] as const },
  { id: 'health', label: '건강·의료', hint: '건강보험·의료급여·정신건강·검진', tags: ['의료', '건강', '건강보험'] as const },
  { id: 'livelihood', label: '생계·급여', hint: '기초생활·긴급복지·맞춤형 지원', tags: ['지원금', '급여', '저소득'] as const },
  { id: 'housing', label: '주거', hint: '임대·전세·주거급여', tags: ['주거', '주택', '임대'] as const },
  { id: 'child', label: '출산·육아', hint: '출산·보육·양육수당·돌봄', tags: ['육아', '출산', '보육', '아동'] as const },
  { id: 'education', label: '교육', hint: '학비·장학·직업훈련', tags: ['교육', '학생', '장학'] as const },
  {
    id: 'senior_care',
    label: '노후·요양·장애',
    hint: '노인·장기요양·장애인·돌봄',
    tags: ['노인', '장기요양', '장애인', '돌봄'] as const,
  },
  { id: 'energy_env', label: '에너지·환경', hint: '요금·취약계층·전기차 등', tags: ['에너지', '환경', '전기차'] as const },
] as const;

/** Nationwide rows use this tag; if user entered 거주 지역, treat as satisfied without duplicate tag. */
const WELFARE_TAGS_OPTIONAL_WHEN_REGION_SET = new Set<string>(['전국']);

function addWelfareInterestCategories(tags: Set<string>, p: MemberProfile) {
  for (const id of p.welfareInterestCategoryIds ?? []) {
    const def = WELFARE_INTEREST_CATEGORY_DEFS.find((d) => d.id === id);
    if (def) for (const x of def.tags) tags.add(x);
  }
}

function addOccupationAndAssetTags(tags: Set<string>, p: MemberProfile) {
  const kindTags = p.occupationKind ? OCC_KIND_TAGS[p.occupationKind] : undefined;
  if (kindTags) for (const t of kindTags) tags.add(t);
  if (p.occupationKind === 'self_employed') {
    tags.add('소상공인');
  }
  if (p.occupation.trim()) {
    const raw = p.occupation.trim();
    tags.add(raw);
    for (const part of raw.split(/[,/|]/).map((s) => s.trim()).filter((s) => s.length >= 2)) {
      if (part !== raw) tags.add(part);
    }
  }

  if (p.hasCar === 'yes') tags.add('자동차');
  if (p.ownsHome === 'yes') tags.add('유주택');
  if (p.ownsHome === 'no') tags.add('무주택');
}

function addExtendedProfileTags(tags: Set<string>, p: MemberProfile) {
  if (p.employmentContract === 'regular') tags.add('정규직');
  if (p.employmentContract === 'contract') tags.add('계약직');
  if (p.employmentContract === 'daily') tags.add('일용직');
  if (p.employmentContract === 'special') tags.add('특고');

  if (p.schoolName.trim()) {
    const s = p.schoolName.trim();
    tags.add(s);
  }

  if (p.enrollmentStatus === 'on_leave') tags.add('휴학');
  if (p.enrollmentStatus === 'expected_graduate') tags.add('졸업예정');

  if (p.singleParentHousehold) tags.add('한부모');
  if (p.multiculturalFamily) tags.add('다문화');
  if (p.veteranOrMeritRelated) {
    tags.add('보훈');
    tags.add('국가유공자');
  }

  if (p.parentingStage === 'pregnancy') tags.add('임신');
  if (p.parentingStage === 'infant') tags.add('영유아');
  if (p.parentingStage === 'school_age') {
    tags.add('아동');
    tags.add('자녀');
  }

  if (p.housingTenure === 'jeonse') tags.add('전세');
  if (p.housingTenure === 'monthly') tags.add('월세');
  if (p.housingTenure === 'owned') tags.add('자가');

  if (p.healthInsurance === 'medical_aid') tags.add('의료급여');
  if (p.healthInsurance === 'employee') tags.add('직장가입자');
  if (p.healthInsurance === 'local') tags.add('지역가입자');

  if (p.livelihoodSupportTier === 'basic_livelihood') {
    tags.add('기초생활');
    tags.add('생계급여');
  }
  if (p.livelihoodSupportTier === 'near_poverty') {
    tags.add('차상위');
  }

  if (p.primarySectorContext === 'agriculture') {
    tags.add('농업');
    tags.add('농촌');
    tags.add('농민');
  }
  if (p.primarySectorContext === 'fishery') {
    tags.add('어업');
    tags.add('어촌');
    tags.add('수산');
  }

  if (p.unpaidFamilyCaregiver) {
    tags.add('돌봄');
  }
  if (p.energyOrHousingVulnerable) {
    tags.add('에너지');
    tags.add('취약계층');
  }
}

function baseProfileTags(p: MemberProfile, age: number | null): string[] {
  const tags = new Set<string>();
  const region = p.region.trim();
  if (region) {
    for (const token of region.split(/\s+/).filter(Boolean)) {
      tags.add(token);
    }
  }
  addOccupationAndAssetTags(tags, p);
  addExtendedProfileTags(tags, p);
  for (const t of ageCategory(age)) tags.add(t);
  if (p.hasDisability) tags.add('장애인');
  if (p.studentLevel === 'university' && age != null && age >= 18 && age <= 39) tags.add('대학생');
  if (p.studentLevel === 'university' && age == null) tags.add('대학생');
  if (p.studentLevel === 'k12' && age != null && age >= 6 && age <= 19) tags.add('청소년');
  if (p.studentLevel === 'k12' && age == null) tags.add('청소년');
  if (p.incomeBand.trim()) tags.add(p.incomeBand.trim());
  addWelfareInterestCategories(tags, p);
  for (const t of p.extraIncludeTags) if (t.trim()) tags.add(t.trim());
  return [...tags];
}

/** Tags inferred from profile for matching against welfare.tags */
export function profileToDerivedTags(p: MemberProfile): string[] {
  const age = ageFromBirthDate(p.birthDate);
  return baseProfileTags(p, age);
}

/** Same as profileToDerivedTags but uses a hypothetical age (for timeline). */
export function profileToDerivedTagsAtAge(p: MemberProfile, ageYears: number): string[] {
  return baseProfileTags(p, ageYears);
}

export function memberExcludeTags(p: MemberProfile): Set<string> {
  return new Set(p.extraExcludeTags.map((t) => t.trim()).filter(Boolean));
}

/** Same exclude semantics as 숨은 복지·혜택찾기: blob match + topic synonym expansion. */
export function welfareBlockedByExcludeTokens(w: WelfareRecord, exclude: Set<string>): boolean {
  if (exclude.size === 0) return false;
  const blob = blobFromWelfare(w);
  for (const ex of exclude) {
    if (!ex.trim()) continue;
    const terms = relatedMatchTerms(ex);
    if (blobMatchesAnyTerm(blob, terms)) return true;
  }
  return false;
}

/**
 * True if welfare matches any member "제외 태그" (synonym-expanded against title·tags·target·…).
 */
export function welfareBlockedByMemberProfile(w: WelfareRecord, profile: MemberProfile): boolean {
  return welfareBlockedByExcludeTokens(w, memberExcludeTags(profile));
}

function jaccardMatchScore(derived: Set<string>, welfareTags: string[]): number {
  if (derived.size === 0 || welfareTags.length === 0) return 0;
  let inter = 0;
  for (const t of welfareTags) {
    if (derived.has(t)) inter += 1;
  }
  const union = new Set<string>([...derived, ...welfareTags]).size;
  return union === 0 ? 0 : Math.round((inter / union) * 1000) / 1000;
}

/** Drop car-centric rows when user explicitly has no car. */
function welfareConflictsWithAssets(w: WelfareRecord, p: MemberProfile): boolean {
  if (p.hasCar !== 'no') return false;
  return w.tags.some((t) => {
    const x = t.trim();
    return x === '자동차' || x === '전기차' || x === '차량';
  });
}

/**
 * Each catalog tag must be “explained” by the profile: either in derived tags,
 * or an optional universal tag (e.g. 전국) when 거주 지역이 있음.
 */
export function welfareCatalogTagSatisfiedByProfile(
  catalogTag: string,
  derived: Set<string>,
  profile: MemberProfile
): boolean {
  const t = catalogTag.trim();
  if (!t) return true;
  if (derived.has(t)) return true;
  if (WELFARE_TAGS_OPTIONAL_WHEN_REGION_SET.has(t)) {
    return profile.region.trim().length > 0;
  }
  return false;
}

/**
 * 100% match: every welfare row tag is satisfied by profile-derived tags (엄격).
 * 태그 없는 행, 제외 규칙·차량 충돌은 불일치 처리.
 */
export function welfareStrictFullCatalogTagCoverage(w: WelfareRecord, profile: MemberProfile): boolean {
  if (welfareBlockedByMemberProfile(w, profile)) return false;
  if (welfareConflictsWithAssets(w, profile)) return false;
  const tags = w.tags ?? [];
  if (tags.length === 0) return false;
  const derived = new Set(profileToDerivedTags(profile));
  if (derived.size === 0) return false;
  return tags.every((tag) => welfareCatalogTagSatisfiedByProfile(tag, derived, profile));
}

/** 프로필에 없어서 빠진 혜택 태그 (사용자 안내용). */
export function welfareStrictMissingCatalogTags(w: WelfareRecord, profile: MemberProfile): string[] {
  const tags = w.tags ?? [];
  const derived = new Set(profileToDerivedTags(profile));
  return tags.filter((tag) => !welfareCatalogTagSatisfiedByProfile(tag, derived, profile));
}

export type WelfareRecommendMode = 'strict' | 'loose';

function recommendFromDerived(
  list: WelfareRecord[],
  derived: Set<string>,
  exclude: Set<string>,
  profile: MemberProfile | undefined,
  mode: WelfareRecommendMode
): WelfareRecord[] {
  if (derived.size === 0) return [];
  return list.filter((w) => {
    if (isWelfareEffectivelyExpired(w)) return false;
    if (profile && welfareConflictsWithAssets(w, profile)) return false;
    const blocked = welfareBlockedByExcludeTokens(w, exclude);
    if (blocked) return false;
    if (mode === 'strict' && profile) {
      return welfareStrictFullCatalogTagCoverage(w, profile);
    }
    const hit = w.tags.some((t) => derived.has(t));
    if (!hit) return false;
    const j = jaccardMatchScore(derived, w.tags);
    return j >= MIN_PROFILE_LIST_JACCARD_01;
  });
}

/**
 * Default floor for profile-vs-catalog tag overlap (Jaccard). Below this, rows look like weak/spam matches.
 */
export const MIN_PROFILE_LIST_JACCARD_01 = 0.22;

export function welfareMeetsMinProfileOverlap(
  w: WelfareRecord,
  profile: MemberProfile,
  min01: number = MIN_PROFILE_LIST_JACCARD_01
): boolean {
  const derived = profileToDerivedTags(profile);
  if (derived.length === 0) return true;
  if (welfareBlockedByMemberProfile(w, profile) || welfareConflictsWithAssets(w, profile)) return false;
  return jaccardMatchScore(new Set(derived), w.tags) >= min01;
}

/** Sort: higher profile Jaccard first, then non-expired, then catalog popularity. */
export function compareWelfareForBenefitListSort(
  a: WelfareRecord,
  b: WelfareRecord,
  profile: MemberProfile | null,
  now: Date = new Date()
): number {
  const hasProf = profile && profileToDerivedTags(profile).length > 0;
  if (hasProf && profile) {
    const sa = welfareProfileTagMatchScore01(a, profile) ?? 0;
    const sb = welfareProfileTagMatchScore01(b, profile) ?? 0;
    if (sb !== sa) return sb - sa;
  }
  const ea = isWelfareEffectivelyExpired(a, now);
  const eb = isWelfareEffectivelyExpired(b, now);
  if (ea !== eb) return ea ? 1 : -1;
  return (b.popularity ?? 0) - (a.popularity ?? 0);
}

export type ScoredWelfare = WelfareRecord & { matchScore: number };

/** Matched items with Jaccard-based score, sorted by score then popularity. */
export function recommendScoredForProfile(
  list: WelfareRecord[],
  profile: MemberProfile
): ScoredWelfare[] {
  const derived = new Set(profileToDerivedTags(profile));
  const exclude = memberExcludeTags(profile);
  if (derived.size === 0) return [];
  const base = recommendFromDerived(list, derived, exclude, profile, 'strict');
  return base
    .map((w) => ({
      ...w,
      matchScore: jaccardMatchScore(derived, w.tags),
    }))
    .sort((a, b) => {
      const d = b.matchScore - a.matchScore;
      if (d !== 0) return d;
      return (b.popularity ?? 0) - (a.popularity ?? 0);
    });
}

/**
 * Match when welfare shares at least one tag with derived tags,
 * and none of welfare.tags are in the member exclude set.
 */
export function recommendForProfile(
  list: WelfareRecord[],
  profile: MemberProfile
): WelfareRecord[] {
  return recommendScoredForProfile(list, profile).map(({ matchScore: _score, ...w }) => w);
}

/**
 * Jaccard overlap (0–1) between profile-derived tags and welfare.tags.
 * `null` when the profile yields no tags (matching % is not applicable).
 */
export function welfareProfileTagMatchScore01(
  w: WelfareRecord,
  profile: MemberProfile
): number | null {
  const derived = new Set(profileToDerivedTags(profile));
  if (derived.size === 0) return null;
  return jaccardMatchScore(derived, w.tags);
}

/** Recommend as if the member were `ageYears` years old (timeline). */
export function recommendForProfileAtAge(
  list: WelfareRecord[],
  profile: MemberProfile,
  ageYears: number
): WelfareRecord[] {
  return recommendFromDerived(
    list,
    new Set(profileToDerivedTagsAtAge(profile, ageYears)),
    memberExcludeTags(profile),
    profile,
    'strict'
  );
}

export function filterWelfareByText(list: WelfareRecord[], q: string): WelfareRecord[] {
  const s = q.trim().toLowerCase();
  if (!s) return list;
  return list.filter(
    (w) =>
      w.title.toLowerCase().includes(s) ||
      w.description.toLowerCase().includes(s) ||
      w.tags.some((t) => t.toLowerCase().includes(s))
  );
}

/** Lowercased text blob for keyword / smart matching (title, body, tags, region, target, period). */
export function blobFromWelfare(w: WelfareRecord): string {
  const parts = [
    w.title,
    w.description,
    w.benefit,
    w.period,
    ...(w.tags ?? []),
    ...(w.region ?? []),
    ...(w.target ?? []),
  ];
  return parts.join(' ').toLowerCase();
}
