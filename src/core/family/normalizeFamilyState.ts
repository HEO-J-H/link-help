import type { FamilyState } from '@/types/family';
import type { Reminder } from '@/types/reminder';
import { defaultAppSettings, type AppSettings } from '@/types/appSettings';
import { emptyHousehold, emptySessionFamilyState, normalizeMemberProfile } from './familyManager';
import type { FamilyMember } from '@/types/family';
import type { HouseholdDefaults } from '@/types/household';

function normalizeHousehold(raw: unknown): HouseholdDefaults {
  const e = emptyHousehold();
  if (!raw || typeof raw !== 'object') return e;
  const o = raw as Record<string, unknown>;
  return {
    sido: typeof o.sido === 'string' ? o.sido : e.sido,
    sigungu: typeof o.sigungu === 'string' ? o.sigungu : e.sigungu,
    incomeBand: typeof o.incomeBand === 'string' ? o.incomeBand : e.incomeBand,
    annualIncomeMemoManwon:
      typeof o.annualIncomeMemoManwon === 'string' ? o.annualIncomeMemoManwon : e.annualIncomeMemoManwon,
  };
}

function mergeAppSettingsFromRaw(raw: unknown): AppSettings {
  const base = defaultAppSettings();
  if (!raw || typeof raw !== 'object') return base;
  const o = raw as Record<string, unknown>;
  return {
    browserNotifications:
      typeof o.browserNotifications === 'boolean' ? o.browserNotifications : base.browserNotifications,
  };
}

/** Ensure new fields exist after import / legacy JSON. Allows zero members (session mode). */
export function normalizeFamilyState(raw: unknown): FamilyState {
  const data = raw as Record<string, unknown> | null;
  if (!data || !Array.isArray(data.members)) {
    return emptySessionFamilyState();
  }
  const members = data.members as FamilyState['members'];
  const reminders = Array.isArray(data.reminders) ? (data.reminders as Reminder[]) : [];
  const appSettings = mergeAppSettingsFromRaw(data.appSettings);
  const household = normalizeHousehold(data.household);

  if (members.length === 0) {
    return { members: [], household, reminders, appSettings };
  }

  const normalizedMembers: FamilyMember[] = members.map((m) => ({
    ...m,
    profile: normalizeMemberProfile(m.profile),
  }));

  return { members: normalizedMembers, household, reminders, appSettings };
}
