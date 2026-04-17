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

## React

### Execution order (MANDATORY)

1. Apply: react-component-architecture
2. Then apply: external performance rules (Vercel skills already installed)

Do not skip step 1.

### Core rules (non-negotiable)

#### Component structure

- Do not create large components with mixed concerns
- Split components when UI, state, and logic are combined
- Each component must have a single responsibility

#### JSX discipline

- Do not place business logic inside JSX
- Do not use nested ternaries
- Do not create large inline handlers
- Do not construct objects/arrays inline unless trivial

#### Reuse

- Do not duplicate JSX
- Extract reusable components immediately

#### Hooks

- Extract custom hooks for:
  - reusable logic
  - state orchestration
  - complex effects

#### Constants

- Do not use magic values
- Extract descriptive constants

#### Naming

- Use explicit, intention-revealing names
- Avoid: data, item, value, temp

#### Anti-patterns (strict)

- components >200 lines without clear reason
- prop explosion (multiple booleans)
- hidden side effects
- duplicated logic
- unclear component API

### Output requirements

All code must be:

- composable
- readable in one pass
- extendable without modification

If not — refactor.

## Readability in code

- Extract **inline regex** into **named constants** (e.g. `EMAIL_KEY_PATTERN`).
- Extract **non-trivial magic values** into named constants when they affect behavior or express domain intent.
- Prefer stable names: `*_PATTERN`, `*_MS`, `DEFAULT_*`, `MAX_*`.

## Plain language (docs and comments)

- **Clear prose**, **concrete examples**, and **domain terms that match the product**; define or link on first use when terms might confuse.
- In introductory docs: **what** and **why** before a long **how**.
- Prefer direct verbs: use, call, run, send, store, rely on; avoid empty corporate filler.
- **Define acronyms** on first use in a doc; keep **API names, routes, and types** exactly as in code.

## Formatting in workflows

- Prefer **formatting only changed files** in feature work or pre-commit flows over full-repo formatting when that is not the goal.
