/** User progress on a welfare item (per family member). */
export type WelfareTrackingStatus = 'applying' | 'excluded' | 'later';

export interface WelfareTrackingEntry {
  memberId: string;
  welfareId: string;
  status: WelfareTrackingStatus;
  /** Shown for `excluded`; updated manually or via profile-linked refresh */
  excludeReason?: string;
  /** When true, `excludeReason` is regenerated from profile exclude tags vs this welfare row */
  excludeFromProfileTags?: boolean;
  updatedAt: string;
}

/** Short labels for the whole family (no English “skip”). */
export const WELFARE_TRACKING_LABELS: Record<WelfareTrackingStatus, string> = {
  applying: '신청 중',
  excluded: '제외함',
  later: '나중에 볼게요',
};
