# Cleanup Photos

Cleanup Photos is an Electron desktop app for scanning photo folders, finding duplicates, reviewing blurry images, organizing files by capture date, and exporting resized copies.

The v1 release target is a Universal macOS DMG distributed through GitHub Releases. Cleanup Photos is local-first: it scans folders on disk and does not upload photos or include telemetry by default.

## V1 Status

- Final v1 scope lives in `docs/v1-ready-to-market-plan.md`.
- Payments, auto-updates, and release publishing are disabled by default until explicit final v1 approval.
- Unlicensed v1 use will be limited to 100 photos per workflow action; licensed users will get unlimited local processing.
- Lemon Squeezy license activation, GitHub Releases auto-update, signing, notarization, and Universal macOS packaging are planned v1 work and must remain gated until approval.

## Recommended IDE Setup

- VS Code
- ESLint extension
- Prettier extension

## Project Setup

Install dependencies:

```bash
pnpm install
```

Run the app in development:

```bash
pnpm dev
```

Run local checks:

```bash
pnpm lint
pnpm typecheck
pnpm test
```

Build compiled Electron output:

```bash
pnpm build
```

Run the Electron smoke tests after building:

```bash
pnpm test:e2e
```

Build a local macOS arm64 DMG:

```bash
pnpm build:mac
```

## Notes

- `pnpm test:e2e` expects compiled output in `out/`, so run `pnpm build` first.
- The current local packaging script targets macOS arm64. The v1 release target is a Universal macOS DMG.
- Do not publish or create public releases from local builds.
