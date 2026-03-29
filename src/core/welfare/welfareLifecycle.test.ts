import { describe, expect, it } from 'vitest';
import type { WelfareRecord } from '@/types/benefit';
import { isWelfareEffectivelyExpired, parsePeriodEndDate } from './welfareLifecycle';

function row(partial: Partial<WelfareRecord> & Pick<WelfareRecord, 'id' | 'title'>): WelfareRecord {
  return {
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
    ...partial,
  };
}

describe('parsePeriodEndDate', () => {
  it('parses YYYY-MM-DD ~ YYYY-MM-DD', () => {
    const d = parsePeriodEndDate('2026-01-01 ~ 2026-12-31');
    expect(d?.getFullYear()).toBe(2026);
    expect(d?.getMonth()).toBe(11);
    expect(d?.getDate()).toBe(31);
  });

  it('returns null for empty', () => {
    expect(parsePeriodEndDate('')).toBeNull();
    expect(parsePeriodEndDate('상시')).toBeNull();
  });
});

describe('isWelfareEffectivelyExpired', () => {
  it('respects status expired', () => {
    const w = row({
      id: '1',
      title: 'x',
      period: '2099-01-01 ~ 2099-12-31',
      status: 'expired',
    });
    expect(isWelfareEffectivelyExpired(w, new Date('2030-01-01'))).toBe(true);
  });

  it('uses period end before reference day', () => {
    const w = row({ id: '1', title: 'x', period: '2024-01-01 ~ 2024-06-30' });
    expect(isWelfareEffectivelyExpired(w, new Date(2024, 6, 1))).toBe(true);
    expect(isWelfareEffectivelyExpired(w, new Date(2024, 5, 30))).toBe(false);
  });

  it('does not expire when period is not parseable', () => {
    const w = row({ id: '1', title: 'x', period: '별도 공고' });
    expect(isWelfareEffectivelyExpired(w, new Date('2099-01-01'))).toBe(false);
  });
});
