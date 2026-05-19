# Quality review — improvements plan

**Scope:** The **Quality** feature only (`src/renderer/src/features/QualityReview/`, `src/main/ipc/quality.ts`).  
**How to use:** Check items as you complete them.  
**Related:** [App shell plan](./app-shell-improvements-plan.md) · [Organizer plan](./organizer-improvements-plan.md) · [CODEBASE_REVIEW_AND_PLAN.md](../CODEBASE_REVIEW_AND_PLAN.md)

**Last reviewed against repo:** 2026-04-19

---

## Current behavior (summary)

The **Quality** tab ranks photos with a **Laplacian-based sharpness score** in the main process (`src/main/ipc/quality.ts`): for each file, `sharp` decodes a 512×512 greyscale thumbnail once, then compares channel stdev of the original buffer vs a lightly blurred version — **sharp images lose more “energy” when blurred** than already-soft ones. Concurrency: **4 workers** sharing a single path iterator. Failures emit **`score: -1`** (*Unable to Analyse* tier).

**UI flow**

1. **Idle** — `PhotosRequiredCallout` with primary action **Analyse Sharpness** (uses the full list from `PhotosContext`).
2. **Results (scoring)** — `handleScore` sets status to `results`, subscribes to `onQualityProgress` and `onQualityScoreItem`, then `getBlurScores`. While `isScoring` is true, `ResultsGrid` shows a **flat 4-column grid**; tiles without a score show a **shared global percent** from progress. Thumbnails use `useLazyRef` to defer loading. **No cancel** (unlike Dedup’s hash cancel).
3. **Results (tiered)** — Collapsible tier sections in `tiers.ts`. The first non-empty lowest-quality section is expanded (`ResultsGrid` / `isFirst`). Per tier: **Select all / Deselect all**. Footer: **Change photos**, **Re-analyse**, **Review & Trash** when `selected.size > 0`.
4. **Reviewing** — `QualityTrashReview` + `TrashReviewChrome` (thumbnails, path, `scoreLabel`, size). Back returns to `results`.
5. **Trashing / Done** — `ProgressView` → `TrashDonePanel` (“Analyze again”). **No** `confirmTrash` on this path (unlike Dedup’s primary trash entry).

**Header** — `qualityReviewSubtitle.ts`: in `results` / `reviewing`, shows `N photos` and optional `M selected to trash`.

**Known gaps (this feature only):** `handleConfirmTrash` does not remove paths from `PhotosContext` (see [app shell plan](./app-shell-improvements-plan.md) for the shared `photos` model). The `QualityStatus` union still includes `scoring`, but the app uses `results` + `isScoring` instead.

---

## Implementation checklist

- [ ] **Remove trashed photos from `PhotosContext`** when Quality trash completes (or call a shared helper from [app shell plan](./app-shell-improvements-plan.md)).
- [ ] **Add `confirmTrash`** before final trash (e.g. on **Review & Trash** confirm) for parity with Dedup.
- [ ] **Remove or use** unused **`scoring`** in `QualityStatus`.
- [ ] **Unify copy:** **Analyse** vs **Analyze** (button vs done panel) — one locale style.
- [ ] **Cancel in-flight analysis:** IPC + main cancellation (like `cancelHashes`) + **Cancel** in the UI during scoring.
- [ ] **Per-tile progress (optional):** Avoid implying per-file accuracy when showing one global `loadingPercent` on every loading tile; spinner or queue text instead.
- [ ] **Empty library:** If all photos are trashed, define `done` / `idle` messaging.
- [ ] **Tests:** Extend `tests/renderer/useQualityReviewState.test.tsx` (trash → `setPhotos`, confirm flow, cancel).

---

## Progress log (optional)

| Date | Note |
|------|------|
| 2026-04-19 | Split from a combined plan; this file is Quality-only. |
