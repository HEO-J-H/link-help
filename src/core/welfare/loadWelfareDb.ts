import type { WelfareRecord } from '@/types/benefit';

const WELFARE_FILES = [
  '/welfare-db/welfare/national.json',
  '/welfare-db/welfare/gyeonggi.json',
  '/welfare-db/welfare/yongin.json',
];

export async function loadAllWelfare(): Promise<WelfareRecord[]> {
  const chunks = await Promise.all(
    WELFARE_FILES.map(async (url) => {
      const res = await fetch(url);
      if (!res.ok) return [] as WelfareRecord[];
      const data = (await res.json()) as WelfareRecord[];
      return Array.isArray(data) ? data : [];
    })
  );
  return chunks.flat();
}
