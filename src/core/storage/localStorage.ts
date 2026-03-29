import type { FamilyState } from '@/types/family';
import { FAMILY_STORAGE_KEY } from './localStorageKeys';

export function loadFamilyFromStorage(): FamilyState | null {
  try {
    const raw = localStorage.getItem(FAMILY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FamilyState;
    if (!parsed || !Array.isArray(parsed.members)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveFamilyToStorage(state: FamilyState): void {
  localStorage.setItem(FAMILY_STORAGE_KEY, JSON.stringify(state));
}
