# Architecture

- **UI**: React 19, TypeScript, Vite, React Router
- **User data**: IndexedDB (`link-help` DB, `family` store); legacy `localStorage` is migrated once on load
- **Benefit catalog**: Local `public/welfare-db` + optional merge from `GET {syncApiBaseUrl}/welfare`
- **Service worker**: `src/sw.ts` (injectManifest) — precache, navigation fallback, welfare cache, **Web Push** handlers
- **Matching**: `core/filter/filterEngine.ts` — tag overlap + exclude tags; timeline uses hypothetical age

Tab shell: Family → Benefits → Recommend → Timeline → Insurance → Notifications → Settings (scrollable bar).

Extensions: insurance CRUD in `FamilyState`, reminders + `ReminderRunner` (Notification API), `recommendScoredForProfile`, `core/ai/suggestTags` (client-only).
