import { describe, expect, it } from 'vitest';
import { normalizeApiBase } from './linkHelpServer';

describe('normalizeApiBase', () => {
  it('trims and strips trailing slashes', () => {
    expect(normalizeApiBase('  https://x.com/path/  ')).toBe('https://x.com/path');
  });
});
