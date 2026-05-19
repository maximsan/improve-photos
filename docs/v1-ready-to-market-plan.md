# Cleanup Photos final V1 ready-to-market plan

## Summary

V1 should ship as a **Universal macOS DMG**, distributed through **GitHub Releases**, with **notarization, auto-update, and one-time Lemon Squeezy license activation**.

Unlicensed use is limited by **photo count**, not time: users can process up to **100 photos per workflow action**. Licensed users get unlimited local processing.

Payments and auto-updates must stay **disabled by default** until the full v1 feature set is implemented, manually tested, and explicitly approved for release. No workflow should automatically create or publish a release before that approval.

This is the source-of-truth plan for v1. Older feature-specific improvement docs were consolidated here so the team can resume work from one place.

## Boundaries

### Included in V1

- Universal macOS distribution through GitHub Releases.
- Apple signing and notarization for public release builds.
- Local-first scanner, duplicate review, organizer, quality review, and exporter workflows.
- One-time Lemon Squeezy license activation.
- 100-photo limit for unlicensed users.
- GitHub Releases auto-update.
- Feature gates that allow payments and auto-updates to remain off while application functionality is still being finalized.
- Release guardrails that prevent accidental publishing of an unfinished app.
- First-run onboarding, Help, Settings, support link, and privacy statement.
- Manual and automated QA gates.

### Explicitly postponed

- Windows and Linux releases.
- Mac App Store distribution.
- Subscription pricing or multi-tier plans.
- Time-limited trial.
- Crash or analytics SDKs unless privacy policy and opt-in UX are added first.
- Electron 42, TypeScript 6, ESLint 10, and `@types/node` 25 major upgrades.
- Cloud sync, photo upload, AI categorization, or account system beyond license activation.
- Optional shared `PhotoFigure` UI refactor unless Dedup and Quality tiles are being edited for another reason.

## Documentation cleanup plan

- [ ] **Step 1: Keep this document as the V1 source of truth**  
  **Definition of Done:** `docs/v1-ready-to-market-plan.md` contains final v1 scope, release boundary, licensing boundary, postponed features, public interface changes, and release gate.

- [ ] **Step 2: Consolidate active feature-plan items into this plan**  
  **Definition of Done:** Active items from the former app shell, dedup, organizer, and quality plans are represented below; no active requirement exists only in a feature-specific plan.

- [ ] **Step 3: Remove redundant completed planning docs**  
  **Definition of Done:** `docs/repository-tooling-improvements-plan.md` and `docs/react-component-architecture-plan.md` are removed after confirming their completed status is covered by `CODEBASE_REVIEW_AND_PLAN.md`, `AGENTS.md`, and current tests.

- [ ] **Step 4: Remove superseded feature improvement docs**  
  **Definition of Done:** `docs/app-shell-improvements-plan.md`, `docs/dedup-improvements-plan.md`, `docs/organizer-improvements-plan.md`, and `docs/quality-review-improvements-plan.md` are removed after their remaining v1 items are migrated into this plan.

- [ ] **Step 5: Update surviving docs for market readiness**  
  **Definition of Done:** `README.md`, `docs/architecture.md`, `docs/glossary.md`, `docs/qa-checklist.md`, `docs/go-to-market-plan.md`, and `CODEBASE_REVIEW_AND_PLAN.md` agree on v1 scope, Universal Mac DMG, count-limited free use, licensing, auto-update, notarization, and postponed features.

## V1 implementation plan

- [ ] **Step 6: Fix app identity and release metadata**  
  **Definition of Done:** `package.json.homepage` no longer points to electron-vite, repository/bugs/support metadata exists, and `electronApp.setAppUserModelId` matches `electron-builder.yml` app id `com.maksim.cleanup-photos`.

- [ ] **Step 7: Add explicit scanned library root to app state**  
  **Definition of Done:** `PhotosContext` stores `scanRoot`; Scanner sets it after folder selection and clears it on reset; Organizer no longer infers root with `dirname(dirname(photo.path))`.

- [ ] **Step 8: Update Organizer to use the explicit scan root**  
  **Definition of Done:** `previewOrganize` receives the scanned root, target paths are generated under that root, Preview UI shows the resolved root directory, and tests cover flat and deeply nested libraries.

- [ ] **Step 9: Keep photo state consistent after trash**  
  **Definition of Done:** Successful trash actions from Dedup and Quality remove trashed paths from `PhotosContext`; main-process cached photos are also invalidated or updated; Scanner count and all feature tabs stop showing trashed files without requiring rescan.

- [ ] **Step 10: Harden Quality review behavior**  
  **Definition of Done:** Quality uses the same native `confirmTrash` flow as Dedup, supports canceling in-flight analysis, removes unused `scoring` status or uses it consistently, and standardizes Analyze/Analyse copy to one style.

- [ ] **Step 11: Add first-run onboarding and in-app Help**  
  **Definition of Done:** First launch shows a short local/privacy-focused workflow guide, persists completion locally, links users to Scan first, and Help explains Scan -> Review -> Organize/Export plus safety notes for Trash and backups.

- [ ] **Step 12: Add lightweight Settings**  
  **Definition of Done:** Settings expose license status, update status, free limit status, confirm-before-trash preference, default export behavior, and app/support links; settings persist locally.

- [ ] **Step 13: Add release-mode feature gates for payments and auto-updates**  
  **Definition of Done:** Payments and auto-updates are controlled by explicit release flags or config values, both default to `off` in development and pre-v1 builds, and Settings clearly shows when either feature is disabled.

- [ ] **Step 14: Implement Lemon Squeezy one-time license activation behind the payments gate**  
  **Definition of Done:** When payments are enabled, the app activates license keys through Lemon Squeezy, stores license state locally, supports deactivate/reactivate, and clearly distinguishes licensed vs unlicensed status; when payments are disabled, no license network request is made and core feature testing is not blocked by licensing.

- [ ] **Step 15: Implement count-limited free use**  
  **Definition of Done:** Unlicensed users can process up to **100 photos per workflow action** for scan, duplicate analysis, quality analysis, organize, trash, and export; attempting more shows an upgrade prompt before work begins; licensed users have no photo-count limit.

- [ ] **Step 16: Add GitHub Releases auto-update behind the auto-update gate**  
  **Definition of Done:** When auto-updates are enabled, the app checks GitHub Releases for updates, reports available/downloading/ready/error states in Settings or About, never interrupts active file operations, and can install an update after user confirmation; when auto-updates are disabled, no update check runs and Settings shows updates are paused.

- [ ] **Step 17: Build Universal macOS DMG distribution**  
  **Definition of Done:** Build config produces Universal or paired x64/arm64 macOS release artifacts, Sharp optional dependencies work for both architectures, and QA verifies launch plus JPEG/HEIC scan on Apple Silicon and Intel Mac or equivalent CI runner.

- [ ] **Step 18: Enable signing and notarization**  
  **Definition of Done:** `electron-builder.yml` notarization is enabled for release builds, credentials are read from CI secrets only, and a clean macOS install opens without Gatekeeper warnings.

- [ ] **Step 19: Add manual release publishing guardrails**  
  **Definition of Done:** CI can build and test artifacts, but publishing a GitHub Release requires an explicit manual trigger or approval; no push, merge, test run, or local build automatically publishes a release.

- [ ] **Step 20: Add release artifacts and trust material**  
  **Definition of Done:** Each release includes DMG, checksum, short release notes, screenshots, support contact, privacy statement, system requirements, and clear explanation of the free 100-photo limit.

- [ ] **Step 21: Expand automated coverage for v1-critical paths**  
  **Definition of Done:** Tests cover scan root propagation, Organizer target paths, Dedup/Quality post-trash photo removal, Quality cancellation/confirmation, payments disabled/enabled behavior, auto-updates disabled/enabled behavior, license status transitions, 100-photo limit enforcement, and update-state rendering.

- [ ] **Step 22: Add workflow-level E2E smoke fixtures**  
  **Definition of Done:** E2E covers app launch, scan fixture folder, duplicate analysis no-crash path, organizer preview, quality scoring no-crash path, exporter output-folder flow, and one unlicensed over-limit prompt.

- [ ] **Step 23: Revalidate all application functionality before enabling market features**  
  **Definition of Done:** Scanner, Duplicates, Organizer, Quality, Exporter, onboarding, Help, Settings, and free-limit behavior pass manual QA with payments and auto-updates disabled.

- [ ] **Step 24: Enable payments and auto-updates only after explicit release approval**  
  **Definition of Done:** A documented release checklist item records the approval to enable payments and auto-updates, the release flags are switched on only for release builds, and a final QA pass confirms license activation and update checks work.

- [ ] **Step 25: Run final release QA gate**  
  **Definition of Done:** `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:coverage`, `pnpm build`, `pnpm test:e2e`, `pnpm build:mac`, notarization, update check, license activation, free-limit checks, and manual QA checklist all pass.

## Public interfaces to change

- `PhotosContext`: add `scanRoot`, `setScanRoot`, and `removePhotosByPath(paths)`.
- `window.api.previewOrganize`: change from `(photos)` to `(photos, scanRoot)`.
- `window.api`: add Quality cancellation if implemented as a new IPC channel.
- `window.api`: add license methods: `getLicenseStatus`, `activateLicense`, `deactivateLicense`.
- `window.api`: add entitlement/free-limit methods: `getEntitlementStatus`, `canProcessPhotoCount`.
- `window.api`: add update methods/events: `checkForUpdates`, `downloadUpdate`, `installUpdate`, `onUpdateStatus`.
- Release config: add explicit flags for `paymentsEnabled`, `autoUpdatesEnabled`, and `releasePublishingEnabled`.

## Release gate

The final v1 release is ready only when all of the following pass:

- `pnpm install --frozen-lockfile`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:coverage`
- `pnpm build`
- `pnpm test:e2e`
- `pnpm build:mac`
- Apple notarization
- GitHub Releases update check
- Lemon Squeezy license activation/deactivation
- Free-limit checks for scan, duplicate analysis, quality analysis, organize, trash, and export
- Manual approval record for enabling payments, auto-updates, and release publishing
- Manual QA checklist in `docs/qa-checklist.md`

## Assumptions

- Unlicensed v1 allows **100 photos per workflow action**.
- Licensed v1 has unlimited local processing.
- Primary release channel is **GitHub Releases**.
- Payments and auto-updates stay disabled until explicit v1 release approval.
- No release is published automatically from ordinary push, merge, test, or local build workflows.
- The app remains privacy-first and local-first: no photo upload, no telemetry by default.
- Universal Mac support is required before final v1, but Windows/Linux are not.
