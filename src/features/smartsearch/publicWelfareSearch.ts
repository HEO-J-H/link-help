/** Official portal + major Korean search engines — no API keys; opens in a new tab. */

export const BOKJI_PORTAL_URL =
  'https://www.bokji.go.kr/welfareNet/cvnetcca/srvCtr/retrieveMain.do';

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

export function naverWebSearchUrl(query: string): string {
  return `https://search.naver.com/search.naver?where=web&sm=tab_jum&query=${encodeURIComponent(query)}`;
}

export function googleWebSearchUrl(query: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

export function daumWebSearchUrl(query: string): string {
  return `https://search.daum.net/search?w=tot&q=${encodeURIComponent(query)}`;
}
