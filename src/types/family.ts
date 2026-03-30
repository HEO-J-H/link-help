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
