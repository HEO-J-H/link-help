import type { FamilyState } from '@/types/family';
import { normalizeFamilyState } from '@/core/family/normalizeFamilyState';
import { FAMILY_STORAGE_KEY } from './localStorageKeys';
import { loadFamilyFromStorage } from './localStorage';
import { emptySessionFamilyState } from '@/core/family/familyManager';

const DB_NAME = 'link-help';
const DB_VERSION = 1;
const STORE = 'family';
const STATE_KEY = 'state';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error ?? new Error('indexedDB open failed'));
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
  });
}

function idbRequest<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('indexedDB request failed'));
  });
}

function txComplete(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('indexedDB transaction failed'));
    tx.onabort = () => reject(tx.error ?? new Error('indexedDB transaction aborted'));
  });
}

export async function loadFamilyFromIndexedDb(): Promise<FamilyState | null> {
  const db = await openDb();
  const tx = db.transaction(STORE, 'readonly');
  const store = tx.objectStore(STORE);
  const raw = await idbRequest(store.get(STATE_KEY));
  await txComplete(tx);
  db.close();
  if (!raw || typeof raw !== 'object' || !Array.isArray((raw as FamilyState).members)) {
    return null;
  }
  return normalizeFamilyState(raw);
}

export async function saveFamilyToIndexedDb(state: FamilyState): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE, 'readwrite');
  tx.objectStore(STORE).put(state, STATE_KEY);
  await txComplete(tx);
  db.close();
}

/** Remove legacy DB after migrating to sessionStorage (one-time per browser). */
export function clearFamilyIndexedDb(): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error ?? new Error('indexedDB delete failed'));
    req.onblocked = () => resolve();
  });
}

/**
 * Legacy: prefer IndexedDB, else migrate from localStorage once into IDB. (App now uses sessionStorage;
 * FamilyContext migrates from IDB/localStorage once then deletes IDB.)
 */
export async function loadFamilyWithMigration(): Promise<FamilyState> {
  const fromIdb = await loadFamilyFromIndexedDb();
  if (fromIdb) return fromIdb;

  const fromLs = loadFamilyFromStorage();
  if (fromLs) {
    const normalized = normalizeFamilyState(fromLs);
    await saveFamilyToIndexedDb(normalized);
    try {
      localStorage.removeItem(FAMILY_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    return normalized;
  }

  return emptySessionFamilyState();
}
