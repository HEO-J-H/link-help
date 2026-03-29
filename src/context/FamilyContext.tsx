import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { FamilyMember, FamilyState } from '@/types/family';
import { createMember, emptySessionFamilyState } from '@/core/family/familyManager';
import { normalizeFamilyState } from '@/core/family/normalizeFamilyState';
import { clearFamilyIndexedDb, loadFamilyFromIndexedDb } from '@/core/storage/familyIndexedDb';
import { FAMILY_STORAGE_KEY } from '@/core/storage/localStorageKeys';
import { loadFamilyFromStorage } from '@/core/storage/localStorage';
import { loadFamilyFromSession, saveFamilyToSession } from '@/core/storage/familySessionStorage';

type FamilyContextValue = {
  state: FamilyState;
  setState: (s: FamilyState) => void;
  updateState: (fn: (prev: FamilyState) => FamilyState) => void;
  addMember: (name: string) => void;
  updateMember: (id: string, patch: Partial<FamilyMember>) => void;
  removeMember: (id: string) => void;
};

const FamilyContext = createContext<FamilyContextValue | null>(null);

export function FamilyProvider({ children }: { children: ReactNode }) {
  const [state, setStateInternal] = useState<FamilyState | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const fromSession = loadFamilyFromSession();
        if (fromSession !== null) {
          if (!cancelled) setStateInternal(fromSession);
          return;
        }

        const fromIdb = await loadFamilyFromIndexedDb();
        if (fromIdb) {
          saveFamilyToSession(fromIdb);
          await clearFamilyIndexedDb();
          if (!cancelled) setStateInternal(fromIdb);
          return;
        }

        const fromLs = loadFamilyFromStorage();
        if (fromLs) {
          const normalized = normalizeFamilyState(fromLs);
          saveFamilyToSession(normalized);
          try {
            localStorage.removeItem(FAMILY_STORAGE_KEY);
          } catch {
            /* ignore */
          }
          await clearFamilyIndexedDb();
          if (!cancelled) setStateInternal(normalized);
          return;
        }

        if (!cancelled) setStateInternal(emptySessionFamilyState());
      } catch {
        if (!cancelled) setStateInternal(emptySessionFamilyState());
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!state) return;
    saveFamilyToSession(state);
  }, [state]);

  const setState = useCallback((s: FamilyState) => setStateInternal(s), []);

  const updateState = useCallback((fn: (prev: FamilyState) => FamilyState) => {
    setStateInternal((prev) => {
      if (!prev) return prev;
      return fn(prev);
    });
  }, []);

  const addMember = useCallback((name: string) => {
    setStateInternal((prev) => {
      const base = prev ?? emptySessionFamilyState();
      return {
        ...base,
        members: [
          ...base.members,
          createMember({ displayName: name, relationship: 'other', paletteIndex: base.members.length }),
        ],
      };
    });
  }, []);

  const updateMember = useCallback((id: string, patch: Partial<FamilyMember>) => {
    setStateInternal((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        members: prev.members.map((m) =>
          m.id === id ? { ...m, ...patch, profile: patch.profile ? { ...m.profile, ...patch.profile } : m.profile } : m
        ),
      };
    });
  }, []);

  const removeMember = useCallback((id: string) => {
    setStateInternal((prev) => {
      if (!prev) return prev;
      const next = prev.members.filter((m) => m.id !== id);
      return {
        ...prev,
        members: next,
        welfareTracking: prev.welfareTracking.filter((e) => e.memberId !== id),
      };
    });
  }, []);

  const value = useMemo(() => {
    if (!state) return null;
    return { state, setState, updateState, addMember, updateMember, removeMember };
  }, [state, setState, updateState, addMember, updateMember, removeMember]);

  if (!hydrated || !value) {
    return (
      <div
        className="app-shell"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100dvh',
          padding: 24,
        }}
      >
        <p className="muted" role="status">
          데이터를 불러오는 중…
        </p>
      </div>
    );
  }

  return <FamilyContext.Provider value={value}>{children}</FamilyContext.Provider>;
}

export function useFamily(): FamilyContextValue {
  const ctx = useContext(FamilyContext);
  if (!ctx) throw new Error('useFamily must be used within FamilyProvider');
  return ctx;
}
