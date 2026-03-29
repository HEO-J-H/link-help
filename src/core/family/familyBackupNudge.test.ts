import { describe, expect, it } from 'vitest';
import { emptySessionFamilyState, createMember } from '@/core/family/familyManager';
import { shouldSuggestFamilyBackup } from '@/core/family/familyBackupNudge';

describe('shouldSuggestFamilyBackup', () => {
  it('returns false when household region incomplete', () => {
    const s = emptySessionFamilyState();
    s.members = [createMember({ displayName: 'A', relationship: 'self', paletteIndex: 0 })];
    s.members[0].profile.birthDate = '1990-01-01';
    expect(shouldSuggestFamilyBackup(s)).toBe(false);
  });

  it('returns true when region + all members have birthDate', () => {
    const s = emptySessionFamilyState();
    s.household.sido = '경기도';
    s.household.sigungu = '용인시';
    s.members = [createMember({ displayName: 'A', relationship: 'self', paletteIndex: 0 })];
    s.members[0].profile.birthDate = '1990-01-01';
    expect(shouldSuggestFamilyBackup(s)).toBe(true);
  });
});
