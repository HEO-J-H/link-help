import type { WelfareRecord } from '@/types/benefit';
import { publicAsset } from '@/utils/publicAsset';
import { getAllCachedWelfareRecords } from '@/core/storage/welfareIndexedDb';
import { mergeWelfareById } from '@/core/welfare/mergeWelfareCatalog';
import { sanitizeWelfareDemoMarkers } from '@/core/welfare/welfareDemoMarkers';

const WELFARE_FILES = [
  'welfare-db/welfare/national.json',
  'welfare-db/welfare/gyeonggi.json',
  'welfare-db/welfare/yongin.json',
];

/** Static JSON shipped with the app (curated from public agency references; see docs/data-sources.md). */
export async function loadBundledWelfare(): Promise<WelfareRecord[]> {
  const chunks = await Promise.all(
    WELFARE_FILES.map(async (rel) => {
      const res = await fetch(publicAsset(rel));
      if (!res.ok) return [] as WelfareRecord[];
      const data = (await res.json()) as WelfareRecord[];
      return Array.isArray(data) ? data : [];
    })
  );
  return chunks.flat();
}

/** Bundled + IndexedDB cache (smart-match hits, future imports). */
export async function loadMergedWelfareCatalog(): Promise<WelfareRecord[]> {
  const [bundled, cached] = await Promise.all([loadBundledWelfare(), getAllCachedWelfareRecords()]);
  return mergeWelfareById(bundled, cached).map(sanitizeWelfareDemoMarkers);
}
