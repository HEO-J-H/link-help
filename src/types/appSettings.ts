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
}

export function defaultAppSettings(): AppSettings {
  return {
    browserNotifications: false,
    linkHelpApiBaseUrl: '',
    linkHelpApiToken: '',
    welfareContributeConsent: false,
  };
}
