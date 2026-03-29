import type { WelfareRecord } from '@/types/benefit';
import { isWelfareEffectivelyExpired } from '@/core/welfare/welfareLifecycle';

export type SmartMatchQuery = {
  profileTags: string[];
  includeKeywords: string[];
  excludeKeywords: string[];
};

export type SmartMatchedWelfare = WelfareRecord & { smartScore: number };

function textBlob(w: WelfareRecord): string {
  const parts = [
    w.title,
    w.description,
    w.benefit,
    w.period,
    ...w.tags,
    ...w.region,
    ...w.target,
  ];
  return parts.join(' ').toLowerCase();
}

/** Comma / Korean comma separated keywords */
export function parseKeywordInput(raw: string): string[] {
  return raw
    .split(/[,，、]/u)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function runSmartMatch(list: WelfareRecord[], q: SmartMatchQuery): SmartMatchedWelfare[] {
  const profileTags = q.profileTags.map((s) => s.trim()).filter(Boolean);
  const includeKeywords = q.includeKeywords.map((s) => s.trim()).filter(Boolean);
  const excludeKeywords = q.excludeKeywords.map((s) => s.trim()).filter(Boolean);

  const scored: SmartMatchedWelfare[] = [];

  for (const w of list) {
    if (isWelfareEffectivelyExpired(w)) continue;

    const blob = textBlob(w);
    let blocked = false;
    for (const ex of excludeKeywords) {
      if (ex && blob.includes(ex.toLowerCase())) {
        blocked = true;
        break;
      }
    }
    if (blocked) continue;

    if (profileTags.length > 0) {
      const wtags = new Set(w.tags.map((t) => t.toLowerCase()));
      const hit = profileTags.some((p) => {
        const pl = p.toLowerCase();
        if (wtags.has(pl)) return true;
        for (const t of wtags) if (t.includes(pl) || pl.includes(t)) return true;
        return blob.includes(pl);
      });
      if (!hit) continue;
    }

    for (const inc of includeKeywords) {
      if (inc && !blob.includes(inc.toLowerCase())) {
        blocked = true;
        break;
      }
    }
    if (blocked) continue;

    let score = 0;
    for (const p of profileTags) {
      const pl = p.toLowerCase();
      if (blob.includes(pl)) score += 2;
    }
    for (const inc of includeKeywords) {
      if (inc && blob.includes(inc.toLowerCase())) score += 3;
    }
    score += Math.min(20, (w.popularity ?? 0) / 10);

    scored.push({ ...w, smartScore: Math.round(score * 10) / 10 });
  }

  scored.sort((a, b) => b.smartScore - a.smartScore || (b.popularity ?? 0) - (a.popularity ?? 0));
  return scored;
}
