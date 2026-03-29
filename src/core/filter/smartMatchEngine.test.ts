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
});

describe('runSmartMatch', () => {
  it('requires include keyword in blob', () => {
    const list = [
      w({ id: '1', title: '자동차 보조금', tags: ['용인'], benefit: '지원' }),
      w({ id: '2', title: '청년 통장', tags: ['용인'], benefit: '적금' }),
    ];
    const out = runSmartMatch(list, {
      profileTags: ['용인'],
      includeKeywords: ['자동차'],
      excludeKeywords: [],
    });
    expect(out.map((x) => x.id)).toEqual(['1']);
  });

  it('excludes by keyword', () => {
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
});
