import type { FamilyMember, MemberProfile } from '@/types/family';
import type { HouseholdDefaults } from '@/types/household';

/** Effective profile for tag matching (가구 기본 + 구성원별 옵션). */
export function getEffectiveProfile(member: FamilyMember, household: HouseholdDefaults): MemberProfile {
  const p = member.profile;

  if (p.useHouseholdRegionIncome === false) {
    const pieces = [p.regionSido.trim(), p.regionSigungu.trim()].filter(Boolean);
    const region = pieces.length > 0 ? pieces.join(' ') : p.region.trim();
    return { ...p, region };
  }

  let region = p.region;
  let incomeBand = p.incomeBand;
  let annualIncomeMemoManwon = p.annualIncomeMemoManwon;

  const sido = household.sido.trim();
  const sigungu = household.sigungu.trim();

  if (sido === '전국') {
    region = '전국';
  } else if (sido && sigungu) {
    region = `${sido} ${sigungu}`;
  } else if (sido) {
    region = sido;
  }

  if (household.incomeBand.trim()) incomeBand = household.incomeBand.trim();
  if (household.annualIncomeMemoManwon.trim()) {
    annualIncomeMemoManwon = household.annualIncomeMemoManwon.trim();
  }

  return {
    ...p,
    region,
    incomeBand,
    annualIncomeMemoManwon,
  };
}
