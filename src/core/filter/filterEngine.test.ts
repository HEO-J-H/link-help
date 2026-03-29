import { describe, expect, it } from 'vitest';
import type { WelfareRecord } from '@/types/benefit';
import { emptyProfile } from '@/core/family/familyManager';
import {
  profileToDerivedTags,
  recommendForProfile,
  welfareBlockedByMemberProfile,
} from '@/core/filter/filterEngine';

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

  it('welfareBlockedByMemberProfile: 제외 태그 장애인이 제목·태그·대상에 걸리면 차단', () => {
    const p = emptyProfile();
    p.region = '용인시';
    p.extraIncludeTags = ['청년'];
    p.extraExcludeTags = ['장애인'];
    const disability = record({
      id: 'd',
      title: '용인시 장애인 지원금(샘플)',
      tags: ['장애인', '용인시'],
      target: ['장애인'],
    });
    const youth = record({ id: 'y', title: '청년 통장', tags: ['청년', '용인시'] });
    expect(welfareBlockedByMemberProfile(disability, p)).toBe(true);
    expect(welfareBlockedByMemberProfile(youth, p)).toBe(false);
    const rec = recommendForProfile([disability, youth], p);
    expect(rec.map((w) => w.id)).toEqual(['y']);
  });
});
