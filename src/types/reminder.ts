export type ReminderKind = 'benefit' | 'insurance' | 'custom';

export interface Reminder {
  id: string;
  kind: ReminderKind;
  title: string;
  body: string;
  fireAt: string;
  refId?: string;
  createdAt: string;
  delivered?: boolean;
}
