# Codebase review and development plan

**Project:** cleanup-photos — Electron desktop app for organizing and cleaning photo libraries.  
**Stack (from `package.json`):** Electron ^41.3.0, electron-vite ^5.0.0, React ^19.2.1, TypeScript ^5.9.3, Vite ^8.0.10, Tailwind ^4.2.2, Sharp ^0.34.5, exifr ^7.1.3, Vitest ^4.1.5, `@playwright/test` ^1.59.1, `@vitejs/plugin-react` ^6.0.1.

**Initial review:** 2026-04-19  
**Last verified against repo:** 2026-04-25 — `pnpm test` (9 files, 75 tests, all passing); `pnpm test:coverage` (~30% statements/lines on included paths); `pnpm build` + `pnpm test:e2e` (6 Playwright tests); `.github/workflows/ci.yml` (`ci` + `e2e` jobs); `vitest.config.ts` (React plugin, `tests/**/*.test.{ts,tsx}`, coverage thresholds); `tests/shims/*`; `@testing-library/react` + `happy-dom`.

### Keeping this doc current

After meaningful changes, re-run **`pnpm test`**, **`pnpm test:coverage`** (if tracking metrics), **`pnpm build && pnpm test:e2e`** (Electron smoke), check **`package.json`** scripts and **`.github/workflows`**, then update **Last verified**, narrative in §3 where facts shifted, and checkboxes below.

**Checkbox convention:** `[x]` = true in the repo as of **Last verified**; `[ ]` = not done. Continue checking items off as you complete work.

---

## At-a-glance status

- [x] **Unit + hook tests:** all pass (**9** files, **75** tests — **6** under `tests/unit/`, **3** under `tests/renderer/`)
- [x] **Main process in Vitest:** `resolve.alias` maps `electron` and `@electron-toolkit/utils` → `tests/shims/*.ts` (avoids ESM/CJS import failures)
- [x] **`package.json` scripts:** `test`, `test:watch`, `test:coverage`, **`test:e2e`** (Playwright)
- [x] **CI:** `.github/workflows/ci.yml` — job **`ci`:** install → `typecheck` → `lint` → `test` on `macos-latest`; job **`e2e`** (after `ci`): install → `build` → `test:e2e`
- [x] **`vitest.config.ts`:** `@vitejs/plugin-react`; `coverage.include` / `exclude`; soft thresholds (statements 25%, lines 25%, functions 15%, branches 10%)
- [x] **Renderer hook tests:** `@testing-library/react` + `happy-dom`; `useScannerState`, `useDedupState`, `useQualityReviewState` (per-file `// @vitest-environment happy-dom`)
- [x] **E2E smoke:** Playwright **`tests/e2e/app.spec.ts`** — spawns Electron with **`CLEANUP_PHOTOS_E2E_CDP_PORT`** + CDP connect (see file header); covers shell, five sidebar tabs, default Scanner empty state, tab navigation
- [ ] **E2E deeper flows:** folder pick → scan, export batch, organize/trash (not automated yet)
- [x] **Coverage (latest `test:coverage`):** ~**30%** statements / ~**30%** lines across `src/main` + `src/shared` + `src/renderer/src`; hook files strong (~87–93% lines on tested hooks); most **`.tsx` UI** and **`useOrganizerState` / `useExporterState`** still ~**0%**

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

**Features (renderer):**

- **Scanner** — folder pick, scan, progress
- **Dedup** — perceptual hashing, duplicate groups, review UI
- **Organizer** — date-based paths, preview, execute moves, trash
- **Quality review** — blur scoring tiers, grid review
- **Exporter** — presets, batch export, progress
- **Shared trash flow** — `TrashReviewChrome` (header + scrollable list + confirm button) and `TrashDonePanel` (completion state) are reusable shells; `DuplicateTrashReview` and `QualityTrashReview` wrap them with feature-specific content. Old monolithic `ReviewScreen` components removed.

**Main IPC modules:** `src/main/ipc/{scanner,dedup,organizer,quality,exporter}.ts` plus `main/lib/hash.ts`, `main/localProtocol.ts`.

---

## 2. Strengths

1. **Clear boundary:** Shared types and `IPC` object prevent channel string drift between preload and main.
2. **Security posture:** Renderer accesses filesystem only through explicit preload methods (no raw Node in React).
3. **Feature modularity:** Each major workflow lives under `features/<Name>/` with hooks and components colocated.
4. **AGENTS.md discipline:** Hooks for orchestration, no business logic in JSX, component size constraints — aligns with maintainability.
5. **Testing:** Vitest + `@vitest/coverage-v8`; unit tests cover hash, exporter, scanner helpers, quality (`computeBlurScore`), organizer (`deriveTargetPath` + IPC), **IPC parity**; **electron/toolkit shims** keep the runner stable; **React plugin** in Vitest for `*.test.tsx`.
6. **E2E smoke:** Playwright drives a **built** app via CDP (workaround for Electron 41+ / debugging-port behavior); same suite runs in CI after `pnpm build`.

---

## 3. Gaps and risks

### 3.1 Testing and CI

- [x] **`package.json` scripts** — `test`, `test:watch`, `test:coverage`, `test:e2e`.
- [x] **CI workflow** — `.github/workflows/ci.yml`: **`ci`** (`typecheck` → `lint` → `test`); **`e2e`** (`build` → `test:e2e`) on push/PR to `main`.
- [x] **Vitest + main-process imports** — **`tests/shims/`** + **`vitest.config.ts`** aliases; **9** test files run.
- [x] **Renderer hooks tested** — `useScannerState`, `useDedupState`, `useQualityReviewState` with `@testing-library/react` + `happy-dom`.
- [x] **E2E smoke automated** — shell + navigation + empty Scanner (not full workflows).
- [ ] **Coverage breadth** — ~**30%** statements overall; **organizer/quality/scanner IPC** handlers and **`localProtocol`** still thin; **UI components** and **`useOrganizerState` / `useExporterState`** largely untested; **branches** ~**12%** (threshold 10% — monitor regressions).

### 3.2 Coupling and evolution

- **Organizer ↔ scanner:** `getCachedPhotos` from `scanner` couples organizer IPC to scan cache implementation. Harder to test in isolation and to replace with a dedicated store later.
- **All tabs mounted:** Simplifies state retention but increases baseline work for hidden features; acceptable unless profiling shows cost — then consider lazy routes or conditional mount with explicit state restore.

### 3.3 Platform and packaging

- **Optional Sharp darwin-arm64** in `package.json` — document/support x64 or Linux if you expand targets.
- **`sandbox: false` in `BrowserWindow`** — common for preload patterns; document threat model (only load trusted local UI; validate all IPC inputs on main).

### 3.4 Product hardening (typical next steps)

- [ ] **Undo / dry-run** for destructive operations (organize, trash) if not already surfaced in UX.
- [ ] **Large-library performance:** progress cancellation exists for hashes (`CANCEL_HASHES`); verify parity for scan/export where users expect abort.
- [ ] **Error surfaces:** IPC failures propagate to user-visible messages consistently across features.

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

- [ ] `main/lib/hash.ts` — close remaining branch/line gaps (tests exist; tighten to full branch coverage)
- [x] **Organizer paths:** `deriveTargetPath` — covered in `tests/unit/organizer.test.ts`
- [ ] **Quality:** direct tests for **`laplacianVariance`** (if kept exported) — today **`computeBlurScore`** is covered in `tests/unit/quality.test.ts`
- [ ] Pure helpers: renderer `features/Organizer/utils/tree.ts`, `lib/format.ts`, quality `scoreLabel.ts` / `tiers.ts` / subtitle helpers
- [x] **`IPC` invoke parity** — `tests/unit/ipc-parity.test.ts` exercises all **11** `ipcRenderer.invoke` channels used by preload (`PICK_FOLDER` … `CONFIRM_TRASH`)

**Tier B — Main process with mocks**

- [ ] Scanner: extend beyond helpers into IPC handler paths / edge cases
- [ ] Dedup: grouping/sorting from hash map fixtures
- [ ] Exporter: extend preset + path edge cases
- [ ] Organizer / quality: IPC handlers — conflicts, errors, not only exported helpers

**Tier C — Renderer**

- [x] Hooks: `useScannerState`, `useDedupState`, `useQualityReviewState` with mocked `window.api`
- [ ] Hooks: `useOrganizerState`, `useExporterState`
- [ ] Critical UI states: empty, loading, error, completion (component-level RTL)

**Tier D — E2E**

- [x] **Smoke:** app launches, sidebar tabs, Scanner default empty state, tab switches (`tests/e2e/app.spec.ts`)
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
- [x] Add **preload ↔ main parity checks** — `tests/unit/ipc-parity.test.ts` uses `it.each` over all **11** invoke channels; registers all `register*Handlers()` and asserts `ipcMain.handle` coverage

### Phase 2 — Renderer tests

- [x] Add **Testing Library** + **happy-dom** for `*.test.tsx` — per-file `// @vitest-environment happy-dom`
- [x] Cover **three high-risk hooks** (`useScannerState`, `useDedupState`, `useQualityReviewState`) with mocked `window.api`

### Phase 3 — E2E and release confidence

- [x] **Playwright + Electron** smoke — `tests/e2e/app.spec.ts`, `playwright.config.ts`, `pnpm test:e2e`; **CI `e2e` job** on `macos-latest` after `build`
- [ ] Document **manual QA checklist** for releases (large folders, HEIC, permissions, cancel mid-scan)

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

The codebase is **well-structured for a multi-feature Electron app**, with a **strong shared IPC contract** and **clear separation** between preload and React. **Phases 0–2 are done:** scripts, Vitest (including React tests), coverage config with thresholds, IPC parity tests, three renderer hook suites (**75** tests in **9** files). **Phase 3 is partially done:** Playwright **smoke** (shell + tabs + Scanner empty state) runs locally after **`pnpm build`** and in CI via a dedicated **`e2e`** job. Remaining debt: **~30% overall line/statement coverage**, weak **branch** coverage, **Organizer/Exporter hooks** and most **`.tsx`** still untested, **no workflow-level E2E**. Sensible next steps: Tier A/B gaps, **`useOrganizerState` / `useExporterState`**, then optional **workflow E2E** and a **manual QA** doc.

---

*Living document — update **Last verified**, §3 checkboxes, and metrics when the repo changes.*
