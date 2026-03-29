import type { FamilyState } from '@/types/family';
import type { Reminder } from '@/types/reminder';
import { defaultAppSettings, type AppSettings } from '@/types/appSettings';
import { emptySessionFamilyState, normalizeMemberProfile } from './familyManager';
import type { FamilyMember } from '@/types/family';

function mergeAppSettingsFromRaw(raw: unknown): AppSettings {
  const base = defaultAppSettings();
  if (!raw || typeof raw !== 'object') return base;
  const o = raw as Record<string, unknown>;
  return {
    browserNotifications:
      typeof o.browserNotifications === 'boolean' ? o.browserNotifications : base.browserNotifications,
    syncApiBaseUrl: typeof o.syncApiBaseUrl === 'string' ? o.syncApiBaseUrl : base.syncApiBaseUrl,
    pushSubscriptionJson:
      typeof o.pushSubscriptionJson === 'string' ? o.pushSubscriptionJson : undefined,
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

  if (members.length === 0) {
    return { members: [], reminders, appSettings };
  }

  const normalizedMembers: FamilyMember[] = members.map((m) => ({
    ...m,
    profile: normalizeMemberProfile(m.profile),
  }));

  return { members: normalizedMembers, reminders, appSettings };
}
