import { parseBirthDateMs } from '@/utils/date';

export function formatDateKR(iso: string): string {
  if (!iso) return '—';
  const ms = parseBirthDateMs(iso);
  if (ms == null) return iso;
  return new Date(ms).toLocaleDateString('ko-KR');
}

/** For `<input type="datetime-local" />` value (local timezone). */
export function formatDatetimeLocalValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
