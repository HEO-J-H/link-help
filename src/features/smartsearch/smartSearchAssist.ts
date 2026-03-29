import { parseKeywordInput } from '@/core/filter/smartMatchEngine';
import { relatedMatchTerms } from '@/core/filter/smartMatchSynonyms';

/** One-click bundles: comma-separated include line (OR match). */
export const SMART_SEARCH_PRESETS: {
  id: string;
  label: string;
  hint: string;
  includeLine: string;
}[] = [
  {
    id: 'livelihood',
    label: '가구·생계·긴급',
    hint: '소득·주거 위기, 기초·차상위 맥락',
    includeLine: '주거급여, 긴급복지, 기초생활수급, 차상위, 생계급여',
  },
  {
    id: 'childcare',
    label: '임신·출산·육아',
    hint: '산전산후, 보육, 육아휴직',
    includeLine: '임신, 출산, 산전산후, 보육료, 아동수당, 육아휴직, 영유아',
  },
  {
    id: 'housing',
    label: '주거·전월세',
    hint: 'LH, 청약, 전세자금',
    includeLine: '전세자금, 월세지원, 주거, 임대, LH, 청약, 주택',
  },
  {
    id: 'utilities',
    label: '공과금·통신',
    hint: '전기·수도·가스·통신비',
    includeLine: '전기요금, 에너지 바우처, 상하수도, 가스요금, 통신비, 휴대폰',
  },
  {
    id: 'health',
    label: '의료·건강·돌봄',
    hint: '검진, 치매, 요양, 장애',
    includeLine: '건강검진, 의료비, 치매, 요양, 장애인, 활동지원, 중증장애',
  },
  {
    id: 'youth_elder',
    label: '청년·노인',
    hint: '통장, 일자리, 기초연금',
    includeLine: '청년, 청년통장, 고령, 노인, 기초연금, 어르신',
  },
  {
    id: 'work',
    label: '일·퇴직·실업',
    hint: '고용, 실업급여, 연금',
    includeLine: '실업급여, 고용보험, 국민연금, 퇴직, 재취업',
  },
  {
    id: 'farm_small',
    label: '농어업·소상공인',
    hint: '농업인, 손실보전',
    includeLine: '농업인, 어업인, 소상공인, 손실보전, 전통시장',
  },
];

/** Short chips for the cloud (append to include field). */
export const SMART_QUICK_CHIPS: string[] = [
  '장애인',
  '청년',
  '아동',
  '노인',
  '한부모',
  '다자녀',
  '전기요금',
  '주거급여',
  '에너지 바우처',
  '보육료',
  '건강검진',
  'LH',
  '육아휴직',
  '차상위',
  '소상공인',
  '임신출산',
  '통신비',
  '기초연금',
];

export type DrilldownGuide = {
  id: string;
  title: string;
  body: string;
  refineChips: string[];
};

const DRILLDOWN_TOPICS: {
  id: string;
  clusterHints: string[];
  title: string;
  body: string;
  refineChips: string[];
}[] = [
  {
    id: 'child',
    clusterHints: ['아동', '영유아', '육아', '보육', '자녀', '아이'],
    title: '아동·자녀는 나이·학년이 공고마다 갈라집니다',
    body:
      '「만 몇 세」「미취학·초등」「다자녀」처럼 구체적으로 쓰면 숨은 항목이 더 잘 걸립니다. 아래 칩으로 포함 칸을 바꿔 다시 검색해 보세요.',
    refineChips: ['아동수당', '영유아', '보육료', '다자녀', '초등', '청소년'],
  },
  {
    id: 'disability',
    clusterHints: ['장애', '장애인', '중증', '활동지원'],
    title: '장애 복지는 등급·중증 여부가 핵심입니다',
    body: '등록 장애인, 중증장애, 활동지원, 보조기기 등으로 좁혀 검색하면 맞춤 공고가 잡히기 쉽습니다.',
    refineChips: ['등록장애인', '중증장애', '활동지원', '장애수당', '복지카드'],
  },
  {
    id: 'housing',
    clusterHints: ['주거', '전세', '월세', '임대', '주택', 'LH'],
    title: '주거는 무주택·소득·가구원 수가 묶여 있습니다',
    body: '전세자금, 월세지원, 주거급여, 청년·신혼 등 대상별로 나뉩니다. 한 번에 한 주제 단어로 바꿔 검색해 보세요.',
    refineChips: ['무주택', '전세자금', '월세지원', '주거급여', '신혼부부', '청년'],
  },
  {
    id: 'income',
    clusterHints: ['기초', '차상위', '수급', '중위소득', '긴급'],
    title: '소득 구간은 공고마다 기준이 다릅니다',
    body: '가족 탭의 소득 구간과 맞춰 보고, 공고에서 쓰는 말(중위소득 %, 차상위 등)을 키워드에 넣으면 좋습니다.',
    refineChips: ['차상위', '기초생활수급', '중위소득', '긴급복지', '위기가구'],
  },
  {
    id: 'youth',
    clusterHints: ['청년', '대학', '취업'],
    title: '청년·학생은 나이 상한과 지역이 자주 붙습니다',
    body: '대학생, 취업준비, 창업, 주거를 나눠 검색하면 목록이 정리됩니다.',
    refineChips: ['대학생', '청년통장', '취업지원', '창업', '청년 주거'],
  },
  {
    id: 'elder',
    clusterHints: ['노인', '어르신', '고령', '치매', '요양'],
    title: '노인·돌봄은 거주 지역·등급이 중요합니다',
    body: '요양등급, 치매, 독거, 기초연금 등을 나눠 넣어 보세요.',
    refineChips: ['기초연금', '요양보험', '치매', '독거노인', '어르신'],
  },
  {
    id: 'utility',
    clusterHints: ['전기', '수도', '가스', '통신', '한전'],
    title: '공과금 감면은 에너지·가구 소득 조건이 붙는 경우가 많습니다',
    body: '에너지 바우처, 누진제, 복지할인 등 표현을 섞어 보면 숨은 공고가 잡힙니다.',
    refineChips: ['에너지 바우처', '전기요금', '한전', '상하수도', '통신비'],
  },
  {
    id: 'pregnancy',
    clusterHints: ['임신', '출산', '산모', '산전', '산후'],
    title: '임신·출산은 의료비·급여·휴가가 따로 노는 경우가 많습니다',
    body: '산전검진, 출산지원금, 산후조리, 고위험 임신 등으로 나눠 검색해 보세요.',
    refineChips: ['산전검진', '출산지원', '산후조리', '고위험임신', '난임'],
  },
];

function keywordTouchesHint(userKw: string, hints: string[]): boolean {
  const k = userKw.trim().toLowerCase();
  if (!k) return false;
  for (const h of hints) {
    const hl = h.toLowerCase();
    if (k.includes(hl) || hl.includes(k)) return true;
  }
  const expanded = relatedMatchTerms(userKw);
  for (const term of expanded) {
    const tl = term.toLowerCase();
    for (const h of hints) {
      const hl = h.toLowerCase();
      if (tl.includes(hl) || hl.includes(tl)) return true;
    }
  }
  return false;
}

/** Guides shown when current include keywords look broad — nudge deeper search. */
export function collectDrilldownGuides(includeRaw: string): DrilldownGuide[] {
  const kws = parseKeywordInput(includeRaw);
  if (kws.length === 0) return [];
  const seen = new Set<string>();
  const out: DrilldownGuide[] = [];
  for (const topic of DRILLDOWN_TOPICS) {
    const hit = kws.some((kw) => keywordTouchesHint(kw, topic.clusterHints));
    if (hit && !seen.has(topic.id)) {
      seen.add(topic.id);
      out.push({
        id: topic.id,
        title: topic.title,
        body: topic.body,
        refineChips: topic.refineChips,
      });
    }
  }
  return out;
}

export function appendKeywordToDraft(current: string, term: string): string {
  const t = term.trim();
  if (!t) return current;
  const existing = parseKeywordInput(current).map((x) => x.toLowerCase());
  if (existing.includes(t.toLowerCase())) return current;
  const base = current.trim();
  return base ? `${base}, ${t}` : t;
}

/** Suggested chips when zero results (diversify query). */
export function fallbackChipsForEmpty(includeRaw: string): string[] {
  const kws = parseKeywordInput(includeRaw);
  const pool = [...SMART_QUICK_CHIPS];
  for (const kw of kws) {
    for (const t of relatedMatchTerms(kw)) {
      const tl = t.toLowerCase();
      if (tl.length >= 2 && !pool.some((p) => p.toLowerCase() === tl)) pool.push(t);
    }
  }
  return pool.slice(0, 16);
}

export const SMART_SEARCH_COACH_STEPS: string[] = [
  '먼저 상황을 한 단어로 적어 보세요. (예: 전기요금, 한부모, 장애인)',
  '포함 칸에서 쉼표로 나눈 단어는 하나만 맞아도 나옵니다(OR). 건수를 줄이려면 단어를 줄이거나, 제외 칸으로 거르세요.',
  '아래 안내·칩으로 세부 표현을 골라 포함 키워드를 바꿔 다시 찾기를 눌러 보세요. 카드 상세에서 공고를 꼭 확인하세요.',
];

/** Above this count, suggest narrowing (OR semantics). */
export const SMART_MATCH_MANY_THRESHOLD = 42;
