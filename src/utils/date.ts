const PAD2 = (n: number) => String(n).padStart(2, '0');

/**
 * Parse stored birth date: `YYYYMMDD` (8 digits) or ISO `YYYY-MM-DD`.
 * Returns timestamp ms or null if invalid / empty.
 */
export function parseBirthDateMs(raw: string): number | null {
  const t = String(raw ?? '').trim();
  if (!t) return null;
  if (/^\d{8}$/.test(t)) {
    const y = Number(t.slice(0, 4));
    const mo = Number(t.slice(4, 6)) - 1;
    const d = Number(t.slice(6, 8));
    if (![y, mo, d].every(Number.isFinite) || mo < 0 || mo > 11 || d < 1 || d > 31) return null;
    const dt = new Date(y, mo, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== d) return null;
    return dt.getTime();
  }
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return null;
  return d.getTime();
}

/** Convert compact `YYYYMMDD` to ISO `YYYY-MM-DD`, or null if invalid. */
export function compactBirthDateToIso(compact: string): string | null {
  const t = compact.trim();
  if (!/^\d{8}$/.test(t)) return null;
  const y = Number(t.slice(0, 4));
  const m = Number(t.slice(4, 6));
  const d = Number(t.slice(6, 8));
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
  return `${y}-${PAD2(m)}-${PAD2(d)}`;
}

/** Stored value (ISO or compact) → `YYYYMMDD` for display in compact-only field. */
export function birthDateStoredToCompact(stored: string): string {
  const t = String(stored ?? '').trim();
  if (!t) return '';
  if (/^\d{8}$/.test(t)) return t;
  const ms = parseBirthDateMs(t);
  if (ms == null) return '';
  const d = new Date(ms);
  return `${d.getFullYear()}${PAD2(d.getMonth() + 1)}${PAD2(d.getDate())}`;
}

/** Normalize any supported input to ISO `YYYY-MM-DD` for storage, or '' if invalid / empty. */
export function normalizeBirthDateForStorage(raw: string): string {
  const t = String(raw ?? '').trim();
  if (!t) return '';
  if (/^\d{8}$/.test(t)) {
    return compactBirthDateToIso(t) ?? '';
  }
  const ms = parseBirthDateMs(t);
  if (ms == null) return '';
  const d = new Date(ms);
  return `${d.getFullYear()}-${PAD2(d.getMonth() + 1)}-${PAD2(d.getDate())}`;
}

/** Digits only, max 8, for controlled birth-date input. */
export function sanitizeBirthDateCompactInput(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 8);
}

export function ageFromBirthDate(isoDate: string, ref = new Date()): number | null {
  const ms = parseBirthDateMs(isoDate);
  if (ms == null) return null;
  const d = new Date(ms);
  let age = ref.getFullYear() - d.getFullYear();
  const m = ref.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < d.getDate())) age -= 1;
  return age;
}

export function ageCategory(age: number | null): string[] {
  if (age == null) return [];
  const tags: string[] = [];
  if (age >= 19 && age <= 39) tags.push('청년');
  if (age >= 40 && age <= 64) tags.push('중장년');
  if (age >= 65) tags.push('노인');
  if (age >= 40) tags.push('40세이상');
  return tags;
}
