# App shell — improvements plan

**Scope:** Shared **renderer** state (`PhotosContext`, scan revision) and how it stays consistent with the **main** process (scanner cache) when files are removed or the library changes.  
**Not in scope here:** Per-feature UI — see the feature’s own plan.  
**Related:** [Quality review plan](./quality-review-improvements-plan.md) · [Dedup plan](./dedup-improvements-plan.md) · [Organizer plan](./organizer-improvements-plan.md)

**Last reviewed against repo:** 2026-04-19

---

## Checklist

- [ ] **Renderer — `photos` after Trash:** On successful `trashFiles` from any feature, filter trashed paths out of `PhotosContext` (or a small `removePathsFromPhotos(paths: string[])` helper used by Quality, Dedup, etc.) so the Scanner count and other tabs do not list missing files until rescan.
- [ ] **Main process — `getCachedPhotos()` / scanner cache:** If handlers still assume trashed files exist, update, remove, or invalidate cache entries when files are moved to Trash so main-side state matches disk.

---

## Progress log (optional)

| Date | Note |
|------|------|
| 2026-04-19 | Split out from the combined plan; cross-cutting `photos` / cache items live here. |
