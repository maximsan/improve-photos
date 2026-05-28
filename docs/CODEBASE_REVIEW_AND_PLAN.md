# Codebase review and development plan

**Project:** cleanup-photos — Electron desktop app for organizing and cleaning photo libraries.  
**Stack (from `package.json`):** Electron ^41.3.0, electron-vite ^5.0.0, React ^19.2.6, TypeScript ^5.9.3, Vite ^8.0.13, Tailwind ^4.3.0, Sharp ^0.34.5, exifr ^7.1.3, Vitest ^4.1.6, `@playwright/test` ^1.60.0, `@vitejs/plugin-react` ^6.0.2.

**Initial review:** 2026-04-19  
**Last verified against repo:** 2026-05-19 — `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm test` (19 files, 176 tests, all passing), and `pnpm test:e2e` (6 smoke tests, all passing with loopback CDP). Most recent documented coverage run before release-gate tests was 50.65% statements / 25.86% branches.

### Keeping this doc current

After meaningful changes, re-run **`pnpm test`**, **`pnpm test:coverage`** (if tracking metrics), **`pnpm build && pnpm test:e2e`** (Electron smoke), check **`package.json`** scripts and **`.github/workflows`**, then update **Last verified**, narrative in §3 where facts shifted, and checkboxes below.

**Checkbox convention:** `[x]` = true in the repo as of **Last verified**; `[ ]` = not done. Continue checking items off as you complete work.

---

## At-a-glance status

- [x] **Unit + hook tests:** all pass (**19** files, **176** tests — **8** under `tests/unit/`, **11** under `tests/renderer/`)
- [x] **Main process in Vitest:** `resolve.alias` maps `electron` and `@electron-toolkit/utils` → `tests/shims/*.ts` (avoids ESM/CJS import failures)
- [x] **`package.json` scripts:** `test`, `test:watch`, `test:coverage`, **`test:e2e`** (Playwright)
- [x] **CI:** `.github/workflows/ci.yml` — job **`ci`:** install → `typecheck` → `lint` → `test` on `macos-latest`; job **`e2e`** (after `ci`): install → `build` → `test:e2e`
- [x] **`vitest.config.ts`:** `@vitejs/plugin-react`; `coverage.include` / `exclude`; soft thresholds (statements 25%, lines 25%, functions 15%, branches 10%)
- [x] **Renderer hook tests:** `@testing-library/react` + `happy-dom`; `useScannerState`, `useDedupState`, `useQualityReviewState`, **`useOrganizerState`** (incl. undo flow), **`useExporterState`**; **`OrganizeDoneView`** component RTL (organized/reverted variants, undo button, error display); **`ReleaseGatesPanel`** rendering
- [x] **E2E smoke:** Playwright **`tests/e2e/app.spec.ts`** — spawns Electron with **`CLEANUP_PHOTOS_E2E_CDP_PORT`** + loopback CDP connect on `127.0.0.1`; covers shell, six sidebar tabs, default Scanner empty state, tab navigation
- [ ] **E2E deeper flows:** folder pick → scan, export batch, organize/trash (not automated yet)
- [x] **Coverage:** **50.65%** statements / **50.79%** lines / **25.86%** branches; hooks and targeted main-process tests carry most coverage, while many `.tsx` UI components remain thin

---

## 1. Architecture snapshot

| Layer | Location | Role |
|--------|-----------|------|
| **Main process** | `src/main/` | Window lifecycle, custom `app://` protocol, IPC handlers for scan, dedup, organizer, quality, exporter |
| **Preload** | `src/preload/` | `contextBridge` API (`ElectronAPI`) — typed invoke/on/off for all features |
| **Renderer** | `src/renderer/src/` | React UI: tabbed features, contexts for photos and navigation |
| **Shared** | `src/shared/ipc.ts` | `PhotoRecord`, progress types, **`IPC` channel constants** — single source of truth for cross-process contracts |

**Build:** Aliases `@shared`, `@renderer` in `electron.vite.config.ts`; main/preload/renderer each configured consistently.

**App shell:** `App.tsx` holds `activeTab`, `photos`, `scanRevision`; provides `PhotosContext` and `NavigationContext`. Features are toggled via `display: contents` / `hidden` (all feature trees stay mounted).

**V1 release boundary:** Payments, auto-updates, and release publishing are behind explicit feature gates and default to disabled until final v1 approval.

**Features (renderer):**

- **Scanner** — folder pick, scan, progress
- **Dedup** — perceptual hashing, duplicate groups, review UI
- **Organizer** — date-based paths, preview, execute moves, trash
- **Quality review** — blur scoring tiers, grid review
- **Exporter** — presets, batch export, progress
- **Settings** — release feature gate status while v1 market features are paused
- **Shared trash flow** — `TrashReviewChrome` (header + scrollable list + confirm button) and `TrashDonePanel` (completion state) are reusable shells; `DuplicateTrashReview` and `QualityTrashReview` wrap them with feature-specific content. Old monolithic `ReviewScreen` components removed.

**Main IPC modules:** `src/main/ipc/{scanner,dedup,organizer,quality,exporter,releaseFeatureFlags}.ts` plus `main/lib/hash.ts`, `main/localProtocol.ts`.

---

## 2. Strengths

1. **Clear boundary:** Shared types and `IPC` object prevent channel string drift between preload and main.
2. **Security posture:** Renderer accesses filesystem only through explicit preload methods (no raw Node in React).
3. **Feature modularity:** Each major workflow lives under `features/<Name>/` with hooks and components colocated.
4. **AGENTS.md discipline:** Hooks for orchestration, no business logic in JSX, component size constraints — aligns with maintainability.
5. **Testing:** Vitest + `@vitest/coverage-v8`; unit tests cover hash, exporter, scanner helpers, quality (`computeBlurScore`), organizer (`deriveTargetPath` + IPC), release feature gates, **IPC parity**; **electron/toolkit shims** keep the runner stable; **React plugin** in Vitest for `*.test.tsx`.
6. **E2E smoke:** Playwright drives a **built** app via loopback CDP on `127.0.0.1` (workaround for Electron 41+ / debugging-port behavior); same suite runs in CI after `pnpm build`.

---

## 3. Gaps and risks

### 3.1 Testing and CI

- [x] **`package.json` scripts** — `test`, `test:watch`, `test:coverage`, `test:e2e`.
- [x] **CI workflow** — `.github/workflows/ci.yml`: **`ci`** (`typecheck` → `lint` → `test`); **`e2e`** (`build` → `test:e2e`) on push/PR to `main`.
- [x] **Vitest + main-process imports** — **`tests/shims/`** + **`vitest.config.ts`** aliases; **19** test files run.
- [x] **Renderer hooks tested** — `useScannerState`, `useDedupState`, `useQualityReviewState` with `@testing-library/react` + `happy-dom`.
- [x] **E2E smoke automated** — shell + navigation including Settings + empty Scanner (not full workflows).
- [ ] **Coverage breadth** — **50.65%** statements overall; scanner, organizer, exporter, and `localProtocol` now have targeted main-process coverage; dedup/quality IPC paths and many **UI components** remain thin; **branches** **25.86%** (threshold 10%).

### 3.2 Coupling and evolution

- **Organizer ↔ scanner:** `getCachedPhotos` from `scanner` couples organizer IPC to scan cache implementation. Harder to test in isolation and to replace with a dedicated store later.
- **All tabs mounted:** Simplifies state retention but increases baseline work for hidden features; acceptable unless profiling shows cost — then consider lazy routes or conditional mount with explicit state restore.

### 3.3 Platform and packaging

- **Optional Sharp darwin-arm64** in `package.json` — document/support x64 or Linux if you expand targets.
- **`sandbox: false` in `BrowserWindow`** — common for preload patterns; document threat model (only load trusted local UI; validate all IPC inputs on main).

### 3.4 Product hardening (typical next steps)

- [x] **Undo / dry-run** — **dry-run** is `PREVIEW_ORGANIZE` (already shown before any files move); **undo for organize** is now implemented: `UNDO_ORGANIZE` IPC channel reverses renames sequentially, updates the cache for files that succeeded, and the renderer shows an "Undo" button in the done state that transitions through `undoing → undone`. Trash goes to macOS Trash which is recoverable by the user — no additional undo needed.
- [x] **Cancellation parity:** `CANCEL_SCAN` and `CANCEL_EXPORT` IPC channels added (main handlers + preload stubs), matching the existing `CANCEL_HASHES` pattern. Renderer UI hookup is a separate step.
- [x] **Error surfaces:** `EXECUTE_ORGANIZE` now processes files sequentially and updates the cache for those that succeeded before any failure; `EXPORT_BATCH` continues on per-file errors and reports a summary; `TRASH_FILES` continues per-item and reports failures — all three throw a structured error string that the renderer hooks already surface via their `error` state.

---

## 4. Recommended stack (tests and quality)

| Concern | Recommendation |
|---------|----------------|
| **Unit / integration** | **Vitest** (already in use) — keep one runner |
| **Coverage** | **v8** via `@vitest/coverage-v8` — configured in `vitest.config.ts` (`include`/`exclude`, soft thresholds); raise thresholds as coverage grows |
| **Renderer** | **@testing-library/react** (+ **user-event**) with **happy-dom** — `// @vitest-environment happy-dom` per `*.test.tsx` |
| **E2E** | **Playwright** — **`tests/e2e/`**; requires **`pnpm build`** before **`pnpm test:e2e`**; CI **`e2e`** job already runs this sequence |
| **Avoid** | Adding Jest in parallel |

---

## 5. What to cover (testing priorities)

Check off when meaningful tests exist and stay green in CI.

**Tier A — Fast, deterministic**

- [x] `main/lib/hash.ts` — HEIC sips fallback branches now covered: non-HEIC error re-throw, `.heic`/`.heif` fallback success, sips args, temp-file cleanup on success and on failure (`tests/unit/hash.test.ts`)
- [x] **Organizer paths:** `deriveTargetPath` — covered in `tests/unit/organizer.test.ts`
- [x] **Quality:** `computeBlurScore` edge cases added — zero standard deviation (uniform image), equal standard deviation, decode error propagation (`tests/unit/quality.test.ts`)
- [x] Pure helpers: `tree.ts` (`buildTree`, `shortPath`), `format.ts` (`formatBytes`, `fileUrl`), `scoreLabel.ts`, `tiers.ts` — all covered in `tests/renderer/`; `scoreLabel` boundary values, tier exhaustiveness (no gaps/overlaps), `formatBytes` KB/MB/GB boundaries
- [x] **`IPC` invoke parity** — `tests/unit/ipc-parity.test.ts` exercises all **15** `ipcRenderer.invoke` channels used by preload (`PICK_FOLDER` … `GET_RELEASE_FEATURE_FLAGS`)

**Tier B — Main process with mocks**

- [x] Scanner: extend beyond helpers into IPC handler paths / edge cases
- [ ] Dedup: grouping/sorting from hash map fixtures
- [x] Exporter: extend IPC failure/progress paths
- [ ] Organizer / quality: IPC handlers — organizer conflicts/errors covered; quality IPC still pending
- [x] Release feature gates: default-disabled and explicit-enabled values (`tests/unit/releaseFeatureFlags.test.ts`)

**Tier C — Renderer**

- [x] Hooks: `useScannerState`, `useDedupState`, `useQualityReviewState` with mocked `window.api`
- [x] Hooks: `useOrganizerState` (preview, confirm, undo success/failure, reset, conflict exclusion, `setPhotos` path update), `useExporterState` (pick folder, export success/failure, progress subscription, unsubscribe in finally, reset)
- [x] Critical UI states: `OrganizeDoneView` component RTL — organized/reverted variants, undo button presence, click handlers, singular/plural count, error display, "Done" vs "Organize again" label; `ReleaseGatesPanel` disabled/enabled copy

**Tier D — E2E**

- [x] **Smoke:** app launches, sidebar tabs including Settings, Scanner default empty state, tab switches (`tests/e2e/app.spec.ts`)
- [ ] **Workflows:** pick folder → scan completes; export or organize smoke (feasibility TBD in CI)

---

## 6. Phased plan

### Phase 0 — Baseline hygiene

- [x] Add **`pnpm` scripts:** `test`, `test:watch`, `test:coverage`
- [x] **Vitest stable for main-process imports** — `tests/shims/electron.ts`, `tests/shims/electron-toolkit-utils.ts` + `vitest.config.ts` `resolve.alias`
- [ ] Optional: **reduce coupling** — inject photo source for organizer tests (facade or small module) so organizer tests do not import full `scanner` graph
- [x] Add **minimal CI** — GitHub Actions `ci` job: `typecheck`, `lint`, `test`

### Phase 1 — Coverage and contracts

- [x] Configure **coverage** `include`/`exclude` for `src/main`, `src/shared`, `src/renderer/src`
- [x] Introduce **soft coverage thresholds** (statements 25%, lines 25%, functions 15%, branches 10%); raise over time
- [x] Add **preload ↔ main parity checks** — `tests/unit/ipc-parity.test.ts` uses `it.each` over all **15** invoke channels; registers all `register*Handlers()` and asserts `ipcMain.handle` coverage

### Phase 2 — Renderer tests

- [x] Add **Testing Library** + **happy-dom** for `*.test.tsx` — per-file `// @vitest-environment happy-dom`
- [x] Cover **three high-risk hooks** (`useScannerState`, `useDedupState`, `useQualityReviewState`) with mocked `window.api`

### Phase 3 — E2E and release confidence

- [x] **Playwright + Electron** smoke — `tests/e2e/app.spec.ts`, `playwright.config.ts`, `pnpm test:e2e`; **CI `e2e` job** on `macos-latest` after `build`
- [x] Document **manual QA checklist** for releases (large folders, HEIC, permissions, cancel mid-scan)

### Phase 4 — Architecture follow-ups (as needed)

- [ ] If organizer/scanner coupling blocks features, introduce a **small photo repository** interface in main (backed by cache today)
- [ ] If memory or startup cost matters, evaluate **lazy mounting** for inactive tabs with serialized restore
- [ ] Review **sandbox** and **CSP** options as the preload surface grows

---

## 7. Alignment with project rules

- **AGENTS.md:** Continue extracting hooks for orchestration; keep components focused; avoid nested ternaries and JSX-embedded business rules.
- **Performance (React best practices):** Prefer testing **user-visible behavior** and **boundaries** (IPC, pure reducers) over implementation details; use E2E sparingly for integration confidence.

---

## 8. Summary

The codebase is **well-structured for a multi-feature Electron app**, with a **strong shared IPC contract** and **clear separation** between preload and React. **Phases 0–3 are done** and §3.4 hardening is largely complete: **176 tests** across **19 files**; Tier A pure-helper and branch-gap tests added (`hash.ts` HEIC fallback, `computeBlurScore` edge cases, `tree.ts`, `format.ts`, `scoreLabel.ts`, `tiers.ts`); targeted main-process tests now cover `localProtocol`, scanner progress/cancel, organizer conflict/error paths, exporter failure progress, and release feature gates. The most recent documented coverage run before release-gate tests was **50.65% statements**, **50.79% lines**, and **25.86% branches**. Remaining debt: dedup/quality IPC paths and many **`.tsx`** components are still thin; **no workflow-level E2E**; cancellation renderer UI not yet connected.

---

*Living document — update **Last verified**, §3 checkboxes, and metrics when the repo changes.*
