/**
 * Server-side validation/normalization for contributed welfare rows (mirrors client normalizeWelfareImport).
 */

function strArr(v) {
  if (!Array.isArray(v)) return [];
  return v.filter((x) => typeof x === 'string');
}

function isStatus(v) {
  return v === 'active' || v === 'expired';
}

function isOrigin(v) {
  return v === 'bundled' || v === 'crowd' || v === 'import';
}

export function normalizeContributedRecord(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw;
  if (typeof o.id !== 'string' || !o.id.trim()) return null;
  if (typeof o.title !== 'string' || !o.title.trim()) return null;

  const today = new Date().toISOString().slice(0, 10);
  const base = {
    id: o.id.trim(),
    title: o.title.trim(),
    description: typeof o.description === 'string' ? o.description : '',
    region: strArr(o.region),
    target: strArr(o.target),
    age: strArr(o.age),
    income: strArr(o.income),
    tags: strArr(o.tags),
    benefit: typeof o.benefit === 'string' ? o.benefit : '',
    period: typeof o.period === 'string' ? o.period : '',
    apply_url: typeof o.apply_url === 'string' ? o.apply_url : '',
    created_at: typeof o.created_at === 'string' ? o.created_at : today,
    updated_at: typeof o.updated_at === 'string' ? o.updated_at : today,
    source: typeof o.source === 'string' && o.source.trim() ? o.source.trim() : 'crowd',
  };

  if (isStatus(o.status)) base.status = o.status;
  if (typeof o.popularity === 'number' && Number.isFinite(o.popularity)) {
    base.popularity = Math.round(o.popularity);
  }
  if (typeof o.schema_version === 'number' && Number.isFinite(o.schema_version)) {
    base.schema_version = Math.floor(o.schema_version);
  }
  if (typeof o.dedupe_key === 'string' && o.dedupe_key) base.dedupe_key = o.dedupe_key;
  if (typeof o.source_url === 'string' && o.source_url) base.source_url = o.source_url;
  if (typeof o.source_fetched_at === 'string' && o.source_fetched_at) {
    base.source_fetched_at = o.source_fetched_at;
  }
  if (typeof o.source_text_digest === 'string' && o.source_text_digest) {
    base.source_text_digest = o.source_text_digest;
  }
  if (typeof o.ai_confidence === 'number' && Number.isFinite(o.ai_confidence)) {
    base.ai_confidence = Math.max(0, Math.min(1, o.ai_confidence));
  }
  base.catalog_origin = isOrigin(o.catalog_origin) ? o.catalog_origin : 'crowd';

  return base;
}

export function parseContributionPayload(body) {
  const records = body?.records;
  if (!Array.isArray(records)) {
    throw new Error('records_must_be_array');
  }
  if (records.length > 80) {
    throw new Error('too_many_records');
  }
  const out = [];
  for (const item of records) {
    const w = normalizeContributedRecord(item);
    if (w) out.push(w);
  }
  if (out.length === 0) {
    throw new Error('no_valid_records');
  }
  return out;
}
