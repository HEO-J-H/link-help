/**
 * Notice text → Welfare-shaped object. Uses OpenAI when OPENAI_API_KEY is set; else heuristic stub.
 */
import crypto from 'node:crypto';

function strArr(v) {
  if (!Array.isArray(v)) return [];
  return v.filter((x) => typeof x === 'string');
}

export function analyzeNoticeHeuristic(text) {
  const t = String(text || '').trim().slice(0, 32000);
  const lines = t.split(/\n/).map((l) => l.trim()).filter(Boolean);
  const title = (lines[0] || '공고 요약').slice(0, 200);
  const periodMatch = t.match(
    /(\d{4})[.\-/년]\s*(\d{1,2})[.\-/월]\s*~?\s*(\d{4})?[.\-/년]?\s*(\d{1,2})?[.\-/월]?/
  );
  let period = '';
  if (periodMatch) {
    period = periodMatch[0].replace(/년|월|일/g, '.').replace(/\s+/g, ' ').trim();
  }
  return {
    title,
    description: t.slice(0, 800),
    region: [],
    target: [],
    age: [],
    income: [],
    tags: [],
    benefit: lines.find((l) => /지원|금액|만원|원|월\s*\d/.test(l))?.slice(0, 200) || '',
    period: period || '',
    apply_url: '',
    source: 'heuristic',
    ai_confidence: 0.35,
  };
}

/**
 * @param {string} text
 * @param {{ OPENAI_API_KEY?: string, OPENAI_MODEL?: string }} env
 * @returns {Promise<object|null>} partial fields (no id/dates) or null on failure
 */
export async function analyzeNoticeWithOpenAI(text, env) {
  const key = env.OPENAI_API_KEY?.trim();
  if (!key) return null;

  const model = env.OPENAI_MODEL?.trim() || 'gpt-4o-mini';
  const body = {
    model,
    messages: [
      {
        role: 'system',
        content: `You extract Korean public welfare / subsidy notices into JSON. Return ONLY a JSON object with keys:
title (string), description (string), region (string[]), target (string[]), age (string[]), income (string[]), tags (string[]), benefit (string), period (string), apply_url (string), source (string, agency name).
Use [] or "" when unknown. Keep text in Korean where appropriate.`,
      },
      { role: 'user', content: String(text).slice(0, 28000) },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2,
  };

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`openai_http_${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content || typeof content !== 'string') return null;
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;
  return {
    title: typeof parsed.title === 'string' ? parsed.title : '',
    description: typeof parsed.description === 'string' ? parsed.description : '',
    region: strArr(parsed.region),
    target: strArr(parsed.target),
    age: strArr(parsed.age),
    income: strArr(parsed.income),
    tags: strArr(parsed.tags),
    benefit: typeof parsed.benefit === 'string' ? parsed.benefit : '',
    period: typeof parsed.period === 'string' ? parsed.period : '',
    apply_url: typeof parsed.apply_url === 'string' ? parsed.apply_url : '',
    source: typeof parsed.source === 'string' ? parsed.source : 'openai',
    ai_confidence: 0.82,
  };
}

/**
 * @param {string} text
 * @param {Record<string, string | undefined>} env process.env
 */
export async function analyzeNoticeToRecord(text, env) {
  const trimmed = String(text || '').trim();
  if (!trimmed) {
    throw new Error('empty_text');
  }
  const digest = crypto.createHash('sha256').update(trimmed).digest('hex');

  let analysisSource = 'heuristic';
  let partial = null;
  try {
    partial = await analyzeNoticeWithOpenAI(trimmed, env);
    if (partial) analysisSource = 'openai';
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn('[link-help-api] OpenAI analyze failed, using heuristic:', msg.slice(0, 120));
  }
  if (!partial) {
    partial = analyzeNoticeHeuristic(trimmed);
    analysisSource = 'heuristic';
  }

  const today = new Date().toISOString().slice(0, 10);
  const id = `welfare_notice_${digest.slice(0, 20)}`;

  const record = {
    id,
    title: partial.title?.trim() || '제목 미상',
    description: partial.description || '',
    region: partial.region || [],
    target: partial.target || [],
    age: partial.age || [],
    income: partial.income || [],
    tags: partial.tags || [],
    benefit: partial.benefit || '',
    period: partial.period || '',
    apply_url: partial.apply_url || '',
    created_at: today,
    updated_at: today,
    source: partial.source || 'analyze',
    schema_version: 1,
    dedupe_key: `sha256:${digest}`,
    source_text_digest: `sha256:${digest}`,
    ai_confidence: partial.ai_confidence ?? 0.5,
    catalog_origin: 'crowd',
  };

  return { record, analysis_source: analysisSource };
}
