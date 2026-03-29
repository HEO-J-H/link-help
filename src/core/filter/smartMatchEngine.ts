import type { WelfareRecord } from '@/types/benefit';
import { blobFromWelfare } from './filterEngine';
import { isWelfareEffectivelyExpired } from '@/core/welfare/welfareLifecycle';
import { relatedMatchTerms, blobMatchesAnyTerm } from './smartMatchSynonyms';

export type SmartMatchQuery = {
  profileTags: string[];
  includeKeywords: string[];
  excludeKeywords: string[];
  excludeIds?: string[];
  /** Default true: skip expired programs (same idea as bundled server match). */
  hideExpired?: boolean;
};

export type SmartMatchedWelfare = WelfareRecord & {
  smartScore: number;
  matchedProfileTags: string[];
  matchedIncludeKeywords: string[];
};

/**
 * Split only on comma / ideographic comma / newline — spaces keep one phrase
 * (e.g. "전기 요금" stays one token; avoids loose OR on every word).
 */
export function parseKeywordInput(raw: string): string[] {
  const chunks = raw.split(/[,，、\n]/u).map((s) => s.trim()).filter(Boolean);
  return [...new Set(chunks)];
}

const MAX_BROAD_RESULTS = 200;

function profileMatchesBlob(w: WelfareRecord, blob: string, profileTags: string[]): string[] {
  const hits: string[] = [];
  const tagBlob = (w.tags ?? []).join(' ').toLowerCase();
  const regionBlob = `${(w.region ?? []).join(' ')} ${(w.target ?? []).join(' ')}`.toLowerCase();
  const combined = `${blob} ${tagBlob} ${regionBlob}`;

  for (const tag of profileTags) {
    const terms = relatedMatchTerms(tag);
    if (blobMatchesAnyTerm(combined, terms)) hits.push(tag);
  }
  return hits;
}

/** Include match: synonym expansion; count literal substring hits for ranking. */
function includeMatchDetail(
  blob: string,
  includeKeywords: string[]
): { hits: string[]; literalBonus: number } {
  const b = blob.toLowerCase();
  const hits: string[] = [];
  let literalBonus = 0;
  for (const kw of includeKeywords) {
    const trimmed = kw.trim();
    if (!trimmed) continue;
    const terms = relatedMatchTerms(trimmed);
    if (!blobMatchesAnyTerm(b, terms)) continue;
    hits.push(trimmed);
    const kl = trimmed.toLowerCase();
    if (kl.length >= 2 && b.includes(kl)) literalBonus += 3;
    else if (kl.length === 1 && b.includes(kl)) literalBonus += 1;
  }
  return { hits, literalBonus };
}

function excludeHits(blob: string, excludeKeywords: string[]): string[] {
  const hits: string[] = [];
  for (const ex of excludeKeywords) {
    const terms = relatedMatchTerms(ex);
    if (blobMatchesAnyTerm(blob, terms)) hits.push(ex);
  }
  return hits;
}

/**
 * When the user types include keywords, only rows that match at least one keyword (synonyms OK) pass.
 * Profile-only mode when include list is empty: match profile tags or broad cap.
 */
export function runSmartMatch(catalog: WelfareRecord[], q: SmartMatchQuery): SmartMatchedWelfare[] {
  const profileTags = (q.profileTags ?? []).map((t) => t.trim()).filter(Boolean);
  const includeKeywords = (q.includeKeywords ?? []).map((t) => t.trim()).filter(Boolean);
  const excludeKeywords = (q.excludeKeywords ?? []).map((t) => t.trim()).filter(Boolean);
  const excludeIdSet = new Set(q.excludeIds ?? []);
  const hideExpired = q.hideExpired !== false;

  const noProfile = profileTags.length === 0;
  const noInclude = includeKeywords.length === 0;

  const byId = new Map(catalog.map((w) => [w.id, w]));

  type Row = {
    w: WelfareRecord;
    smartScore: number;
    matchedProfileTags: string[];
    matchedIncludeKeywords: string[];
    literalBonus: number;
  };
  const rows: Row[] = [];

  for (const w of catalog) {
    if (excludeIdSet.has(w.id)) continue;
    if (hideExpired && isWelfareEffectivelyExpired(w)) continue;

    const blob = blobFromWelfare(w);
    const ex = excludeHits(blob, excludeKeywords);
    if (ex.length > 0) continue;

    const profHits = noProfile ? [] : profileMatchesBlob(w, blob, profileTags);
    const { hits: incHits, literalBonus } = noInclude
      ? { hits: [] as string[], literalBonus: 0 }
      : includeMatchDetail(blob, includeKeywords);

    let passes = false;
    if (noProfile && noInclude) passes = true;
    else if (!noInclude) passes = incHits.length > 0;
    else passes = profHits.length > 0;

    if (!passes) continue;

    const pop = typeof w.popularity === 'number' && Number.isFinite(w.popularity) ? w.popularity : 0;
    const smartScore =
      pop +
      literalBonus +
      profHits.length * 12 +
      incHits.length * 10 +
      (w.tags?.length ?? 0) * 0.5;

    rows.push({
      w,
      smartScore: Math.round(smartScore * 10) / 10,
      matchedProfileTags: profHits,
      matchedIncludeKeywords: incHits,
      literalBonus,
    });
  }

  rows.sort((a, b) => {
    const ld = b.literalBonus - a.literalBonus;
    if (ld !== 0) return ld;
    const d = b.smartScore - a.smartScore;
    if (d !== 0) return d;
    return (b.w.popularity ?? 0) - (a.w.popularity ?? 0);
  });

  const slice =
    noProfile && noInclude ? rows.slice(0, MAX_BROAD_RESULTS) : rows;

  return slice.map((r) => {
    const base = byId.get(r.w.id) ?? r.w;
    return {
      ...base,
      smartScore: r.smartScore,
      matchedProfileTags: r.matchedProfileTags,
      matchedIncludeKeywords: r.matchedIncludeKeywords,
    };
  });
}
