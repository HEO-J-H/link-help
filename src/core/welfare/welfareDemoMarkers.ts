/**
 * Remove demo-only parentheticals from catalog strings (import/AI snippets, legacy samples).
 */
const DEMO_PAREN = /\s*[（(]\s*(?:샘플|예시)\s*[）)]/g;

export function stripWelfareDemoMarkers(s: string): string {
  return s
    .replace(DEMO_PAREN, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** Apply to user-visible text fields on a welfare row (in-memory / at load). */
export function sanitizeWelfareDemoMarkers<T extends { title: string; description: string; benefit: string }>(w: T): T {
  return {
    ...w,
    title: stripWelfareDemoMarkers(w.title),
    description: stripWelfareDemoMarkers(w.description),
    benefit: stripWelfareDemoMarkers(w.benefit),
  };
}
