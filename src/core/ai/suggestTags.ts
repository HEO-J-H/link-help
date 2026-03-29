/**
 * Client-side tag hints from pasted text (no server).
 * Matches known tags from welfare-db vocabulary when they appear as substrings.
 */
export async function loadTagVocabulary(): Promise<string[]> {
  const res = await fetch('/welfare-db/tags/tags.json');
  if (!res.ok) return [];
  const data = (await res.json()) as { tags?: string[] };
  return Array.isArray(data.tags) ? data.tags : [];
}

export async function suggestTagsFromText(text: string, max = 12): Promise<string[]> {
  const vocab = await loadTagVocabulary();
  if (!text.trim() || vocab.length === 0) return [];
  const norm = text.replace(/\s+/g, ' ');
  const found = new Set<string>();
  for (const tag of vocab) {
    if (!tag || found.has(tag)) continue;
    if (norm.includes(tag)) found.add(tag);
  }
  return [...found].slice(0, max);
}
