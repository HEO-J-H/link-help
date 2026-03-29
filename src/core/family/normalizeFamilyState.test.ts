import { describe, expect, it } from 'vitest';
import { normalizeFamilyState } from './normalizeFamilyState';
import { createMember, emptySessionFamilyState } from './familyManager';

describe('normalizeFamilyState', () => {
  it('returns empty session when members array is empty', () => {
    const out = normalizeFamilyState({ members: [], reminders: [], appSettings: {} });
    expect(out.members).toEqual([]);
    expect(out.reminders).toEqual([]);
    expect(out.appSettings.linkHelpApiBaseUrl).toBe('');
    expect(out.appSettings.welfareContributeConsent).toBe(false);
  });

  it('returns empty session when input is invalid', () => {
    expect(normalizeFamilyState(null).members).toEqual([]);
    expect(normalizeFamilyState({}).members).toEqual([]);
  });

  it('preserves members and merges app settings', () => {
    const m = createMember({ displayName: 'A', relationship: 'self' });
    const out = normalizeFamilyState({
      members: [m],
      reminders: [],
      appSettings: { browserNotifications: true },
    });
    expect(out.members).toHaveLength(1);
    expect(out.members[0].displayName).toBe('A');
    expect(out.appSettings.browserNotifications).toBe(true);
  });

  it('matches emptySessionFamilyState defaults for invalid', () => {
    const empty = emptySessionFamilyState();
    const norm = normalizeFamilyState(null);
    expect(norm.members).toEqual(empty.members);
    expect(norm.reminders).toEqual(empty.reminders);
  });

  it('migrates legacy isStudent to studentLevel university', () => {
    const out = normalizeFamilyState({
      members: [
        {
          id: '1',
          displayName: 'A',
          relationship: 'self',
          profile: {
            birthDate: '',
            region: '',
            occupation: '',
            incomeBand: '',
            isStudent: true,
            hasDisability: false,
            extraIncludeTags: [],
            extraExcludeTags: [],
          } as import('@/types/family').MemberProfile & { isStudent?: boolean },
        },
      ],
      reminders: [],
      appSettings: {},
    });
    expect(out.members[0].profile.studentLevel).toBe('university');
  });
});
