import { describe, expect, it } from 'vitest';
import { createMember, emptyHousehold } from './familyManager';
import { profileMatchReadiness } from './profileMatchReadiness';

describe('profileMatchReadiness', () => {
  it('새 구성원은 완성도 100% 미만', () => {
    const m = createMember({ displayName: 'A', relationship: 'self' });
    const r = profileMatchReadiness(m, emptyHousehold());
    expect(r.percent).toBeLessThan(100);
    expect(r.missing.length).toBeGreaterThan(0);
  });

  it('가구 지역·소득·핵심 필드를 채우면 완성도가 오른다', () => {
    const m = createMember({
      displayName: 'B',
      relationship: 'self',
      profile: {
        birthDate: '1990-01-01',
        occupationKind: 'salaried',
        occupation: '사무직',
        hasCar: 'no',
        ownsHome: 'yes',
        employmentContract: 'regular',
        employmentInsurance: 'yes',
        nationalPension: 'yes',
        isHouseholdHead: 'yes',
        householdMemberCount: '3',
        dependentsChildrenCount: '1',
        parentingStage: 'school_age',
        housingTenure: 'jeonse',
        healthInsurance: 'employee',
        livelihoodSupportTier: 'none',
        primarySectorContext: 'none',
        welfareInterestCategoryIds: ['work'],
      },
    });
    const h = { ...emptyHousehold(), sido: '경기도', sigungu: '용인시', incomeBand: '일반' };
    const r = profileMatchReadiness(m, h);
    expect(r.percent).toBe(100);
    expect(r.missing).toHaveLength(0);
  });
});
