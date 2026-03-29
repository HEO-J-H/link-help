import { describe, expect, it } from 'vitest';
import type { WelfareRecord } from '@/types/benefit';
import { getApplicationDDay, calendarDaysUntil } from './applicationDDay';

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

describe('calendarDaysUntil', () => {
  it('counts whole local calendar days', () => {
    const a = new Date(2026, 2, 20);
    const b = new Date(2026, 2, 27);
    expect(calendarDaysUntil(a, b)).toBe(7);
  });
});

describe('getApplicationDDay', () => {
  it('returns urgent D-3 when end in 3 days', () => {
    const now = new Date(2026, 2, 20);
    const w = row({
      id: '1',
      title: 't',
      period: '2026-01-01 ~ 2026-03-23',
    });
    const d = getApplicationDDay(w, now);
    expect(d.urgency).toBe('urgent');
    expect(d.daysLeft).toBe(3);
    expect(d.label).toBe('D-3');
  });

  it('returns soon for 15 days left', () => {
    const now = new Date(2026, 2, 1);
    const w = row({
      id: '1',
      title: 't',
      period: '2026-01-01 ~ 2026-03-16',
    });
    const d = getApplicationDDay(w, now);
    expect(d.urgency).toBe('soon');
    expect(d.daysLeft).toBe(15);
  });

  it('returns steady for far end', () => {
    const now = new Date(2026, 2, 1);
    const w = row({
      id: '1',
      title: 't',
      period: '2026-01-01 ~ 2026-12-31',
    });
    const d = getApplicationDDay(w, now);
    expect(d.urgency).toBe('steady');
    expect(d.daysLeft).toBeGreaterThan(30);
  });

  it('detects ongoing 상시', () => {
    const w = row({ id: '1', title: 't', period: '상시 모집' });
    const d = getApplicationDDay(w);
    expect(d.urgency).toBe('ongoing');
    expect(d.label).toBe('상시');
  });
});
