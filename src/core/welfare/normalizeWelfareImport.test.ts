import { describe, expect, it } from 'vitest';
import { normalizeImportedWelfare, parseWelfareImportJson } from './normalizeWelfareImport';

describe('normalizeImportedWelfare', () => {
  it('returns null without id/title', () => {
    expect(normalizeImportedWelfare(null)).toBeNull();
    expect(normalizeImportedWelfare({ id: '', title: 'x' })).toBeNull();
    expect(normalizeImportedWelfare({ id: 'a', title: '' })).toBeNull();
  });

  it('strips (샘플)/(예시) markers from title·description·benefit', () => {
    const w = normalizeImportedWelfare({
      id: 'd',
      title: '용인시 대학생 장학(샘플)',
      description: '설명(예시) 입니다',
      benefit: '등록금 일부 지원(예시)',
    });
    expect(w).not.toBeNull();
    expect(w!.title).toBe('용인시 대학생 장학');
    expect(w!.description).toBe('설명 입니다');
    expect(w!.benefit).toBe('등록금 일부 지원');
  });

  it('fills defaults and preserves catalog fields', () => {
    const w = normalizeImportedWelfare({
      id: 'x1',
      title: 'Test',
      source_url: 'https://example.com/n',
      schema_version: 1,
      ai_confidence: 0.9,
      catalog_origin: 'crowd',
    });
    expect(w).not.toBeNull();
    expect(w!.region).toEqual([]);
    expect(w!.source_url).toBe('https://example.com/n');
    expect(w!.schema_version).toBe(1);
    expect(w!.ai_confidence).toBe(0.9);
    expect(w!.catalog_origin).toBe('crowd');
  });
});

describe('parseWelfareImportJson', () => {
  it('accepts array', () => {
    const rows = parseWelfareImportJson('[{"id":"a","title":"A"}]');
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe('a');
  });

  it('throws on invalid', () => {
    expect(() => parseWelfareImportJson('{}')).toThrow('not_array');
    expect(() => parseWelfareImportJson('[]')).toThrow('no_valid_rows');
  });
});
