import { describe, expect, it } from 'vitest';
import type { WelfareRecord } from '@/types/benefit';
import type { MemberProfile } from '@/types/family';
import { deriveAutoExcludeReason, upsertWelfareTracking } from './welfareTracking';

function welfare(partial: Partial<WelfareRecord> & Pick<WelfareRecord, 'id' | 'title'>): WelfareRecord {
  return {
    description: '',
    region: [],
    target: [],
    age: [],
    income: [],
    tags: [],
    benefit: '',
    period: '',
    apply_url: '',
    created_at: '',
    updated_at: '',
    source: '',
    ...partial,
  };
}

function profile(extraExclude: string[]): MemberProfile {
  return {
    birthDate: '',
    useHouseholdRegionIncome: true,
    regionSido: '',
    regionSigungu: '',
    region: '',
    occupationKind: '',
    occupation: '',
    hasCar: 'unknown',
    ownsHome: 'unknown',
    incomeBand: '',
    annualIncomeMemoManwon: '',
    studentLevel: 'none',
    hasDisability: false,
    extraIncludeTags: [],
    extraExcludeTags: extraExclude,
  };
}

describe('deriveAutoExcludeReason', () => {
  it('lists welfare tags that match exclude tags', () => {
    const w = welfare({
      id: '1',
      title: 'x',
      tags: ['청년', '용인'],
    });
    const r = deriveAutoExcludeReason(w, profile(['청년']));
    expect(r).toContain('청년');
    expect(r).toContain('태그');
  });

  it('notes when no exclude tags on profile', () => {
    const w = welfare({ id: '1', title: 'x', tags: ['a'] });
    expect(deriveAutoExcludeReason(w, profile([]))).toContain('제외 태그가 없습니다');
  });
});

describe('upsertWelfareTracking', () => {
  it('clears exclude fields when switching to applying', () => {
    const a = upsertWelfareTracking([], {
      memberId: 'm1',
      welfareId: 'w1',
      status: 'excluded',
      excludeReason: 'x',
      excludeFromProfileTags: true,
    });
    const b = upsertWelfareTracking(a, { memberId: 'm1', welfareId: 'w1', status: 'applying' });
    const row = b.find((e) => e.memberId === 'm1' && e.welfareId === 'w1');
    expect(row?.status).toBe('applying');
    expect(row?.excludeReason).toBeUndefined();
  });
});
