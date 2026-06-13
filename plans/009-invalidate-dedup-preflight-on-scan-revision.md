# Plan 009: Invalidate Dedup Preflight When Scan Revision Changes

## Executor Instructions

This plan is for a separate implementation pass. Work only on the files named here unless the drift check shows that the code moved.

Before editing, run:

```bash
git diff --stat 66b11b1..HEAD -- src/renderer/src/features/Dedup/hooks/useDedupState.ts tests/renderer/useDedupState.test.tsx .skills/react-component-architecture/SKILL.md AGENTS.md CLAUDE.md
```

If either dedup file changed since commit `66b11b1`, compare the current code against the excerpts below before proceeding. If the hook no longer awaits `canProcessPhotoCount` before changing status away from `idle`, stop and report that this plan is stale.

## Status

| Field | Value |
| --- | --- |
| Priority | P2 |
| Effort | S |
| Risk | LOW |
| Depends on | None |
| Category | Bug |
| Planned at | `66b11b1` on 2026-06-13 |

## Why This Matters

The dedup hook already invalidates stale analysis runs after cancel/reset, but a scan change during the entitlement preflight can slip through while the UI status is still `idle`. In that window, the scan revision effect records the new revision but does not call `handleReset`, so the old `handleAnalyze` run can continue into hashing and publish duplicate groups for photos from the previous scan. This was not introduced by the preview protocol branch, but it lives in a touched hook and is a close relative of the already-fixed dedup cancellation race.

## Current State

Key files and roles:

| Path | Role |
| --- | --- |
| `src/renderer/src/features/Dedup/hooks/useDedupState.ts` | Dedup workflow state hook; owns async analysis run invalidation. |
| `tests/renderer/useDedupState.test.tsx` | Hook tests using `PhotosContext` and mocked `window.api`. |
| `.skills/react-component-architecture/SKILL.md` | Repo-local React architecture rules; read before editing this hook. |
| `AGENTS.md` and `CLAUDE.md` | Require `react-component-architecture` first, then external React performance rules for React work. |

Evidence at `66b11b1`:

```ts
// src/renderer/src/features/Dedup/hooks/useDedupState.ts:40-49
useEffect(() => {
  if (lastRevisionRef.current === scanRevision) {
    return
  }
  lastRevisionRef.current = scanRevision
  if (status !== 'idle') {
    handleReset()
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [scanRevision])
```

```ts
// src/renderer/src/features/Dedup/hooks/useDedupState.ts:51-67
async function handleAnalyze(): Promise<void> {
  const analysisRunId = activeAnalysisRunRef.current + 1
  activeAnalysisRunRef.current = analysisRunId
  setError(null)
  setProgress(null)

  const entitlement = await window.api.canProcessPhotoCount(photos.length)
  if (activeAnalysisRunRef.current !== analysisRunId) {
    return
  }
  if (!entitlement.allowed) {
    setError(entitlement.reason ?? 'Photo limit exceeded')
    setStatus('idle')
    return
  }

  setStatus('computing')
```

```ts
// src/renderer/src/features/Dedup/hooks/useDedupState.ts:172-179
function handleReset(): void {
  activeAnalysisRunRef.current++
  setStatus('idle')
  setGroups([])
  clearTrash()
  setError(null)
  setProgress(null)
}
```

The current test wrapper hard-codes `scanRevision: 0`, so hook tests cannot reproduce scan-revision drift:

```tsx
// tests/renderer/useDedupState.test.tsx:39-55
function wrapper({ children }: { children: ReactNode }): ReactElement {
  return createElement(
    PhotosContext.Provider,
    {
      value: {
        photos: [],
        scanRoot: null,
        scanRevision: 0,
        setPhotos: vi.fn(),
        setScanRoot: vi.fn(),
        removePhotosByPath,
        bumpScanRevision: vi.fn()
      }
    },
    children
  )
}
```

Use `tests/renderer/useOrganizerState.test.tsx:58-75` as the local pattern for a wrapper factory that accepts a scan revision.

Repo conventions to follow:

- React hook changes must honor `.skills/react-component-architecture/SKILL.md`.
- `AGENTS.md` and `CLAUDE.md` require applying `react-component-architecture` first, then external React performance rules when modifying React feature files.
- Keep hook logic readable; extract tiny named helpers rather than duplicating reset logic.

## Commands

| Purpose | Command |
| --- | --- |
| Type check | `pnpm typecheck` |
| Focused tests | `pnpm test -- tests/renderer/useDedupState.test.tsx` |
| Targeted lint | `pnpm exec eslint src/renderer/src/features/Dedup/hooks/useDedupState.ts tests/renderer/useDedupState.test.tsx --no-cache` |

## Suggested Executor Toolkit

- Read `.skills/react-component-architecture/SKILL.md` before editing `useDedupState.ts`.
- Apply the external Vercel React best-practices/performance rules if available in the executor environment.
- This is hook state orchestration, not UI work; do not split files unless the live code has grown enough that the repo-local React rules require it.

## Scope

In scope:

- Invalidate the active dedup analysis run on every `scanRevision` change, even when `status` is still `idle`.
- Keep visible reset behavior the same: only clear groups/trash/error/progress on scan revision changes when the dedup UI is not idle.
- Add a regression test for scan revision changing while `canProcessPhotoCount` is pending.
- Adjust the test wrapper so dedup tests can supply dynamic scan revisions.

Out of scope:

- Changing dedup hashing or duplicate grouping algorithms.
- Changing scan state ownership in `PhotosContext`.
- Changing trash confirmation, trash execution, or organizer behavior.
- Adding a shared async-task abstraction across hooks.

## Git Workflow

Use a branch named `codex/009-invalidate-dedup-preflight-on-scan-revision`.

Use a conventional commit message such as:

```text
fix: ignore dedup preflight after scan changes
```

Do not push or open a PR unless the operator asks.

## Ordered Steps

### Step 1: Refactor reset logic inside the hook

In `src/renderer/src/features/Dedup/hooks/useDedupState.ts`, keep the hook API unchanged.

Extract a small internal helper for the visible reset state so the scan-revision effect does not need to call `handleReset` after it manually invalidates the run. The target shape is:

```ts
function resetAnalysisState(): void {
  setStatus('idle')
  setGroups([])
  clearTrash()
  setError(null)
  setProgress(null)
}

function handleReset(): void {
  activeAnalysisRunRef.current++
  resetAnalysisState()
}
```

Do not move logic into JSX; this is a hook-only change.

Verify:

```bash
pnpm test -- tests/renderer/useDedupState.test.tsx
```

Expected result: existing dedup hook tests still pass.

### Step 2: Invalidate runs on every scan revision change

Update the `useEffect` that watches `scanRevision`:

- If the revision did not change, return as it does today.
- When the revision changed, set `lastRevisionRef.current = scanRevision`.
- Increment `activeAnalysisRunRef.current` immediately, even when `status === 'idle'`.
- If `status !== 'idle'`, call `resetAnalysisState()` so the visible UI clears as it does today.
- Keep the existing `react-hooks/exhaustive-deps` suppression only if it remains necessary, and do not broaden it to unrelated rules.

The intended behavior is that a pending `handleAnalyze` call becomes stale after a scan revision change before it can call `computeHashes`.

Verify:

```bash
pnpm test -- tests/renderer/useDedupState.test.tsx
```

Expected result: existing tests still pass.

### Step 3: Make the hook test wrapper revision-aware

In `tests/renderer/useDedupState.test.tsx`, replace the fixed `wrapper` with a factory or dynamic wrapper that can provide different `scanRevision` values.

One acceptable pattern is:

```tsx
function makeWrapper(getScanRevision = () => 0) {
  return function wrapper({ children }: { children: ReactNode }): ReactElement {
    return createElement(
      PhotosContext.Provider,
      {
        value: {
          photos: [],
          scanRoot: null,
          scanRevision: getScanRevision(),
          setPhotos: vi.fn(),
          setScanRoot: vi.fn(),
          removePhotosByPath,
          bumpScanRevision: vi.fn()
        }
      },
      children
    )
  }
}
```

Then update existing `renderHook` calls from `{ wrapper }` to `{ wrapper: makeWrapper() }`.

Verify:

```bash
pnpm test -- tests/renderer/useDedupState.test.tsx
```

Expected result: all existing tests still pass after the wrapper update.

### Step 4: Add the preflight stale-run regression test

In `tests/renderer/useDedupState.test.tsx`, add a test modeled after `handleCancel prevents late hash results from publishing groups`.

Test shape:

1. Create `const entitlementRun = createDeferred<{ allowed: true; photoLimit: number; reason: null }>()` or import the exact shared entitlement type if one exists.
2. Mock `mockApi.canProcessPhotoCount` to return `entitlementRun.promise`.
3. Mock `computeHashes` and `getDuplicateGroups` with normal success values.
4. Use a dynamic wrapper:
   ```ts
   let scanRevision = 0
   const dynamicWrapper = makeWrapper(() => scanRevision)
   const { result, rerender } = renderHook(() => useDedupState(PHOTOS), {
     wrapper: dynamicWrapper
   })
   ```
5. Start `handleAnalyze()` and allow it to reach the pending entitlement await.
6. Set `scanRevision = 1` and call `rerender()` inside `act`.
7. Resolve the entitlement as allowed and await the original analyze promise.
8. Assert:
   - `mockApi.computeHashes` was not called.
   - `mockApi.getDuplicateGroups` was not called.
   - `result.current.status` is still `idle`.
   - `result.current.groups` is still `[]`.

Verify:

```bash
pnpm test -- tests/renderer/useDedupState.test.tsx
```

Expected result: the new regression test fails before Step 2 and passes after Step 2.

### Step 5: Run final checks

Run:

```bash
pnpm typecheck
pnpm test -- tests/renderer/useDedupState.test.tsx
pnpm exec eslint src/renderer/src/features/Dedup/hooks/useDedupState.ts tests/renderer/useDedupState.test.tsx --no-cache
```

Expected result: all commands exit 0.

## Test Plan

- Preserve existing dedup hook tests.
- Add one focused regression test for scan revision changing while entitlement preflight is pending.
- The regression must prove stale preflight does not call `computeHashes` or publish duplicate groups.

## Done Criteria

- Any scan revision change invalidates the current dedup analysis run id.
- Non-idle dedup UI still resets on scan revision changes.
- Idle dedup UI does not visibly reset, but pending entitlement continuations are ignored.
- New regression test exists and passes.
- `pnpm typecheck` exits 0.
- `pnpm test -- tests/renderer/useDedupState.test.tsx` exits 0.
- Targeted ESLint exits 0 for the files listed above.
- No files outside the in-scope list are modified except `plans/README.md` if this plan's status is updated by the executor.

## STOP Conditions

Stop and report back if:

- `scanRevision` is no longer available through `usePhotos()`.
- A broader async run/cancellation helper already exists and should own this behavior.
- Product requirements now say dedup analysis should keep processing old photos after a new scan starts.
- Fixing the issue requires changing `PhotosContext` or scanner state ownership.

## Maintenance Notes

The dedup hook uses a local run id to reject stale async continuations. Future awaits added to `handleAnalyze` should check `activeAnalysisRunRef.current` before mutating state, especially before publishing groups or errors.
