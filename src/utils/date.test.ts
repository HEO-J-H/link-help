import { describe, expect, it } from 'vitest';
import {
  ageFromBirthDate,
  birthDateStoredToCompact,
  compactBirthDateToIso,
  normalizeBirthDateForStorage,
  parseBirthDateMs,
  sanitizeBirthDateCompactInput,
} from '@/utils/date';
import { yearWhenTurningAge } from '@/utils/timeline';

describe('birth date compact (YYYYMMDD)', () => {
  it('parses valid compact', () => {
    expect(parseBirthDateMs('19780225')).not.toBeNull();
    expect(compactBirthDateToIso('19780225')).toBe('1978-02-25');
  });

  it('rejects invalid calendar dates', () => {
    expect(compactBirthDateToIso('19780231')).toBeNull();
    expect(parseBirthDateMs('19780231')).toBeNull();
  });

  it('normalizes compact to ISO for storage', () => {
    expect(normalizeBirthDateForStorage('19780225')).toBe('1978-02-25');
    expect(normalizeBirthDateForStorage('1978-02-25')).toBe('1978-02-25');
  });

  it('stored ISO → display compact', () => {
    expect(birthDateStoredToCompact('1978-02-25')).toBe('19780225');
  });

  it('age matches for compact vs ISO', () => {
    const ref = new Date('2026-06-15');
    expect(ageFromBirthDate('19780225', ref)).toBe(ageFromBirthDate('1978-02-25', ref));
  });

  it('sanitize strips non-digits', () => {
    expect(sanitizeBirthDateCompactInput('1978-02-25')).toBe('19780225');
    expect(sanitizeBirthDateCompactInput('19780225123')).toBe('19780225');
  });

  it('yearWhenTurningAge works with compact', () => {
    expect(yearWhenTurningAge('19780225', 65)).toBe(yearWhenTurningAge('1978-02-25', 65));
  });
});
