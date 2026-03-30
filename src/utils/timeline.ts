import { ageFromBirthDate, parseBirthDateMs } from '@/utils/date';

/** Typical ages to surface future welfare hints (설계: 50·55·60·65 …). */
export const TIMELINE_MILESTONE_AGES = [50, 55, 60, 65, 70, 75] as const;

export function upcomingMilestoneAges(birthDate: string, ref = new Date()): number[] {
  const age = ageFromBirthDate(birthDate, ref);
  if (age == null) return [];
  return [...TIMELINE_MILESTONE_AGES].filter((a) => a > age);
}

/** Approximate calendar year when the person reaches `targetAge` (same month/day as birth). */
export function yearWhenTurningAge(birthDateIso: string, targetAge: number): number | null {
  const ms = parseBirthDateMs(birthDateIso);
  if (ms == null) return null;
  const d = new Date(ms);
  return d.getFullYear() + targetAge;
}
