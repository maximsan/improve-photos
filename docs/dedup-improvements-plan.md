# Dedup — improvements plan

**Scope:** **Deduplication** feature — duplicate groups, hashing, review trash (`src/renderer/src/features/Dedup/`, `src/main/ipc/dedup.ts`).  
**Related:** [App shell plan](./app-shell-improvements-plan.md) (keeping global `photos` in sync after trash) · [CODEBASE_REVIEW_AND_PLAN.md](../CODEBASE_REVIEW_AND_PLAN.md)

**Last reviewed against repo:** 2026-04-19

---

## Checklist

- [ ] **Global `photos` list:** `applyTrash` today updates **duplicate groups** only, not `PhotosContext.photos`. If the product should show a consistent library everywhere, also remove trashed paths from `photos` (align with [app shell plan](./app-shell-improvements-plan.md)).

---

## Progress log (optional)

| Date | Note |
|------|------|
| 2026-04-19 | Split from the combined plan. |
