import type { WelfareRecord } from '@/types/benefit';
import { parseApplicationPeriodRange } from '@/core/welfare/welfareLifecycle';

/** YYYYMMDD in local calendar (for Google Calendar all-day `dates`). */
export function formatGoogleAllDayDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

/**
 * Opens Google Calendar "create event" with all-day range from parsed `w.period`.
 * Returns null when the period string cannot be parsed.
 */
export function googleCalendarUrlForApplicationPeriod(w: WelfareRecord): string | null {
  const range = parseApplicationPeriodRange(w.period);
  if (!range) return null;

  const startStr = formatGoogleAllDayDate(range.start);
  const endExclusive = new Date(range.end.getFullYear(), range.end.getMonth(), range.end.getDate());
  endExclusive.setDate(endExclusive.getDate() + 1);
  const endStr = formatGoogleAllDayDate(endExclusive);

  const text = `[신청기간] ${w.title}`;
  const detailsParts: string[] = [`자료상 신청·모집 기간: ${w.period}`];
  if (w.benefit.trim()) detailsParts.push(`혜택 요약: ${w.benefit}`);
  if (w.apply_url.trim()) detailsParts.push(`신청·안내 링크: ${w.apply_url}`);
  if (w.source_url?.trim()) detailsParts.push(`공고·원문: ${w.source_url}`);
  detailsParts.push('', '실제 접수 기한·방법은 반드시 공식 공고를 확인하세요.');
  const details = detailsParts.join('\n');

  const params = new URLSearchParams();
  params.set('action', 'TEMPLATE');
  params.set('text', text);
  params.set('dates', `${startStr}/${endStr}`);
  params.set('details', details);
  if (w.apply_url.trim()) params.set('location', w.apply_url.trim());

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
