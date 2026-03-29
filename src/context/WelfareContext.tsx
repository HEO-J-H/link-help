import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { WelfareRecord } from '@/types/benefit';
import { loadMergedWelfareCatalog } from '@/core/welfare/loadWelfareDb';

type WelfareContextValue = {
  list: WelfareRecord[];
  loading: boolean;
  error: string | null;
  refreshWelfareCatalog: () => void;
};

const WelfareContext = createContext<WelfareContextValue | null>(null);

export function WelfareProvider({ children }: { children: ReactNode }) {
  const [list, setList] = useState<WelfareRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const refreshWelfareCatalog = useCallback(() => setReloadToken((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const initialPass = reloadToken === 0;
      if (initialPass) setLoading(true);
      setError(null);
      try {
        const local = await loadMergedWelfareCatalog();
        if (!cancelled) setList(local);
      } catch {
        if (!cancelled) setError('복지 데이터를 불러오지 못했습니다.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  return (
    <WelfareContext.Provider value={{ list, loading, error, refreshWelfareCatalog }}>
      {children}
    </WelfareContext.Provider>
  );
}

export function useWelfare(): WelfareContextValue {
  const ctx = useContext(WelfareContext);
  if (!ctx) throw new Error('useWelfare must be used within WelfareProvider');
  return ctx;
}
