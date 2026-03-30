/**
 * Web discovery for welfare search: Google Custom Search API + optional OpenAI summary.
 * Env: GOOGLE_SEARCH_API_KEY, GOOGLE_SEARCH_ENGINE_ID (Programmable Search Engine cx).
 */

function clampInt(n, min, max) {
  const x = Number(n);
  if (!Number.isFinite(x)) return min;
  return Math.min(max, Math.max(min, Math.floor(x)));
}

function buildSearchQuery(userQuery, regionHint) {
  const q = String(userQuery || '').trim().slice(0, 200);
  const r = String(regionHint || '').trim().slice(0, 80);
  const parts = [q];
  if (r) parts.push(r);
  parts.push('복지', '지원', '신청');
  return parts.filter(Boolean).join(' ');
}

/**
 * @param {{ title: string, link: string, snippet: string, displayLink: string }[]} items
 * @param {string} userQuery
 * @param {{ OPENAI_API_KEY?: string, OPENAI_MODEL?: string }} env
 */
async function summarizeResultsWithOpenAI(items, userQuery, env) {
  const key = env.OPENAI_API_KEY?.trim();
  if (!key || items.length === 0) return null;

  const model = env.OPENAI_MODEL?.trim() || 'gpt-4o-mini';
  const lines = items.slice(0, 8).map((it, i) => `${i + 1}. ${it.title}\n   ${it.snippet}\n   ${it.link}`);
  const body = {
    model,
    messages: [
      {
        role: 'system',
        content:
          'You help Korean users find official welfare/subsidy pages. Given search snippets, reply ONLY valid JSON: {"summary":"2-4 sentences in Korean: which results look like government/official welfare notices and what to verify on the page","caution":"one short Korean line about hallucination risk and checking dates"}. No markdown.',
      },
      {
        role: 'user',
        content: `User query: ${userQuery}\n\nResults:\n${lines.join('\n\n')}`,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.25,
    max_tokens: 500,
  };

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) return null;
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content || typeof content !== 'string') return null;
  try {
    const parsed = JSON.parse(content);
    const summary = typeof parsed.summary === 'string' ? parsed.summary.trim() : '';
    const caution = typeof parsed.caution === 'string' ? parsed.caution.trim() : '';
    if (!summary) return null;
    return caution ? `${summary}\n\n※ ${caution}` : summary;
  } catch {
    return null;
  }
}

/**
 * @param {string} userQuery
 * @param {string} [regionHint]
 * @param {number} [limit]
 * @param {Record<string, string | undefined>} env
 */
export async function discoverWelfareOnWeb(userQuery, regionHint, limit, env) {
  const key = env.GOOGLE_SEARCH_API_KEY?.trim();
  const cx = env.GOOGLE_SEARCH_ENGINE_ID?.trim();

  if (!key || !cx) {
    return {
      ok: true,
      source: 'disabled',
      items: [],
      llm_summary: null,
      hint: 'Set GOOGLE_SEARCH_API_KEY and GOOGLE_SEARCH_ENGINE_ID in server/.env (Google Programmable Search Engine).',
    };
  }

  const num = clampInt(limit ?? 8, 1, 10);
  const q = buildSearchQuery(userQuery, regionHint);
  const url = new URL('https://www.googleapis.com/customsearch/v1');
  url.searchParams.set('key', key);
  url.searchParams.set('cx', cx);
  url.searchParams.set('q', q);
  url.searchParams.set('num', String(num));
  url.searchParams.set('lr', 'lang_ko');
  url.searchParams.set('safe', 'active');

  const res = await fetch(url.toString());
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const err = new Error(`google_search_http_${res.status}`);
    err.detail = text.slice(0, 400);
    throw err;
  }

  const data = await res.json();
  const rawItems = Array.isArray(data.items) ? data.items : [];

  const items = rawItems.map((it) => ({
    title: typeof it.title === 'string' ? it.title : '',
    link: typeof it.link === 'string' ? it.link : '',
    snippet: typeof it.snippet === 'string' ? it.snippet : '',
    displayLink: typeof it.displayLink === 'string' ? it.displayLink : '',
  }));

  let llm_summary = null;
  try {
    llm_summary = await summarizeResultsWithOpenAI(items, userQuery, env);
  } catch {
    llm_summary = null;
  }

  return {
    ok: true,
    source: 'google_cse',
    items,
    llm_summary,
    hint: null,
    query_used: q,
  };
}
