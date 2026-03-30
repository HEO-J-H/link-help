import type { UiTheme } from '@/types/appSettings';

const THEME_META_COLORS: Record<UiTheme, string> = {
  dark: '#050b18',
  light: '#157a5f',
};

/** Syncs `data-theme` on `<html>` and `theme-color` meta for PWA / browser chrome. */
export function applyDocumentTheme(theme: UiTheme): void {
  document.documentElement.setAttribute('data-theme', theme);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', THEME_META_COLORS[theme]);
}
