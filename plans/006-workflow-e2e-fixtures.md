# Plan 006: Add Workflow-Level E2E Fixtures

## Executor Instructions

This plan is for a separate implementation pass. Work only on the files named here unless the drift check shows that the code moved.

Before editing, run:

```bash
git diff -- tests/e2e/app.spec.ts playwright.config.ts src/main/ipc/scanner.ts tests/unit/scanner.test.ts docs/v1-ready-to-market-plan.md docs/qa-checklist.md
git show --stat ca41862 -- tests/e2e/app.spec.ts playwright.config.ts src/main/ipc/scanner.ts tests/unit/scanner.test.ts docs/v1-ready-to-market-plan.md docs/qa-checklist.md
```

If these paths changed since commit `ca41862`, reconcile the current behavior before applying the steps below.

## Status

| Field | Value |
| --- | --- |
| Priority | P2 |
| Effort | L |
| Risk | MED |
| Depends on | None |
| Category | Tests |
| Planned at | `ca41862` on 2026-06-13 |

## Why This Matters

The app has a documented v1 requirement for workflow-level E2E smoke coverage, but the current Playwright file only verifies the shell and navigation. Regressions in scanning, duplicate analysis, organizer preview, quality scoring, export folder flow, and free-limit prompts can pass E2E today.

## Current State

Key files and roles:

| Path | Role |
| --- | --- |
| `tests/e2e/app.spec.ts` | Spawns the built Electron app, connects over CDP, and tests shell/navigation. |
| `src/main/ipc/scanner.ts` | Owns folder picker IPC and scan IPC. Native dialogs block direct E2E automation. |
| `tests/unit/scanner.test.ts` | Add tests if an E2E-only folder picker queue is introduced. |
| `docs/v1-ready-to-market-plan.md` | Documents Step 22 E2E workflow fixture requirements. |
| `docs/qa-checklist.md` | Lists manual workflow scenarios to translate into smoke tests. |

Evidence at `ca41862`:

```ts
// tests/e2e/app.spec.ts
test('window opens and renders the app shell', async () => { ... })
test('sidebar shows all navigation tabs', async () => { ... })
test('Scanner is active by default and shows empty state', async () => { ... })
test('navigating to Duplicates shows its panel header', async () => { ... })
test('all remaining tabs open without error', async () => { ... })
```

```md
<!-- docs/v1-ready-to-market-plan.md -->
Step 22: Add workflow-level E2E smoke fixtures
Definition of Done: E2E covers app launch, scan fixture folder, duplicate analysis no-crash path, organizer preview, quality scoring no-crash path, exporter output-folder flow, and one unlicensed over-limit prompt.
```

## Commands

| Purpose | Command |
| --- | --- |
| Build app for E2E | `pnpm build` |
| E2E tests | `pnpm test:e2e` |
| Scanner unit tests | `pnpm test -- tests/unit/scanner.test.ts` |
| Type check | `pnpm typecheck` |
| Targeted lint | `pnpm exec eslint tests/e2e/app.spec.ts src/main/ipc/scanner.ts tests/unit/scanner.test.ts --no-cache` |

Note: `pnpm build` writes `out/`, and `pnpm test:e2e` drives a built Electron app. These are appropriate during implementation, not during this planning pass.

## Scope

In scope:

- Add deterministic test image fixtures created at test runtime.
- Add E2E smoke coverage for scan, dedup, organizer, quality, export folder selection, and free-limit prompt.
- Add a narrowly gated E2E-only folder picker bypass if native dialogs block automation.

Out of scope:

- Pixel-perfect visual assertions.
- Full duplicate accuracy validation beyond no-crash and visible group state.
- Real payment or license activation flows.
- Long-running performance tests.

## Git Workflow

Use a branch named `codex/006-workflow-e2e-fixtures`.

Use a conventional commit message such as:

```text
test: add workflow e2e smoke fixtures
```

Do not push or open a PR unless the operator asks.

## Ordered Steps

1. Refactor the E2E launcher for isolated app instances.
   - In `tests/e2e/app.spec.ts`, extract the current `beforeAll` spawn/connect logic into a helper such as `launchElectronApp(envOverrides)`.
   - Return `{ browser, page, proc, getOutput }`.
   - Keep `CLEANUP_PHOTOS_E2E_CDP_PORT` behavior unchanged.
   - Add cleanup that closes the browser and kills the process per describe block.
   - Verify: `pnpm build` then `pnpm test:e2e`
   - Expected result: existing shell tests still pass.

2. Add runtime fixture creation.
   - Use `node:fs/promises`, `node:os`, and `node:path` to create temp scan and export directories.
   - Use `sharp` to write a few small image files at runtime:
     - two identical files for duplicate analysis.
     - one distinct file.
     - optionally one blurry/low-contrast fixture for quality scoring smoke.
   - Keep fixtures tiny to avoid slow CI.
   - Clean up temp directories after tests when possible.
   - Verify: `pnpm exec eslint tests/e2e/app.spec.ts --no-cache`
   - Expected result: no lint errors.

3. Add a test-only folder picker queue if needed.
   - Native `dialog.showOpenDialog` cannot be automated reliably from Playwright.
   - Add an environment-gated queue in `src/main/ipc/scanner.ts`, for example:
     - enabled only when `process.env.CLEANUP_PHOTOS_E2E === '1'`.
     - reads `process.env.CLEANUP_PHOTOS_E2E_PICK_FOLDERS` as a JSON string array.
     - each `PICK_FOLDER` call shifts and returns the next path.
     - if the queue is missing or empty, fall back to the native dialog.
   - Do not enable this behavior unless the explicit E2E env flag is set.
   - Add unit tests in `tests/unit/scanner.test.ts` for:
     - queue returns the next path when gated on.
     - native dialog path remains used when gated off.
   - Verify: `pnpm test -- tests/unit/scanner.test.ts`
   - Expected result: scanner picker behavior is covered without opening dialogs.

4. Add the workflow smoke test.
   - Launch Electron with:
     - `CLEANUP_PHOTOS_E2E=1`.
     - `CLEANUP_PHOTOS_E2E_PICK_FOLDERS` containing the scan folder and export folder in the order UI actions will request them.
   - Test flow:
     1. Start with Scan if onboarding appears.
     2. Click `Choose Folder`.
     3. Wait for scan result count.
     4. Navigate to Duplicates.
     5. Click the analyze action and assert the panel reaches either a duplicate group or a no-duplicates result without error.
     6. Navigate to Organize and assert preview generation reaches a preview or empty/no-op state.
     7. Navigate to Quality, run analysis, and assert results or a no-crash completion state.
     8. Navigate to Export, choose output folder, and assert the chosen folder state enables or advances export controls.
   - Prefer role/name selectors over class selectors.
   - Verify: `pnpm build` then `pnpm test:e2e`
   - Expected result: shell tests plus workflow smoke pass.

5. Add the unlicensed over-limit prompt smoke test.
   - Use a separate app instance to avoid state leaking from the workflow test.
   - Generate 101 tiny image files or whatever count exceeds `FREE_PHOTO_LIMIT`.
   - Launch without a license and with folder picker queue pointing at the over-limit folder.
   - Click `Choose Folder`.
   - Assert the free-limit prompt or limit-reached state appears before processing.
   - Verify: `pnpm build` then `pnpm test:e2e`
   - Expected result: over-limit path is covered.

6. Keep tests stable.
   - Avoid asserting exact timing text.
   - Use generous waits only around scan/hash/quality actions.
   - Do not depend on macOS native dialogs.
   - Do not add binary fixture files unless runtime generation proves impractical.
   - Verify final:
     - `pnpm typecheck`
     - `pnpm test -- tests/unit/scanner.test.ts`
     - `pnpm build`
     - `pnpm test:e2e`
     - `pnpm exec eslint tests/e2e/app.spec.ts src/main/ipc/scanner.ts tests/unit/scanner.test.ts --no-cache`

## Done Criteria

- E2E covers app launch and real workflow smoke paths from scan through export.
- Native folder selection is bypassed only under an explicit E2E env flag.
- Over-limit prompt is covered by E2E.
- Fixtures are deterministic and small.
- Unit tests cover any new scanner test hook.
- Build, E2E, focused unit tests, typecheck, and targeted lint pass.

## STOP Conditions

- Stop if native dialog bypass requires non-test-gated production behavior.
- Stop if workflow E2E becomes flaky or routinely exceeds acceptable local runtime.
- Stop if fixture generation requires new dependencies; use existing `sharp` first.
- Stop if selectors are too unstable because the UI lacks accessible names. Fix accessibility names in a separate narrow change only if required.

## Maintenance Notes

Workflow E2E should prove that major paths still connect, not duplicate all unit coverage. Keep it smoke-level and deterministic.
