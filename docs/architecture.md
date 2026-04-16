# Architecture

## Why two processes?

Electron runs two separate JavaScript environments:

| Process                        | Where it runs      | What it can access                                              |
| ------------------------------ | ------------------ | --------------------------------------------------------------- |
| **Main** (`src/main/`)         | Node.js            | File system, native OS APIs, `sharp`, `exifr`, all Node modules |
| **Renderer** (`src/renderer/`) | Chromium (browser) | React UI, DOM, CSS — no direct file system access               |

This separation is a security feature. The renderer cannot accidentally (or maliciously) read arbitrary files — it must ask the main process via a typed message channel called **IPC**.

## How the renderer talks to the main process

```
Renderer (React)
    │
    │  window.api.scan('/path/to/photos')
    ▼
Preload script (src/preload/index.ts)
    │  contextBridge — the only allowed crossing point
    │  ipcRenderer.invoke('scan', '/path/to/photos')
    ▼
Main process (src/main/ipc/scanner.ts)
    │  ipcMain.handle('scan', handler)
    │  runs sharp + exifr, reads disk
    ▼
Returns PhotoRecord[] back up the same chain
```

1. **`src/shared/ipc.ts`** — defines all TypeScript types and channel name constants. Both main and renderer import from here so they never get out of sync.
2. **`src/preload/index.ts`** — the bridge. `contextBridge.exposeInMainWorld('api', ...)` makes `window.api` available in React with only the methods we explicitly allow.
3. **`src/main/ipc/*.ts`** — one file per feature. Each registers `ipcMain.handle(IPC.CHANNEL, handler)` and does the real work.

## Feature modules

| Module    | Main file                   | What it does                               |
| --------- | --------------------------- | ------------------------------------------ |
| Scanner   | `src/main/ipc/scanner.ts`   | Walks a directory, reads EXIF + dimensions |
| Dedup     | `src/main/ipc/dedup.ts`     | Groups photos by perceptual hash           |
| Organizer | `src/main/ipc/organizer.ts` | Proposes and executes date-based moves     |
| Quality   | `src/main/ipc/quality.ts`   | Scores photos by blur (Laplacian variance) |
| Exporter  | `src/main/ipc/exporter.ts`  | Batch resizes/converts photos via presets  |

## Key libraries

- **`sharp`** — image processing (resize, format convert, pixel access for hashing and blur scoring). Runs only in main process — it's a native Node.js module.
- **`exifr`** — reads EXIF metadata (date taken, camera model, GPS). Fast, zero native dependencies.
- **`shell.trashItem()`** — Electron built-in for moving files to system Trash. Cross-platform safe.
- **`path.join()` / `path.resolve()`** — all file paths are constructed with these, never with string concatenation, so the app works on any OS.

## Build pipeline

Getting from source code to an installable `.dmg` is two separate stages:

**Stage 1 — `electron-vite build`** compiles TypeScript to JavaScript:
```
src/main/*.ts      →  out/main/
src/preload/*.ts   →  out/preload/
src/renderer/*.tsx →  out/renderer/
```

**Stage 2 — `electron-builder --mac`** bundles everything into a distributable:
```
out/          ─┐
resources/    ─┤  →  dist/cleanup-photos.dmg
build/icons   ─┘
node_modules (including native modules like sharp)
```
The result is a self-contained `.app` — the user who installs it needs nothing else (no Node.js, no pnpm).

`pnpm dev` skips both stages entirely and runs the TypeScript source directly with hot reload. `pnpm build:mac` runs Stage 1 then Stage 2.

> **Why `sharp` needs a special build step:** native modules like `sharp` contain compiled C++ code. They must be compiled against the exact Node.js version bundled inside Electron — not the system Node.js. `electron-builder install-app-deps` (run automatically after `pnpm install`) handles this recompilation.

---

## Adding a new feature

1. Add new types + channel name to `src/shared/ipc.ts`
2. Add the handler to `src/main/ipc/<feature>.ts` and register it in `src/main/index.ts`
3. Add the `window.api.<method>` stub to `src/preload/index.ts`
4. Build the React UI in `src/renderer/src/features/<Feature>/`
5. Add a unit test in `tests/unit/<feature>.test.ts`
