/** Absolute path for files served from `public/` (honors Vite `base`, e.g. `/link-help/`). */
export function publicAsset(relativePath: string): string {
  const p = relativePath.replace(/^\/+/, '');
  return `${import.meta.env.BASE_URL}${p}`;
}
