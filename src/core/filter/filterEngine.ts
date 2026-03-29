import type { WelfareRecord } from '@/types/benefit';
import type { MemberProfile } from '@/types/family';
import { isWelfareEffectivelyExpired } from '@/core/welfare/welfareLifecycle';
import { ageCategory, ageFromBirthDate } from '@/utils/date';

function baseProfileTags(p: MemberProfile, age: number | null): string[] {
  const tags = new Set<string>();
  const region = p.region.trim();
  if (region) {
    for (const token of region.split(/\s+/).filter(Boolean)) {
      tags.add(token);
    }
  }
  const occ = p.occupation.trim();
  if (occ) tags.add(occ);
  for (const t of ageCategory(age)) tags.add(t);
  if (p.hasDisability) tags.add('장애인');
  if (p.studentLevel === 'university' && age != null && age >= 18 && age <= 39) tags.add('대학생');
  if (p.studentLevel === 'university' && age == null) tags.add('대학생');
  if (p.studentLevel === 'k12' && age != null && age >= 6 && age <= 19) tags.add('청소년');
  if (p.studentLevel === 'k12' && age == null) tags.add('청소년');
  if (p.incomeBand.trim()) tags.add(p.incomeBand.trim());
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

function jaccardMatchScore(derived: Set<string>, welfareTags: string[]): number {
  if (derived.size === 0 || welfareTags.length === 0) return 0;
  let inter = 0;
  for (const t of welfareTags) {
    if (derived.has(t)) inter += 1;
  }
  const union = new Set<string>([...derived, ...welfareTags]).size;
  return union === 0 ? 0 : Math.round((inter / union) * 1000) / 1000;
}

function recommendFromDerived(
  list: WelfareRecord[],
  derived: Set<string>,
  exclude: Set<string>
): WelfareRecord[] {
  if (derived.size === 0) return [];
  return list.filter((w) => {
    if (isWelfareEffectivelyExpired(w)) return false;
    const hit = w.tags.some((t) => derived.has(t));
    const blocked = w.tags.some((t) => exclude.has(t));
    return hit && !blocked;
  });
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
  const base = recommendFromDerived(list, derived, exclude);
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

/** Recommend as if the member were `ageYears` years old (timeline). */
export function recommendForProfileAtAge(
  list: WelfareRecord[],
  profile: MemberProfile,
  ageYears: number
): WelfareRecord[] {
  return recommendFromDerived(
    list,
    new Set(profileToDerivedTagsAtAge(profile, ageYears)),
    memberExcludeTags(profile)
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
