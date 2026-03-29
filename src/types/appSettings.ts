export interface AppSettings {
  /** Request browser Notification API when due reminders fire (tab open) */
  browserNotifications: boolean;
}

export function defaultAppSettings(): AppSettings {
  return { browserNotifications: false };
}
