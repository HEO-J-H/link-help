/**
 * Keyword smart-match (LLM-ready: swap body for remote model later).
 * No PII: only tag/keyword strings.
 */

function textBlob(w) {
  const parts = [
    w.title,
    w.description,
    w.benefit,
    w.period,
    ...(w.tags || []),
    ...(w.region || []),
    ...(w.target || []),
  ];
  return parts.join(' ').toLowerCase();
}

function isExpiredLike(w) {
  if (w.status === 'expired') return true;
  const period = (w.period || '').trim();
  const m = period
    .replace(/～|〜/g, '~')
    .match(/(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})\s*[~\-–]\s*(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/);
  if (!m) return false;
  const y = Number(m[4]);
  const mo = Number(m[5]) - 1;
  const d = Number(m[6]);
  const end = new Date(y, mo, d, 23, 59, 59, 999);
  const today = new Date();
  const sod = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate());
  return sod(today) > sod(end);
}

/**
 * @param {object[]} items — welfare records
 * @param {{ profileTags: string[], includeKeywords: string[], excludeKeywords: string[] }} q
 */
export function runSmartMatch(items, q) {
  const profileTags = (q.profileTags || []).map((s) => String(s).trim()).filter(Boolean);
  const includeKeywords = (q.includeKeywords || []).map((s) => String(s).trim()).filter(Boolean);
  const excludeKeywords = (q.excludeKeywords || []).map((s) => String(s).trim()).filter(Boolean);

  const scored = [];

  for (const w of items) {
    if (!w || typeof w.id !== 'string') continue;
    if (isExpiredLike(w)) continue;

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
      const wtags = new Set((w.tags || []).map((t) => String(t).toLowerCase()));
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
