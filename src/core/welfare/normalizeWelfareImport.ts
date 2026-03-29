import type { WelfareCatalogOrigin, WelfareRecord, WelfareStatus } from '@/types/benefit';

function strArr(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === 'string');
}

function isStatus(v: unknown): v is WelfareStatus {
  return v === 'active' || v === 'expired';
}

function isOrigin(v: unknown): v is WelfareCatalogOrigin {
  return v === 'bundled' || v === 'crowd' || v === 'import';
}

/**
 * Normalize a loosely typed JSON object into WelfareRecord for IndexedDB upsert.
 * Requires non-empty id + title; other fields get safe defaults.
 */
export function normalizeImportedWelfare(raw: unknown): WelfareRecord | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== 'string' || !o.id.trim()) return null;
  if (typeof o.title !== 'string' || !o.title.trim()) return null;

  const today = new Date().toISOString().slice(0, 10);
  const base: WelfareRecord = {
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
    source: typeof o.source === 'string' && o.source.trim() ? o.source.trim() : 'import',
  };
  if (typeof o.required_documents === 'string' && o.required_documents.trim()) {
    base.required_documents = o.required_documents.trim();
  }

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
  base.catalog_origin = isOrigin(o.catalog_origin) ? o.catalog_origin : 'import';

  return base;
}

/** Parse JSON text as WelfareRecord[]. Throws if not a non-empty array of valid rows. */
export function parseWelfareImportJson(text: string): WelfareRecord[] {
  let data: unknown;
  try {
    data = JSON.parse(text) as unknown;
  } catch {
    throw new Error('invalid_json');
  }
  if (!Array.isArray(data)) {
    throw new Error('not_array');
  }
  const out: WelfareRecord[] = [];
  for (const item of data) {
    const w = normalizeImportedWelfare(item);
    if (w) out.push(w);
  }
  if (out.length === 0) {
    throw new Error('no_valid_rows');
  }
  return out;
}
