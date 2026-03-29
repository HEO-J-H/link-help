import type { WelfareRecord } from '@/types/benefit';

/** Inclusive local start (00:00) and end (23:59:59.999) for 신청·모집 기간 문자열. */
export function parseApplicationPeriodRange(period: string): { start: Date; end: Date } | null {
  const s = period.trim();
  if (!s) return null;

  const norm = s.replace(/～|〜/g, '~').replace(/\s+/g, ' ');
  const range =
    /(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})\s*[~\-–]\s*(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/;
  const m = norm.match(range);
  if (m) {
    const y1 = Number(m[1]);
    const mo1 = Number(m[2]) - 1;
    const d1 = Number(m[3]);
    const y2 = Number(m[4]);
    const mo2 = Number(m[5]) - 1;
    const d2 = Number(m[6]);
    if (![y1, mo1, d1, y2, mo2, d2].every(Number.isFinite)) return null;
    return {
      start: new Date(y1, mo1, d1, 0, 0, 0, 0),
      end: new Date(y2, mo2, d2, 23, 59, 59, 999),
    };
  }

  const until = /(?:까지|마감|종료)\s*[:(]?\s*(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/i.exec(norm);
  if (until) {
    const y = Number(until[1]);
    const mo = Number(until[2]) - 1;
    const d = Number(until[3]);
    if (![y, mo, d].every(Number.isFinite)) return null;
    const day = new Date(y, mo, d, 0, 0, 0, 0);
    return { start: day, end: new Date(y, mo, d, 23, 59, 59, 999) };
  }

  return null;
}

/**
 * Parse a typical Korean period string for an end date.
 * Supports: "2026-01-01 ~ 2026-12-31", dots instead of dashes, full-width tilde.
 * Returns null if no reliable end date (caller should not auto-expire).
 */
export function parsePeriodEndDate(period: string): Date | null {
  const r = parseApplicationPeriodRange(period);
  return r ? r.end : null;
}

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * True when the record should be treated as ended for matching & default lists.
 * Uses explicit status === 'expired' or parsed period end before today (local).
 */
export function isWelfareEffectivelyExpired(w: WelfareRecord, now: Date = new Date()): boolean {
  if (w.status === 'expired') return true;
  const end = parsePeriodEndDate(w.period);
  if (!end) return false;
  return startOfLocalDay(now) > startOfLocalDay(end);
}

/** Active items first; among active, higher popularity first when scores tie elsewhere. */
export function sortWelfareForDiscovery(
  list: WelfareRecord[],
  now: Date = new Date()
): WelfareRecord[] {
  return [...list].sort((a, b) => {
    const ea = isWelfareEffectivelyExpired(a, now);
    const eb = isWelfareEffectivelyExpired(b, now);
    if (ea !== eb) return ea ? 1 : -1;
    return (b.popularity ?? 0) - (a.popularity ?? 0);
  });
}
