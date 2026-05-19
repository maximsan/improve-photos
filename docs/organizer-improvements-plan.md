# Organizer — improvements plan

**Scope:** **Organize** tab — date-based folder moves (`src/renderer/src/features/Organizer/`, `src/main/ipc/organizer.ts`).  
**Related:** [App shell plan](./app-shell-improvements-plan.md) (optional `scanRoot` in `PhotosContext`) · [CODEBASE_REVIEW_AND_PLAN.md](../CODEBASE_REVIEW_AND_PLAN.md)

**Last reviewed against repo:** 2026-04-19

---

## Checklist

- [ ] **Explicit library root:** Pass the folder used in the last **scan** into `previewOrganize` / `executeOrganize` instead of inferring `rootDir` with `dirname(dirname(photos[0].path))` (wrong for flat libraries or deep nesting). May require `scanRoot` in `PhotosContext` — see [app shell plan](./app-shell-improvements-plan.md).
- [ ] **Preview UI:** Show the **resolved root directory** in the preview header so users can confirm where `YYYY/MM/DD` folders will be created.

---

## Progress log (optional)

| Date | Note |
|------|------|
| 2026-04-19 | Split from the combined plan. |
