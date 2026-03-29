# Architecture

## UI & routing

- **Stack**: React 19, TypeScript, Vite, React Router (`BrowserRouter` + `basename` when `base` is `/link-help/`).
- **Shell**: App header + bottom nav — Family → Benefits → Recommend → Timeline → Notifications → Settings.

## User data (family, reminders, app settings)

- **Household defaults**: `FamilyState.household` — shared `sido` / `sigungu` / `incomeBand` (and optional memo) applied when a member has `useHouseholdRegionIncome: true`. `getEffectiveProfile()` merges for matching.
- **Live storage**: **`sessionStorage`** (`link-help-family-session-v1`), JSON-serialized `FamilyState`. Cleared when the tab/window closes; reopening starts empty until **JSON import**.
- **Legacy migration (once per browser)**: If session is empty, load from **IndexedDB** (`link-help` / `family`) or old **localStorage** key, write to session, then **delete** the IndexedDB database so it is not reused.
- **Export/import**: `core/storage/exportImport.ts` — user-controlled backup; `normalizeFamilyState` allows zero members.

## Benefit catalog

- **Shipped data**: `public/welfare-db` — fetched via `import.meta.env.BASE_URL` (`publicAsset()`).
- **Client merge**: `loadMergedWelfareCatalog()` loads bundled JSON **plus** IndexedDB cache (`link-help-welfare-cache`) — smart-match upserts and **Settings → 복지 JSON 불러오기** (`parseWelfareImportJson` + `upsertWelfareRecords`).
- **Planned / external**: An **AI analysis server** can turn notice text into `WelfareRecord` JSON and feed a **shared public catalog** (crowdsourcing + dedupe + review). Contract and diagram: `docs/catalog-pipeline.md`. Types include optional fields (`schema_version`, `dedupe_key`, `source_url`, etc.) for that pipeline; sample JSON files omit them.

## Service worker (`src/sw.ts`)

- **injectManifest** (Workbox): precache, navigation fallback to `index.html` under `BASE_URL`, runtime cache for `welfare-db`.

## Server (`server/`)

- Optional **self-hosted** API: SQLite welfare catalog, `GET /welfare`, `POST /welfare/analyze`, `POST /welfare/contribute`, optional Web Push (`server/README.md`). The static app works without it; **Settings** stores API base URL + token + contribute consent, and `src/core/api/linkHelpServer.ts` performs fetches.

## Matching & helpers

- **filterEngine**: tag overlap, excludes, scored recommend, timeline hypothetical age. Skips items that are **effectively ended** (`status: expired` or `period` end date before today when parseable).
- **welfareLifecycle**: parse `period` strings, `isWelfareEffectivelyExpired`, list sort for discovery (active first).
- **Reminders**: `ReminderRunner` + Notification API.
- **Tag hints**: `core/ai/suggestTags.ts` — client-only vocabulary match (not a hosted “AI search” product).
- **Smart match**: `features/smartsearch/SmartSearchPage.tsx` + `core/filter/smartMatchEngine.ts` — profile tags + include/exclude keywords, staged progress UI; all client-side (no server logging in app).
