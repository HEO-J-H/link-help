# Architecture

- **UI**: React 19, TypeScript, Vite, React Router
- **User data**: `localStorage` (`link-help:family:v1`) — no server
- **Benefit catalog**: Fetched from `public/welfare-db` at runtime
- **Matching**: `core/filter/filterEngine.ts` — tag overlap + exclude tags

Tab shell: Family → Benefits → Recommend → Settings (see `전체 앱 구조.txt`).
