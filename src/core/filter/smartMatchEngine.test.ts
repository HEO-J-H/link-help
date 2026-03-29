import { describe, expect, it } from 'vitest';
import type { WelfareRecord } from '@/types/benefit';
import { parseKeywordInput, runSmartMatch } from './smartMatchEngine';

function w(p: Partial<WelfareRecord> & Pick<WelfareRecord, 'id' | 'title'>): WelfareRecord {
  return {
    description: '',
    region: [],
    target: [],
    age: [],
    income: [],
    tags: [],
    benefit: '',
    period: '2099-01-01 ~ 2099-12-31',
    apply_url: '',
    created_at: '',
    updated_at: '',
    source: '',
    ...p,
  };
}

describe('parseKeywordInput', () => {
  it('splits on commas', () => {
    expect(parseKeywordInput('a, b')).toEqual(['a', 'b']);
  });

  it('keeps spaced phrase as one keyword (comma splits only)', () => {
    expect(parseKeywordInput('전기 요금')).toEqual(['전기 요금']);
    expect(parseKeywordInput('전기요금, 수도')).toEqual(['전기요금', '수도']);
  });
});

describe('runSmartMatch', () => {
  it('when include keywords are set, only rows matching those keywords pass (profile does not bypass)', () => {
    const list = [
      w({ id: '1', title: '자동차 보조금', tags: ['용인'], benefit: '지원' }),
      w({ id: '2', title: '청년 통장', tags: ['용인'], benefit: '적금' }),
    ];
    const out = runSmartMatch(list, {
      profileTags: ['용인'],
      includeKeywords: ['자동차'],
      excludeKeywords: [],
    });
    expect(out.map((x) => x.id).sort()).toEqual(['1']);
  });

  it('include keywords are OR: any keyword hitting blob is enough', () => {
    const list = [
      w({ id: '1', title: 'A', description: '전기', tags: [], benefit: '' }),
      w({ id: '2', title: 'B', description: '수도', tags: [], benefit: '' }),
      w({ id: '3', title: 'C', description: '기타', tags: [], benefit: '' }),
    ];
    const out = runSmartMatch(list, {
      profileTags: [],
      includeKeywords: ['전기', '상하수도'],
      excludeKeywords: [],
    });
    expect(out.map((x) => x.id).sort()).toEqual(['1', '2']);
  });

  it('expands utility synonyms (전기 → 한전 등)', () => {
    const list = [
      w({ id: '1', title: '한전 요금 지원', description: '', tags: [], benefit: '' }),
    ];
    const out = runSmartMatch(list, {
      profileTags: [],
      includeKeywords: ['전기요금'],
      excludeKeywords: [],
    });
    expect(out.map((x) => x.id)).toEqual(['1']);
  });

  it('expands welfare topic clusters (한부모·기초생활 등)', () => {
    const list = [
      w({ id: '1', title: '지원', description: '한부모가정 대상', tags: [], benefit: '' }),
      w({ id: '2', title: '급여', description: '생계급여 안내', tags: [], benefit: '' }),
    ];
    expect(
      runSmartMatch(list, {
        profileTags: [],
        includeKeywords: ['한부모'],
        excludeKeywords: [],
      }).map((x) => x.id)
    ).toEqual(['1']);
    expect(
      runSmartMatch(list, {
        profileTags: [],
        includeKeywords: ['기초생활수급'],
        excludeKeywords: [],
      }).map((x) => x.id)
    ).toEqual(['2']);
  });

  it('excludes by keyword (with cluster expansion)', () => {
    const list = [
      w({ id: '1', title: '복지 A', tags: ['전국', '장애인'], benefit: 'x' }),
      w({ id: '2', title: '복지 B', tags: ['전국'], benefit: 'y' }),
    ];
    const out = runSmartMatch(list, {
      profileTags: ['전국'],
      includeKeywords: [],
      excludeKeywords: ['장애인'],
    });
    expect(out.map((x) => x.id)).toEqual(['2']);
  });

  it('region token matches catalog region text (경기도 vs 경기)', () => {
    const list = [
      w({
        id: '1',
        title: '지역 복지',
        region: ['경기'],
        tags: [],
        benefit: '',
      }),
    ];
    const out = runSmartMatch(list, {
      profileTags: ['경기도'],
      includeKeywords: [],
      excludeKeywords: [],
    });
    expect(out.map((x) => x.id)).toEqual(['1']);
  });
});
