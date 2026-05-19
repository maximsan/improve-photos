# Cleanup Photos

Cleanup Photos is an Electron desktop app for scanning photo folders, finding duplicates, reviewing blurry images, organizing files by capture date, and exporting resized copies.

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
- The distributable build currently targets macOS arm64.
