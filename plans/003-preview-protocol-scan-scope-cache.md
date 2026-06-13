# Plan 003: Reset Preview Protocol Scope Per Scan

## Executor Instructions

This plan is for a separate implementation pass. Work only on the files named here unless the drift check shows that the code moved.

Before editing, run:

```bash
git diff -- src/main/localProtocol.ts src/main/ipc/scanner.ts tests/unit/localProtocol.test.ts tests/unit/scanner.test.ts
git show --stat ca41862 -- src/main/localProtocol.ts src/main/ipc/scanner.ts tests/unit/localProtocol.test.ts tests/unit/scanner.test.ts
```

If these paths changed since commit `ca41862`, reconcile the current behavior before applying the steps below.

## Status

| Field | Value |
| --- | --- |
| Priority | P1 |
| Effort | S |
| Risk | MED |
| Depends on | None |
| Category | Security/Performance |
| Planned at | `ca41862` on 2026-06-13 |

## Why This Matters

The custom `app://images` protocol keeps every scan root ever allowed during the app session. It also documents that the HEIC preview cache is cleared on new scans, but scanning never calls `clearPreviewCache`. A later scan can still serve files from older roots and can retain converted HEIC buffers longer than needed.

## Current State

Key files and roles:

| Path | Role |
| --- | --- |
| `src/main/localProtocol.ts` | Tracks allowed preview roots and the HEIC conversion cache. |
| `src/main/ipc/scanner.ts` | Registers the selected folder as preview-servable before scanning. |
| `tests/unit/localProtocol.test.ts` | Covers host validation, outside-root rejection, and allowed fetch. |
| `tests/unit/scanner.test.ts` | Scanner unit tests; update only if scanner import behavior changes. |

Evidence at `ca41862`:

```ts
// src/main/localProtocol.ts
const allowedRoots = new Set<string>()
...
export function clearPreviewCache(): void {
  previewCache.clear()
}
...
export function allowDirectory(dir: string): void {
  allowedRoots.add(dir)
}
```

```ts
// src/main/ipc/scanner.ts
allowDirectory(folderPath)
```

```ts
// src/main/localProtocol.ts
const isAllowed = [...allowedRoots].some((root) => filePath.startsWith(root + '/'))
```

Current production references to `clearPreviewCache`: none.

## Commands

| Purpose | Command |
| --- | --- |
| Type check | `pnpm typecheck` |
| Focused tests | `pnpm test -- tests/unit/localProtocol.test.ts tests/unit/scanner.test.ts` |
| Targeted lint | `pnpm exec eslint src/main/localProtocol.ts src/main/ipc/scanner.ts tests/unit/localProtocol.test.ts tests/unit/scanner.test.ts --no-cache` |

## Scope

In scope:

- Replace additive preview-root registration with per-scan registration.
- Clear HEIC preview cache whenever a new scan root is selected.
- Add regression tests proving old roots are no longer allowed.

Out of scope:

- Disk-backed HEIC cache.
- Thumbnail generation redesign.
- Renderer image loading changes.

## Git Workflow

Use a branch named `codex/003-preview-protocol-scan-scope-cache`.

Use a conventional commit message such as:

```text
fix: reset preview protocol scope on scan
```

Do not push or open a PR unless the operator asks.

## Ordered Steps

1. Replace the root-registration API.
   - In `src/main/localProtocol.ts`, add a function such as:
     ```ts
     export function setAllowedPreviewRoot(dir: string): void {
       allowedRoots.clear()
       previewCache.clear()
       allowedRoots.add(path.resolve(dir))
     }
     ```
   - Either remove `allowDirectory` or keep it only if tests still require it. Prefer a single production API to avoid future additive calls.
   - Normalize roots with `path.resolve`.
   - Verify: `pnpm typecheck`
   - Expected result: scanner import breaks until updated.

2. Update scanner registration.
   - In `src/main/ipc/scanner.ts`, replace `allowDirectory(folderPath)` with the new per-scan function.
   - Use the exact selected folder path and let the protocol module normalize it.
   - Verify: `pnpm test -- tests/unit/scanner.test.ts`
   - Expected result: scanner tests pass or need import mock updates.

3. Harden allowed-root matching.
   - In `src/main/localProtocol.ts`, normalize the decoded request path before checking it.
   - Keep the traversal rejection, but do not rely on string containment alone.
   - Use a helper like:
     ```ts
     function isPathUnderRoot(filePath: string, root: string): boolean {
       const relative = path.relative(root, filePath)
       return relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative)
     }
     ```
   - Decide whether serving the root directory itself should be allowed. For image files, `relative !== ''` is fine.
   - Verify: `pnpm test -- tests/unit/localProtocol.test.ts`
   - Expected result: existing allowed/outside tests still pass.

4. Add regression tests.
   - In `tests/unit/localProtocol.test.ts`, update imports to the new API.
   - Add a test:
     - register `/first`.
     - register `/second`.
     - assert `app://images/first/photo.jpg` returns 403.
     - assert `app://images/second/photo.jpg` calls `net.fetch`.
   - Add a sibling-prefix test:
     - register `/photos`.
     - assert `/photos-old/a.jpg` is rejected.
   - If feasible, add a cache-clearing assertion by serving a HEIC file under one root, switching roots, and proving the old path is rejected before conversion. Do not add brittle `sips` dependencies to unit tests.
   - Verify: `pnpm test -- tests/unit/localProtocol.test.ts`
   - Expected result: protocol tests cover new scan isolation.

5. Run final checks.
   - `pnpm typecheck`
   - `pnpm test -- tests/unit/localProtocol.test.ts tests/unit/scanner.test.ts`
   - `pnpm exec eslint src/main/localProtocol.ts src/main/ipc/scanner.ts tests/unit/localProtocol.test.ts tests/unit/scanner.test.ts --no-cache`
   - Expected result: all focused checks pass.

## Done Criteria

- A new scan replaces the previous allowed preview root.
- HEIC preview cache is cleared on new scan root registration.
- Old roots and sibling-prefix paths are rejected by tests.
- Focused tests, typecheck, and targeted lint pass.

## STOP Conditions

- Stop if multiple simultaneous scan roots become a product requirement.
- Stop if current code moved preview serving into another protocol module.
- Stop if path normalization breaks valid macOS absolute paths in existing tests.

## Maintenance Notes

Keep the preview protocol least-privilege: it should serve only the current library root. If multi-root support is added later, make that explicit in state and UI instead of preserving stale roots implicitly.
