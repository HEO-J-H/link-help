import { describe, expect, it } from 'vitest';
import {
  buildWelfareWebQuery,
  daumWebSearchUrl,
  googleWebSearchUrl,
  naverWebSearchUrl,
} from './publicWelfareSearch';

describe('buildWelfareWebQuery', () => {
  it('combines keywords, region, and welfare terms', () => {
    expect(buildWelfareWebQuery('장학금', '용인시')).toContain('장학금');
    expect(buildWelfareWebQuery('장학금', '용인시')).toContain('용인시');
    expect(buildWelfareWebQuery('장학금', '용인시')).toContain('복지');
  });

  it('uses student-friendly default when empty', () => {
    expect(buildWelfareWebQuery('', '')).toMatch(/청소년|학생/);
    expect(buildWelfareWebQuery('', '수원시')).toContain('수원시');
  });
});

describe('search URLs', () => {
  it('encodes query for Naver and Google', () => {
    const q = 'a b & 케이스';
    expect(naverWebSearchUrl(q)).toContain(encodeURIComponent(q));
    expect(googleWebSearchUrl(q)).toContain(encodeURIComponent(q));
    expect(daumWebSearchUrl(q)).toContain(encodeURIComponent(q));
  });
});
