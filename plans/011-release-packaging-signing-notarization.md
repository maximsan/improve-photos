# Plan 011: Finish Release Packaging, Signing, and Notarization

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report; do not improvise. When done, update the status row for this plan in `plans/README.md` unless a reviewer dispatched you and told you they maintain the index.
>
> **Drift check (run first)**: `git diff --stat ad5a56e..HEAD -- package.json electron-builder.yml scripts/build-mac.sh scripts/create-dmg.sh build/notarize.cjs build/entitlements.mac.plist README.md docs/v1-ready-to-market-plan.md .github/workflows/ci.yml tests/unit/notarize.test.ts`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live files before proceeding. On a meaningful mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: dx
- **Planned at**: commit `ad5a56e`, 2026-06-19

## Why this matters

The app cannot be publicly distributed as a trustworthy macOS download until the Universal DMG path, signing path, notarization path, and architecture checks are explicit and repeatable. The repo already has a Universal DMG script and a gated notarization hook, but the remaining release work needs acceptance artifacts and CI wiring so it does not depend on tribal knowledge. This plan completes v1 Steps 17 and 18 without publishing a release.

## Current state

Key files and roles:

| Path                              | Role                                                                          |
| --------------------------------- | ----------------------------------------------------------------------------- |
| `package.json`                    | Defines `pnpm build:mac` and package metadata.                                |
| `electron-builder.yml`            | Defines macOS target, Universal arch, Sharp unpacking, and notarization hook. |
| `scripts/build-mac.sh`            | Wraps build and packaging for local unsigned and signed/notarized flows.      |
| `scripts/create-dmg.sh`           | Creates the DMG after app packaging.                                          |
| `build/notarize.cjs`              | Electron Builder `afterSign` hook for Apple notarization.                     |
| `.github/workflows/ci.yml`        | Current CI, including unsigned Universal DMG packaging smoke.                 |
| `tests/unit/notarize.test.ts`     | Tests the notarization hook.                                                  |
| `README.md`                       | Documents local and signed build flows.                                       |
| `docs/v1-ready-to-market-plan.md` | Tracks v1 Steps 17 and 18.                                                    |

Current excerpts:

```json
// package.json
"build:mac": "bash scripts/build-mac.sh"
```

```yaml
# electron-builder.yml:25-31
mac:
  target:
    - target: dmg
      arch:
        - universal
  entitlementsInherit: build/entitlements.mac.plist
```

```yaml
# electron-builder.yml:59-61
# Notarization is gated inside the hook by MAC_NOTARIZE + Apple credentials;
# no-op without them so local unsigned builds are unaffected.
afterSign: build/notarize.cjs
```

```bash
# scripts/build-mac.sh:23-36
: "${CSC_IDENTITY_AUTO_DISCOVERY:=false}"
: "${MAC_NOTARIZE:=0}"

if [ "${MAC_NOTARIZE}" = "1" ]; then
  HARDENED_RUNTIME=true
else
  HARDENED_RUNTIME=false
fi

export CSC_IDENTITY_AUTO_DISCOVERY

pnpm build
electron-builder --mac --dir --universal \
  -c.mac.hardenedRuntime="${HARDENED_RUNTIME}"
bash scripts/create-dmg.sh universal
```

```yaml
# .github/workflows/ci.yml:51-87
package-mac-universal:
  # Universal DMG packaging smoke. Gated to release tags and manual runs so
  # PR CI stays fast. Produces an unsigned DMG (no Apple credentials in CI).
  if: github.event_name == 'workflow_dispatch' || startsWith(github.ref, 'refs/tags/v')
  runs-on: macos-latest
  needs: ci
  ...
  - run: pnpm build:mac
  ...
  - name: Upload Universal DMG
```

```md
<!-- docs/v1-ready-to-market-plan.md:91-95 -->

- [ ] **Step 17: Build Universal macOS DMG distribution**
      **Definition of Done:** Build config produces Universal or paired x64/arm64 macOS release artifacts, Sharp optional dependencies work for both architectures, and QA verifies launch plus JPEG/HEIC scan on Apple Silicon and Intel Mac or equivalent CI runner.

- [ ] **Step 18: Enable signing and notarization**
      **Definition of Done:** `electron-builder.yml` notarization is enabled for release builds, credentials are read from CI secrets only, and a clean macOS install opens without Gatekeeper warnings.
```

Repo conventions to follow:

- Local builds must remain unsigned by default and must not require Apple credentials.
- Release signing/notarization must be opt-in via explicit env/CI configuration.
- Do not put secret values in committed files, docs, test output, or plan updates.
- Use `pnpm` scripts already present in `package.json`; do not introduce another package manager.

## Commands you will need

| Purpose                      | Command                                                                                                                                                 | Expected on success                                                                                 |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Install                      | `pnpm install --frozen-lockfile`                                                                                                                        | exit 0                                                                                              |
| Typecheck                    | `pnpm typecheck`                                                                                                                                        | exit 0, no TypeScript errors                                                                        |
| Notarization unit tests      | `pnpm test -- tests/unit/notarize.test.ts`                                                                                                              | all tests pass                                                                                      |
| Targeted lint                | `pnpm exec eslint build/notarize.cjs tests/unit/notarize.test.ts --no-cache`                                                                            | exit 0                                                                                              |
| Build compiled app           | `pnpm build`                                                                                                                                            | exit 0, `out/` exists                                                                               |
| Build unsigned Universal DMG | `pnpm build:mac`                                                                                                                                        | exit 0, `dist/mac-universal/Cleanup Photos.app` and `dist/Cleanup Photos-0.1.0-universal.dmg` exist |
| Verify app architecture      | `lipo -info "dist/mac-universal/Cleanup Photos.app/Contents/MacOS/Cleanup Photos"`                                                                      | output includes `x86_64 arm64`                                                                      |
| Verify Sharp arm64 binary    | `test -f "dist/mac-universal/Cleanup Photos.app/Contents/Resources/app.asar.unpacked/node_modules/@img/sharp-darwin-arm64/lib/sharp-darwin-arm64.node"` | exit 0                                                                                              |
| Verify Sharp x64 binary      | `test -f "dist/mac-universal/Cleanup Photos.app/Contents/Resources/app.asar.unpacked/node_modules/@img/sharp-darwin-x64/lib/sharp-darwin-x64.node"`     | exit 0                                                                                              |

Signed/notarized release verification requires Apple credentials and a Developer ID certificate. Do not run it unless the operator provides the required secrets or CI environment.

## Scope

**In scope**:

- `electron-builder.yml`
- `scripts/build-mac.sh`
- `scripts/create-dmg.sh`
- `build/notarize.cjs`
- `build/entitlements.mac.plist`
- `.github/workflows/ci.yml`
- `tests/unit/notarize.test.ts`
- `README.md`
- `docs/v1-ready-to-market-plan.md`
- `plans/README.md`

**Out of scope**:

- Publishing a GitHub Release.
- Enabling payments or auto-updates for users.
- Changing app runtime behavior unrelated to packaging/signing/notarization.
- Committing Apple credentials, certificates, provisioning material, or real secret values.
- Windows/Linux packaging.

## Git workflow

- Branch: `codex/011-release-packaging-signing-notarization`
- Commit message: `ci: finish mac release notarization path`
- Do not push or open a pull request unless the operator asks.

## Steps

### Step 1: Verify the unsigned Universal DMG path

Run the unsigned build path from a clean install state if practical:

1. `pnpm install --frozen-lockfile`
2. `pnpm build:mac`
3. `lipo -info "dist/mac-universal/Cleanup Photos.app/Contents/MacOS/Cleanup Photos"`
4. Verify both Sharp optional dependency files listed in "Commands you will need".

If the app bundle path or DMG file name differs from README, update README and this plan's status notes in `plans/README.md`. Do not change release code until you know whether the failure is docs drift or code drift.

**Verify**: commands above -> exit 0; lipo output includes `x86_64 arm64`; both Sharp files exist.

### Step 2: Make notarization prerequisites explicit

Check `build/notarize.cjs`, `scripts/build-mac.sh`, and `README.md` for a consistent signed-release contract:

- Signed release builds require `MAC_NOTARIZE=1`.
- Required Apple credential env vars are `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, and `APPLE_TEAM_ID`.
- Developer ID signing is provided by Keychain identity discovery or `CSC_LINK`/`CSC_KEY_PASSWORD`.
- Missing required Apple credentials fail when `MAC_NOTARIZE=1`.
- Local unsigned builds remain no-op for notarization.

If any part is missing or contradictory, update the narrowest file. For tests, model changes after `tests/unit/notarize.test.ts`; do not add real credentials.

**Verify**: `pnpm test -- tests/unit/notarize.test.ts` -> all tests pass.

### Step 3: Add or tighten CI support for signed release verification

Inspect `.github/workflows/ci.yml`. The current `package-mac-universal` job uploads an unsigned DMG for `workflow_dispatch` and `v*` tags. Add a separate, explicit signed/notarized verification path only if the repository has or is expected to have Apple signing secrets.

Acceptable shape:

- A separate job or guarded steps that run only on `workflow_dispatch` with an explicit input such as `notarize: true`, or on a protected release environment.
- It must require secrets for Apple credentials and signing identity.
- It must not run on ordinary `push`, `pull_request`, or local builds.
- It must not publish releases.
- It should run `pnpm build:mac` with `MAC_NOTARIZE=1` and then verify Gatekeeper/stapling with the appropriate macOS commands.

If Apple secrets are not available in the repo settings, document the required CI secrets and mark the signed CI portion blocked in `plans/README.md`; do not fake success.

**Verify**: `rg -n "MAC_NOTARIZE|APPLE_ID|APPLE_APP_SPECIFIC_PASSWORD|APPLE_TEAM_ID|workflow_dispatch|environment" .github/workflows/ci.yml README.md` -> signed path and required secrets are explicit, or the block is documented.

### Step 4: Add clean-install release acceptance notes

Update `docs/v1-ready-to-market-plan.md` and, if useful, `README.md` with a concise acceptance checklist for Step 17/18:

- Universal binary check.
- Sharp arm64/x64 binary presence check.
- Apple Silicon launch plus JPEG/HEIC scan.
- Intel Mac launch plus JPEG/HEIC scan, or a documented equivalent if no Intel hardware is available.
- Signed/notarized build opens on a clean macOS user account without Gatekeeper warnings.
- `spctl`/stapling verification command and expected result.

Do not mark Steps 17/18 complete until those checks have actually run.

**Verify**: `rg -n "lipo -info|sharp-darwin-arm64|sharp-darwin-x64|Gatekeeper|spctl|JPEG/HEIC" README.md docs/v1-ready-to-market-plan.md` -> acceptance checks are findable.

### Step 5: Run final checks and update plan status

Run the appropriate checks for the work actually performed:

- Always: typecheck, notarization unit tests, targeted lint, unsigned Universal DMG build, lipo, Sharp binary checks.
- If credentials are available and signed CI/local verification is in scope: signed/notarized build and Gatekeeper verification.

Update `plans/README.md` row for this plan:

- `DONE` only if unsigned Universal checks and signed/notarized acceptance checks passed or the owner explicitly accepts a `BLOCKED` status for missing external Apple credentials.
- `BLOCKED (missing Apple credentials / Intel Mac QA / clean Gatekeeper verification)` if that is the true state.

**Verify**: `rg -n "011-release-packaging-signing-notarization" plans/README.md` -> one row with truthful status.

## Test plan

Required tests and checks:

- `pnpm typecheck`
- `pnpm test -- tests/unit/notarize.test.ts`
- `pnpm exec eslint build/notarize.cjs tests/unit/notarize.test.ts --no-cache`
- `pnpm build:mac`
- `lipo -info "dist/mac-universal/Cleanup Photos.app/Contents/MacOS/Cleanup Photos"`
- Sharp binary `test -f` checks for arm64 and x64.

Manual/external validation:

- Apple Silicon launch and JPEG/HEIC scan.
- Intel Mac launch and JPEG/HEIC scan, or documented equivalent.
- Signed/notarized clean macOS install and Gatekeeper check when credentials are available.

## Done criteria

- [ ] Unsigned local Universal DMG still builds without Apple credentials.
- [ ] Universal app binary contains `x86_64 arm64`.
- [ ] Packaged app includes Sharp native binaries for both macOS architectures.
- [ ] Signed/notarized release path is explicit, gated, and cannot run accidentally on ordinary pushes/tests/local builds.
- [ ] Missing notarization credentials fail when notarization is explicitly enabled.
- [ ] Clean macOS Gatekeeper verification is documented and either completed or truthfully marked blocked.
- [ ] `docs/v1-ready-to-market-plan.md` Step 17/18 status reflects actual verification.
- [ ] `plans/README.md` row status is truthful.

## STOP conditions

Stop and report back if:

- Apple Developer credentials, signing certificate access, or Intel Mac QA are required but unavailable.
- Making notarization work requires committing secrets or weakening signing requirements.
- The unsigned local build starts requiring Apple credentials.
- Universal packaging breaks Sharp loading or app launch.
- CI changes would publish or create a GitHub Release.

## Maintenance notes

Keep local unsigned packaging and release signed/notarized packaging as two explicit flows. The local path is for developer validation; the signed path is for distribution trust and should remain gated by credentials plus manual release intent.
