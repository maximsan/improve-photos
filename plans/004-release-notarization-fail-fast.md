# Plan 004: Fail Fast When Release Notarization Is Misconfigured

## Executor Instructions

This plan is for a separate implementation pass. Work only on the files named here unless the drift check shows that the code moved.

Before editing, run:

```bash
git diff -- build/notarize.cjs scripts/build-mac.sh README.md tests/unit
git show --stat 4276491 -- build/notarize.cjs scripts/build-mac.sh README.md tests/unit
```

If these paths changed since commit `4276491`, reconcile the current behavior before applying the steps below.

## Status

| Field      | Value                   |
| ---------- | ----------------------- |
| Priority   | P1                      |
| Effort     | S                       |
| Risk       | LOW                     |
| Depends on | None                    |
| Category   | Release/Security        |
| Planned at | `4276491` on 2026-06-13 |

## Why This Matters

`MAC_NOTARIZE=1` is documented as the signed and notarized release flow. Today, if credentials are missing, the notarization hook logs a skip and returns success. That can produce a release artifact that the operator believed was notarized.

## Current State

Key files and roles:

| Path                          | Role                                                                    |
| ----------------------------- | ----------------------------------------------------------------------- |
| `build/notarize.cjs`          | electron-builder `afterSign` hook.                                      |
| `scripts/build-mac.sh`        | Build wrapper that flips hardened runtime when `MAC_NOTARIZE=1`.        |
| `README.md`                   | Documents the signed and notarized release flow.                        |
| `tests/unit/notarize.test.ts` | Does not exist yet; add it if the helper extraction below is practical. |

Evidence at `4276491`:

```js
// build/notarize.cjs
if (process.env.MAC_NOTARIZE !== '1') {
  console.log('[notarize] MAC_NOTARIZE != 1 - skipping notarization')
  return
}

const missing = REQUIRED_CREDENTIAL_KEYS.filter((key) => !process.env[key])
if (missing.length > 0) {
  console.log(`[notarize] missing credentials (${missing.join(', ')}) - skipping notarization`)
  return
}
```

```bash
# scripts/build-mac.sh
#   MAC_NOTARIZE=1 -> signed + notarized release build:
#     * Caller must also supply APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD,
#       APPLE_TEAM_ID, and (typically) CSC_IDENTITY_AUTO_DISCOVERY=true.
```

```md
<!-- README.md -->

With `MAC_NOTARIZE=1` the wrapper flips hardened runtime on (required by notarization) and lets identity discovery proceed.
```

## Commands

| Purpose       | Command                                                                      |
| ------------- | ---------------------------------------------------------------------------- |
| Focused test  | `pnpm test -- tests/unit/notarize.test.ts`                                   |
| Type check    | `pnpm typecheck`                                                             |
| Targeted lint | `pnpm exec eslint build/notarize.cjs tests/unit/notarize.test.ts --no-cache` |

If no TypeScript test is added, omit `pnpm typecheck` from the focused loop but still run it before finishing.

## Scope

In scope:

- Throw an explicit error when `MAC_NOTARIZE=1` and required Apple credentials are missing.
- Keep local unsigned builds as no-op when `MAC_NOTARIZE` is not `1`.
- Add a focused regression test if feasible.

Out of scope:

- Changing code-signing identity discovery.
- Validating Apple credentials against Apple services.
- Running a real notarized release build.

## Git Workflow

Use a branch named `codex/004-release-notarization-fail-fast`.

Use a conventional commit message such as:

```text
fix: fail release build when notarization credentials are missing
```

Do not push or open a PR unless the operator asks.

## Ordered Steps

1. Extract credential validation if it makes tests clean.
   - Option A: export a small helper from `build/notarize.cjs`:
     ```js
     function getMissingNotarizationCredentials(env) {
       return REQUIRED_CREDENTIAL_KEYS.filter((key) => !env[key])
     }
     ```
   - Option B: add a sibling CJS helper, for example `build/notarize-env.cjs`, and require it from the hook.
   - Keep the hook default export compatible with electron-builder.
   - Verify: `pnpm exec eslint build/notarize.cjs --no-cache`
   - Expected result: lint reports no errors.

2. Fail when explicit release notarization is misconfigured.
   - In `build/notarize.cjs`, keep this no-op:
     ```js
     if (process.env.MAC_NOTARIZE !== '1') return
     ```
   - Change the missing-credential branch to throw:
     ```js
     throw new Error(`[notarize] MAC_NOTARIZE=1 but missing credentials: ${missing.join(', ')}`)
     ```
   - Do not print secret values.
   - Verify: `pnpm exec eslint build/notarize.cjs --no-cache`
   - Expected result: lint reports no errors.

3. Add tests.
   - Add `tests/unit/notarize.test.ts`.
   - Cover:
     - validation returns no missing keys when all required env vars exist.
     - validation returns all missing keys when none exist.
     - the hook returns without throwing when `MAC_NOTARIZE` is not `1`.
     - the hook rejects when `MAC_NOTARIZE=1` and credentials are missing.
   - Mock `@electron/notarize` so tests never call Apple services.
   - Verify: `pnpm test -- tests/unit/notarize.test.ts`
   - Expected result: test proves explicit release mode cannot silently skip.

4. Update docs only if wording is now inaccurate.
   - `README.md` and `scripts/build-mac.sh` already say credentials are required.
   - If you touch them, keep changes minimal and state that `MAC_NOTARIZE=1` fails when required credentials are missing.
   - Verify: targeted eslint if Markdown is linted by the project; otherwise no doc-specific command is needed.

5. Run final checks.
   - `pnpm typecheck`
   - `pnpm test -- tests/unit/notarize.test.ts`
   - `pnpm exec eslint build/notarize.cjs tests/unit/notarize.test.ts --no-cache`
   - Expected result: all focused checks pass.

## Done Criteria

- Local unsigned builds still skip notarization.
- `MAC_NOTARIZE=1` with missing credentials fails the build.
- Missing credential names are reported without exposing secret values.
- Focused test covers the failure path.
- Typecheck and targeted lint pass.

## STOP Conditions

- Stop if electron-builder cannot load the hook after helper extraction.
- Stop if mocking `@electron/notarize` for the default-export CJS hook becomes brittle; in that case, test only the validation helper and manually document the hook behavior.
- Stop if current release automation intentionally relies on `MAC_NOTARIZE=1` with missing credentials.

## Maintenance Notes

Release flags should be fail-fast when they claim to produce distribution artifacts. Silent skips are acceptable only for default local build paths.
