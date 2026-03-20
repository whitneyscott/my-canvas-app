# Teacher QA Checklist — Canvas Bulk Editor

Use this to verify GUI behavior against Canvas API routes (`/canvas/courses/:id/...`). Field definitions live in `public/js/config.js`; sync and grid logic in `public/js/main.js`. **Bulk Actions** (Search & Replace, Date Shift, Points) are checked **per endpoint** in each tab section below—not in Global. The **FlowStateASL / Render** section is for the sibling project’s deploy health (separate repo).

## Before you start

- [x] Use **Production** or **Developer** mode (⚙️ Mode). **Demo** mode only allows a subset of tabs.
- [x] Authenticated (LTI + token or manual token); **course selected** from dropdown.
- [x] Use a **sandbox / test course** for delete/clone tests.

## Global (all grid tabs)

- [x] **Course dropdown**: loads courses; switching course reloads the active tab.
- [x] **Refresh**: reloads current tab data.
- [x] **Columns**: show/hide columns; grid updates.
- [x] **Sync Changes**: after editing cells, changes push to Canvas and row shows synced (no errors in UI).

**Bulk Actions reminder:** Search & Replace uses **selected rows**, or if none selected, **all filtered rows** (string columns only). Date Shift uses checked date fields in the modal. Points requires **row selection**. Each is verified under the relevant endpoint section.

---

## Assignments — `GET/PUT /canvas/courses/:id/assignments`

- [x] Grid loads with assignment list.
- [ ] **Name** (text): edit → Sync → verify in Canvas.
- [ ] **Description** (HTML): edit → Sync → verify in Canvas.
- [ ] **Assignment Group** (dropdown): change → Sync → verify.
- [ ] **Points possible**: edit → Sync → verify.
- [ ] **Due / Available From / Available Until**: edit → Sync → verify (dates).
- [ ] **Published**: visible in grid; field is read-only for inline edit in config—verify expected behavior if you use a publish workflow elsewhere.
- [ ] **Search & Replace** on name or description (string fields).
- [ ] **Date Shift** on `due_at`, `unlock_at`, `lock_at`.
- [ ] **Points** on `points_possible`.
- [ ] **Clone** (modal): standard / structural / deep as applicable → refresh → verify in Canvas for **deep**.
- [ ] **Delete** (confirm DELETE) → item removed in Canvas.

---

## New Quizzes — `GET/PUT /canvas/courses/:id/new_quizzes` (Canvas New Quizzes API)

- [ ] Grid loads with New Quiz list (Name and Instructions populated).
- [ ] **Name** (text): edit → Sync → verify in Canvas New Quiz.
- [ ] **Instructions** (HTML): edit → Sync → verify in Canvas New Quiz.
- [ ] **Assignment Group** (dropdown): change → Sync → verify.
- [ ] **Points possible**: edit → Sync → verify.
- [ ] **Due / Available From / Available Until**: edit → Sync → verify (dates).
- [ ] **Published**: visible in grid; field is read-only in config.
- [ ] **Search & Replace** on name or instructions (string fields).
- [ ] **Date Shift** on `due_at`, `unlock_at`, `lock_at`.
- [ ] **Points** on `points_possible`.
- [ ] **Clone** / **Delete**: verify behavior if implemented; otherwise skip or note.

---

## Modules — `GET/POST/PUT/DELETE …/modules` (+ items for clone/delete)

- [ ] Grid loads with modules (and items when included).
- [ ] **Module Name**, **Position**, **Unlock Date**: edit → Sync → verify.
- [ ] **Published** display (read-only in config).
- [ ] **Merge Modules** (Bulk Actions): only on this tab; merge 2+ modules → verify structure in Canvas.
- [ ] **Clone**: opens **module-specific** clone modal — structure only / structure+shared / **deep copy** → verify.
- [ ] **Delete**: **module only** vs **module and items** → verify in Canvas.
- [ ] **Date Shift** on `unlock_at` if present on rows.
- [ ] **Search & Replace** on name (string).
- [ ] **Points** on `position` (numeric).

---

## Pages — `GET/PUT …/pages` (id = page `url`)

- [ ] Grid loads pages.
- [ ] **Page Title**: edit → Sync → verify.
- [ ] **Content (body)**: edit → Sync → verify in Canvas page body.
- [ ] **Published** (read-only in grid config).
- [ ] **Search & Replace** on title or body (body must be string in grid).
- [ ] **Date Shift** / **Points**: N/A for this tab (`pages` has no date or points columns in `config.js`).
- [ ] **Clone**: deep clone fetches full page then creates new → verify; UI-only clone adds local row only until you confirm expected behavior.
- [ ] **Delete** by page slug/url → verify.

---

## Quizzes — `GET/PUT …/quizzes`

- [ ] Grid loads quizzes.
- [ ] **Quiz Title**: edit → Sync → verify.
- [ ] **Description**: read-only in UI; confirm you cannot rely on inline description edit.
- [ ] **Assignment Group**: change → Sync → verify.
- [ ] **Time limit**, **Allowed attempts**: edit → Sync → verify.
- [ ] **Due / Available From / Available Until**, **Show Answers At / Hide Answers At**: edit → Sync → verify (server may route `due_at` via assignment for graded quizzes).
- [ ] **Points** (bulk) on `time_limit` or `allowed_attempts`.
- [ ] **Date Shift** on quiz date fields.
- [ ] **Search & Replace** on title.
- [ ] **Clone** deep: fetches quiz + creates copy → verify.
- [ ] **Delete** → verify.

---

## Discussions — `GET/PUT …/discussions` (config key `discussion_topics`)

- [ ] Grid loads topics.
- [ ] **Title**: edit → Sync → verify.
- [ ] **Message**: read-only in config (no inline body sync from grid).
- [ ] **Allow Rating**: toggle → Sync → verify.
- [ ] **Delayed Post**, **Lock / Unlock**, **Due**: edit → Sync → verify.
- [ ] **Search & Replace** on title.
- [ ] **Date Shift** on discussion date fields.
- [ ] **Points**: N/A (no points column on discussions grid).
- [ ] **Clone** deep → verify.
- [ ] **Delete** → verify.

---

## Announcements — `GET/PUT …/announcements` (discussion_topics API)

- [ ] Grid loads announcements.
- [ ] **Title**, **Message** (HTML): edit → Sync → verify.
- [ ] **Allow Rating**, **Delayed Post**, **Lock / Unlock**, **Due**: edit → Sync → verify.
- [ ] **Search & Replace** on title / message.
- [ ] **Date Shift** on date fields.
- [ ] **Points**: N/A (no points column on announcements grid).
- [ ] **Clone** deep → verify.
- [ ] **Delete** → verify.

---

## Files — `GET/PUT/DELETE …/files` (+ folders)

- [ ] Grid loads files and folders (folders shown as rows with `is_folder`).
- [ ] **File Name** (`display_name`): edit → Sync → verify.
- [ ] **Folder Name** (`name` on folder rows): edit → Sync → verify.
- [ ] **Locked** display (read-only).
- [ ] **Delete** selected file vs folder (confirm Canvas behavior).
- [ ] **Search & Replace** on `display_name` (strings only).
- [ ] **Date Shift** on folder `unlock_at` / `lock_at` when those columns apply (folder rows).
- [ ] **Points** (bulk) on `parent_folder_id` only if you use that workflow; otherwise skip.
- [ ] **Clone / Merge**: N/A or tab-specific—confirm UI matches expectations for files.

---

## Standards Sync (Accreditation) — not a Canvas object grid

- [ ] Tab shows **Accreditation Profile** form (state → city → institution → program → focus).
- [ ] **Save Profile** persists (course accreditation profile via API).
- [ ] **Outcomes & Standards**: outcomes list loads; **standards** text per outcome **Save** updates outcome description via API.
- [ ] **Apply to course** (accreditation standards checkboxes) saves **selectedStandards** on profile and refreshes.

---

## ADA Compliance Sync

- [ ] Tab opens without error.
- [ ] If grid stays empty: treat as **not implemented** until `ada_compliance` has `FIELD_DEFINITIONS` (see `TODO.md`)—note in your runbook.

---

## Known gaps (optional expected-fail row)

- [ ] **Assign To** modal: `executeAssignTo` is **not implemented** (see `TODO.md`) — button may error; skip or log as bug.

---

## Related project: FlowStateASL — fix failed Render build

*Separate codebase from Canvas Bulk Editor. Work in the FlowStateASL repo; track progress here.*

- [ ] **Render → Service → Events / Logs**: capture the exact failing step (build vs start) and the last 30–50 log lines.
- [ ] **Reproduce locally** in FlowStateASL: same Node major as Render (`node -v` vs Render **Environment** Node version); run the same command Render uses (`npm ci` + `npm run build` or `yarn build`, etc.).
- [ ] **Build command / root**: Render **Root Directory** matches the folder with `package.json`; **Build Command** matches how the app is built (no stale `cd` or wrong workspace).
- [ ] **TypeScript / lint**: `npm run build` (or project equivalent) passes with **zero errors**; fix any TS errors Render surfaces first—they often fail CI with no custom message.
- [ ] **Dependencies**: lockfile committed (`package-lock.json` / `yarn.lock`); no `optionalDependencies` or platform binaries failing on Linux (Render is Linux, not Windows).
- [ ] **Env at build time**: if the build imports `process.env.*`, required vars are set under Render **Environment** for **Build** (not only Runtime), or build is changed not to require secrets at compile time.
- [ ] **Start command**: matches production entry (`node dist/main.js`, `npm run start:prod`, etc.); **PORT** uses `process.env.PORT` if the framework expects it.
- [ ] **Clear build cache & redeploy** (Render **Manual Deploy** → **Clear build cache & deploy**) after lockfile or native dep changes.
- [ ] **GitHub**: fix pushed to default branch; Render shows **Live** deploy for that commit.

---

## Quick Canvas API ↔ tab map

| Tab           | Primary list endpoint   |
|---------------|-------------------------|
| Assignments   | `…/assignments`         |
| New Quizzes   | `…/new_quizzes`         |
| Modules       | `…/modules`             |
| Pages         | `…/pages`               |
| Quizzes       | `…/quizzes`             |
| Discussions   | `…/discussions`         |
| Announcements | `…/announcements`       |
| Files         | `…/files` (files+folders) |
