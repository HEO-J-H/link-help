import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { WelfareRecord } from '@/types/benefit';
import { useFamily } from '@/context/FamilyContext';
import { loadAllWelfare } from '@/core/welfare/loadWelfareDb';
import { fetchRemoteWelfareList, mergeWelfareRecords } from '@/core/welfare/remoteWelfare';

type WelfareContextValue = {
  list: WelfareRecord[];
  loading: boolean;
  error: string | null;
  remoteError: string | null;
};

const WelfareContext = createContext<WelfareContextValue | null>(null);

export function WelfareProvider({ children }: { children: ReactNode }) {
  const { state } = useFamily();
  const baseUrl = state.appSettings.syncApiBaseUrl.trim();
  const [list, setList] = useState<WelfareRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [remoteError, setRemoteError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      setRemoteError(null);
      try {
        const local = await loadAllWelfare();
        if (cancelled) return;
        if (!baseUrl) {
          setList(local);
          return;
        }
        try {
          const remote = await fetchRemoteWelfareList(baseUrl);
          if (cancelled) return;
          setList(mergeWelfareRecords(local, remote));
        } catch {
          if (cancelled) return;
          setRemoteError('원격 복지(/welfare)를 불러오지 못했습니다. 로컬 데이터만 표시합니다.');
          setList(local);
        }
      } catch {
        if (!cancelled) setError('복지 데이터를 불러오지 못했습니다.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [baseUrl]);

  return (
    <WelfareContext.Provider value={{ list, loading, error, remoteError }}>
      {children}
    </WelfareContext.Provider>
  );
}

export function useWelfare(): WelfareContextValue {
  const ctx = useContext(WelfareContext);
  if (!ctx) throw new Error('useWelfare must be used within WelfareProvider');
  return ctx;
}
