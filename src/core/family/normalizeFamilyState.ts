import type { FamilyState } from '@/types/family';
import type { InsurancePolicy } from '@/types/insurance';
import type { Reminder } from '@/types/reminder';
import { defaultAppSettings, type AppSettings } from '@/types/appSettings';
import { initialFamilyState } from './familyManager';

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

/** Ensure new fields exist after IDB / import / legacy JSON. */
export function normalizeFamilyState(raw: unknown): FamilyState {
  const data = raw as Record<string, unknown> | null;
  if (!data || !Array.isArray(data.members) || data.members.length === 0) {
    return initialFamilyState();
  }
  const members = data.members as FamilyState['members'];
  const insurancePolicies =
    Array.isArray(data.insurancePolicies) ? (data.insurancePolicies as InsurancePolicy[]) : [];
  const reminders = Array.isArray(data.reminders) ? (data.reminders as Reminder[]) : [];
  const appSettings = mergeAppSettingsFromRaw(data.appSettings);

  return { members, insurancePolicies, reminders, appSettings };
}
