import type { Reminder } from '@/types/reminder';
import type { AppSettings } from '@/types/appSettings';
import type { HouseholdDefaults } from '@/types/household';
import type { WelfareTrackingEntry } from '@/types/welfareTracking';

export type Relationship = 'self' | 'spouse' | 'child' | 'parent' | 'other';

/** Replaces legacy `isStudent` boolean (university-only UX). */
export type StudentLevel = 'none' | 'k12' | 'university';

/** Universal activity / employment shape for matching (not legal status). */
export type OccupationKind =
  | ''
  | 'salaried'
  | 'self_employed'
  | 'freelancer'
  | 'homemaker'
  | 'student'
  | 'job_seeking'
  | 'retired'
  | 'parental_leave'
  | 'other';

/** For car / home hints: unknown = do not filter or add asset tags. */
export type AssetAnswer = 'unknown' | 'yes' | 'no';

/** 재학 상태 (학생일 때 매칭 정밀도). */
export type EnrollmentStatus = '' | 'enrolled' | 'on_leave' | 'expected_graduate';

/** 임신·영유아·취학 자녀 등 복지 공고 힌트. */
export type ParentingStage = '' | 'none' | 'pregnancy' | 'infant' | 'school_age';

/** 주거 형태 힌트. */
export type HousingTenure = '' | 'owned' | 'jeonse' | 'monthly' | 'free' | 'other';

/** 근로 형태 세부. */
export type EmploymentContractKind = '' | 'regular' | 'contract' | 'daily' | 'special' | 'unknown';

/** 건강보험·의료급여 구분(참고용). */
export type HealthInsuranceKind = '' | 'employee' | 'local' | 'medical_aid';

/** 생계급여·차상위 등 복지 DB 저소득 태그 연결(참고). '' = 미선택. */
export type LivelihoodSupportTier = '' | 'none' | 'basic_livelihood' | 'near_poverty';

/** 농어촌·산업 공고 태그 보강. '' = 미선택. */
export type PrimarySectorContext = '' | 'none' | 'agriculture' | 'fishery';

export interface MemberProfile {
  birthDate: string;
  /** When false, use regionSido/regionSigungu (or legacy region) instead of 가구 기본. */
  useHouseholdRegionIncome: boolean;
  /** 시·도 (가구와 다르게 쓸 때) */
  regionSido: string;
  /** 시·군·구 */
  regionSigungu: string;
  /** Derived / legacy single field; kept in sync when possible */
  region: string;
  /** Primary activity selector; drives welfare tags. */
  occupationKind: OccupationKind;
  /** Free text when occupationKind is other, or legacy note */
  occupation: string;
  /** 자동차 보유 — 'no'일 때 자동차 중심 공고를 제외하는 데 씁니다. */
  hasCar: AssetAnswer;
  /** 주택 보유(유주택) — 태그 힌트에만 사용합니다. */
  ownsHome: AssetAnswer;
  incomeBand: string;
  /** Optional memo (만 원 단위 문자). Matching/tags are unchanged — not a legal income test. */
  annualIncomeMemoManwon: string;
  studentLevel: StudentLevel;
  hasDisability: boolean;

  /** 정규직·계약직 등 (근로·육아휴직 복지 정밀도). */
  employmentContract: EmploymentContractKind;
  /** 재학·휴학 등 (학생). */
  enrollmentStatus: EnrollmentStatus;
  /** 학교명 (학생). */
  schoolName: string;
  /** 세대주 여부. */
  isHouseholdHead: AssetAnswer;
  /** 가구 전체 인원(본인 포함), 숫자 문자열. */
  householdMemberCount: string;
  /** 동거·부양 미성년 자녀 수, 숫자 문자열. */
  dependentsChildrenCount: string;
  parentingStage: ParentingStage;
  housingTenure: HousingTenure;
  singleParentHousehold: boolean;
  multiculturalFamily: boolean;
  veteranOrMeritRelated: boolean;
  /** 장애 정도·유형 메모(로컬만). */
  disabilityDetail: string;
  employmentInsurance: AssetAnswer;
  nationalPension: AssetAnswer;
  healthInsurance: HealthInsuranceKind;

  /** 기초생활수급 등 — 「기초생활」「생계급여」 태그와 맞춤. */
  livelihoodSupportTier: LivelihoodSupportTier;
  /** 농업·어업 복지 공고 — 「농촌」「어촌」 등 태그와 맞춤. */
  primarySectorContext: PrimarySectorContext;
  /** 가족 돌봄(요양·장기요양 대상 부양 등) — 「돌봄」 태그. */
  unpaidFamilyCaregiver: boolean;
  /** 에너지·주거 비용 부담 큼 — 「에너지」「취약계층」 등과 맞춤. */
  energyOrHousingVulnerable: boolean;

  /**
   * 복지로·정부24 분류 참고 관심 영역 id (`filterEngine`의 WELFARE_INTEREST_CATEGORY_DEFS).
   * 선택 시 해당 카테고리 대표 태그가 파생 태그에 합쳐져 엄격 매칭에 사용됩니다.
   */
  welfareInterestCategoryIds: string[];

  extraIncludeTags: string[];
  extraExcludeTags: string[];
}

export interface FamilyMember {
  id: string;
  displayName: string;
  relationship: Relationship;
  /** Hex accent for UI (recommend tab, lists), e.g. #2563eb */
  memberColor: string;
  profile: MemberProfile;
}

export interface FamilyState {
  members: FamilyMember[];
  /** 가구 공통: 지역·소득 (구성원이 「가구와 동일」일 때 매칭에 사용) */
  household: HouseholdDefaults;
  reminders: Reminder[];
  appSettings: AppSettings;
  /** 구성원별 복지 항목 진행 상태(신청 중 / 제외 / 나중에 볼게요) */
  welfareTracking: WelfareTrackingEntry[];
}
