import { describe, expect, it } from 'vitest';
import { mergeWelfareById } from './mergeWelfareCatalog';
import type { WelfareRecord } from '@/types/benefit';

const base = (id: string, title: string): WelfareRecord => ({
  id,
  title,
  description: '',
  region: [],
  target: [],
  age: [],
  income: [],
  tags: [],
  benefit: '',
  period: '',
  apply_url: '',
  created_at: '',
  updated_at: '',
  source: '',
});

describe('mergeWelfareById', () => {
  it('adds new ids from cache', () => {
    const a = mergeWelfareById([base('1', 'A')], [base('2', 'B')]);
    expect(a).toHaveLength(2);
    expect(a.map((w) => w.id).sort()).toEqual(['1', '2']);
  });

  it('cached overlays bundled for same id', () => {
    const merged = mergeWelfareById([base('1', 'Old')], [{ ...base('1', 'Old'), title: 'New' }]);
    expect(merged).toHaveLength(1);
    expect(merged[0].title).toBe('New');
  });
});
