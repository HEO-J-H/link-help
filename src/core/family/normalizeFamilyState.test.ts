import { describe, expect, it } from 'vitest';
import { normalizeFamilyState } from './normalizeFamilyState';
import { createMember, emptySessionFamilyState } from './familyManager';

describe('normalizeFamilyState', () => {
  it('returns empty session when members array is empty', () => {
    const out = normalizeFamilyState({ members: [], reminders: [], appSettings: {} });
    expect(out.members).toEqual([]);
    expect(out.reminders).toEqual([]);
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
      appSettings: { browserNotifications: true, syncApiBaseUrl: 'http://x' },
    });
    expect(out.members).toHaveLength(1);
    expect(out.members[0].displayName).toBe('A');
    expect(out.appSettings.browserNotifications).toBe(true);
    expect(out.appSettings.syncApiBaseUrl).toBe('http://x');
  });

  it('matches emptySessionFamilyState defaults for invalid', () => {
    const empty = emptySessionFamilyState();
    const norm = normalizeFamilyState(null);
    expect(norm.members).toEqual(empty.members);
    expect(norm.reminders).toEqual(empty.reminders);
  });
});
