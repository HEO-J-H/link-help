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
import { loadFamilyFromStorage, saveFamilyToStorage } from '@/core/storage/localStorage';

type FamilyContextValue = {
  state: FamilyState;
  setState: (s: FamilyState) => void;
  addMember: (name: string) => void;
  updateMember: (id: string, patch: Partial<FamilyMember>) => void;
  removeMember: (id: string) => void;
};

const FamilyContext = createContext<FamilyContextValue | null>(null);

export function FamilyProvider({ children }: { children: ReactNode }) {
  const [state, setStateInternal] = useState<FamilyState>(() => {
    return loadFamilyFromStorage() ?? initialFamilyState();
  });

  useEffect(() => {
    saveFamilyToStorage(state);
  }, [state]);

  const setState = useCallback((s: FamilyState) => setStateInternal(s), []);

  const addMember = useCallback((name: string) => {
    setStateInternal((prev) => ({
      members: [...prev.members, createMember({ displayName: name, relationship: 'other' })],
    }));
  }, []);

  const updateMember = useCallback((id: string, patch: Partial<FamilyMember>) => {
    setStateInternal((prev) => ({
      members: prev.members.map((m) =>
        m.id === id ? { ...m, ...patch, profile: patch.profile ? { ...m.profile, ...patch.profile } : m.profile } : m
      ),
    }));
  }, []);

  const removeMember = useCallback((id: string) => {
    setStateInternal((prev) => {
      const next = prev.members.filter((m) => m.id !== id);
      if (next.length === 0) return { members: [createMember({ displayName: '본인', relationship: 'self' })] };
      return { members: next };
    });
  }, []);

  const value = useMemo(
    () => ({ state, setState, addMember, updateMember, removeMember }),
    [state, setState, addMember, updateMember, removeMember]
  );

  return <FamilyContext.Provider value={value}>{children}</FamilyContext.Provider>;
}

export function useFamily(): FamilyContextValue {
  const ctx = useContext(FamilyContext);
  if (!ctx) throw new Error('useFamily must be used within FamilyProvider');
  return ctx;
}
