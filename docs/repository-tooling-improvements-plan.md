# Repository tooling — improvements plan

**Scope:** **Repo hygiene** — scripts, CI, automated checks. Not app features.  
**Related:** [CODEBASE_REVIEW_AND_PLAN.md](../CODEBASE_REVIEW_AND_PLAN.md) (testing / CI section)

**Last reviewed against repo:** 2026-05-19

---

## Checklist

- [x] **package.json:** Standard `test`, `test:watch`, `test:coverage`, and `test:e2e` scripts exist.
- [x] **CI:** `.github/workflows/ci.yml` runs `typecheck`, `lint`, and `test` on push/PR to `main`; the separate `e2e` job runs `build` then `test:e2e`.
- [x] **E2E smoke:** `tests/e2e/app.spec.ts` uses a loopback CDP port on `127.0.0.1` and expects `pnpm build` to run first.

---

## Progress log (optional)

| Date | Note |
|------|------|
| 2026-04-19 | Split from the combined plan. |
| 2026-05-19 | Verified scripts and CI are present; added current E2E note. |
