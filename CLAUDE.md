# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # start Electron app with hot reload (both main + renderer)
pnpm typecheck    # TypeScript check on both processes
pnpm lint         # ESLint
pnpm test         # Vitest unit tests
pnpm build:mac    # production DMG for macOS
```

## Architecture

Electron splits into two processes. See [docs/architecture.md](docs/architecture.md) for a full explanation.

- **Main process** (`src/main/`) — Node.js, file I/O, `sharp`, `exifr`, IPC handlers
- **Renderer** (`src/renderer/`) — React 19 + Vite, Tailwind v4, UI only
- **Preload** (`src/preload/index.ts`) — `contextBridge` bridge; the only crossing point
- **Shared types** (`src/shared/ipc.ts`) — TypeScript types + IPC channel constants imported by both sides

## IPC pattern

Every renderer → main call goes through `window.api.<method>()` (defined in preload). To add a new channel:

1. Add types + channel name to `src/shared/ipc.ts`
2. Add handler to `src/main/ipc/<feature>.ts`, register in `src/main/index.ts`
3. Add stub to `src/preload/index.ts`

## Key conventions

- All file paths use `path.join()` / `path.resolve()` — never string concatenation
- Trash via `shell.trashItem()` — never `fs.unlink`
- `sharp` and `exifr` run in main only — never import them in renderer
- Tailwind v4 with warm amber/orange theme defined in `src/renderer/src/assets/main.css`
- UI skill: always use the **frontend-design skill** when building UI components
