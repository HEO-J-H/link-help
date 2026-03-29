import type { WelfareRecord } from '@/types/benefit';
import { publicAsset } from '@/utils/publicAsset';

const WELFARE_FILES = ['welfare-db/welfare/national.json', 'welfare-db/welfare/gyeonggi.json', 'welfare-db/welfare/yongin.json'];

export async function loadAllWelfare(): Promise<WelfareRecord[]> {
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
