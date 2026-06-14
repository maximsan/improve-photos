# Plan 002: Prevent Dedup Results After Cancel

## Executor Instructions

This plan is for a separate implementation pass. Work only on the files named here unless the drift check shows that the code moved.

Before editing, run:

```bash
git diff -- src/shared/ipc.ts src/main/ipc/dedup.ts src/preload/index.ts src/renderer/src/features/Dedup/hooks/useDedupState.ts tests/renderer/useDedupState.test.tsx tests/unit/ipc-parity.test.ts
git show --stat 1862ad1 -- src/shared/ipc.ts src/main/ipc/dedup.ts src/preload/index.ts src/renderer/src/features/Dedup/hooks/useDedupState.ts tests/renderer/useDedupState.test.tsx tests/unit/ipc-parity.test.ts
```

If these paths changed since commit `1862ad1`, reconcile the current behavior before applying the steps below.

## Status

| Field | Value |
| --- | --- |
| Priority | P1 |
| Effort | S |
| Risk | LOW |
| Depends on | None |
| Category | Bug |
| Planned at | `1862ad1` on 2026-06-13 |

## Why This Matters

The user can cancel duplicate analysis, but an in-flight hash computation can still resolve afterward. The hook then continues to compute duplicate groups and moves the UI into `results`, undoing the visible cancel.

## Current State

Key files and roles:

| Path | Role |
| --- | --- |
| `src/shared/ipc.ts` | Contains `ExecuteOrganizeResult` from Plan 001. `computeHashes` still returns `Promise<PhotoHashes>`. |
| `src/main/ipc/dedup.ts` | Stops workers when cancellation is set, logs `cancelled`, then returns the partial hashes. |
| `src/preload/index.ts` | Exposes `computeHashes`, `getDuplicateGroups`, and `cancelHashes`. |
| `src/renderer/src/features/Dedup/hooks/useDedupState.ts` | Awaits hashes, then always calls `getDuplicateGroups(hashes)`. |
| `tests/renderer/useDedupState.test.tsx` | Cancellation test uses a never-resolving promise, so it misses late resolution. |

Evidence at `1862ad1`:

```ts
// src/main/ipc/dedup.ts
while (queue.length > 0 && !controller.cancelled) {
  const p = queue.shift()!
  hashes[p] = await computePHash(p)
}
...
const status = controller.cancelled ? 'cancelled' : 'completed'
return hashes
```

```ts
// src/renderer/src/features/Dedup/hooks/useDedupState.ts
const hashes = await window.api.computeHashes(photos.map((p) => p.path))
const found = await window.api.getDuplicateGroups(hashes)
setGroups(found)
setStatus('results')
```

```ts
// tests/renderer/useDedupState.test.tsx
mockApi.computeHashes.mockReturnValue(new Promise(() => {}))
```

## Commands

| Purpose | Command |
| --- | --- |
| Type check | `pnpm typecheck` |
| Focused tests | `pnpm test -- tests/renderer/useDedupState.test.tsx tests/unit/ipc-parity.test.ts` |
| Targeted lint | `pnpm exec eslint src/shared/ipc.ts src/main/ipc/dedup.ts src/preload/index.ts src/renderer/src/features/Dedup/hooks/useDedupState.ts tests/renderer/useDedupState.test.tsx tests/unit/ipc-parity.test.ts --no-cache` |

## Scope

In scope:

- Return explicit cancellation status from hash computation.
- Guard renderer continuations from stale runs.
- Add regression tests for a cancelled analysis that resolves later.

Out of scope:

- Changing duplicate grouping algorithms.
- Changing pHash thresholds.
- Changing trash confirmation or trash behavior.

## Git Workflow

Use a branch named `codex/002-dedup-cancel-result-race`.

Use a conventional commit message such as:

```text
fix: ignore dedup results after cancellation
```

Do not push or open a PR unless the operator asks.

## Ordered Steps

1. Add a structured hash result.
   - In `src/shared/ipc.ts`, add:
     ```ts
     export interface ComputeHashesResult {
       hashes: PhotoHashes
       cancelled: boolean
     }
     ```
   - Change the renderer API type from `computeHashes: (...) => Promise<PhotoHashes>` to `Promise<ComputeHashesResult>`.
   - Update preload imports/signature if needed.
   - Verify: `pnpm typecheck`
   - Expected result: TypeScript points to call sites that still expect raw `PhotoHashes`.

2. Return cancellation status from the main process.
   - In `src/main/ipc/dedup.ts`, change the `COMPUTE_HASHES` handler return type to `Promise<ComputeHashesResult>`.
   - Return `{ hashes, cancelled: controller.cancelled }`.
   - Preserve progress events and the existing cancellation loop behavior.
   - Verify: `pnpm test -- tests/unit/ipc-parity.test.ts`
   - Expected result: IPC parity remains valid or shows only intentional type-level changes.

3. Add stale-run protection in the hook.
   - In `useDedupState.ts`, add a ref such as `activeAnalysisRunRef`.
   - Increment the run id in `handleAnalyze`, `handleCancel`, and `handleReset`.
   - Capture the current run id in `handleAnalyze`.
   - After `canProcessPhotoCount`, after `computeHashes`, and after `getDuplicateGroups`, return early if the run id is stale.
   - If `computeHashes` resolves with `cancelled: true`, leave status `idle`, clear progress, do not call `getDuplicateGroups`, and do not set an error.
   - Keep the unsubscribe cleanup in `finally`, but only clear current progress for the active run.
   - Verify: `pnpm test -- tests/renderer/useDedupState.test.tsx`
   - Expected result before test updates: old tests that expect raw hashes need updates.

4. Add cancellation race tests.
   - Update successful analysis tests to mock `computeHashes` as `{ hashes, cancelled: false }`.
   - Add a test where `computeHashes` resolves after `handleCancel`.
   - Assert:
     - `cancelHashes` was called.
     - status remains `idle`.
     - `getDuplicateGroups` is not called.
     - no stale groups are set.
   - Add a test where main returns `{ hashes: partial, cancelled: true }` without explicit hook cancel.
   - Verify: `pnpm test -- tests/renderer/useDedupState.test.tsx`
   - Expected result: focused dedup hook tests pass.

5. Run final checks.
   - `pnpm typecheck`
   - `pnpm exec eslint src/shared/ipc.ts src/main/ipc/dedup.ts src/preload/index.ts src/renderer/src/features/Dedup/hooks/useDedupState.ts tests/renderer/useDedupState.test.tsx tests/unit/ipc-parity.test.ts --no-cache`
   - Expected result: typecheck passes; targeted lint reports no errors.

## Done Criteria

- Cancelled hash runs cannot publish groups to the UI.
- The main IPC result includes `cancelled`.
- The hook ignores stale async continuations.
- Regression tests cover late resolution after cancel.
- Focused tests, typecheck, and targeted lint pass.

## STOP Conditions

- Stop if a broader async task orchestration helper already exists and should be reused.
- Stop if the current branch has already changed `computeHashes` to a different structured result.
- Stop if preserving partial hashes after cancellation is now a product requirement.

## Maintenance Notes

Prefer a local hook run id over a global cancellation singleton in the renderer. It protects both user-triggered cancel and scan-revision resets.
