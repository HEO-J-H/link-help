export interface AppSettings {
  /** Request browser Notification API when due reminders fire */
  browserNotifications: boolean;
  /** Base URL for remote welfare API and optional push subscribe (e.g. http://localhost:8787) */
  syncApiBaseUrl: string;
  /** Serialized PushSubscription JSON after Web Push subscribe */
  pushSubscriptionJson?: string;
}

export function defaultAppSettings(): AppSettings {
  return { browserNotifications: false, syncApiBaseUrl: '' };
}
