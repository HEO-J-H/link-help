import { useEffect, useMemo } from 'react';
import { useFamily } from '@/context/FamilyContext';
import { useWelfare } from '@/context/WelfareContext';
import { refreshAutoExcludeReasons } from '@/core/family/welfareTracking';

/**
 * When profile exclude tags, household, or catalog changes, refresh auto-derived exclude reasons.
 */
export function WelfareTrackingSync() {
  const { state, updateState } = useFamily();
  const { list } = useWelfare();

  const profileSig = useMemo(() => {
    const parts = state.members.map((m) => ({
      id: m.id,
      ex: [...m.profile.extraExcludeTags].sort().join('|'),
    }));
    const h = `${state.household.sido}|${state.household.sigungu}|${state.household.incomeBand}`;
    return JSON.stringify({ parts, h });
  }, [state.members, state.household]);

  const listKey = useMemo(() => list.map((x) => x.id).join('\n'), [list]);

  useEffect(() => {
    if (list.length === 0) return;
    updateState((prev) => {
      const next = refreshAutoExcludeReasons(prev.welfareTracking, prev.members, prev.household, list);
      if (JSON.stringify(prev.welfareTracking) === JSON.stringify(next)) return prev;
      return { ...prev, welfareTracking: next };
    });
  }, [profileSig, listKey, list, updateState]);

  return null;
}
