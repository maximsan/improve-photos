# Improvement Plans

Generated on 2026-06-13 from audit commit `ca41862`.

Last reconciled on 2026-06-13 at `aa53149`.

These plans are implementation briefs for separate agents or future passes. They intentionally do not modify source code.

## Execution Order

| Plan                                                                                 | Finding                                                           | Priority | Effort | Risk | Status  | Notes                                                                                               |
| ------------------------------------------------------------------------------------ | ----------------------------------------------------------------- | -------- | ------ | ---- | ------- | --------------------------------------------------------------------------------------------------- |
| [001-organizer-partial-move-state.md](001-organizer-partial-move-state.md)           | #1 Organizer partial moves leave renderer state stale             | P1       | M      | MED  | DONE    | Implemented in `1862ad1` on branch `codex/001-organizer-partial-move-state`; verified at `aa53149`. |
| [002-dedup-cancel-result-race.md](002-dedup-cancel-result-race.md)                   | #2 Dedup cancel can still publish results                         | P1       | S      | LOW  | DONE    | Implemented in `aa53149` on branch `codex/002-dedup-cancel-result-race`; verified at `aa53149`.     |
| [003-preview-protocol-scan-scope-cache.md](003-preview-protocol-scan-scope-cache.md) | #3 Preview protocol keeps old scan roots and HEIC cache           | P1       | S      | MED  | Planned | No scoped drift since `ca41862`; still executable.                                                  |
| [004-release-notarization-fail-fast.md](004-release-notarization-fail-fast.md)       | #4 Release notarization can silently skip when explicitly enabled | P1       | S      | LOW  | Planned | Target release code unchanged; only unrelated `tests/unit` drift from Plan 001.                     |
| [005-encode-app-image-file-urls.md](005-encode-app-image-file-urls.md)               | #5 Thumbnail URLs break on filenames with `#` or `?`              | P2       | S      | LOW  | Planned | No scoped drift since `ca41862`; still executable.                                                  |
| [006-workflow-e2e-fixtures.md](006-workflow-e2e-fixtures.md)                         | #7 Workflow E2E coverage is shell-only                            | P2       | L      | MED  | Planned | No scoped drift since `ca41862`; still executable.                                                  |
| [007-keyboard-operable-photo-selection.md](007-keyboard-operable-photo-selection.md) | #8 Clickable photo tiles are not keyboard-operable                | P2       | M      | LOW  | Planned | Target UI code unchanged; only unrelated renderer-test drift from Plans 001 and 002.                |

## Dependency Notes

- Plans 003 through 005 are independent and can be implemented in any order; Plans 001 and 002 are complete.
- Plan 006 can be implemented independently, but it may be easier after Plan 005 because workflow smoke tests will exercise thumbnails. The organizer and dedup dependencies from Plans 001 and 002 are already done.
- Plan 007 is independent of the workflow test plan, but its accessibility improvements may make E2E selectors more stable.

## Reconcile Notes

- Verified DONE plans 001 and 002 at `aa53149`.
- Drift checks found no scoped drift for Plans 003, 005, and 006.
- Plan 004 drift is limited to `tests/unit/organizer.test.ts` from Plan 001; the notarization finding still exists.
- Plan 007 drift is limited to `tests/renderer/useOrganizerState.test.tsx` and `tests/renderer/useDedupState.test.tsx` from Plans 001 and 002; the mouse-only selection finding still exists.
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
