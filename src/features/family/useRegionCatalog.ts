import { useEffect, useState } from 'react';
import type { RegionCatalog } from '@/types/regionCatalog';
import { publicAsset } from '@/utils/publicAsset';

const FALLBACK: RegionCatalog = {
  sidoSigungu: {
    경기도: ['용인시', '수원시', '성남시'],
    서울특별시: ['강남구', '송파구'],
  },
};

export function useRegionCatalog(): RegionCatalog | null {
  const [cat, setCat] = useState<RegionCatalog | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(publicAsset('welfare-db/region/region.json'));
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as RegionCatalog;
        if (!cancelled && data?.sidoSigungu && typeof data.sidoSigungu === 'object') {
          setCat(data);
        }
      } catch {
        if (!cancelled) setCat(FALLBACK);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return cat;
}

export function sortedSidoList(sidoSigungu: Record<string, string[]>): string[] {
  return Object.keys(sidoSigungu).sort((a, b) => a.localeCompare(b, 'ko'));
}
