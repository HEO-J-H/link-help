import type { WelfareRecord } from '@/types/benefit';
import type { MemberProfile } from '@/types/family';
import { ageCategory, ageFromBirthDate } from '@/utils/date';

function baseProfileTags(p: MemberProfile, age: number | null): string[] {
  const tags = new Set<string>();
  if (p.region.trim()) tags.add(p.region.trim());
  const occ = p.occupation.trim();
  if (occ) tags.add(occ);
  for (const t of ageCategory(age)) tags.add(t);
  if (p.hasDisability) tags.add('장애인');
  if (p.isStudent && age != null && age >= 18 && age <= 39) tags.add('대학생');
  if (p.isStudent && age == null) tags.add('대학생');
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

function recommendFromDerived(
  list: WelfareRecord[],
  derived: Set<string>,
  exclude: Set<string>
): WelfareRecord[] {
  if (derived.size === 0) return [];
  return list.filter((w) => {
    if (w.status === 'expired') return false;
    const hit = w.tags.some((t) => derived.has(t));
    const blocked = w.tags.some((t) => exclude.has(t));
    return hit && !blocked;
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
  return recommendFromDerived(list, new Set(profileToDerivedTags(profile)), memberExcludeTags(profile));
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
