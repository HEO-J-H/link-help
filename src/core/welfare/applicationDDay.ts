import type { WelfareRecord } from '@/types/benefit';
import { isWelfareEffectivelyExpired, parsePeriodEndDate } from './welfareLifecycle';

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Whole calendar days from `from` (typically today) to `to` (deadline), both start-of-day. */
export function calendarDaysUntil(from: Date, to: Date): number {
  const a = startOfLocalDay(from).getTime();
  const b = startOfLocalDay(to).getTime();
  return Math.round((b - a) / 86400000);
}

export type ApplicationDDayUrgency = 'ended' | 'urgent' | 'soon' | 'steady' | 'ongoing' | 'unknown';

export type ApplicationDDayInfo = {
  urgency: ApplicationDDayUrgency;
  daysLeft: number | null;
  /** Short badge text, e.g. D-3, 상시 */
  label: string;
};

/**
 * D-Day style label from application period end. Buckets drive list colors:
 * urgent ≤7d, soon ≤30d, steady &gt;30d, ongoing/unknown when not parseable.
 */
export function getApplicationDDay(w: WelfareRecord, now: Date = new Date()): ApplicationDDayInfo {
  if (isWelfareEffectivelyExpired(w, now)) {
    const end = parsePeriodEndDate(w.period);
    const daysLeft = end ? calendarDaysUntil(now, end) : null;
    return { urgency: 'ended', daysLeft, label: '마감' };
  }

  const p = (w.period || '').trim();
  // Bundled rows often omit period for standing programs — not "failed to verify"
  if (!p) {
    return { urgency: 'ongoing', daysLeft: null, label: '상시·연중' };
  }
  if (/상시|연중\s*모집|수시\s*접수|별도\s*공고|상시\s*운영|연중\s*접수/i.test(p)) {
    return { urgency: 'ongoing', daysLeft: null, label: '상시' };
  }

  const end = parsePeriodEndDate(w.period);
  if (!end) {
    return { urgency: 'unknown', daysLeft: null, label: '공고문 확인' };
  }

  const daysLeft = calendarDaysUntil(now, end);
  if (daysLeft < 0) {
    return { urgency: 'ended', daysLeft, label: '마감' };
  }
  if (daysLeft === 0) {
    return { urgency: 'urgent', daysLeft: 0, label: 'D-Day' };
  }
  if (daysLeft <= 7) {
    return { urgency: 'urgent', daysLeft, label: `D-${daysLeft}` };
  }
  if (daysLeft <= 30) {
    return { urgency: 'soon', daysLeft, label: `D-${daysLeft}` };
  }
  return { urgency: 'steady', daysLeft, label: `D-${daysLeft}` };
}
