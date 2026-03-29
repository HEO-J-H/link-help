import type {
  AssetAnswer,
  FamilyMember,
  FamilyState,
  MemberProfile,
  OccupationKind,
  Relationship,
  StudentLevel,
} from '@/types/family';
import type { HouseholdDefaults } from '@/types/household';
import { defaultAppSettings } from '@/types/appSettings';
import { isValidMemberColor, memberColorFromPaletteIndex } from '@/core/family/memberColors';

function uid(): string {
  return `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

export function emptyHousehold(): HouseholdDefaults {
  return {
    sido: '',
    sigungu: '',
    incomeBand: '',
    annualIncomeMemoManwon: '',
  };
}

export function emptyProfile(): MemberProfile {
  return {
    birthDate: '',
    useHouseholdRegionIncome: true,
    regionSido: '',
    regionSigungu: '',
    region: '',
    occupationKind: '',
    occupation: '',
    hasCar: 'unknown',
    ownsHome: 'unknown',
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
  const useHouseholdRegionIncome =
    typeof o.useHouseholdRegionIncome === 'boolean' ? o.useHouseholdRegionIncome : true;

  const kindVals: OccupationKind[] = [
    '',
    'salaried',
    'self_employed',
    'freelancer',
    'homemaker',
    'student',
    'job_seeking',
    'retired',
    'parental_leave',
    'other',
  ];
  let occupationKind: OccupationKind =
    typeof o.occupationKind === 'string' && kindVals.includes(o.occupationKind as OccupationKind)
      ? (o.occupationKind as OccupationKind)
      : '';
  let occupation = typeof o.occupation === 'string' ? o.occupation : e.occupation;
  if (!occupationKind && occupation.trim()) occupationKind = 'other';

  const normAsset = (v: unknown): AssetAnswer => {
    if (v === 'yes' || v === true) return 'yes';
    if (v === 'no' || v === false) return 'no';
    return 'unknown';
  };

  return {
    birthDate: typeof o.birthDate === 'string' ? o.birthDate : e.birthDate,
    useHouseholdRegionIncome,
    regionSido: typeof o.regionSido === 'string' ? o.regionSido : e.regionSido,
    regionSigungu: typeof o.regionSigungu === 'string' ? o.regionSigungu : e.regionSigungu,
    region: typeof o.region === 'string' ? o.region : e.region,
    occupationKind,
    occupation,
    hasCar: normAsset(o.hasCar),
    ownsHome: normAsset(o.ownsHome),
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
  /** Explicit #rgb / #rrggbb */
  memberColor?: string;
  /** Pick from preset ring when color omitted */
  paletteIndex?: number;
}): FamilyMember {
  const memberColor =
    typeof partial.memberColor === 'string' && isValidMemberColor(partial.memberColor)
      ? partial.memberColor.trim()
      : memberColorFromPaletteIndex(partial.paletteIndex ?? 0);
  return {
    id: uid(),
    displayName: partial.displayName,
    relationship: partial.relationship,
    memberColor,
    profile: { ...emptyProfile(), ...partial.profile },
  };
}

export function initialFamilyState(): FamilyState {
  return {
    members: [createMember({ displayName: '본인', relationship: 'self' })],
    household: emptyHousehold(),
    reminders: [],
    appSettings: defaultAppSettings(),
    welfareTracking: [],
  };
}

/** New tab / after closing the window — no members until import or add. */
export function emptySessionFamilyState(): FamilyState {
  return {
    members: [],
    household: emptyHousehold(),
    reminders: [],
    appSettings: defaultAppSettings(),
    welfareTracking: [],
  };
}
