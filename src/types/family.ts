import type { Reminder } from '@/types/reminder';
import type { AppSettings } from '@/types/appSettings';
import type { HouseholdDefaults } from '@/types/household';

export type Relationship = 'self' | 'spouse' | 'child' | 'parent' | 'other';

/** Replaces legacy `isStudent` boolean (university-only UX). */
export type StudentLevel = 'none' | 'k12' | 'university';

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
  occupation: string;
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
}
