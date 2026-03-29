import type { WelfareRecord } from '@/types/benefit';

/**
 * Parse a typical Korean period string for an end date.
 * Supports: "2026-01-01 ~ 2026-12-31", dots instead of dashes, full-width tilde.
 * Returns null if no reliable end date (caller should not auto-expire).
 */
export function parsePeriodEndDate(period: string): Date | null {
  const s = period.trim();
  if (!s) return null;

  const norm = s.replace(/～|〜/g, '~').replace(/\s+/g, ' ');
  const range =
    /(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})\s*[~\-–]\s*(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/;
  const m = norm.match(range);
  if (m) {
    const y = Number(m[4]);
    const mo = Number(m[5]) - 1;
    const d = Number(m[6]);
    if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null;
    return new Date(y, mo, d, 23, 59, 59, 999);
  }

  const until = /(?:까지|마감|종료)\s*[:(]?\s*(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/i.exec(norm);
  if (until) {
    const y = Number(until[1]);
    const mo = Number(until[2]) - 1;
    const d = Number(until[3]);
    return new Date(y, mo, d, 23, 59, 59, 999);
  }

  return null;
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
