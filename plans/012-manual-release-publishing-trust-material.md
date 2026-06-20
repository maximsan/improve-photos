# Plan 012: Add Manual Release Publishing Guardrails and Trust Material

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report; do not improvise. When done, update the status row for this plan in `plans/README.md` unless a reviewer dispatched you and told you they maintain the index.
>
> **Drift check (run first)**: `git diff --stat ad5a56e..HEAD -- .github/workflows/ci.yml package.json README.md docs/v1-ready-to-market-plan.md docs/go-to-market-plan.md docs/qa-checklist.md plans/README.md`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live files before proceeding. On a meaningful mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: `plans/011-release-packaging-signing-notarization.md`
- **Category**: dx
- **Planned at**: commit `ad5a56e`, 2026-06-19

## Why this matters

The v1 plan requires GitHub Releases distribution but also says no push, merge, test, or local build should publish a release automatically. Current CI uploads an unsigned DMG artifact for manual/tag packaging smoke, but there is no complete release-publishing checklist or trust-material workflow. This plan creates an explicit manual release path with checksums, notes, screenshots/support/privacy material, and guardrails that prevent accidental publishing.

## Current state

Key files and roles:

| Path                              | Role                                           |
| --------------------------------- | ---------------------------------------------- |
| `.github/workflows/ci.yml`        | CI and unsigned Universal DMG artifact upload. |
| `package.json`                    | Build/test scripts used by release jobs.       |
| `README.md`                       | Public-facing build and release safety notes.  |
| `docs/v1-ready-to-market-plan.md` | Tracks Steps 19 and 20.                        |
| `docs/go-to-market-plan.md`       | Tracks public trust/download material.         |
| `docs/qa-checklist.md`            | Manual release verification checklist.         |
| `plans/README.md`                 | Executor plan index.                           |

Current excerpts:

```yaml
# .github/workflows/ci.yml:3-10
on:
  push:
    branches: [main]
    tags: ['v*']
  pull_request:
    branches: [main]
  workflow_dispatch:
```

```yaml
# .github/workflows/ci.yml:51-87
package-mac-universal:
  # Universal DMG packaging smoke. Gated to release tags and manual runs so
  # PR CI stays fast. Produces an unsigned DMG (no Apple credentials in CI).
  if: github.event_name == 'workflow_dispatch' || startsWith(github.ref, 'refs/tags/v')
  ...
  - name: Upload Universal DMG
    uses: actions/upload-artifact@v4
```

```md
<!-- docs/v1-ready-to-market-plan.md:97-101 -->

- [ ] **Step 19: Add manual release publishing guardrails**
      **Definition of Done:** CI can build and test artifacts, but publishing a GitHub Release requires an explicit manual trigger or approval; no push, merge, test run, or local build automatically publishes a release.

- [ ] **Step 20: Add release artifacts and trust material**
      **Definition of Done:** Each release includes DMG, checksum, short release notes, screenshots, support contact, privacy statement, system requirements, and clear explanation of the free 100-photo limit.
```

```md
<!-- README.md:113-114 -->

- `pnpm test:e2e` expects compiled output in `out/`, so run `pnpm build` first.
- Do not publish or create public releases from local builds.
```

Repo conventions to follow:

- Release publishing must require explicit manual action or approval.
- Do not publish from normal push, pull request, test, or local build workflows.
- Keep market feature flags disabled unless final approval has been recorded.
- Do not include secret values in docs or workflows.

## Commands you will need

| Purpose                                       | Command                                                                                                                                                 | Expected on success          |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- | ------------- | ----- | -------------- | ---------- | --------- | --------------- | ----------------------------------------------- | --------------------------------- |
| Inspect release workflow triggers             | `rg -n "workflow_dispatch                                                                                                                               | push:                        | pull_request: | tags: | create-release | gh release | softprops | upload-artifact | GITHUB_TOKEN" .github/workflows README.md docs` | release publishing is manual-only |
| Typecheck if workflow-adjacent scripts change | `pnpm typecheck`                                                                                                                                        | exit 0                       |
| Lint if JS/TS scripts change                  | `pnpm lint`                                                                                                                                             | exit 0                       |
| Build release artifact before publishing      | `pnpm build:mac`                                                                                                                                        | exit 0; DMG exists           |
| Generate checksum                             | `shasum -a 256 "dist/Cleanup Photos-0.1.0-universal.dmg"`                                                                                               | prints SHA-256 and file path |
| Diff whitespace                               | `git diff --check -- .github/workflows/ci.yml README.md docs/v1-ready-to-market-plan.md docs/go-to-market-plan.md docs/qa-checklist.md plans/README.md` | exit 0                       |

## Scope

**In scope**:

- `.github/workflows/ci.yml`
- Optional new workflow under `.github/workflows/` if a separate release workflow is clearer.
- `README.md`
- `docs/v1-ready-to-market-plan.md`
- `docs/go-to-market-plan.md`
- `docs/qa-checklist.md`
- `plans/README.md`

**Out of scope**:

- Implementing signing/notarization itself; that belongs to Plan 011.
- Running real release publishing before final approval.
- Enabling payments or auto-updates.
- Adding analytics/crash SDKs.
- Creating a public website or sales page beyond release trust material references.

## Git workflow

- Branch: `codex/012-manual-release-publishing-trust-material`
- Commit message: `ci: add manual release publishing guardrails`
- Do not push or open a pull request unless the operator asks.

## Steps

### Step 1: Decide whether publishing lives in CI or a checklist

Inspect `.github/workflows/ci.yml` and the repository's release needs. Choose one of these approaches:

- Preferred: a separate `.github/workflows/release.yml` with `workflow_dispatch` inputs and a protected environment. It builds/verifies artifacts, computes checksums, and only publishes when an explicit input such as `publish: true` is provided.
- Acceptable: keep publishing manual outside CI with a documented checklist if the owner does not want GitHub Actions to create releases yet.

Either way, ordinary `push`, `pull_request`, test, and local build paths must not create a GitHub Release.

**Verify**: `rg -n "gh release create|softprops/action-gh-release|create-release|workflow_dispatch|environment" .github/workflows README.md docs` -> publishing path is explicit and manual-only, or docs state publishing is manual outside CI.

### Step 2: Add release publishing guardrails

If adding a workflow:

- Trigger only with `workflow_dispatch`.
- Use explicit inputs for `version`, `publish`, and optionally `notarize`.
- Use a protected GitHub environment such as `release` if available.
- Build and verify artifacts before any release creation step.
- Keep release creation behind an `if:` condition that checks the explicit publish input.
- Do not trigger release creation on tags automatically unless the maintainer explicitly chooses that policy.

If documenting manual publishing only:

- Add a release checklist that says exactly which commands to run.
- Include an explicit "do not publish from local builds without final v1 approval" note.

**Verify**: `rg -n "push:|pull_request:|tags:|workflow_dispatch|publish" .github/workflows README.md docs/v1-ready-to-market-plan.md docs/qa-checklist.md` -> no automatic publish path exists.

### Step 3: Define required release artifacts

Update `docs/v1-ready-to-market-plan.md`, `docs/go-to-market-plan.md`, or a dedicated release checklist section with the required artifacts:

- Universal DMG.
- SHA-256 checksum.
- Short user-facing release notes, 3-7 bullets.
- Screenshots or a short recording.
- Support contact.
- Privacy statement or privacy section.
- System requirements.
- Clear free-limit explanation: unlicensed users can process up to 100 photos per workflow action once payments are enabled; licensed users get unlimited local processing.

If the privacy statement does not exist yet, keep it as an explicit release blocker rather than implying completion.

**Verify**: `rg -n "SHA-256|checksum|release notes|screenshots|support|privacy|system requirements|100 photos" docs/v1-ready-to-market-plan.md docs/go-to-market-plan.md docs/qa-checklist.md README.md` -> all required trust-material items are findable.

### Step 4: Add checksum generation to the release path

If adding CI release support, add a checksum step after the DMG is produced and before artifact upload/release creation. If keeping publishing manual, document the exact command:

```bash
shasum -a 256 "dist/Cleanup Photos-0.1.0-universal.dmg"
```

If the DMG file name can change with version, use the actual glob or workflow variable safely. Avoid commands that could match multiple stale DMGs.

**Verify**: checksum command is documented or workflow step exists, and it references the current DMG path.

### Step 5: Update v1 status and plan index

Update `docs/v1-ready-to-market-plan.md`:

- Keep Step 19 unchecked unless publishing guardrails are implemented and verified.
- Keep Step 20 unchecked until trust material exists and has been reviewed.
- Add any blocked external items as clear blockers.

Update `plans/README.md` row for this plan with truthful status.

**Verify**: `rg -n "012-manual-release-publishing-trust-material|Step 19|Step 20|BLOCKED|DONE" plans/README.md docs/v1-ready-to-market-plan.md` -> status is clear.

## Test plan

If workflow/docs only:

- `rg -n "workflow_dispatch|publish|release notes|checksum|100 photos" .github/workflows README.md docs`
- `git diff --check -- .github/workflows README.md docs/v1-ready-to-market-plan.md docs/go-to-market-plan.md docs/qa-checklist.md plans/README.md`

If JS/TS scripts are added or changed:

- `pnpm typecheck`
- `pnpm lint`
- Add targeted tests for any new script logic.

If CI release workflow is added:

- Validate YAML syntax by opening the workflow in GitHub or running the repository's chosen workflow linter if available.
- Use a dry-run/manual dispatch without `publish: true` first; it must build/upload artifacts without creating a release.

## Done criteria

- [ ] No ordinary push, pull request, test, or local build can publish a release.
- [ ] Release publishing requires an explicit manual trigger or approval.
- [ ] Release artifact checklist includes DMG, checksum, release notes, screenshots, support, privacy, system requirements, and free-limit explanation.
- [ ] Checksum generation is part of the release path or documented manual checklist.
- [ ] Step 19/20 status in `docs/v1-ready-to-market-plan.md` is truthful.
- [ ] `plans/README.md` status row is updated.

## STOP conditions

Stop and report back if:

- The release workflow would need repository settings or protected environments you cannot verify.
- Publishing requires real credentials, signing material, or approval that the operator has not provided.
- A proposed workflow would publish on tag push or normal push without an explicit approval.
- The privacy/support material requires a product decision not present in current docs.

## Maintenance notes

Release guardrails should be boring and explicit. If the team later chooses tag-based publishing, keep a manual approval environment in the path and update this plan's assumptions in the release docs.
