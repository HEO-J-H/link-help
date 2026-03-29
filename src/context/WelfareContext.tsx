import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { WelfareRecord } from '@/types/benefit';
import { loadAllWelfare } from '@/core/welfare/loadWelfareDb';

type WelfareContextValue = {
  list: WelfareRecord[];
  loading: boolean;
  error: string | null;
};

const WelfareContext = createContext<WelfareContextValue | null>(null);

export function WelfareProvider({ children }: { children: ReactNode }) {
  const [list, setList] = useState<WelfareRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await loadAllWelfare();
        if (!cancelled) setList(data);
      } catch {
        if (!cancelled) setError('복지 데이터를 불러오지 못했습니다.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <WelfareContext.Provider value={{ list, loading, error }}>{children}</WelfareContext.Provider>
  );
}

export function useWelfare(): WelfareContextValue {
  const ctx = useContext(WelfareContext);
  if (!ctx) throw new Error('useWelfare must be used within WelfareProvider');
  return ctx;
}
