import type { FamilyState } from '@/types/family';

/** True when basic household + members look complete enough to suggest a JSON backup. */
export function shouldSuggestFamilyBackup(state: FamilyState): boolean {
  const { household, members } = state;
  if (!household.sido?.trim() || !household.sigungu?.trim()) return false;
  if (members.length === 0) return false;
  return members.every((m) => (m.profile.birthDate?.trim().length ?? 0) >= 8);
}
