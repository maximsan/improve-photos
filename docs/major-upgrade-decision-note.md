# Major upgrade decision note

**Reviewed:** 2026-05-19

The following major upgrades are intentionally deferred. They should be handled in separate branches because each can change compiler, runtime, lint, or Electron behavior beyond a safe patch/minor update.

| Package | Deferred target | Required validation before adoption |
| --- | --- | --- |
| `electron` | `42.x` | `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:coverage`, `pnpm build`, `pnpm test:e2e`, and a manual macOS scan of JPEG + HEIC fixtures |
| `typescript` | `6.x` | `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm lint`, `pnpm test`, and review of any `isolatedModules` or project-reference diagnostics |
| `eslint` | `10.x` | `pnpm install --frozen-lockfile`, `pnpm lint`, and review of the flat config plus `@electron-toolkit` config compatibility |
| `@types/node` | `25.x` | `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm test`, and review of Node API type changes used by main-process tests |

Do not combine these major upgrades with app behavior changes.
