import type { InsurancePolicy } from '@/types/insurance';
import type { Reminder } from '@/types/reminder';
import type { AppSettings } from '@/types/appSettings';

export type Relationship = 'self' | 'spouse' | 'child' | 'parent' | 'other';

export interface MemberProfile {
  birthDate: string;
  region: string;
  occupation: string;
  incomeBand: string;
  isStudent: boolean;
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
  insurancePolicies: InsurancePolicy[];
  reminders: Reminder[];
  appSettings: AppSettings;
}
