# Plan 005: Encode app:// Image Paths Safely

## Executor Instructions

This plan is for a separate implementation pass. Work only on the files named here unless the drift check shows that the code moved.

Before editing, run:

```bash
git diff -- src/renderer/src/lib/format.ts src/main/localProtocol.ts tests/renderer/format.test.ts tests/unit/localProtocol.test.ts
git show --stat 4276491 -- src/renderer/src/lib/format.ts src/main/localProtocol.ts tests/renderer/format.test.ts tests/unit/localProtocol.test.ts
```

If these paths changed since commit `4276491`, reconcile the current behavior before applying the steps below.

## Status

| Field      | Value                   |
| ---------- | ----------------------- |
| Priority   | P2                      |
| Effort     | S                       |
| Risk       | LOW                     |
| Depends on | None                    |
| Category   | Bug                     |
| Planned at | `4276491` on 2026-06-13 |

## Why This Matters

Photo paths are inserted directly into `app://images...` URLs. Filenames containing `#` or `?` are parsed as URL fragments or query strings, so the main process receives the wrong pathname and thumbnails can fail to load.

## Current State

Key files and roles:

| Path                               | Role                                                            |
| ---------------------------------- | --------------------------------------------------------------- |
| `src/renderer/src/lib/format.ts`   | Builds `app://images` URLs for `<img src>`.                     |
| `src/main/localProtocol.ts`        | Decodes `url.pathname` and fetches the local file.              |
| `tests/renderer/format.test.ts`    | Tests basic `fileUrl` behavior but not reserved URL characters. |
| `tests/unit/localProtocol.test.ts` | Tests protocol decoding and `net.fetch` calls.                  |

Evidence at `4276491`:

```ts
// src/renderer/src/lib/format.ts
export function fileUrl(path: string): string {
  return `app://images${path}`
}
```

```ts
// src/main/localProtocol.ts
const decodedFilePath = decodeURIComponent(url.pathname)
...
const filePath = path.resolve(decodedFilePath)
...
return net.fetch(pathToFileURL(filePath).toString())
```

Current test expectation:

```ts
expect(fileUrl('/my photos/hello world.jpg')).toBe('app://images/my photos/hello world.jpg')
```

URL parsing problem to verify manually if needed:

```js
new URL('app://images/photos/a#b.jpg').pathname // '/photos/a'
new URL('app://images/photos/a?b.jpg').pathname // '/photos/a'
```

## Commands

| Purpose       | Command                                                                                                                                               |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Type check    | `pnpm typecheck`                                                                                                                                      |
| Focused tests | `pnpm test -- tests/renderer/format.test.ts tests/unit/localProtocol.test.ts`                                                                         |
| Targeted lint | `pnpm exec eslint src/renderer/src/lib/format.ts src/main/localProtocol.ts tests/renderer/format.test.ts tests/unit/localProtocol.test.ts --no-cache` |

## Scope

In scope:

- Encode file path URL segments in `fileUrl`.
- Keep slash separators intact.
- Add tests for spaces, `#`, `?`, and non-ASCII characters if practical.
- Update protocol tests only if decoding expectations need to be explicit.

Out of scope:

- Changing the `app://images` scheme or host.
- Supporting Windows-style backslash paths unless the app already normalizes them elsewhere.
- Thumbnail retry logic.

## Git Workflow

Use a branch named `codex/005-encode-app-image-file-urls`.

Use a conventional commit message such as:

```text
fix: encode local image preview urls
```

Do not push or open a PR unless the operator asks.

## Ordered Steps

1. Encode each path segment.
   - In `src/renderer/src/lib/format.ts`, update `fileUrl` to preserve `/` separators while encoding segment contents:
     ```ts
     export function fileUrl(filePath: string): string {
       const encodedPath = filePath.split('/').map(encodeURIComponent).join('/')
       return `app://images${encodedPath}`
     }
     ```
   - Rename the parameter from `path` to `filePath` to avoid shadowing Node `path` naming in nearby code.
   - Verify: `pnpm test -- tests/renderer/format.test.ts`
   - Expected result before test updates: existing tests expecting literal spaces fail.

2. Update renderer format tests.
   - Change the spaces test to expect `%20`.
   - Add a test for reserved characters:
     ```ts
     expect(fileUrl('/my photos/a#b?c.jpg')).toBe('app://images/my%20photos/a%23b%3Fc.jpg')
     ```
   - Add a nested path test to prove slashes remain separators.
   - Optional: add a non-ASCII filename case and expect percent-encoded UTF-8.
   - Verify: `pnpm test -- tests/renderer/format.test.ts`
   - Expected result: format tests pass.

3. Ensure protocol decoding remains correct.
   - `localProtocol.ts` already uses `decodeURIComponent(url.pathname)`.
   - Add or update a protocol test:
     - register `/allowed`.
     - request `app://images/allowed/a%23b%3Fc.jpg`.
     - assert `net.fetch` is called with `file:///allowed/a%23b%3Fc.jpg` or the exact `pathToFileURL` output.
   - Do not double-decode.
   - Verify: `pnpm test -- tests/unit/localProtocol.test.ts`
   - Expected result: protocol can serve encoded reserved characters.

4. Run final checks.
   - `pnpm typecheck`
   - `pnpm test -- tests/renderer/format.test.ts tests/unit/localProtocol.test.ts`
   - `pnpm exec eslint src/renderer/src/lib/format.ts src/main/localProtocol.ts tests/renderer/format.test.ts tests/unit/localProtocol.test.ts --no-cache`
   - Expected result: all focused checks pass.

## Done Criteria

- `fileUrl` encodes reserved URL characters and spaces.
- Slash path separators are preserved.
- Main protocol tests confirm encoded paths decode to the intended local file.
- Focused tests, typecheck, and targeted lint pass.

## STOP Conditions

- Stop if another branch changed image URLs to a different transport format.
- Stop if Electron protocol handling treats encoded `app://` paths differently than standard `URL` parsing in tests.
- Stop if Windows path support is now required; design path normalization first.

## Maintenance Notes

Always treat local file paths as data when building URLs. Encode in the renderer and decode exactly once in the protocol handler.
