# Plan 007: Make Photo Selection Keyboard Operable

## Executor Instructions

This plan is for a separate implementation pass. Work only on the files named here unless the drift check shows that the code moved.

Because this plan edits React UI, apply these in order before coding:

1. `.skills/react-component-architecture/SKILL.md`
2. External React performance rules from the Vercel React best-practices skill

Before editing, run:

```bash
git diff -- src/renderer/src/features/Dedup/components/PhotoCard.tsx src/renderer/src/features/Dedup/components/SelectionRow.tsx src/renderer/src/features/Dedup/components/PhotoThumbnail.tsx src/renderer/src/features/QualityReview/components/PhotoTile.tsx src/renderer/src/features/QualityReview/components/TierSection.tsx src/renderer/src/components/TrashOverlay.tsx tests/renderer
git show --stat 4276491 -- src/renderer/src/features/Dedup/components/PhotoCard.tsx src/renderer/src/features/Dedup/components/SelectionRow.tsx src/renderer/src/features/Dedup/components/PhotoThumbnail.tsx src/renderer/src/features/QualityReview/components/PhotoTile.tsx src/renderer/src/features/QualityReview/components/TierSection.tsx src/renderer/src/components/TrashOverlay.tsx tests/renderer
```

If these paths changed since commit `4276491`, reconcile the current behavior before applying the steps below.

## Status

| Field      | Value                   |
| ---------- | ----------------------- |
| Priority   | P2                      |
| Effort     | M                       |
| Risk       | LOW                     |
| Depends on | None                    |
| Category   | Accessibility/Bug       |
| Planned at | `4276491` on 2026-06-13 |

## Why This Matters

Duplicate and quality review photo tiles are clickable with a mouse, but the primary selection action is not reachable by keyboard. Users navigating with Tab, Enter, or Space cannot perform the same cleanup workflow.

## Current State

Key files and roles:

| Path                                                                 | Role                                                                    |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `src/renderer/src/features/Dedup/components/PhotoCard.tsx`           | Clickable card wrapper toggles trash selection when not already marked. |
| `src/renderer/src/features/Dedup/components/SelectionRow.tsx`        | Clickable row only when already marked.                                 |
| `src/renderer/src/features/Dedup/components/PhotoThumbnail.tsx`      | Shows selected overlay.                                                 |
| `src/renderer/src/features/QualityReview/components/PhotoTile.tsx`   | Clickable quality tile toggles selection.                               |
| `src/renderer/src/components/TrashOverlay.tsx`                       | Clickable overlay action, currently a `div`.                            |
| `src/renderer/src/features/QualityReview/components/TierSection.tsx` | Contains select all and collapse buttons.                               |

Evidence at `4276491`:

```tsx
// PhotoCard.tsx
<div
  className="..."
  onClick={markedForTrash ? undefined : onToggle}
>
```

```tsx
// SelectionRow.tsx
<div className="px-3 pb-2.5 bg-white flex items-center gap-1.5" onClick={handleClick}>
```

```tsx
// PhotoTile.tsx
<div
  onClick={onToggle}
  className="..."
>
```

```tsx
// TrashOverlay.tsx
<div
  className="absolute inset-0 ..."
  onClick={(e) => { ... }}
>
```

`PhotoCard` and `PhotoTile` can contain `TrashOverlay`, so blindly converting the outer container to a `<button>` may create nested interactive controls. Avoid invalid nested buttons.

## Commands

| Purpose       | Command                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Type check    | `pnpm typecheck`                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Focused tests | `pnpm test -- tests/renderer/photoSelectionAccessibility.test.tsx`                                                                                                                                                                                                                                                                                                                                                                                    |
| Targeted lint | `pnpm exec eslint src/renderer/src/features/Dedup/components/PhotoCard.tsx src/renderer/src/features/Dedup/components/SelectionRow.tsx src/renderer/src/features/Dedup/components/PhotoThumbnail.tsx src/renderer/src/features/QualityReview/components/PhotoTile.tsx src/renderer/src/features/QualityReview/components/TierSection.tsx src/renderer/src/components/TrashOverlay.tsx tests/renderer/photoSelectionAccessibility.test.tsx --no-cache` |

If component tests are split by feature instead, adjust the focused test command to the actual new test paths.

## Scope

In scope:

- Make dedup and quality photo selection keyboard-operable.
- Use semantic buttons where they do not create nested interactive markup.
- Add tests for keyboard selection.
- Add missing `type="button"` to buttons touched in these components.

Out of scope:

- Redesigning the card layout.
- Changing duplicate or quality algorithms.
- Adding drag selection or multi-select shortcuts.

## Git Workflow

Use a branch named `codex/007-keyboard-operable-photo-selection`.

Use a conventional commit message such as:

```text
fix: make photo selection keyboard accessible
```

Do not push or open a PR unless the operator asks.

## Ordered Steps

1. Choose valid interaction structure.
   - Inspect the current rendered structure before editing.
   - Preferred direction:
     - Keep visual cards as non-interactive containers.
     - Put the selection action in an explicit child `<button type="button">` with accessible text.
     - Convert `TrashOverlay` to a real `<button type="button">` when it is not nested inside another button.
   - If preserving whole-card click is required, use `role="button"`, `tabIndex={0}`, `aria-pressed`, and a named `handleKeyDown` for Enter/Space only where a semantic `<button>` would create invalid nested controls.
   - Avoid nested ternaries and large inline handlers per `AGENTS.md`.
   - Verify: `pnpm typecheck`
   - Expected result: TypeScript catches handler type mismatches.

2. Update dedup selection.
   - In `SelectionRow.tsx`, replace the clickable `div` with a semantic control if possible:
     - `button type="button"`.
     - `aria-pressed={markedForTrash}`.
     - accessible name such as `Mark ${photoName} for trash` if the component receives the photo name.
   - If `SelectionRow` needs a name, update its props intentionally instead of using vague text.
   - In `PhotoCard.tsx`, remove outer click behavior if it conflicts with semantic controls, or keep it keyboard-enabled only if product needs whole-card click.
   - Extract named handlers from JSX.
   - Verify: `pnpm exec eslint src/renderer/src/features/Dedup/components/PhotoCard.tsx src/renderer/src/features/Dedup/components/SelectionRow.tsx --no-cache`
   - Expected result: no JSX accessibility or hook/style violations.

3. Update quality selection.
   - In `PhotoTile.tsx`, apply the same interaction pattern.
   - If a semantic card-level button would contain `TrashOverlay`, do not nest buttons. Use an explicit selection button or a role-based wrapper with keyboard handlers.
   - Keep loading overlay text from blocking interaction only while scoring if selection should be disabled during scoring.
   - Verify: `pnpm exec eslint src/renderer/src/features/QualityReview/components/PhotoTile.tsx --no-cache`
   - Expected result: no lint errors.

4. Update overlay and touched buttons.
   - In `TrashOverlay.tsx`, prefer a real `<button type="button">` for the overlay action.
   - Stop propagation in a named click handler.
   - Give it an accessible name matching the action:
     - with `onTrash`: `Move to Trash`.
     - without `onTrash`: `Keep photo`.
   - In `TierSection.tsx`, add `type="button"` to `Select all` and collapse buttons if touched.
   - Verify: `pnpm exec eslint src/renderer/src/components/TrashOverlay.tsx src/renderer/src/features/QualityReview/components/TierSection.tsx --no-cache`
   - Expected result: no lint errors.

5. Add keyboard tests.
   - Add `tests/renderer/photoSelectionAccessibility.test.tsx` or colocate feature tests if a pattern already exists.
   - Use Testing Library and `@testing-library/user-event`.
   - Cover:
     - Dedup selection control receives focus and toggles with Enter.
     - Dedup selection control toggles with Space.
     - Quality selection control receives focus and toggles with Enter or Space.
     - Overlay control is keyboard-operable when a photo is selected.
   - Prefer role/name queries over test IDs.
   - Verify: `pnpm test -- tests/renderer/photoSelectionAccessibility.test.tsx`
   - Expected result: keyboard behavior is proven.

6. Run final checks.
   - `pnpm typecheck`
   - `pnpm test -- tests/renderer/photoSelectionAccessibility.test.tsx`
   - `pnpm exec eslint src/renderer/src/features/Dedup/components/PhotoCard.tsx src/renderer/src/features/Dedup/components/SelectionRow.tsx src/renderer/src/features/Dedup/components/PhotoThumbnail.tsx src/renderer/src/features/QualityReview/components/PhotoTile.tsx src/renderer/src/features/QualityReview/components/TierSection.tsx src/renderer/src/components/TrashOverlay.tsx tests/renderer/photoSelectionAccessibility.test.tsx --no-cache`
   - Expected result: all focused checks pass.

## Done Criteria

- Mouse behavior still works.
- Keyboard users can select and deselect photos in duplicate and quality review.
- Interactive controls have accessible names.
- No invalid nested buttons are introduced.
- Focused tests, typecheck, and targeted lint pass.

## STOP Conditions

- Stop if design requires whole-card click and nested overlay controls cannot be represented with valid semantic HTML.
- Stop if accessible names cannot be made stable without changing visible copy or component APIs beyond this scope.
- Stop if existing tests depend on click events bubbling from old wrapper divs; update them only after confirming product behavior.

## Maintenance Notes

Prefer explicit controls over broad clickable containers for review workflows. They are easier to test, describe, and operate with assistive technology.
