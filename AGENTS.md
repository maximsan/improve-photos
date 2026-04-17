# AGENTS.md

## Purpose

Repository-level instructions for all AI coding agents.

Applies to:

- Codex
- Cursor
- Claude (fallback)

Keep this file minimal and strict.

---

## When working with React

### Execution order (MANDATORY)

1. Apply: react-component-architecture
2. Then apply: external performance rules (Vercel skills already installed)

Do not skip step 1.

---

## Core rules (non-negotiable)

### Component structure

- Do not create large components with mixed concerns
- Split components when UI, state, and logic are combined
- Each component must have a single responsibility

---

### JSX discipline

- Do not place business logic inside JSX
- Do not use nested ternaries
- Do not create large inline handlers
- Do not construct objects/arrays inline unless trivial

---

### Reuse

- Do not duplicate JSX
- Extract reusable components immediately

---

### Hooks

- Extract custom hooks for:
  - reusable logic
  - state orchestration
  - complex effects

---

### Constants

- Do not use magic values
- Extract descriptive constants

---

### Naming

- Use explicit, intention-revealing names
- Avoid: data, item, value, temp

---

### Anti-patterns (strict)

- components >200 lines without clear reason
- prop explosion (multiple booleans)
- hidden side effects
- duplicated logic
- unclear component API

---

## Output requirements

All code must be:

- composable
- readable in one pass
- extendable without modification

If not — refactor.

## TypeScript and tooling

- Prefer **strict** typing; fix types instead of weakening compiler settings.
- When the project uses **noEmit** / **isolatedModules**, keep modules compatible with that mode.
- Follow the repo’s **ESLint** conventions (e.g. remove unused imports; unused bindings prefixed with `_` if that’s the house rule).
- If the repo enforces **import sorting**, keep it consistent.

## TypeScript and ESLint diagnostic workflow

- **Authority:** Treat **CLI** checks (`type-check`, `lint`, targeted `eslint` on paths) as source of truth when editor and CLI disagree; align editor with the workspace config and **same TypeScript version**.
- **Before changing code:** Note **ts vs eslint** and the **full** message or **rule id** (e.g. `TS2677`, `@typescript-eslint/...`). Abbreviated labels are not enough to choose a fix.
- **Type predicates (`value is T`):** Change or remove only when the **runtime check does not justify** the narrow type. Do not delete sound guards (e.g. `typeof x === 'string'` supporting `value is string`) to silence an unclear hint.
- **Fix direction:** Prefer **correct types and call sites** over turning off `strict` or blanket `eslint-disable`. Use **scoped** suppressions only when the rule id is known and the exception is justified.
- **Verification:** After substantive TS/ESLint fixes, run **type-check** and **lint** (and **tests** when behavior may have changed).

## Architecture and structure

- **Layering:** Shared / infra / domain layers should **not import upward** into UI, routes, or app shell in ways that create cycles or hide app-only config in “shared.” When shared code needs config, use **narrow types** and **map** from env at **boundaries** (handlers, actions, composition root).
- **Single source of truth:** For allowed values (locales, providers, flags, etc.), define once (const, enum, schema) and **derive** scripts, UI, and validation—avoid duplicated literals.
- **Tests:** Prefer **colocated** unit tests next to the module under test.
- **Multi-file features:** Prefer a **dedicated folder** (e.g. kebab-case) with **short basenames** that do not repeat the folder name.

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
