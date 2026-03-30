import { describe, expect, it } from 'vitest';
import type { WelfareRecord } from '@/types/benefit';
import { emptyProfile } from '@/core/family/familyManager';
import {
  profileToDerivedTags,
  recommendForProfile,
  welfareBlockedByMemberProfile,
  welfareProfileTagMatchScore01,
  welfareStrictFullCatalogTagCoverage,
  welfareStrictMissingCatalogTags,
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

  it('welfareProfileTagMatchScore01 is null when profile yields no tags', () => {
    const p = emptyProfile();
    const w = record({ id: '1', title: 't', tags: ['전국'] });
    expect(welfareProfileTagMatchScore01(w, p)).toBeNull();
  });

  it('welfareProfileTagMatchScore01 is Jaccard overlap 0–1', () => {
    const p = emptyProfile();
    p.region = '전국';
    const w = record({ id: '1', title: 't', tags: ['전국', '청년'] });
    expect(welfareProfileTagMatchScore01(w, p)).toBeCloseTo(0.5, 5);
  });

  it('excludes car-tagged welfare when hasCar is no', () => {
    const list: WelfareRecord[] = [
      record({ id: '1', title: '전기차', tags: ['전국', '자동차', '전기차'] }),
      record({ id: '2', title: '청년', tags: ['청년', '주택'] }),
    ];
    const p = emptyProfile();
    p.region = '경기도';
    p.extraIncludeTags = ['청년', '주택'];
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

  it('adds 직무 상세 텍스트를 파생 태그로 넣는다', () => {
    const p = emptyProfile();
    p.region = '전국';
    p.occupationKind = 'salaried';
    p.occupation = '3D 디자인, 그래픽';
    const tags = profileToDerivedTags(p);
    expect(tags.some((t) => t.includes('3D') || t.includes('디자인'))).toBe(true);
  });

  it('strict recommendForProfile: 전체 태그가 프로필로 설명될 때만 포함', () => {
    const p = emptyProfile();
    p.birthDate = '1955-06-01';
    p.region = '경기도';
    p.occupationKind = 'retired';
    p.extraIncludeTags = ['노인', '지원금', '일자리', '고령'];
    const strong = record({
      id: 's',
      title: '노인 일자리',
      tags: ['전국', '노인', '일자리', '고령', '지원금'],
    });
    const weak = record({
      id: 'w',
      title: '단일 겹침',
      tags: ['전국', '어업'],
    });
    expect(welfareStrictFullCatalogTagCoverage(strong, p)).toBe(true);
    expect(welfareStrictFullCatalogTagCoverage(weak, p)).toBe(false);
    expect(welfareStrictMissingCatalogTags(weak, p)).toContain('어업');
    const out = recommendForProfile([strong, weak], p);
    expect(out.map((w) => w.id)).toEqual(['s']);
  });

  it('한부모·다문화·보훈 스위치로 태그를 붙인다', () => {
    const p = emptyProfile();
    p.region = '경기도';
    p.birthDate = '1990-01-01';
    p.occupationKind = 'salaried';
    p.singleParentHousehold = true;
    p.multiculturalFamily = true;
    p.veteranOrMeritRelated = true;
    const tags = profileToDerivedTags(p);
    expect(tags).toContain('한부모');
    expect(tags).toContain('다문화');
    expect(tags).toContain('보훈');
  });
});
