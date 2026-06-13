# Plan 008: Defer Preview Root Replacement Until Scan Succeeds

## Executor Instructions

This plan is for a separate implementation pass. Work only on the files named here unless the drift check shows that the code moved.

Before editing, run:

```bash
git diff --stat 66b11b1..HEAD -- src/main/ipc/scanner.ts src/main/localProtocol.ts src/renderer/src/features/Scanner/hooks/useScannerState.ts tests/unit/scanner.test.ts tests/unit/localProtocol.test.ts
```

If any of these paths changed since commit `66b11b1`, compare the current code against the excerpts below before proceeding. If the scanner no longer replaces the preview root before entitlement and scan success are known, stop and report that this plan is stale.

## Status

| Field | Value |
| --- | --- |
| Priority | P1 |
| Effort | S |
| Risk | LOW |
| Depends on | Plan 003 already implemented |
| Category | Bug |
| Planned at | `66b11b1` on 2026-06-13 |

## Why This Matters

Plan 003 intentionally changed the preview protocol to allow only the latest scan root. The scanner now replaces that root before it knows the scan can actually publish new photos. If the user attempts a paid-limit scan or a scan that throws, the renderer keeps showing the previous accepted photo set, but `app://images` may only serve the newly attempted folder. That can break previews for the photos still visible in the UI. This is introduced by the Plan 003 branch because the old additive preview-root behavior did not remove the previous successful root.

## Current State

Key files and roles:

| Path | Role |
| --- | --- |
| `src/main/ipc/scanner.ts` | Main-process scan IPC handler; currently replaces preview root immediately. |
| `src/main/localProtocol.ts` | `setAllowedPreviewRoot` clears previous roots and the HEIC preview cache. |
| `src/renderer/src/features/Scanner/hooks/useScannerState.ts` | Renderer keeps old shared photos when scan returns a limit result or throws. |
| `tests/unit/scanner.test.ts` | Focused scanner IPC tests; add the regression assertions here. |
| `tests/unit/localProtocol.test.ts` | Existing coverage for replacing allowed roots; run it as a guard. |

Evidence at `66b11b1`:

```ts
// src/main/ipc/scanner.ts:125-140
ipcMain.handle(IPC.SCAN, async (event, folderPath: string): Promise<ScanResult> => {
  const controller = { cancelled: false }
  activeScanController = controller

  setAllowedPreviewRoot(folderPath)

  const paths = await walkDir(folderPath)
  const total = paths.length
  const entitlement = await canProcessPhotoCount(total)
  if (!entitlement.allowed) {
    activeScanController = null
    return {
      ok: false,
      limit: { photoCount: total, photoLimit: entitlement.photoLimit ?? FREE_PHOTO_LIMIT }
    }
  }
```

```ts
// src/main/localProtocol.ts:29-34
/** Call this when the user scans/selects a folder so the protocol may serve files from it. */
export function setAllowedPreviewRoot(dir: string): void {
  allowedRoots.clear()
  previewCache.clear()
  allowedRoots.add(path.resolve(dir))
}
```

```ts
// src/renderer/src/features/Scanner/hooks/useScannerState.ts:83-94
const result = await window.api.scan(path)
if (!result.ok) {
  setLimit(result.limit)
  setStatus('limit')
  return
}
applyScannedPhotos(result.photos, path)
} catch (err) {
  console.error('[scanner] scan failed', err)
  setError(toDisplayMessage(err))
  setStatus('idle')
}
```

The existing limit test stops before metadata reads, but it does not assert that preview-root state is preserved:

```ts
// tests/unit/scanner.test.ts:272-277
const result = (await handlers.get(IPC.SCAN)!(event, '/photos' as never)) as ScanResult

expect(result).toEqual({ ok: false, limit: { photoCount: 101, photoLimit: 100 } })
expect(stat).not.toHaveBeenCalled()
expect(event.sender.send).not.toHaveBeenCalled()
```

Repo conventions to follow:

- Main-process file access belongs in `src/main/`; renderer code talks through `window.api`.
- Use `path.resolve()` inside the protocol module, not in renderer code.
- Keep changes focused and add colocated Vitest coverage in `tests/unit/scanner.test.ts`.

## Commands

| Purpose | Command |
| --- | --- |
| Type check | `pnpm typecheck` |
| Focused tests | `pnpm test -- tests/unit/scanner.test.ts tests/unit/localProtocol.test.ts` |
| Targeted lint | `pnpm exec eslint src/main/ipc/scanner.ts tests/unit/scanner.test.ts tests/unit/localProtocol.test.ts --no-cache` |

## Scope

In scope:

- Move `setAllowedPreviewRoot(folderPath)` so it only runs for an accepted scan result.
- Preserve the previous allowed preview root when `SCAN` returns `{ ok: false, limit: ... }`.
- Preserve the previous allowed preview root when `walkDir(folderPath)` or later scan work throws.
- Add scanner IPC tests covering success, limit, and thrown scan paths.

Out of scope:

- Changing `setAllowedPreviewRoot` semantics in `src/main/localProtocol.ts`.
- Changing renderer scan state behavior.
- Changing licensing or entitlement rules.
- Redesigning preview URL generation or HEIC conversion caching.

## Git Workflow

Use a branch named `codex/008-defer-preview-root-until-scan-success`.

Use a conventional commit message such as:

```text
fix: keep preview root until scan succeeds
```

Do not push or open a PR unless the operator asks.

## Ordered Steps

### Step 1: Add scanner-level protocol assertions

In `tests/unit/scanner.test.ts`, mock the protocol module before importing the scanner:

```ts
vi.mock('../../src/main/localProtocol', () => ({
  setAllowedPreviewRoot: vi.fn()
}))
```

Then import the mocked function:

```ts
import { setAllowedPreviewRoot } from '../../src/main/localProtocol'
```

Use the existing `scanner IPC handlers` tests as the pattern. Add these assertions:

- In `emits scan progress for each processed photo`, assert successful scans call `setAllowedPreviewRoot('/photos')` once.
- In `returns a limit result before reading metadata when an unlicensed scan exceeds the free limit`, assert `setAllowedPreviewRoot` was not called.
- Add a new test where `readdir` rejects for `/blocked`, the scan promise rejects, and `setAllowedPreviewRoot` was not called.

Verify:

```bash
pnpm test -- tests/unit/scanner.test.ts
```

Expected result before the production fix: at least the limit-path assertion fails because the root is replaced too early.

### Step 2: Move preview-root replacement to the accepted-scan path

In `src/main/ipc/scanner.ts`, remove the early call at the start of the `IPC.SCAN` handler.

Call `setAllowedPreviewRoot(folderPath)` only after the scan has passed entitlement and completed its worker pass, immediately before publishing the new scanner cache and returning `ok: true`. The target shape is:

```ts
const chunks = await Promise.all(Array.from({ length: MAX_CONCURRENT }, worker))
const records = chunks.flat()

setAllowedPreviewRoot(folderPath)
photoCache = records.filter((r): r is PhotoRecord => r !== null)
activeScanController = null
```

This location intentionally still handles cancelled scans that return `{ ok: true, photos: [] }`, because the renderer treats that as the accepted current scan and updates `scanRoot`.

Verify:

```bash
pnpm test -- tests/unit/scanner.test.ts
```

Expected result: scanner tests pass, including the new limit and thrown-scan assertions.

### Step 3: Run the protocol regression guard

Run the existing protocol test suite to ensure Plan 003 behavior still holds: a successful root replacement must still clear old roots.

Verify:

```bash
pnpm test -- tests/unit/localProtocol.test.ts
```

Expected result: all local protocol tests pass, including `replaces the previous scan root when a new preview root is registered`.

### Step 4: Run final checks

Run:

```bash
pnpm typecheck
pnpm test -- tests/unit/scanner.test.ts tests/unit/localProtocol.test.ts
pnpm exec eslint src/main/ipc/scanner.ts tests/unit/scanner.test.ts tests/unit/localProtocol.test.ts --no-cache
```

Expected result: all commands exit 0.

## Test Plan

- Add scanner IPC coverage for successful scans calling `setAllowedPreviewRoot`.
- Extend the existing over-limit scanner test so limit results do not replace the preview root.
- Add a rejected directory-walk scanner test so thrown scans do not replace the preview root.
- Keep `tests/unit/localProtocol.test.ts` as the guard that root replacement still works after a successful scan registers a new root.

## Done Criteria

- `setAllowedPreviewRoot` is not called until the scan will return `ok: true`.
- Failed and over-limit scans leave the previously accepted protocol root untouched.
- Successful scans still register the new folder as the only allowed preview root.
- `pnpm typecheck` exits 0.
- `pnpm test -- tests/unit/scanner.test.ts tests/unit/localProtocol.test.ts` exits 0.
- Targeted ESLint exits 0 for the files listed above.
- No files outside the in-scope list are modified except `plans/README.md` if this plan's status is updated by the executor.

## STOP Conditions

Stop and report back if:

- `src/main/ipc/scanner.ts` no longer owns preview-root registration.
- The renderer has changed so limit or thrown scans also clear shared photos and scan root.
- The product now requires attempted scans to immediately revoke old previews before the scan succeeds.
- The fix appears to require changing `src/main/localProtocol.ts` semantics.

## Maintenance Notes

The preview protocol should track the last accepted scan, not the last attempted scan. If future work adds concurrent scans or multi-library support, this needs an explicit state model instead of relying on one process-global allowed root.
