import { describe, expect, it } from 'vitest';
import type { WelfareRecord } from '@/types/benefit';
import { formatGoogleAllDayDate, googleCalendarUrlForApplicationPeriod } from './googleCalendar';

function record(partial: Partial<WelfareRecord> & Pick<WelfareRecord, 'id' | 'title' | 'period'>): WelfareRecord {
  return {
    description: '',
    region: [],
    target: [],
    age: [],
    income: [],
    tags: [],
    benefit: '',
    apply_url: 'https://apply.example',
    created_at: '',
    updated_at: '',
    source: '',
    ...partial,
  };
}

describe('formatGoogleAllDayDate', () => {
  it('formats local calendar day as YYYYMMDD', () => {
    expect(formatGoogleAllDayDate(new Date(2026, 2, 9))).toBe('20260309');
  });
});

describe('googleCalendarUrlForApplicationPeriod', () => {
  it('returns null when period is not parseable', () => {
    expect(
      googleCalendarUrlForApplicationPeriod(record({ id: '1', title: 'x', period: '별도 공고' }))
    ).toBeNull();
  });

  it('builds calendar.google.com URL with encoded dates and text', () => {
    const url = googleCalendarUrlForApplicationPeriod(
      record({
        id: '1',
        title: '테스트 지원',
        period: '2026-01-10 ~ 2026-01-12',
        benefit: '지원금',
      })
    );
    expect(url).not.toBeNull();
    const u = new URL(url!);
    expect(u.pathname).toBe('/calendar/render');
    expect(u.searchParams.get('action')).toBe('TEMPLATE');
    expect(u.searchParams.get('text')).toBe('[신청기간] 테스트 지원');
    expect(u.searchParams.get('dates')).toBe('20260110/20260113');
    expect(u.searchParams.get('details')).toContain('2026-01-10');
  });
});
