import type { FamilyState } from '@/types/family';
import { FAMILY_STORAGE_KEY } from './localStorageKeys';
import { loadFamilyFromStorage } from './localStorage';
import { initialFamilyState } from '@/core/family/familyManager';

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
  return raw as FamilyState;
}

export async function saveFamilyToIndexedDb(state: FamilyState): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE, 'readwrite');
  tx.objectStore(STORE).put(state, STATE_KEY);
  await txComplete(tx);
  db.close();
}

/**
 * Prefer IndexedDB; if empty, migrate from legacy localStorage once, then persist to IDB.
 */
export async function loadFamilyWithMigration(): Promise<FamilyState> {
  const fromIdb = await loadFamilyFromIndexedDb();
  if (fromIdb) return fromIdb;

  const fromLs = loadFamilyFromStorage();
  if (fromLs) {
    await saveFamilyToIndexedDb(fromLs);
    try {
      localStorage.removeItem(FAMILY_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    return fromLs;
  }

  return initialFamilyState();
}
