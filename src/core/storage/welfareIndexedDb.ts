import type { WelfareRecord } from '@/types/benefit';

const DB_NAME = 'link-help-welfare-cache';
const DB_VERSION = 1;
const STORE = 'records';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('indexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error ?? new Error('indexedDB open failed'));
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
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

/** All welfare rows stored from past smart matches (and future imports). */
export async function getAllCachedWelfareRecords(): Promise<WelfareRecord[]> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE, 'readonly');
    const store = tx.objectStore(STORE);
    const req = store.getAll();
    const rows = await idbRequest(req);
    await txComplete(tx);
    db.close();
    return Array.isArray(rows) ? (rows as WelfareRecord[]) : [];
  } catch {
    return [];
  }
}

/** Upsert matched / imported records into the local catalog. */
export async function upsertWelfareRecords(records: WelfareRecord[]): Promise<void> {
  if (records.length === 0) return;
  const db = await openDb();
  const tx = db.transaction(STORE, 'readwrite');
  const store = tx.objectStore(STORE);
  for (const w of records) {
    if (w?.id) store.put(w);
  }
  await txComplete(tx);
  db.close();
}
