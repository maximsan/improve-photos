# Improvement Plans

Generated on 2026-06-13 from audit commit `ca41862`.

These plans are implementation briefs for separate agents or future passes. They intentionally do not modify source code.

## Execution Order

| Plan | Finding | Priority | Effort | Risk | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| [001-organizer-partial-move-state.md](001-organizer-partial-move-state.md) | #1 Organizer partial moves leave renderer state stale | P1 | M | MED | DONE | Implemented in `1862ad1` on branch `codex/001-organizer-partial-move-state`. |
| [002-dedup-cancel-result-race.md](002-dedup-cancel-result-race.md) | #2 Dedup cancel can still publish results | P1 | S | LOW | Planned | Independent bug fix. |
| [003-preview-protocol-scan-scope-cache.md](003-preview-protocol-scan-scope-cache.md) | #3 Preview protocol keeps old scan roots and HEIC cache | P1 | S | MED | Planned | Independent security/perf fix. |
| [004-release-notarization-fail-fast.md](004-release-notarization-fail-fast.md) | #4 Release notarization can silently skip when explicitly enabled | P1 | S | LOW | Planned | Independent release hardening. |
| [005-encode-app-image-file-urls.md](005-encode-app-image-file-urls.md) | #5 Thumbnail URLs break on filenames with `#` or `?` | P2 | S | LOW | Planned | Independent preview URL fix. |
| [006-workflow-e2e-fixtures.md](006-workflow-e2e-fixtures.md) | #7 Workflow E2E coverage is shell-only | P2 | L | MED | Planned | Broader test investment; can run after bug fixes. |
| [007-keyboard-operable-photo-selection.md](007-keyboard-operable-photo-selection.md) | #8 Clickable photo tiles are not keyboard-operable | P2 | M | LOW | Planned | React UI change; apply React architecture and Vercel React rules first. |

## Dependency Notes

- Plans 001 through 005 are independent and can be implemented in any order.
- Plan 006 can be implemented independently, but it may be easier after Plans 001, 002, and 005 because workflow smoke tests will exercise organizer, dedup, and thumbnails.
- Plan 007 is independent of the workflow test plan, but its accessibility improvements may make E2E selectors more stable.

## Findings Considered And Rejected

| Finding | Decision | Reason |
| --- | --- | --- |
| #6 Dependency/security audit advisories | Not planned in this batch | The user selected findings 1, 2, 3, 4, 5, 7, and 8 only. |

## Verification For This Planning Pass

The planning pass should leave only files under `plans/` changed. Verify with:

```bash
git status --short
```
