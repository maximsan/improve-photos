# Improvement Plans

Generated on 2026-06-13 from audit commit `ca41862`.

Last updated on 2026-06-20 at active checkout `ad5a56e`; DONE plans archived under `plans/archive/`.

These plans are implementation briefs for separate agents or future passes. They intentionally do not modify source code.

## Active Execution Order

| Plan                                                                                               | Finding                                                     | Priority | Effort | Risk | Status  | Notes                                                                                         |
| -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | -------- | ------ | ---- | ------- | --------------------------------------------------------------------------------------------- |
| [005-encode-app-image-file-urls.md](005-encode-app-image-file-urls.md)                             | #5 Thumbnail URLs break on filenames with `#` or `?`        | P2       | S      | LOW  | Planned | Refreshed to `138a2d2`; `fileUrl` still inserts raw path data into `app://images` URLs.       |
| [006-workflow-e2e-fixtures.md](006-workflow-e2e-fixtures.md)                                       | #7 Workflow E2E coverage is shell-only                      | P2       | L      | MED  | Planned | Refreshed to `138a2d2`; E2E coverage remains shell/navigation-only.                           |
| [007-keyboard-operable-photo-selection.md](007-keyboard-operable-photo-selection.md)               | #8 Clickable photo tiles are not keyboard-operable          | P2       | M      | LOW  | Planned | Refreshed to `138a2d2`; target photo selection wrappers remain mouse-click driven.            |
| [010-reconcile-v1-roadmap-docs.md](010-reconcile-v1-roadmap-docs.md)                               | V1 roadmap docs and interface status are stale              | P1       | S      | LOW  | DONE    | Verified 2026-06-20; docs now align with current v1 status.                                   |
| [011-release-packaging-signing-notarization.md](011-release-packaging-signing-notarization.md)     | Finish macOS release packaging, signing, and notarization   | P1       | M      | MED  | Planned | Written at `ad5a56e`; completes v1 Steps 17-18 without publishing a release.                  |
| [012-manual-release-publishing-trust-material.md](012-manual-release-publishing-trust-material.md) | Add manual release publishing guardrails and trust material | P1       | M      | MED  | Planned | Written at `ad5a56e`; depends on Plan 011 and covers v1 Steps 19-20.                          |
| [013-final-v1-qa-approval-gate.md](013-final-v1-qa-approval-gate.md)                               | Run final v1 QA and approval gate                           | P1       | L      | MED  | Planned | Written at `ad5a56e`; final gate after workflow E2E, docs, packaging, and release guardrails. |

## Archived Done Plans

| Plan                                                                                                             | Finding                                                           | Implemented | Verified  | Notes                                                                             |
| ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ----------- | --------- | --------------------------------------------------------------------------------- |
| [001-organizer-partial-move-state.md](archive/001-organizer-partial-move-state.md)                               | #1 Organizer partial moves leave renderer state stale             | `1862ad1`   | `4276491` | Branch `codex/001-organizer-partial-move-state`.                                  |
| [002-dedup-cancel-result-race.md](archive/002-dedup-cancel-result-race.md)                                       | #2 Dedup cancel can still publish results                         | `aa53149`   | `4276491` | Branch `codex/002-dedup-cancel-result-race`.                                      |
| [003-preview-protocol-scan-scope-cache.md](archive/003-preview-protocol-scan-scope-cache.md)                     | #3 Preview protocol keeps old scan roots and HEIC cache           | `4276491`   | `138a2d2` | Branch `codex/003-preview-protocol-scan-scope-cache`.                             |
| [004-release-notarization-fail-fast.md](archive/004-release-notarization-fail-fast.md)                           | #4 Release notarization can silently skip when explicitly enabled | `d9490c0`   | `d9490c0` | Branch `codex/004-release-notarization-fail-fast`; not merged into active branch. |
| [008-defer-preview-root-until-scan-success.md](archive/008-defer-preview-root-until-scan-success.md)             | Branch audit: preview root changes before scan success            | `3c8c5af`   | `138a2d2` | Branch `codex/008-009-scan-dedup-races`.                                          |
| [009-invalidate-dedup-preflight-on-scan-revision.md](archive/009-invalidate-dedup-preflight-on-scan-revision.md) | Branch audit: dedup preflight can outlive a scan revision         | `138a2d2`   | `138a2d2` | Branch `codex/008-009-scan-dedup-races`.                                          |

## Dependency Notes

- Plans 001, 002, 003, 004, 008, and 009 are complete and archived under `plans/archive/`.
- Plan 005 is independent of the remaining planned work.
- Plan 006 can be implemented independently, but it may be easier after Plan 005 because workflow smoke tests will exercise thumbnails. The organizer and dedup dependencies from Plans 001 and 002 are already done.
- Plan 007 is independent of the workflow test plan, but its accessibility improvements may make E2E selectors more stable.
- Plan 010 should run before Plans 011-013 if the executor needs the docs to be current while working.
- Plan 011 should run before Plan 012 because release publishing/trust material needs the final packaging, signing, and notarization contract.
- Plan 012 should run before Plan 013 because final approval requires the publishing guardrails and trust-material checklist to exist.
- Plan 013 depends on Plans 006, 010, 011, and 012 because it is the final verification and approval gate rather than feature-development work.

## Reconcile Notes

- Verified DONE plans 001, 002, and 003 at `4276491` with their focused test commands.
- Refreshed planned Plans 004, 005, 006, and 007 to `4276491` so future executor drift checks start from the current implemented baseline.
- Added Plan 008 at `66b11b1` for the introduced branch regression where attempted scans can replace the allowed preview root before the renderer accepts new photos.
- Added Plan 009 at `66b11b1` for a pre-existing stale dedup preflight window in a touched hook.
- Reconciled on 2026-06-14 at `138a2d2`.
- Marked Plans 008 and 009 DONE after implementation on branch `codex/008-009-scan-dedup-races`.
- Verified Plans 008 and 009 with `pnpm typecheck`, `pnpm test -- tests/unit/scanner.test.ts tests/unit/localProtocol.test.ts tests/renderer/useDedupState.test.tsx`, and targeted ESLint for the touched scanner/dedup files.
- Refreshed planned Plans 004, 005, 006, and 007 to `138a2d2`; current drift from earlier baselines was either fixed by Plans 008/009 or unrelated to the remaining findings.
- Plan 005 finding still exists: `fileUrl` still inserts raw path data into `app://images` URLs.
- Plan 006 finding still exists: E2E coverage remains shell/navigation-only.
- Plan 007 finding still exists: target photo selection wrappers remain mouse-click driven.
- No plans were rejected or superseded.
- Marked Plan 004 DONE after implementation on branch `codex/004-release-notarization-fail-fast` at `d9490c0`.
- Verified Plan 004 with `pnpm typecheck`, `pnpm test -- tests/unit/notarize.test.ts`, `pnpm exec eslint build/notarize.cjs tests/unit/notarize.test.ts --no-cache`, and `node -p "typeof require('./build/notarize.cjs').default"` in `/private/tmp/cleanup-photos-004`.
- Reconciled on 2026-06-14 at active checkout `d220a43`.
- Verified active-checkout DONE plans 001, 002, 003, 008, and 009 with `pnpm typecheck` and `pnpm test -- tests/unit/organizer.test.ts tests/renderer/useOrganizerState.test.tsx tests/renderer/useDedupState.test.tsx tests/unit/ipc-parity.test.ts tests/unit/localProtocol.test.ts tests/unit/scanner.test.ts`.
- Verified Plan 004 remains DONE in `/private/tmp/cleanup-photos-004` with `pnpm test -- tests/unit/notarize.test.ts` and `pnpm exec eslint build/notarize.cjs tests/unit/notarize.test.ts --no-cache`.
- Plan 004 source changes are not present in active checkout `d220a43`; merge or cherry-pick `d9490c0` when you want that fix in this branch.
- Drift checks for planned Plans 005, 006, and 007 from `138a2d2` to `d220a43` produced no in-scope file changes, so those plans remain executable as written.
- Archived DONE plan files 001, 002, 003, 004, 008, and 009 under `plans/archive/`.
- Added Plans 010-013 on 2026-06-19 at active checkout `ad5a56e` after reviewing `docs/v1-ready-to-market-plan.md`.
- Plans 010-013 turn the remaining market-readiness roadmap into executor-grade work while leaving source and docs unchanged in the planning pass.
- Executed Plan 010 on 2026-06-20 in the active checkout. Verification passed for stale-text searches, Prettier markdown checks, and `git diff --check`; `docs/go-to-market-plan.md` and `docs/glossary.md` are still ignored by `.gitignore`, so their reconciliation is present on disk but not shown by normal git status.

## Findings Considered And Rejected

| Finding                                 | Decision                  | Reason                                                   |
| --------------------------------------- | ------------------------- | -------------------------------------------------------- |
| #6 Dependency/security audit advisories | Not planned in this batch | The user selected findings 1, 2, 3, 4, 5, 7, and 8 only. |

## Verification For This Planning Pass

The planning pass should leave only files under `plans/` changed. Verify with:

```bash
git status --short
```
