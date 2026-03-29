export interface AppSettings {
  /** Request browser Notification API when due reminders fire (tab open) */
  browserNotifications: boolean;
  /**
   * Optional hosted API origin, e.g. https://api.example.com:8787 (no trailing slash).
   * Used for public catalog fetch, notice analyze, and crowd contribute.
   */
  linkHelpApiBaseUrl: string;
  /** When API_SHARED_TOKEN is set on server, send as Bearer (stored in session JSON only). */
  linkHelpApiToken: string;
  /** User opts in to POST anonymized welfare records (no family profile) to linkHelpApiBaseUrl. */
  welfareContributeConsent: boolean;
  /** Last drafts for 숨은 복지·혜택찾기 (saved with family session JSON / IndexedDB). */
  hiddenBenefitIncludeDraft: string;
  hiddenBenefitExcludeDraft: string;
  hiddenBenefitMemberId: string;
}

export function defaultAppSettings(): AppSettings {
  const viteBase =
    typeof import.meta !== 'undefined' && import.meta.env?.VITE_LINK_HELP_API_BASE
      ? String(import.meta.env.VITE_LINK_HELP_API_BASE).trim()
      : '';
  return {
    browserNotifications: false,
    linkHelpApiBaseUrl: viteBase,
    linkHelpApiToken: '',
    welfareContributeConsent: false,
    hiddenBenefitIncludeDraft: '',
    hiddenBenefitExcludeDraft: '',
    hiddenBenefitMemberId: '',
  };
}
