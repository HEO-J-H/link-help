/** Build web search query text — opens in browser; no API keys. */

/** Build a single-line query from user keywords and optional region (가족 프로필). */
export function buildWelfareWebQuery(includeRaw: string, regionHint?: string): string {
  const k = includeRaw.trim();
  const r = (regionHint || '').trim();
  if (k) {
    return [k, r, '복지', '지원'].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
  }
  if (r) return `${r} 복지 지원 혜택`.trim();
  return '청소년 학생 복지 지원';
}

export function googleWebSearchUrl(query: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}
