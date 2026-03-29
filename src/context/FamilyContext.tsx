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
import { createMember, initialFamilyState } from '@/core/family/familyManager';
import { loadFamilyWithMigration, saveFamilyToIndexedDb } from '@/core/storage/familyIndexedDb';

type FamilyContextValue = {
  state: FamilyState;
  setState: (s: FamilyState) => void;
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
        const next = await loadFamilyWithMigration();
        if (!cancelled) setStateInternal(next);
      } catch {
        if (!cancelled) setStateInternal(initialFamilyState());
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
    void saveFamilyToIndexedDb(state);
  }, [state]);

  const setState = useCallback((s: FamilyState) => setStateInternal(s), []);

  const addMember = useCallback((name: string) => {
    setStateInternal((prev) => {
      const base = prev ?? initialFamilyState();
      return {
        members: [...base.members, createMember({ displayName: name, relationship: 'other' })],
      };
    });
  }, []);

  const updateMember = useCallback((id: string, patch: Partial<FamilyMember>) => {
    setStateInternal((prev) => {
      if (!prev) return prev;
      return {
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
      if (next.length === 0) return { members: [createMember({ displayName: '본인', relationship: 'self' })] };
      return { members: next };
    });
  }, []);

  const value = useMemo(() => {
    if (!state) return null;
    return { state, setState, addMember, updateMember, removeMember };
  }, [state, setState, addMember, updateMember, removeMember]);

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
