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
  period: string;
  apply_url: string;
  status?: WelfareStatus;
  created_at: string;
  updated_at: string;
  source: string;
  score?: number;
}
