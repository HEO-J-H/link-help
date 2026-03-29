import type { WelfareRecord } from '@/types/benefit';

export function normalizeApiBase(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

export function buildApiHeaders(token?: string): HeadersInit {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const tok = token?.trim();
  if (tok) {
    headers.Authorization = `Bearer ${tok}`;
  }
  return headers;
}

export async function fetchPublicCatalog(baseUrl: string): Promise<WelfareRecord[]> {
  const base = normalizeApiBase(baseUrl);
  if (!base) throw new Error('missing_base_url');
  const res = await fetch(`${base}/welfare`);
  if (!res.ok) {
    throw new Error(`catalog_http_${res.status}`);
  }
  const data = (await res.json()) as unknown;
  if (!Array.isArray(data)) throw new Error('catalog_invalid');
  return data as WelfareRecord[];
}

export type ContributeResult = { ok: true; accepted: number; skipped: number; total: number };

export async function contributeRecords(
  baseUrl: string,
  records: WelfareRecord[],
  token?: string
): Promise<ContributeResult> {
  const base = normalizeApiBase(baseUrl);
  if (!base) throw new Error('missing_base_url');
  const res = await fetch(`${base}/welfare/contribute`, {
    method: 'POST',
    headers: buildApiHeaders(token),
    body: JSON.stringify({ records }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = typeof (err as { error?: string }).error === 'string' ? (err as { error: string }).error : '';
    throw new Error(msg || `contribute_http_${res.status}`);
  }
  return (await res.json()) as ContributeResult;
}

export type AnalyzeResult = {
  ok: true;
  record: WelfareRecord;
  analysis_source: 'openai' | 'heuristic';
};

export async function analyzeNoticeOnServer(
  baseUrl: string,
  text: string,
  token?: string
): Promise<AnalyzeResult> {
  const base = normalizeApiBase(baseUrl);
  if (!base) throw new Error('missing_base_url');
  const res = await fetch(`${base}/welfare/analyze`, {
    method: 'POST',
    headers: buildApiHeaders(token),
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = typeof (err as { error?: string }).error === 'string' ? (err as { error: string }).error : '';
    throw new Error(msg || `analyze_http_${res.status}`);
  }
  return (await res.json()) as AnalyzeResult;
}
