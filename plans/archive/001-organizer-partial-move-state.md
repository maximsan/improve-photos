# Plan 001: Keep Organizer State Correct After Partial Moves

## Executor Instructions

This plan is for a separate implementation pass. Work only on the files named here unless the drift check shows that the code moved.

Before editing, run:

```bash
git diff -- src/shared/ipc.ts src/main/ipc/organizer.ts src/preload/index.ts src/renderer/src/features/Organizer/hooks/useOrganizerState.ts tests/unit/organizer.test.ts tests/renderer/useOrganizerState.test.tsx
git show --stat ca41862 -- src/shared/ipc.ts src/main/ipc/organizer.ts src/preload/index.ts src/renderer/src/features/Organizer/hooks/useOrganizerState.ts tests/unit/organizer.test.ts tests/renderer/useOrganizerState.test.tsx
```

If these paths changed since commit `ca41862`, reconcile the current behavior before applying the steps below.

## Status

| Field | Value |
| --- | --- |
| Priority | P1 |
| Effort | M |
| Risk | MED |
| Depends on | None |
| Category | Bug |
| Planned at | `ca41862` on 2026-06-13 |

## Why This Matters

`EXECUTE_ORGANIZE` can move some files successfully and then throw because later files failed. The renderer treats any thrown error as a total failure, so photos that already moved remain displayed at their old paths and the undo state is never recorded. This creates stale UI state and can make recovery unclear.

## Current State

Key files and roles:

| Path | Role |
| --- | --- |
| `src/shared/ipc.ts` | Defines `MoveOperation` and the renderer API contract. `executeOrganize` currently returns `Promise<void>`. |
| `src/main/ipc/organizer.ts` | Performs the actual rename operations and updates the main-process photo cache for successful moves. |
| `src/preload/index.ts` | Exposes `executeOrganize` to the renderer. |
| `src/renderer/src/features/Organizer/hooks/useOrganizerState.ts` | Applies optimistic renderer state only after `executeOrganize` resolves. |
| `tests/unit/organizer.test.ts` | Covers proposal and all-failure paths, but not partial success. |
| `tests/renderer/useOrganizerState.test.tsx` | Covers successful and failed organize flows, but not mixed outcomes. |

Evidence at `ca41862`:

```ts
// src/shared/ipc.ts
executeOrganize: (ops: MoveOperation[]) => Promise<void>
```

```ts
// src/main/ipc/organizer.ts
const movedPaths = new Map<string, string>()
const errors: string[] = []
...
await rename(op.photo.path, op.targetPath)
movedPaths.set(op.photo.path, op.targetPath)
...
if (errors.length > 0) {
  throw new Error(`${errors.length} of ${pending.length} file(s) could not be moved:\n${errors.join('\n')}`)
}
```

```ts
// src/renderer/src/features/Organizer/hooks/useOrganizerState.ts
await window.api.executeOrganize(ops)
const movedPairs = ops
  .filter((op) => !op.conflict)
  .map((op) => ({ from: op.photo.path, to: op.targetPath }))
```

## Commands

| Purpose | Command |
| --- | --- |
| Type check | `pnpm typecheck` |
| Focused tests | `pnpm test -- tests/unit/organizer.test.ts tests/renderer/useOrganizerState.test.tsx` |
| Targeted lint | `pnpm exec eslint src/shared/ipc.ts src/main/ipc/organizer.ts src/preload/index.ts src/renderer/src/features/Organizer/hooks/useOrganizerState.ts tests/unit/organizer.test.ts tests/renderer/useOrganizerState.test.tsx --no-cache` |

Avoid `pnpm lint` for this change unless you intentionally want to write `.eslintcache`.

## Scope

In scope:

- Add a structured organize result type.
- Return moved file pairs and per-file errors from the main process.
- Update renderer state for moves that actually succeeded.
- Preserve clear error feedback for failed moves.
- Add unit and hook tests for partial success.

Out of scope:

- Changing organizer preview generation.
- Redesigning Organizer UI.
- Reworking file-system move mechanics beyond returning structured results.

## Git Workflow

Use a branch named `codex/001-organizer-partial-move-state`.

Use a conventional commit message such as:

```text
fix: preserve organizer state after partial moves
```

Do not push or open a PR unless the operator asks.

## Ordered Steps

1. Define the result contract.
   - In `src/shared/ipc.ts`, add an exported type like:
     ```ts
     export interface ExecuteOrganizeResult {
       movedPairs: Array<{ from: string; to: string }>
       errors: string[]
       requestedCount: number
       movedCount: number
     }
     ```
   - Change `executeOrganize` from `Promise<void>` to `Promise<ExecuteOrganizeResult>`.
   - Update `src/preload/index.ts` only if TypeScript needs the exported type imported or the function signature adjusted.
   - Verify: `pnpm typecheck`
   - Expected result: type errors identify every caller that still assumes `void`.

2. Return partial results from the main organizer handler.
   - In `src/main/ipc/organizer.ts`, keep filtering out conflict operations.
   - Continue collecting `movedPaths` and `errors`.
   - Continue updating the in-memory cache for successfully moved files.
   - Do not throw for normal per-file failures after the loop. Return the structured result instead.
   - Keep unexpected setup errors throwing naturally if they happen before the batch result exists.
   - Verify: `pnpm test -- tests/unit/organizer.test.ts`
   - Expected result before test updates: existing failure test may fail because the handler now returns `errors` instead of rejecting.

3. Update renderer state from actual moved pairs.
   - In `useOrganizerState.ts`, use `const result = await window.api.executeOrganize(ops)`.
   - Build the path map from `result.movedPairs`, not from requested operations.
   - If `result.movedPairs.length > 0`, update `movedCount`, `movedPairs`, `photos`, and status using those pairs.
   - If `result.errors.length > 0`, set `error` to a clear message containing the failed count and details.
   - Recommended state behavior:
     - Some moved, some failed: status `done`, undo available for moved files, error visible.
     - None moved, one or more failed: status `preview`, error visible, no undo state.
   - Verify: `pnpm test -- tests/renderer/useOrganizerState.test.tsx`
   - Expected result before test updates: assertions that assumed rejected calls may need rewriting.

4. Add focused tests.
   - In `tests/unit/organizer.test.ts`, replace the all-failure rejection expectation with a structured-result assertion.
   - Add a partial-success test where one `rename` succeeds and one fails. Assert:
     - `movedPairs` contains only the successful move.
     - `errors` contains the failed path.
     - successful cache entries are updated.
   - In `tests/renderer/useOrganizerState.test.tsx`, add:
     - partial success updates moved photo paths and keeps undo data.
     - zero moved plus errors stays in preview and does not mutate photos.
   - Verify: `pnpm test -- tests/unit/organizer.test.ts tests/renderer/useOrganizerState.test.tsx`
   - Expected result: all focused organizer tests pass.

5. Run final checks.
   - `pnpm typecheck`
   - `pnpm exec eslint src/shared/ipc.ts src/main/ipc/organizer.ts src/preload/index.ts src/renderer/src/features/Organizer/hooks/useOrganizerState.ts tests/unit/organizer.test.ts tests/renderer/useOrganizerState.test.tsx --no-cache`
   - Expected result: typecheck passes; targeted lint reports no errors.

## Done Criteria

- Main organizer handler reports moved pairs and errors in one result.
- Renderer state reflects only actual successful moves.
- Partial-success and all-failure behaviors are tested.
- Undo remains available for the files that were moved.
- Focused tests, typecheck, and targeted lint pass.

## STOP Conditions

- Stop if a current branch already changed the organizer IPC contract differently.
- Stop if partial failure needs a product decision about whether to keep the user in preview or done state.
- Stop if tests reveal cache and renderer state can diverge in another move path not covered here.

## Maintenance Notes

Keep `ExecuteOrganizeResult` small and transport-friendly. Avoid putting `PhotoRecord` objects in the result; paths are enough and reduce IPC payload size.
