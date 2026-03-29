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

/** Split by comma / ideographic comma / newline; multi-word chunks become OR tokens. */
export function parseKeywordInput(raw: string): string[] {
  const chunks = raw.split(/[,，、\n]/u).map((s) => s.trim()).filter(Boolean);
  const out: string[] = [];
  for (const c of chunks) {
    const parts = c.split(/\s+/u).filter(Boolean);
    if (parts.length > 1) out.push(...parts);
    else out.push(c);
  }
  return [...new Set(out.map((x) => x.trim()).filter(Boolean))];
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

function includeMatchesBlob(blob: string, includeKeywords: string[]): string[] {
  const hits: string[] = [];
  for (const kw of includeKeywords) {
    const terms = relatedMatchTerms(kw);
    if (blobMatchesAnyTerm(blob, terms)) hits.push(kw);
  }
  return hits;
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
 * Profile tags and include keywords use OR within each list; when both lists are non-empty,
 * a row passes if profile matched OR include matched. Synonym clusters widen utility terms
 * (전기요금, 수도, 통신, 장애인 등).
 * If both lists are empty, returns up to MAX_BROAD_RESULTS items sorted by popularity.
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
  };
  const rows: Row[] = [];

  for (const w of catalog) {
    if (excludeIdSet.has(w.id)) continue;
    if (hideExpired && isWelfareEffectivelyExpired(w)) continue;

    const blob = blobFromWelfare(w);
    const ex = excludeHits(blob, excludeKeywords);
    if (ex.length > 0) continue;

    const profHits = noProfile ? [] : profileMatchesBlob(w, blob, profileTags);
    const incHits = noInclude ? [] : includeMatchesBlob(blob, includeKeywords);

    let passes = false;
    if (noProfile && noInclude) passes = true;
    else if (noProfile) passes = incHits.length > 0;
    else if (noInclude) passes = profHits.length > 0;
    else passes = profHits.length > 0 || incHits.length > 0;

    if (!passes) continue;

    const pop = typeof w.popularity === 'number' && Number.isFinite(w.popularity) ? w.popularity : 0;
    const smartScore =
      pop +
      profHits.length * 12 +
      incHits.length * 10 +
      (w.tags?.length ?? 0) * 0.5;

    rows.push({
      w,
      smartScore: Math.round(smartScore * 10) / 10,
      matchedProfileTags: profHits,
      matchedIncludeKeywords: incHits,
    });
  }

  rows.sort((a, b) => {
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
