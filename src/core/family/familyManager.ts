import type { FamilyMember, FamilyState, MemberProfile, Relationship } from '@/types/family';
import { defaultAppSettings } from '@/types/appSettings';

function uid(): string {
  return `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

export function emptyProfile(): MemberProfile {
  return {
    birthDate: '',
    region: '',
    occupation: '',
    incomeBand: '',
    isStudent: false,
    hasDisability: false,
    extraIncludeTags: [],
    extraExcludeTags: [],
  };
}

export function createMember(partial: {
  displayName: string;
  relationship: Relationship;
  profile?: Partial<MemberProfile>;
}): FamilyMember {
  return {
    id: uid(),
    displayName: partial.displayName,
    relationship: partial.relationship,
    profile: { ...emptyProfile(), ...partial.profile },
  };
}

export function initialFamilyState(): FamilyState {
  return {
    members: [createMember({ displayName: '본인', relationship: 'self' })],
    insurancePolicies: [],
    reminders: [],
    appSettings: defaultAppSettings(),
  };
}
