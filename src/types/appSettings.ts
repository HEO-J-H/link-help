export interface AppSettings {
  /** Request browser Notification API when due reminders fire */
  browserNotifications: boolean;
  /** Reserved for future sync / server integration */
  syncApiBaseUrl: string;
}

export function defaultAppSettings(): AppSettings {
  return { browserNotifications: false, syncApiBaseUrl: '' };
}
