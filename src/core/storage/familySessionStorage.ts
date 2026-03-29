import type { FamilyState } from '@/types/family';
import { normalizeFamilyState } from '@/core/family/normalizeFamilyState';

const SESSION_KEY = 'link-help-family-session-v1';

/** Current-tab session only; cleared when the tab/window is closed. */
export function loadFamilyFromSession(): FamilyState | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw === null) return null;
    return normalizeFamilyState(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

export function saveFamilyToSession(state: FamilyState): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
  } catch {
    /* quota or private mode */
  }
}
