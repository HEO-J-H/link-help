import type { Reminder } from '@/types/reminder';
import type { AppSettings } from '@/types/appSettings';

export type Relationship = 'self' | 'spouse' | 'child' | 'parent' | 'other';

/** Replaces legacy `isStudent` boolean (university-only UX). */
export type StudentLevel = 'none' | 'k12' | 'university';

export interface MemberProfile {
  birthDate: string;
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
  profile: MemberProfile;
}

export interface FamilyState {
  members: FamilyMember[];
  reminders: Reminder[];
  appSettings: AppSettings;
}
