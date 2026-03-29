import { describe, expect, it } from 'vitest';
import { getEffectiveProfile } from './effectiveProfile';
import { createMember, emptyHousehold } from './familyManager';

describe('getEffectiveProfile', () => {
  it('uses household sido+sigungu and income when useHouseholdRegionIncome is true', () => {
    const m = createMember({ displayName: 'A', relationship: 'self' });
    const h = { ...emptyHousehold(), sido: '경기도', sigungu: '용인시', incomeBand: '차상위' };
    const eff = getEffectiveProfile(m, h);
    expect(eff.region).toBe('경기도 용인시');
    expect(eff.incomeBand).toBe('차상위');
  });

  it('uses 전국 tag when household sido is 전국', () => {
    const m = createMember({ displayName: 'A', relationship: 'self' });
    const h = { ...emptyHousehold(), sido: '전국', sigungu: '', incomeBand: '' };
    expect(getEffectiveProfile(m, h).region).toBe('전국');
  });

  it('uses member sido/sigungu when useHouseholdRegionIncome is false', () => {
    const m = createMember({
      displayName: 'A',
      relationship: 'self',
      profile: {
        useHouseholdRegionIncome: false,
        regionSido: '서울특별시',
        regionSigungu: '강남구',
        region: '',
        incomeBand: '일반',
      },
    });
    const h = { ...emptyHousehold(), sido: '경기도', sigungu: '용인시', incomeBand: '차상위' };
    const eff = getEffectiveProfile(m, h);
    expect(eff.region).toBe('서울특별시 강남구');
    expect(eff.incomeBand).toBe('일반');
  });
});
