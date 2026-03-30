import type { FamilyState } from '@/types/family';
import type { Reminder } from '@/types/reminder';
import { defaultAppSettings, type AppSettings } from '@/types/appSettings';
import { emptyHousehold, emptySessionFamilyState, normalizeMemberProfile } from './familyManager';
import type { FamilyMember } from '@/types/family';
import type { HouseholdDefaults } from '@/types/household';
import { normalizeMemberColor } from '@/core/family/memberColors';
import { normalizeWelfareTrackingRaw, pruneWelfareTrackingForMembers } from '@/core/family/welfareTracking';

function normalizeHousehold(raw: unknown): HouseholdDefaults {
  const e = emptyHousehold();
  if (!raw || typeof raw !== 'object') return e;
  const o = raw as Record<string, unknown>;
  return {
    sido: typeof o.sido === 'string' ? o.sido : e.sido,
    sigungu: typeof o.sigungu === 'string' ? o.sigungu : e.sigungu,
    incomeBand: typeof o.incomeBand === 'string' ? o.incomeBand : e.incomeBand,
    annualIncomeMemoManwon:
      typeof o.annualIncomeMemoManwon === 'string' ? o.annualIncomeMemoManwon : e.annualIncomeMemoManwon,
  };
}

function mergeAppSettingsFromRaw(raw: unknown): AppSettings {
  const base = defaultAppSettings();
  if (!raw || typeof raw !== 'object') return base;
  const o = raw as Record<string, unknown>;
  return {
    browserNotifications:
      typeof o.browserNotifications === 'boolean' ? o.browserNotifications : base.browserNotifications,
    uiTheme: o.uiTheme === 'light' || o.uiTheme === 'dark' ? o.uiTheme : base.uiTheme,
    linkHelpApiBaseUrl:
      typeof o.linkHelpApiBaseUrl === 'string' ? o.linkHelpApiBaseUrl : base.linkHelpApiBaseUrl,
    linkHelpApiToken: typeof o.linkHelpApiToken === 'string' ? o.linkHelpApiToken : base.linkHelpApiToken,
    welfareContributeConsent:
      typeof o.welfareContributeConsent === 'boolean'
        ? o.welfareContributeConsent
        : base.welfareContributeConsent,
    hiddenBenefitIncludeDraft:
      typeof o.hiddenBenefitIncludeDraft === 'string'
        ? o.hiddenBenefitIncludeDraft
        : base.hiddenBenefitIncludeDraft,
    hiddenBenefitExcludeDraft:
      typeof o.hiddenBenefitExcludeDraft === 'string'
        ? o.hiddenBenefitExcludeDraft
        : base.hiddenBenefitExcludeDraft,
    hiddenBenefitMemberId:
      typeof o.hiddenBenefitMemberId === 'string'
        ? o.hiddenBenefitMemberId
        : base.hiddenBenefitMemberId,
  };
}

/** Ensure new fields exist after import / legacy JSON. Allows zero members (session mode). */
export function normalizeFamilyState(raw: unknown): FamilyState {
  const data = raw as Record<string, unknown> | null;
  if (!data || !Array.isArray(data.members)) {
    return emptySessionFamilyState();
  }
  const members = data.members as FamilyState['members'];
  const reminders = Array.isArray(data.reminders) ? (data.reminders as Reminder[]) : [];
  const appSettings = mergeAppSettingsFromRaw(data.appSettings);
  const household = normalizeHousehold(data.household);

  const rawTracking = normalizeWelfareTrackingRaw(data.welfareTracking);

  if (members.length === 0) {
    return { members: [], household, reminders, appSettings, welfareTracking: rawTracking };
  }

  const normalizedMembers: FamilyMember[] = members.map((m, index) => {
    const raw = m as unknown as Record<string, unknown>;
    return {
      ...(m as FamilyMember),
      memberColor: normalizeMemberColor(raw.memberColor, index),
      profile: normalizeMemberProfile(m.profile),
    };
  });

  const memberIds = new Set(normalizedMembers.map((m) => m.id));
  const welfareTracking = pruneWelfareTrackingForMembers(rawTracking, memberIds);

  return { members: normalizedMembers, household, reminders, appSettings, welfareTracking };
}
