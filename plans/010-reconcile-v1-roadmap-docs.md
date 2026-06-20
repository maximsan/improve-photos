# Plan 010: Reconcile V1 Roadmap Docs With Current Implementation

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report; do not improvise. When done, update the status row for this plan in `plans/README.md` unless a reviewer dispatched you and told you they maintain the index.
>
> **Drift check (run first)**: `git diff --stat ad5a56e..HEAD -- docs/v1-ready-to-market-plan.md docs/architecture.md docs/go-to-market-plan.md docs/glossary.md README.md docs/qa-checklist.md plans/README.md`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live files before proceeding. On a meaningful mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: docs
- **Planned at**: commit `ad5a56e`, 2026-06-19

## Why this matters

`docs/v1-ready-to-market-plan.md` says it is the source of truth for v1, but some surviving docs still describe older state or keep completed items as future work. That makes the roadmap unreliable for future agents and maintainers. This plan makes the docs describe one current story: v1 market features are mostly implemented and gated, release packaging/signing/publishing/QA are the remaining release-readiness work, and detailed execution lives in numbered `plans/` files.

## Current state

Key files and roles:

| Path                              | Role                                                                      |
| --------------------------------- | ------------------------------------------------------------------------- |
| `docs/v1-ready-to-market-plan.md` | Canonical human roadmap for final v1 scope and release gate.              |
| `docs/architecture.md`            | Architecture overview and build pipeline description.                     |
| `docs/go-to-market-plan.md`       | Market-readiness checklist that points to the v1 plan.                    |
| `docs/glossary.md`                | Definitions for release, licensing, and tooling terms.                    |
| `README.md`                       | User/developer entry point and build instructions.                        |
| `docs/qa-checklist.md`            | Manual release verification checklist.                                    |
| `plans/README.md`                 | Executor plan index; use it as the visible implementation status surface. |

Current excerpts:

```md
<!-- docs/v1-ready-to-market-plan.md:53-54 -->

- [x] **Step 5: Update surviving docs for market readiness**
      **Definition of Done:** `README.md`, `docs/architecture.md`, `docs/glossary.md`, `docs/qa-checklist.md`, and `docs/go-to-market-plan.md` agree on v1 scope, Universal Mac DMG, count-limited free use, licensing, auto-update, notarization, and postponed features.
```

```md
<!-- docs/architecture.md:102 -->

`pnpm dev` skips both stages entirely and runs the TypeScript source directly with hot reload. `pnpm build:mac` runs `pnpm build` first, then packages the current local macOS arm64 app. The v1 release target remains a Universal macOS DMG.
```

```md
<!-- docs/go-to-market-plan.md:23 -->

**Gap:** Screenshots, Help/shortcuts, workflow docs, auto-updates, licensing, and free-limit UX are tracked in the v1 plan before broad public release.
```

```md
<!-- docs/v1-ready-to-market-plan.md:118-127 -->

## Public interfaces to change

- `PhotosContext`: add `scanRoot`, `setScanRoot`, and `removePhotosByPath(paths)`.
- `window.api.previewOrganize`: change from `(photos)` to `(photos, scanRoot)`.
- `window.api`: add Quality cancellation if implemented as a new IPC channel.
- `window.api`: add license methods: `getLicenseStatus`, `activateLicense`, `deactivateLicense`.
- `window.api`: add entitlement/free-limit methods: `getEntitlementStatus`, `canProcessPhotoCount`.
- `window.api`: add update methods/events: `checkForUpdates`, `downloadUpdate`, `installUpdate`, `onUpdateStatus`.
- `window.api.getReleaseFeatureFlags`: added for `paymentsEnabled`, `autoUpdatesEnabled`, and `releasePublishingEnabled`.
- Release config: add explicit flags for `paymentsEnabled`, `autoUpdatesEnabled`, and `releasePublishingEnabled`. Current pre-v1 implementation reads `CLEANUP_PHOTOS_PAYMENTS_ENABLED`, `CLEANUP_PHOTOS_AUTO_UPDATES_ENABLED`, and `CLEANUP_PHOTOS_RELEASE_PUBLISHING_ENABLED`; all default to `off`.
```

Repo conventions to follow:

- Docs use direct, concrete prose. Keep API names and env vars exact.
- `plans/README.md` is the authoritative implementation-plan status surface in this repo. Extend it monotonically instead of replacing it.
- Do not mark release work complete unless the matching artifact, command, or manual verification has actually happened.

## Commands you will need

- Search stale references:
  `rg -n "arm64 app|coming soon|Gap:|Public interfaces to change|to change|planned v1 work|Help/shortcuts|licensing, and free-limit UX" README.md docs plans`
  - Expected on success: only intentional current wording remains.
- Markdown sanity:
  `pnpm exec prettier --check docs/v1-ready-to-market-plan.md docs/architecture.md docs/go-to-market-plan.md docs/glossary.md README.md docs/qa-checklist.md plans/README.md`
  - Expected on success: exit 0.
- Planning-only diff check:
  `git diff --check -- docs/v1-ready-to-market-plan.md docs/architecture.md docs/go-to-market-plan.md docs/glossary.md README.md docs/qa-checklist.md plans/README.md`
  - Expected on success: exit 0.

## Scope

**In scope**:

- `docs/v1-ready-to-market-plan.md`
- `docs/architecture.md`
- `docs/go-to-market-plan.md`
- `docs/glossary.md`
- `README.md`
- `docs/qa-checklist.md`
- `plans/README.md`

**Out of scope**:

- App behavior, tests, build scripts, CI workflows, and release config.
- Rewording product positioning beyond the stale/completed roadmap status.
- Publishing a release or enabling payments/auto-updates.
- Changing the 100-photo limit policy.

## Git workflow

- Branch: `codex/010-reconcile-v1-roadmap-docs`
- Commit message: `docs: reconcile v1 roadmap status`
- Do not push or open a pull request unless the operator asks.

## Steps

### Step 1: Split current and remaining public interfaces

In `docs/v1-ready-to-market-plan.md`, replace `## Public interfaces to change` with two clearer sections:

- `## Implemented public interfaces`
- `## Remaining public interface changes`

Move already-implemented items under implemented:

- `PhotosContext` `scanRoot`, `setScanRoot`, `removePhotosByPath(paths)`.
- `window.api.previewOrganize(photos, scanRoot)`.
- Quality cancellation IPC, if the live shared IPC file confirms it exists.
- license, entitlement, update, and feature-flag APIs listed in the current section.
- release feature flags and env vars.

The remaining section should say that no additional public API shape is currently expected for Steps 17-25 unless the release implementation plan discovers a need. If a live file contradicts that, stop and report rather than inventing a new API.

**Verify**: `rg -n "Public interfaces to change|add license methods|add entitlement|add update methods|add Quality cancellation if implemented" docs/v1-ready-to-market-plan.md` -> no matches.

### Step 2: Add executor-plan links for open v1 work

In `docs/v1-ready-to-market-plan.md`, add a short "Execution plans" subsection near the open Step 17-25 area or after the implementation notes. It should link to:

- `plans/006-workflow-e2e-fixtures.md` for Step 22.
- `plans/010-reconcile-v1-roadmap-docs.md` for doc/status reconciliation.
- `plans/011-release-packaging-signing-notarization.md` for Steps 17-18.
- `plans/012-manual-release-publishing-trust-material.md` for Steps 19-20.
- `plans/013-final-v1-qa-approval-gate.md` for Steps 23-25.

Mention that Step 21 coverage work should be reconciled against existing unit/renderer tests and Plan 006 before adding any new plan.

**Verify**: `rg -n "plans/006-workflow-e2e-fixtures.md|plans/011-release-packaging-signing-notarization.md|plans/012-manual-release-publishing-trust-material.md|plans/013-final-v1-qa-approval-gate.md" docs/v1-ready-to-market-plan.md` -> all four plan links appear.

### Step 3: Correct stale architecture build wording

In `docs/architecture.md`, update the build pipeline paragraph that currently says `pnpm build:mac` packages the local macOS arm64 app. Match the live README and packaging config:

- `pnpm build:mac` runs `pnpm build`, packages a Universal macOS app/DMG, and writes `dist/mac-universal/Cleanup Photos.app` plus `dist/Cleanup Photos-<version>-universal.dmg`.
- Unsigned local builds are default.
- Signed/notarized release builds require `MAC_NOTARIZE=1` and Apple credentials.

Do not duplicate the full README command block; link or summarize.

**Verify**: `rg -n "arm64 app" docs/architecture.md` -> no matches.

### Step 4: Reconcile go-to-market checklist with completed app features

In `docs/go-to-market-plan.md`, update the stale gap/TODO wording:

- Keep screenshots, release artifacts, external pricing/sales page, and optional privacy page as open if still not done.
- Remove or mark complete references to Help, Settings, auto-updates implementation, licensing implementation, and free-limit UX when the live app and `docs/v1-ready-to-market-plan.md` show they are implemented behind gates.
- Keep manual release approval and trust material open.

Do not turn optional product ideas into mandatory v1 scope unless `docs/v1-ready-to-market-plan.md` already requires them.

**Verify**: `rg -n "Help/shortcuts|auto-updates, licensing, and free-limit UX|Validate license on launch" docs/go-to-market-plan.md` -> no stale future-work matches unless intentionally reworded with current status.

### Step 5: Check README, glossary, and QA checklist for consistency

Review `README.md`, `docs/glossary.md`, and `docs/qa-checklist.md` for wording that conflicts with the updated v1 plan. Update only narrow inconsistencies:

- README "planned v1 work" should not claim already-implemented gated features are unimplemented.
- Glossary should keep `mac.notarize: false` framed as local-dev config, with the release path handled by the `afterSign` hook and `MAC_NOTARIZE=1`.
- QA checklist should keep manual verification open; do not check items off unless the verification has been run.

**Verify**: `rg -n "planned v1 work|mac.notarize|MAC_NOTARIZE|release publishing" README.md docs/glossary.md docs/qa-checklist.md` -> wording is current and non-contradictory.

### Step 6: Update the plan index

In `plans/README.md`, keep existing rows intact and add/update the row for this plan if it is not already present:

- Plan: `010-reconcile-v1-roadmap-docs.md`
- Finding: `V1 roadmap docs and interface status are stale`
- Priority: `P1`
- Effort: `S`
- Risk: `LOW`
- Status: `DONE` only if every verification command in this plan passed; otherwise `Planned` or `BLOCKED (...)`.

**Verify**: `rg -n "010-reconcile-v1-roadmap-docs" plans/README.md` -> one row.

## Test plan

This is a docs-only plan. No app tests are required unless the executor changes code, which is out of scope.

Required verification:

- `rg -n "arm64 app|Public interfaces to change|Help/shortcuts|auto-updates, licensing, and free-limit UX" README.md docs plans`
- `pnpm exec prettier --check docs/v1-ready-to-market-plan.md docs/architecture.md docs/go-to-market-plan.md docs/glossary.md README.md docs/qa-checklist.md plans/README.md`
- `git diff --check -- docs/v1-ready-to-market-plan.md docs/architecture.md docs/go-to-market-plan.md docs/glossary.md README.md docs/qa-checklist.md plans/README.md`

## Done criteria

- [ ] `docs/v1-ready-to-market-plan.md` separates implemented interfaces from remaining release work.
- [ ] `docs/v1-ready-to-market-plan.md` links to the concrete executor plans for remaining work.
- [ ] `docs/architecture.md` no longer says `pnpm build:mac` packages only an arm64 app.
- [ ] `docs/go-to-market-plan.md` no longer lists completed gated Help/licensing/update/free-limit implementation as future gaps.
- [ ] README, glossary, and QA checklist do not contradict the canonical v1 plan.
- [ ] `plans/README.md` has exactly one row for this plan and the status reflects reality.
- [ ] Markdown formatting and diff whitespace checks pass.

## STOP conditions

Stop and report back if:

- The live code does not contain one of the APIs currently marked implemented in `docs/v1-ready-to-market-plan.md`.
- Reconciling docs would require deciding a new product policy, pricing rule, or release channel.
- You find another document that contradicts the v1 plan but changing it would expand this plan beyond narrow status reconciliation.
- Any verification command fails twice after a reasonable docs-only correction.

## Maintenance notes

Keep `docs/v1-ready-to-market-plan.md` as the human roadmap and `plans/README.md` as the executor backlog. When a future plan lands, update both surfaces in the same pull request so status stays visible.
