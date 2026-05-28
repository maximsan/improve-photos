# Manual QA checklist — release verification

Run through this before cutting a release DMG. Each section maps to one feature tab.

---

## Setup

- [ ] Build a clean DMG: `pnpm build:mac`
- [ ] Install the DMG on a clean macOS user account (not the dev machine)
- [ ] Grant the app access to the test photo folder when macOS prompts
- [ ] Run Electron smoke tests from built output: `pnpm build && pnpm test:e2e`
- [ ] Confirm payments, auto-updates, and release publishing are disabled unless final v1 approval has explicitly enabled them
- [ ] Confirm no release was created or published by local build, push, merge, test, or CI smoke runs

`pnpm test:e2e` connects to Electron through a loopback Chrome DevTools Protocol port on `127.0.0.1`.

---

## 1. Scanner

| # | Scenario | Expected |
|---|----------|----------|
| 1.1 | Open app — Scanner tab is shown | "Scan Folder" header, "Choose Folder" button visible |
| 1.2 | Choose a small folder (< 50 photos, mix of JPEG + PNG) | Progress bar appears; scan completes; photo count shown |
| 1.3 | Choose a large folder (1 000+ files) | Progress increments without freezing; scan completes |
| 1.4 | Folder contains HEIC files from an iPhone | HEIC photos appear in results with correct dimensions and EXIF date |
| 1.5 | Folder contains no image files | "0 photos" result (or empty state — no crash) |
| 1.6 | Rescan the same folder (click Rescan) | Count matches previous scan; no duplicate entries |
| 1.7 | Reset after a scan | Returns to idle "Choose Folder" state; other tabs clear their state |
| 1.8 | Cancel by choosing a different folder mid-flow | New folder replaces previous; no stale data |

---

## 2. Duplicates

| # | Scenario | Expected |
|---|----------|----------|
| 2.1 | Open Duplicates tab with no scan | "Scan photos first" callout visible; Analyze button disabled |
| 2.2 | Analyze a folder with known duplicates | Groups shown; each group lists photos sorted largest-first |
| 2.3 | Analyze a folder with no duplicates | "No duplicates found" result (not an error) |
| 2.4 | Cancel analysis mid-hash | Returns to idle; no partial results shown |
| 2.5 | Mark one photo per group for trash | Selected count updates in real time |
| 2.6 | Confirm trash | macOS confirmation dialog appears; files moved to Trash |
| 2.7 | After trash: groups with only one remaining photo disappear | Remaining groups update correctly |
| 2.8 | Rescan (from Scanner) resets Duplicates tab | Tab returns to idle |

---

## 3. Organizer

| # | Scenario | Expected |
|---|----------|----------|
| 3.1 | Open Organizer tab with no scan | "Scan photos first" callout visible |
| 3.2 | Preview organize on a dated library | Target paths shown in `YYYY/MM/DD/` format; no files moved yet |
| 3.3 | Photos without EXIF date | Placed in `undated/` folder in preview |
| 3.4 | Conflict: file already exists at target path | Conflict indicator shown in preview; handled without overwrite |
| 3.5 | Execute organize | Files moved; success state shown |
| 3.6 | All photos already in correct structure | "Already organised" state shown (no-op, no error) |

---

## 4. Quality

| # | Scenario | Expected |
|---|----------|----------|
| 4.1 | Open Quality tab with no scan | "Scan photos first" callout visible |
| 4.2 | Score a mixed library | Photos appear in tiers (sharp / acceptable / blurry) |
| 4.3 | Select all in a tier | Checkbox selects all photos in that tier |
| 4.4 | Deselect all | Selection clears |
| 4.5 | Confirm trash | Files moved to Trash; done state shown |
| 4.6 | Rescan resets Quality tab | Returns to idle |

---

## 5. Exporter

| # | Scenario | Expected |
|---|----------|----------|
| 5.1 | Open Exporter tab with no scan | "Batch export photos" empty state with needsScan callout |
| 5.2 | After scan: default preset visible | At least one preset row shown |
| 5.3 | Choose output folder | Folder path shown in the UI |
| 5.4 | Export with JPEG preset | Files written to output folder; correct format and approximate file size |
| 5.5 | Export with WebP preset | Files are valid WebP |
| 5.6 | Export with resize (e.g. max 1920 px) | Output images do not exceed the specified dimension |
| 5.7 | Cancel is not shown (batch runs to completion) | Progress reaches 100%; done state shown |

---

## 6. Settings and release gates

| # | Scenario | Expected |
|---|----------|----------|
| 6.1 | Open Settings before final v1 approval | Payments, auto-updates, and release publishing are shown as paused or disabled |
| 6.2 | Payments gate is disabled | No Lemon Squeezy activation or payment network request runs |
| 6.3 | Auto-update gate is disabled | No GitHub Releases update check runs |
| 6.4 | Release publishing gate is disabled | No release publishing workflow is available from ordinary build or test commands |

---

## 7. Licensing and free limit

| # | Scenario | Expected |
|---|----------|----------|
| 7.1 | Unlicensed workflow action with 100 or fewer photos | Work can start |
| 7.2 | Unlicensed workflow action with more than 100 photos | Upgrade prompt appears before work begins |
| 7.3 | Licensed workflow action with more than 100 photos | Work can start without the free-limit prompt |
| 7.4 | Payments are disabled | Core workflow testing is not blocked by license activation |

---

## 8. Edge cases and permissions

| # | Scenario | Expected |
|---|----------|----------|
| 8.1 | Folder on an external drive | Scans and processes correctly |
| 8.2 | Filenames with Unicode or spaces | Displayed and processed without corruption |
| 8.3 | Very deeply nested folders (5+ levels) | walkDir recurses; all images found |
| 8.4 | Read-only output folder (for Organizer/Exporter) | Clear error message; no crash |
| 8.5 | Revoke folder access in System Settings mid-scan | Error surface shown; app does not hang |
| 8.6 | Very large individual file (50 MB+ TIFF) | Processed without memory spike visible in Activity Monitor |
