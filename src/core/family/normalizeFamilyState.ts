import type { FamilyState } from '@/types/family';
import type { InsurancePolicy } from '@/types/insurance';
import type { Reminder } from '@/types/reminder';
import { defaultAppSettings, type AppSettings } from '@/types/appSettings';
import { initialFamilyState } from './familyManager';

function isAppSettings(x: unknown): x is AppSettings {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  return typeof o.browserNotifications === 'boolean' && typeof o.syncApiBaseUrl === 'string';
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
  const appSettings = isAppSettings(data.appSettings) ? data.appSettings : defaultAppSettings();

  return { members, insurancePolicies, reminders, appSettings };
}
