export type WelfareStatus = 'active' | 'expired';

/** Provenance for rows merged from bundled JSON vs crowd/import pipelines. */
export type WelfareCatalogOrigin = 'bundled' | 'crowd' | 'import';

export interface WelfareRecord {
  id: string;
  title: string;
  description: string;
  region: string[];
  target: string[];
  age: string[];
  income: string[];
  tags: string[];
  benefit: string;
  /** e.g. "YYYY-MM-DD ~ YYYY-MM-DD" — used to detect ended programs when status is not set */
  period: string;
  apply_url: string;
  status?: WelfareStatus;
  created_at: string;
  updated_at: string;
  /** Agency or publisher name (human-readable). */
  source: string;
  /** Computed match score (0–1) when recommending */
  score?: number;
  /** Static popularity hint for sorting (0–100) */
  popularity?: number;

  // --- Optional: AI analysis server + shared catalog (see docs/catalog-pipeline.md) ---
  /** Catalog JSON schema version for migrations. */
  schema_version?: number;
  /** Stable key for dedupe across contributions (e.g. hash of agency + title + period + url). */
  dedupe_key?: string;
  /** Official notice or detail page URL. */
  source_url?: string;
  /** When source metadata or body was fetched (ISO 8601). */
  source_fetched_at?: string;
  /** Digest of full notice text when storing verbatim body is undesirable (e.g. SHA-256 hex). */
  source_text_digest?: string;
  /** Model confidence for parsed fields, 0–1. */
  ai_confidence?: number;
  /** How this row entered the merged catalog. */
  catalog_origin?: WelfareCatalogOrigin;
}
