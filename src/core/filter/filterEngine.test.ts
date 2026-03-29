import { describe, expect, it } from 'vitest';
import type { WelfareRecord } from '@/types/benefit';
import { emptyProfile } from '@/core/family/familyManager';
import { profileToDerivedTags, recommendForProfile } from '@/core/filter/filterEngine';

function record(partial: Partial<WelfareRecord> & Pick<WelfareRecord, 'id' | 'title'>): WelfareRecord {
  return {
    description: '',
    region: [],
    target: [],
    age: [],
    income: [],
    tags: [],
    benefit: '',
    period: '',
    apply_url: '',
    created_at: '',
    updated_at: '',
    source: '',
    ...partial,
  };
}

describe('filterEngine profile tags', () => {
  it('maps occupationKind to Korean tags', () => {
    const p = emptyProfile();
    p.region = '경기도';
    p.occupationKind = 'salaried';
    const tags = profileToDerivedTags(p);
    expect(tags).toContain('직장인');
    expect(tags).toContain('경기도');
  });

  it('excludes car-tagged welfare when hasCar is no', () => {
    const list: WelfareRecord[] = [
      record({ id: '1', title: '전기차', tags: ['전국', '자동차', '전기차'] }),
      record({ id: '2', title: '청년', tags: ['청년', '주택'] }),
    ];
    const p = emptyProfile();
    p.extraIncludeTags = ['청년', '전국'];
    p.hasCar = 'no';
    const out = recommendForProfile(list, p);
    expect(out.map((w) => w.id)).not.toContain('1');
    expect(out.map((w) => w.id)).toContain('2');
  });
});
