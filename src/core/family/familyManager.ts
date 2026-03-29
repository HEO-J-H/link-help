import type {
  FamilyMember,
  FamilyState,
  MemberProfile,
  Relationship,
  StudentLevel,
} from '@/types/family';
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
    annualIncomeMemoManwon: '',
    studentLevel: 'none',
    hasDisability: false,
    extraIncludeTags: [],
    extraExcludeTags: [],
  };
}

/** Merge saved JSON / legacy `isStudent` into current `MemberProfile` shape. */
export function normalizeMemberProfile(raw: unknown): MemberProfile {
  const e = emptyProfile();
  if (!raw || typeof raw !== 'object') return e;
  const o = raw as Record<string, unknown>;
  let studentLevel: StudentLevel = 'none';
  if (o.studentLevel === 'k12' || o.studentLevel === 'university') {
    studentLevel = o.studentLevel;
  } else if (o.isStudent === true) {
    studentLevel = 'university';
  }
  return {
    birthDate: typeof o.birthDate === 'string' ? o.birthDate : e.birthDate,
    region: typeof o.region === 'string' ? o.region : e.region,
    occupation: typeof o.occupation === 'string' ? o.occupation : e.occupation,
    incomeBand: typeof o.incomeBand === 'string' ? o.incomeBand : e.incomeBand,
    annualIncomeMemoManwon:
      typeof o.annualIncomeMemoManwon === 'string' ? o.annualIncomeMemoManwon : e.annualIncomeMemoManwon,
    studentLevel,
    hasDisability: typeof o.hasDisability === 'boolean' ? o.hasDisability : e.hasDisability,
    extraIncludeTags: Array.isArray(o.extraIncludeTags)
      ? o.extraIncludeTags.filter((x): x is string => typeof x === 'string')
      : e.extraIncludeTags,
    extraExcludeTags: Array.isArray(o.extraExcludeTags)
      ? o.extraExcludeTags.filter((x): x is string => typeof x === 'string')
      : e.extraExcludeTags,
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
    reminders: [],
    appSettings: defaultAppSettings(),
  };
}

/** New tab / after closing the window — no members until import or add. */
export function emptySessionFamilyState(): FamilyState {
  return {
    members: [],
    reminders: [],
    appSettings: defaultAppSettings(),
  };
}
