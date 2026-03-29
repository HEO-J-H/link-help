import { describe, expect, it } from 'vitest';
import { publicAsset } from './publicAsset';

describe('publicAsset', () => {
  it('joins import.meta.env.BASE_URL with a relative path', () => {
    const base = import.meta.env.BASE_URL;
    expect(publicAsset('welfare-db/x.json')).toBe(`${base}welfare-db/x.json`);
  });

  it('strips leading slashes from the relative segment', () => {
    const base = import.meta.env.BASE_URL;
    expect(publicAsset('/icons/a.svg')).toBe(`${base}icons/a.svg`);
  });
});
