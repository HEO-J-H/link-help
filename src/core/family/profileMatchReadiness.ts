import type { HouseholdDefaults } from '@/types/household';
import type { FamilyMember, MemberProfile } from '@/types/family';
import { getEffectiveProfile } from '@/core/family/effectiveProfile';

export type ProfileReadiness = {
  percent: number;
  filled: number;
  total: number;
  missing: string[];
};

function regionFilled(p: MemberProfile, household: HouseholdDefaults, useHousehold: boolean): boolean {
  if (useHousehold) {
    const s = household.sido.trim();
    const g = household.sigungu.trim();
    if (s === '전국') return true;
    return Boolean(s && g);
  }
  return Boolean(p.regionSido.trim() && p.regionSigungu.trim()) || Boolean(p.region.trim());
}

function incomeFilled(p: MemberProfile, household: HouseholdDefaults, useHousehold: boolean): boolean {
  return useHousehold
    ? Boolean(household.incomeBand.trim())
    : Boolean(p.incomeBand.trim());
}

/** Checklist toward richer matching (not legal eligibility). */
export function profileMatchReadiness(member: FamilyMember, household: HouseholdDefaults): ProfileReadiness {
  const useHouse = member.profile.useHouseholdRegionIncome;
  const p = getEffectiveProfile(member, household);

  const checks: { label: string; ok: boolean }[] = [
    { label: '생년월일', ok: Boolean(p.birthDate.trim()) },
    { label: '지역(가구 동일이면 가족 탭 시·군·구)', ok: regionFilled(p, household, useHouse) },
    { label: '소득 구간', ok: incomeFilled(p, household, useHouse) },
    { label: '활동·직업 상태', ok: p.occupationKind !== '' },
    { label: '직무·직장·학과 상세(2글자 이상 권장)', ok: p.occupation.trim().length >= 2 },
    { label: '자동차 보유 여부', ok: p.hasCar !== 'unknown' },
    { label: '주택 보유 여부', ok: p.ownsHome !== 'unknown' },
  ];

  if (p.occupationKind === 'student') {
    checks.push({ label: '학생 구분(초·중·고 / 대학)', ok: p.studentLevel !== 'none' });
    checks.push({ label: '학교명', ok: p.schoolName.trim().length >= 2 });
    checks.push({ label: '재학 상태', ok: Boolean(p.enrollmentStatus) });
  } else {
    checks.push({
      label: '학생이 아니면 「해당 없음」',
      ok: p.studentLevel === 'none',
    });
  }

  if (p.occupationKind === 'salaried' || p.occupationKind === 'parental_leave') {
    checks.push({ label: '고용 형태(정규·계약 등)', ok: Boolean(p.employmentContract) });
    checks.push({ label: '고용보험 가입 여부', ok: p.employmentInsurance !== 'unknown' });
    checks.push({ label: '국민연금 가입 여부', ok: p.nationalPension !== 'unknown' });
  }

  checks.push(
    { label: '세대주 여부', ok: p.isHouseholdHead !== 'unknown' },
    {
      label: '가구 인원 수',
      ok: /^\d+$/.test(p.householdMemberCount.trim()) && Number(p.householdMemberCount) > 0,
    },
    {
      label: '동거·부양 중인 미성년 자녀 수',
      ok: /^\d+$/.test(p.dependentsChildrenCount.trim()),
    },
    { label: '출산·육아 단계', ok: Boolean(p.parentingStage) },
    { label: '주거 형태(자가·전세·월세 등)', ok: Boolean(p.housingTenure) },
    { label: '건강보험 유형', ok: Boolean(p.healthInsurance) },
  );

  if (p.hasDisability) {
    checks.push({
      label: '장애 관련 메모(정도·유형 등, 선택이지만 정밀도↑)',
      ok: p.disabilityDetail.trim().length >= 1,
    });
  }

  const filled = checks.filter((c) => c.ok).length;
  const total = checks.length;
  const percent = total === 0 ? 100 : Math.round((filled / total) * 100);
  const missing = checks.filter((c) => !c.ok).map((c) => c.label);
  return { percent, filled, total, missing };
}
