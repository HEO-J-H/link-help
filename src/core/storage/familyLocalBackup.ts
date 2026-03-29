import type { FamilyState } from '@/types/family';
import { FAMILY_LOCAL_BACKUP_KEY } from '@/core/storage/localStorageKeys';

/** Compact JSON for localStorage (no pretty-print). */
export function serializeFamilyLocalBackup(state: FamilyState): string {
  return JSON.stringify({
    version: 2,
    savedAt: new Date().toISOString(),
    members: state.members,
    household: state.household,
    reminders: state.reminders,
    appSettings: state.appSettings,
    welfareTracking: state.welfareTracking,
  });
}

export function loadFamilyLocalBackupRaw(): string | null {
  try {
    return localStorage.getItem(FAMILY_LOCAL_BACKUP_KEY);
  } catch {
    return null;
  }
}

export function saveFamilyLocalBackup(state: FamilyState): boolean {
  try {
    const raw = serializeFamilyLocalBackup(state);
    localStorage.setItem(FAMILY_LOCAL_BACKUP_KEY, raw);
    return true;
  } catch {
    return false;
  }
}

export function clearFamilyLocalBackup(): void {
  try {
    localStorage.removeItem(FAMILY_LOCAL_BACKUP_KEY);
  } catch {
    /* ignore */
  }
}
