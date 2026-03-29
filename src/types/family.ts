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
