# Architecture

## UI & routing

- **Stack**: React 19, TypeScript, Vite, React Router (`BrowserRouter` + `basename` when `base` is `/link-help/`).
- **Shell**: App header + bottom nav — Family → Benefits → Recommend → Timeline → Notifications → Settings.

## User data (family, reminders, app settings)

- **Live storage**: **`sessionStorage`** (`link-help-family-session-v1`), JSON-serialized `FamilyState`. Cleared when the tab/window closes; reopening starts empty until **JSON import**.
- **Legacy migration (once per browser)**: If session is empty, load from **IndexedDB** (`link-help` / `family`) or old **localStorage** key, write to session, then **delete** the IndexedDB database so it is not reused.
- **Export/import**: `core/storage/exportImport.ts` — user-controlled backup; `normalizeFamilyState` allows zero members.

## Benefit catalog

- **Static only**: `public/welfare-db` — fetched via paths built with `import.meta.env.BASE_URL` (`publicAsset()`). No remote merge in the web app.

## Service worker (`src/sw.ts`)

- **injectManifest** (Workbox): precache, navigation fallback to `index.html` under `BASE_URL`, runtime cache for `welfare-db`.

## Server (`server/`)

- Optional / legacy sample (Express + SQLite) may remain in the repo for experiments; **not required** for the static app.

## Matching & helpers

- **filterEngine**: tag overlap, excludes, scored recommend, timeline hypothetical age. Skips items that are **effectively ended** (`status: expired` or `period` end date before today when parseable).
- **welfareLifecycle**: parse `period` strings, `isWelfareEffectivelyExpired`, list sort for discovery (active first).
- **Reminders**: `ReminderRunner` + Notification API.
- **Tag hints**: `core/ai/suggestTags.ts` — client-only vocabulary match (not a hosted “AI search” product).
- **Smart match**: `features/smartsearch/SmartSearchPage.tsx` + `core/filter/smartMatchEngine.ts` — profile tags + include/exclude keywords, staged progress UI; all client-side (no server logging in app).
