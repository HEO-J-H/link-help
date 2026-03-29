/**
 * Persist smart-match run to operator API (no PII — only tags and result ids).
 */
export async function persistSmartMatchRun(
  baseUrl: string,
  body: {
    profileTags: string[];
    includeKeywords: string[];
    excludeKeywords: string[];
    resultIds: string[];
    foundCount: number;
  }
): Promise<{ ok: boolean; runId?: string }> {
  const root = baseUrl.replace(/\/$/, '');
  const res = await fetch(`${root}/smart-match`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    mode: 'cors',
    body: JSON.stringify(body),
  });
  if (!res.ok) return { ok: false };
  const data = (await res.json()) as { ok?: boolean; runId?: string };
  return { ok: data.ok === true, runId: data.runId };
}
