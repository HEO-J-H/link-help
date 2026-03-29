import type { WelfareRecord } from '@/types/benefit';

/** Bundled JSON first; cached/IDB rows overlay by id (new ids enlarge the catalog). */
export function mergeWelfareById(bundled: WelfareRecord[], cached: WelfareRecord[]): WelfareRecord[] {
  const map = new Map<string, WelfareRecord>();
  for (const w of bundled) {
    if (w?.id) map.set(w.id, w);
  }
  for (const w of cached) {
    if (!w?.id) continue;
    const prev = map.get(w.id);
    map.set(w.id, prev ? { ...prev, ...w } : w);
  }
  return [...map.values()];
}
