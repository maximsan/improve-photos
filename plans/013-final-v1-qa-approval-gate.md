# Plan 013: Run Final V1 QA and Approval Gate

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report; do not improvise. When done, update the status row for this plan in `plans/README.md` unless a reviewer dispatched you and told you they maintain the index.
>
> **Drift check (run first)**: `git diff --stat ad5a56e..HEAD -- docs/v1-ready-to-market-plan.md docs/qa-checklist.md docs/go-to-market-plan.md README.md package.json .github/workflows/ci.yml tests tests/e2e/app.spec.ts plans/README.md`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live files before proceeding. On a meaningful mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: MED
- **Depends on**: `plans/006-workflow-e2e-fixtures.md`, `plans/010-reconcile-v1-roadmap-docs.md`, `plans/011-release-packaging-signing-notarization.md`, `plans/012-manual-release-publishing-trust-material.md`
- **Category**: tests
- **Planned at**: commit `ad5a56e`, 2026-06-19

## Why this matters

The final v1 release should happen only after the full app, release services, packaging, notarization, licensing, update checks, free-limit behavior, and manual QA have passed together. This plan gives the final gate an executable shape so market features are enabled only after explicit approval, not because a build happened to pass. It covers v1 Steps 23, 24, and 25, and it reconciles Step 21 coverage only after existing active test plans are accounted for.

## Current state

Key files and roles:

| Path                                 | Role                                                         |
| ------------------------------------ | ------------------------------------------------------------ |
| `docs/v1-ready-to-market-plan.md`    | Canonical release gate and remaining Step 23-25 checklist.   |
| `docs/qa-checklist.md`               | Manual QA checklist for app workflows and release gates.     |
| `package.json`                       | Verification commands.                                       |
| `tests/e2e/app.spec.ts`              | Current Electron smoke tests. Plan 006 expands workflow E2E. |
| `plans/006-workflow-e2e-fixtures.md` | Existing executor plan for Step 22 workflow E2E fixtures.    |
| `plans/README.md`                    | Execution order and status surface.                          |

Current excerpts:

```md
<!-- docs/v1-ready-to-market-plan.md:103-116 -->

- [ ] **Step 21: Expand automated coverage for v1-critical paths**
      **Definition of Done:** Tests cover scan root propagation, Organizer target paths, Dedup/Quality post-trash photo removal, Quality cancellation/confirmation, payments disabled/enabled behavior, auto-updates disabled/enabled behavior, license status transitions, 100-photo limit enforcement, and update-state rendering.

- [ ] **Step 22: Add workflow-level E2E smoke fixtures**
      **Definition of Done:** E2E covers app launch, scan fixture folder, duplicate analysis no-crash path, organizer preview, quality scoring no-crash path, exporter output-folder flow, and one unlicensed over-limit prompt.

- [ ] **Step 23: Revalidate all application functionality before enabling market features**
      **Definition of Done:** Scanner, Duplicates, Organizer, Quality, Exporter, onboarding, Help, Settings, and free-limit behavior pass manual QA with payments and auto-updates disabled.

- [ ] **Step 24: Enable payments and auto-updates only after explicit release approval**
      **Definition of Done:** A documented release checklist item records the approval to enable payments and auto-updates, the release flags are switched on only for release builds, and a final QA pass confirms license activation and update checks work.

- [ ] **Step 25: Run final release QA gate**
      **Definition of Done:** `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:coverage`, `pnpm build`, `pnpm test:e2e`, `pnpm build:mac`, notarization, update check, license activation, free-limit checks, and manual QA checklist all pass.
```

```md
<!-- docs/qa-checklist.md:9-14 -->

- [ ] Build a clean DMG: `pnpm build:mac`
- [ ] Install the DMG on a clean macOS user account (not the dev machine)
- [ ] Grant the app access to the test photo folder when macOS prompts
- [ ] Run Electron smoke tests from built output: `pnpm build && pnpm test:e2e`
- [ ] Confirm payments, auto-updates, and release publishing are disabled unless final v1 approval has explicitly enabled them
- [ ] Confirm no release was created or published by local build, push, merge, test, or CI smoke runs
```

```md
<!-- plans/006-workflow-e2e-fixtures.md:27-30 -->

The app has a documented v1 requirement for workflow-level E2E smoke coverage, but the current Playwright file only verifies the shell and navigation. Regressions in scanning, duplicate analysis, organizer preview, quality scoring, export folder flow, and free-limit prompts can pass E2E today.
```

Repo conventions to follow:

- Treat CLI checks as source of truth.
- Payments, auto-updates, and release publishing default to disabled and must be enabled only after final approval.
- Do not mark checklist items complete unless the command or manual verification was actually run.
- Do not add analytics or crash SDKs as part of this gate.

## Commands you will need

| Purpose             | Command                                                                                                                        | Expected on success                    |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------- |
| Install             | `pnpm install --frozen-lockfile`                                                                                               | exit 0                                 |
| Lint                | `pnpm lint`                                                                                                                    | exit 0                                 |
| Typecheck           | `pnpm typecheck`                                                                                                               | exit 0                                 |
| Unit/renderer tests | `pnpm test`                                                                                                                    | all tests pass                         |
| Coverage            | `pnpm test:coverage`                                                                                                           | exit 0; no unexpected coverage failure |
| Build               | `pnpm build`                                                                                                                   | exit 0                                 |
| E2E                 | `pnpm test:e2e`                                                                                                                | all tests pass                         |
| macOS package       | `pnpm build:mac`                                                                                                               | exit 0; Universal DMG exists           |
| Diff whitespace     | `git diff --check -- docs/v1-ready-to-market-plan.md docs/qa-checklist.md docs/go-to-market-plan.md README.md plans/README.md` | exit 0                                 |

External/manual checks:

- Apple notarization and Gatekeeper verification from Plan 011.
- GitHub Releases update check after auto-update gate is enabled for release testing.
- Lemon Squeezy activation/deactivation after payments gate is enabled for release testing.
- Manual QA checklist in `docs/qa-checklist.md`.

## Scope

**In scope**:

- `docs/v1-ready-to-market-plan.md`
- `docs/qa-checklist.md`
- `docs/go-to-market-plan.md`
- `README.md`
- Test files required only to close missing v1-critical coverage after Plan 006 is done.
- `plans/README.md`

**Out of scope**:

- Implementing the workflow E2E fixtures covered by Plan 006.
- Implementing release packaging/signing/notarization covered by Plan 011.
- Implementing release publishing/trust material covered by Plan 012.
- Shipping a public release without explicit operator approval.
- Changing pricing, license provider, or 100-photo limit policy.

## Git workflow

- Branch: `codex/013-final-v1-qa-approval-gate`
- Commit message: `test: run final v1 qa gate`
- Do not push or open a pull request unless the operator asks.

## Steps

### Step 1: Confirm dependencies are complete

Before starting final QA, inspect `plans/README.md` and confirm:

- Plan 006 is `DONE` or its workflow E2E scope has been completed elsewhere.
- Plan 010 is `DONE`.
- Plan 011 is `DONE` or truthfully `BLOCKED` only on external Apple verification that the operator accepts.
- Plan 012 is `DONE` or truthfully `BLOCKED` only on external release/trust material that the operator accepts.

If any dependency is still `Planned`, stop and execute/review that plan first.

**Verify**: `rg -n "006-workflow-e2e-fixtures|010-reconcile-v1-roadmap-docs|011-release-packaging-signing-notarization|012-manual-release-publishing-trust-material" plans/README.md` -> each dependency has a truthful status.

### Step 2: Reconcile automated v1-critical coverage

Use `docs/v1-ready-to-market-plan.md` Step 21 as the coverage matrix. Check existing tests before adding new ones:

- Scan root propagation.
- Organizer target paths.
- Dedup/Quality post-trash photo removal.
- Quality cancellation/confirmation.
- Payments disabled/enabled behavior.
- Auto-updates disabled/enabled behavior.
- License status transitions.
- 100-photo limit enforcement.
- Update-state rendering.

If existing tests already cover a case, record the test file in a short coverage note in `docs/v1-ready-to-market-plan.md` or `docs/qa-checklist.md`. If a case is missing, add the narrowest focused test following the existing test style under `tests/unit/` or `tests/renderer/`.

Do not duplicate Plan 006's workflow E2E work.

**Verify**: `pnpm test` -> all unit/renderer tests pass.

### Step 3: Run the disabled-market-features QA pass

With payments and auto-updates disabled, run the app QA pass:

- Scanner.
- Duplicates.
- Organizer.
- Quality.
- Exporter.
- Onboarding.
- Help.
- Settings.
- Free-limit behavior with gates disabled.

Use `docs/qa-checklist.md` as the checklist. Record results by checking items only if they were actually run, or add a dated "Final v1 QA run" note with pass/fail/blocker details.

**Verify**: `docs/qa-checklist.md` reflects the actual manual QA run and no checked item is speculative.

### Step 4: Run the full automated gate

Run commands in this order:

1. `pnpm install --frozen-lockfile`
2. `pnpm lint`
3. `pnpm typecheck`
4. `pnpm test`
5. `pnpm test:coverage`
6. `pnpm build`
7. `pnpm test:e2e`
8. `pnpm build:mac`

If a command fails, fix only if the cause is within this plan's scope. Otherwise, stop and report the failing command and exact error.

**Verify**: each command exits 0.

### Step 5: Enable release gates only after explicit approval

Do not enable payments or auto-updates until the operator gives explicit approval for this release candidate.

After approval:

- Record the approval in `docs/v1-ready-to-market-plan.md` or a release checklist section.
- Enable `CLEANUP_PHOTOS_PAYMENTS_ENABLED` and `CLEANUP_PHOTOS_AUTO_UPDATES_ENABLED` only for release testing/builds.
- Keep `CLEANUP_PHOTOS_RELEASE_PUBLISHING_ENABLED` disabled unless the release publishing plan requires it and approval includes publishing.
- Run a final QA pass for license activation/deactivation and update check.

Do not commit real license keys or Apple/GitHub/Lemon Squeezy secrets.

**Verify**: approval record exists, gates are release-build scoped, and final license/update checks are recorded.

### Step 6: Update v1 and plan status

Update `docs/v1-ready-to-market-plan.md`:

- Mark Step 21 complete only if coverage matrix is satisfied.
- Mark Step 23 complete only if disabled-market-features manual QA passed.
- Mark Step 24 complete only if explicit approval was recorded and gated release QA passed.
- Mark Step 25 complete only if all automated, packaging, notarization, update, license, free-limit, and manual QA checks passed.

Update `plans/README.md` row for this plan.

**Verify**: `rg -n "Step 21|Step 23|Step 24|Step 25|013-final-v1-qa-approval-gate" docs/v1-ready-to-market-plan.md plans/README.md` -> status is truthful.

## Test plan

Use the command gate in Step 4 as the automated test plan. Add only focused tests needed to close Step 21 gaps discovered in Step 2.

Manual test plan:

- Complete `docs/qa-checklist.md`.
- Run signed/notarized clean-install verification from Plan 011.
- Run release publishing dry-run or manual checklist from Plan 012.
- Run license activation/deactivation and update check only after explicit release approval enables the gates.

## Done criteria

- [ ] Dependencies Plan 006, 010, 011, and 012 are complete or truthfully accepted as externally blocked.
- [ ] Step 21 coverage matrix is either covered by existing tests or has new focused tests.
- [ ] Full automated gate passes.
- [ ] Manual QA checklist is complete and truthful.
- [ ] Payments and auto-updates are enabled only after explicit approval.
- [ ] License activation/deactivation and update check pass with release gates enabled.
- [ ] Notarization and Gatekeeper verification pass.
- [ ] `docs/v1-ready-to-market-plan.md` Step 21/23/24/25 status reflects actual results.
- [ ] `plans/README.md` status row is updated.

## STOP conditions

Stop and report back if:

- Any dependency plan remains incomplete and is not explicitly accepted as externally blocked.
- Manual QA finds a user-visible bug in Scanner, Duplicates, Organizer, Quality, Exporter, onboarding, Help, Settings, free-limit behavior, licensing, or updates.
- The release cannot be signed/notarized or Gatekeeper verification fails.
- The operator has not explicitly approved enabling payments and auto-updates.
- Any required check fails twice after a reasonable in-scope fix attempt.

## Maintenance notes

This plan is the final gate, not a feature-development plan. Keep fixes narrow. If a substantial behavior change is needed, stop and write a separate plan instead of hiding feature work inside release QA.
