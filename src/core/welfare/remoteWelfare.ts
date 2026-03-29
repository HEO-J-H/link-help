import type { WelfareRecord } from '@/types/benefit';

export async function fetchRemoteWelfareList(baseUrl: string): Promise<WelfareRecord[]> {
  const root = baseUrl.replace(/\/$/, '');
  const u = `${root}/welfare`;
  const res = await fetch(u, { mode: 'cors', credentials: 'omit' });
  if (!res.ok) throw new Error(`welfare HTTP ${res.status}`);
  const data = (await res.json()) as unknown;
  if (Array.isArray(data)) return data as WelfareRecord[];
  if (data && typeof data === 'object' && Array.isArray((data as { items?: unknown }).items)) {
    return (data as { items: WelfareRecord[] }).items;
  }
  return [];
}

export function mergeWelfareRecords(local: WelfareRecord[], remote: WelfareRecord[]): WelfareRecord[] {
  const map = new Map<string, WelfareRecord>();
  for (const w of local) map.set(w.id, w);
  for (const w of remote) {
    const prev = map.get(w.id);
    map.set(w.id, prev ? { ...prev, ...w } : w);
  }
  return [...map.values()];
}
