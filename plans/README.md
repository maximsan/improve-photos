# Improvement Plans

Generated on 2026-06-13 from audit commit `ca41862`.

Last updated on 2026-06-14 at `138a2d2`.

These plans are implementation briefs for separate agents or future passes. They intentionally do not modify source code.

## Execution Order

| Plan                                                                                 | Finding                                                           | Priority | Effort | Risk | Status  | Notes                                                                                                    |
| ------------------------------------------------------------------------------------ | ----------------------------------------------------------------- | -------- | ------ | ---- | ------- | -------------------------------------------------------------------------------------------------------- |
| [001-organizer-partial-move-state.md](001-organizer-partial-move-state.md)           | #1 Organizer partial moves leave renderer state stale             | P1       | M      | MED  | DONE    | Implemented in `1862ad1` on branch `codex/001-organizer-partial-move-state`; verified at `4276491`.      |
| [002-dedup-cancel-result-race.md](002-dedup-cancel-result-race.md)                   | #2 Dedup cancel can still publish results                         | P1       | S      | LOW  | DONE    | Implemented in `aa53149` on branch `codex/002-dedup-cancel-result-race`; verified at `4276491`.          |
| [003-preview-protocol-scan-scope-cache.md](003-preview-protocol-scan-scope-cache.md) | #3 Preview protocol keeps old scan roots and HEIC cache           | P1       | S      | MED  | DONE    | Implemented in `4276491` on branch `codex/003-preview-protocol-scan-scope-cache`; verified at `138a2d2`. |
| [008-defer-preview-root-until-scan-success.md](008-defer-preview-root-until-scan-success.md) | Branch audit: preview root changes before scan success      | P1       | S      | LOW  | DONE    | Implemented in `3c8c5af` on branch `codex/008-009-scan-dedup-races`; verified at `138a2d2`.             |
| [009-invalidate-dedup-preflight-on-scan-revision.md](009-invalidate-dedup-preflight-on-scan-revision.md) | Branch audit: dedup preflight can outlive a scan revision | P2       | S      | LOW  | DONE    | Implemented in `138a2d2` on branch `codex/008-009-scan-dedup-races`; verified at `138a2d2`.             |
| [004-release-notarization-fail-fast.md](004-release-notarization-fail-fast.md)       | #4 Release notarization can silently skip when explicitly enabled | P1       | S      | LOW  | Planned | Refreshed to `138a2d2`; release code finding still exists and plan is executable.                        |
| [005-encode-app-image-file-urls.md](005-encode-app-image-file-urls.md)               | #5 Thumbnail URLs break on filenames with `#` or `?`              | P2       | S      | LOW  | Planned | Refreshed to `138a2d2`; `fileUrl` still inserts raw path data into `app://images` URLs.                  |
| [006-workflow-e2e-fixtures.md](006-workflow-e2e-fixtures.md)                         | #7 Workflow E2E coverage is shell-only                            | P2       | L      | MED  | Planned | Refreshed to `138a2d2`; E2E coverage remains shell/navigation-only.                                      |
| [007-keyboard-operable-photo-selection.md](007-keyboard-operable-photo-selection.md) | #8 Clickable photo tiles are not keyboard-operable                | P2       | M      | LOW  | Planned | Refreshed to `138a2d2`; target photo selection wrappers remain mouse-click driven.                       |

## Dependency Notes

- Plans 001, 002, 003, 008, and 009 are complete.
- Plans 004 and 005 are independent and can be implemented in any order.
- Plan 006 can be implemented independently, but it may be easier after Plan 005 because workflow smoke tests will exercise thumbnails. The organizer and dedup dependencies from Plans 001 and 002 are already done.
- Plan 007 is independent of the workflow test plan, but its accessibility improvements may make E2E selectors more stable.

## Reconcile Notes

- Verified DONE plans 001, 002, and 003 at `4276491` with their focused test commands.
- Refreshed planned Plans 004, 005, 006, and 007 to `4276491` so future executor drift checks start from the current implemented baseline.
- Added Plan 008 at `66b11b1` for the introduced branch regression where attempted scans can replace the allowed preview root before the renderer accepts new photos.
- Added Plan 009 at `66b11b1` for a pre-existing stale dedup preflight window in a touched hook.
- Reconciled on 2026-06-14 at `138a2d2`.
- Marked Plans 008 and 009 DONE after implementation on branch `codex/008-009-scan-dedup-races`.
- Verified Plans 008 and 009 with `pnpm typecheck`, `pnpm test -- tests/unit/scanner.test.ts tests/unit/localProtocol.test.ts tests/renderer/useDedupState.test.tsx`, and targeted ESLint for the touched scanner/dedup files.
- Refreshed planned Plans 004, 005, 006, and 007 to `138a2d2`; current drift from earlier baselines was either fixed by Plans 008/009 or unrelated to the remaining findings.
- Plan 004 finding still exists: `MAC_NOTARIZE=1` with missing credentials logs a skip and returns success.
- Plan 005 finding still exists: `fileUrl` still inserts raw path data into `app://images` URLs.
- Plan 006 finding still exists: E2E coverage remains shell/navigation-only.
- Plan 007 finding still exists: target photo selection wrappers remain mouse-click driven.
- No plans were rejected or superseded.

## Findings Considered And Rejected

| Finding                                 | Decision                  | Reason                                                   |
| --------------------------------------- | ------------------------- | -------------------------------------------------------- |
| #6 Dependency/security audit advisories | Not planned in this batch | The user selected findings 1, 2, 3, 4, 5, 7, and 8 only. |

## Verification For This Planning Pass

The planning pass should leave only files under `plans/` changed. Verify with:

```bash
git status --short
```
