export type WelfareStatus = 'active' | 'expired';

export interface WelfareRecord {
  id: string;
  title: string;
  description: string;
  region: string[];
  target: string[];
  age: string[];
  income: string[];
  tags: string[];
  benefit: string;
  /** e.g. "YYYY-MM-DD ~ YYYY-MM-DD" — used to detect ended programs when status is not set */
  period: string;
  apply_url: string;
  status?: WelfareStatus;
  created_at: string;
  updated_at: string;
  source: string;
  /** Computed match score (0–1) when recommending */
  score?: number;
  /** Static popularity hint for sorting (0–100) */
  popularity?: number;
}
