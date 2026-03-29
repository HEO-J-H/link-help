/**
 * GitHub Pages: SPA deep links need 404.html === index.html (same as dist root).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const index = path.join(root, 'index.html');
const dest = path.join(root, '404.html');
if (!fs.existsSync(index)) {
  console.error('[copy-404] dist/index.html missing — run vite build first.');
  process.exit(1);
}
fs.copyFileSync(index, dest);
console.log('[copy-404] wrote dist/404.html');
