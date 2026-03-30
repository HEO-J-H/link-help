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

export type WebDiscoverItem = {
  title: string;
  link: string;
  snippet: string;
  displayLink: string;
};

export type WebDiscoverResult = {
  ok: true;
  source: 'google_cse' | 'disabled';
  items: WebDiscoverItem[];
  llm_summary?: string | null;
  hint?: string | null;
  query_used?: string;
};

export async function discoverWebWelfare(
  baseUrl: string,
  query: string,
  opts?: { regionHint?: string; limit?: number },
  token?: string
): Promise<WebDiscoverResult> {
  const base = normalizeApiBase(baseUrl);
  if (!base) throw new Error('missing_base_url');
  const res = await fetch(`${base}/welfare/discover-web`, {
    method: 'POST',
    headers: buildApiHeaders(token),
    body: JSON.stringify({
      query: query.trim(),
      regionHint: opts?.regionHint?.trim(),
      limit: opts?.limit,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = typeof (err as { error?: string }).error === 'string' ? (err as { error: string }).error : '';
    const detail = typeof (err as { detail?: string }).detail === 'string' ? (err as { detail: string }).detail : '';
    throw new Error(detail ? `${msg}: ${detail}` : msg || `discover_http_${res.status}`);
  }
  return (await res.json()) as WebDiscoverResult;
}

export type CandidateIngestItem = {
  url: string;
  title?: string;
  snippet?: string;
  regionHint?: string;
};

export async function collectPublicCandidates(
  baseUrl: string,
  token?: string,
  limitPerSource = 40
): Promise<{ ok: true; fetched: number; inserted: number; touched: number }> {
  const base = normalizeApiBase(baseUrl);
  if (!base) throw new Error('missing_base_url');
  const res = await fetch(`${base}/welfare/collect/public`, {
    method: 'POST',
    headers: buildApiHeaders(token),
    body: JSON.stringify({ limitPerSource }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = typeof (err as { error?: string }).error === 'string' ? (err as { error: string }).error : '';
    throw new Error(msg || `collect_public_http_${res.status}`);
  }
  return (await res.json()) as { ok: true; fetched: number; inserted: number; touched: number };
}

export async function submitCandidateUrl(
  baseUrl: string,
  item: CandidateIngestItem,
  token?: string,
  sourceType = 'manual'
): Promise<{ ok: true; inserted: boolean; url: string }> {
  const base = normalizeApiBase(baseUrl);
  if (!base) throw new Error('missing_base_url');
  const res = await fetch(`${base}/welfare/candidate/submit`, {
    method: 'POST',
    headers: buildApiHeaders(token),
    body: JSON.stringify({
      ...item,
      sourceType,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = typeof (err as { error?: string }).error === 'string' ? (err as { error: string }).error : '';
    throw new Error(msg || `candidate_submit_http_${res.status}`);
  }
  return (await res.json()) as { ok: true; inserted: boolean; url: string };
}

export async function bulkCandidateUrls(
  baseUrl: string,
  items: CandidateIngestItem[],
  token?: string
): Promise<{ ok: true; total: number; inserted: number; touched: number }> {
  const base = normalizeApiBase(baseUrl);
  if (!base) throw new Error('missing_base_url');
  const res = await fetch(`${base}/welfare/candidate/bulk`, {
    method: 'POST',
    headers: buildApiHeaders(token),
    body: JSON.stringify({ items }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = typeof (err as { error?: string }).error === 'string' ? (err as { error: string }).error : '';
    throw new Error(msg || `candidate_bulk_http_${res.status}`);
  }
  return (await res.json()) as { ok: true; total: number; inserted: number; touched: number };
}
