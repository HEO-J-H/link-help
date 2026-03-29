# Architecture

- **UI**: React 19, TypeScript, Vite, React Router
- **User data**: IndexedDB (`link-help` DB, `family` store); legacy `localStorage` is migrated once on load
- **Benefit catalog**: Fetched from `public/welfare-db` at runtime; cached by the service worker (offline)
- **Matching**: `core/filter/filterEngine.ts` — tag overlap + exclude tags; timeline uses hypothetical age

Tab shell: Family → Benefits → Recommend → Timeline → Settings (see `전체 앱 구조.txt`).
