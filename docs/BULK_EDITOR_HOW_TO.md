# Canvas Bulk Editor — User How-To Manual

This guide describes the **Canvas Bulk Editor** web app: signing in, choosing a course, working with the data grid, using bulk actions, syncing changes to Canvas, and using the **ADA Compliance Sync** and **Standards Sync** areas.

---

## 1. Getting access

Depending on how your institution deployed the app, you may see one of these first:

- **Authorize with Canvas** — OAuth flow. Use the button to grant access; the app then loads your courses.
- **Canvas Base URL + API token** — Enter your institution’s Canvas URL (for example `https://yourschool.instructure.com`) and a personal access token from **Account → Settings → Approved Integrations**.

After a successful login, the main layout appears: a **left sidebar** (tabs), a **top toolbar**, and a **content area** (grid or special panels).

---

## 2. Main layout

### 2.1 Sidebar tabs

**Canvas Objects** (each opens a spreadsheet-style grid for that object type):

| Tab | What you edit |
|-----|----------------|
| Assignments | Assignment titles, groups, dates, points, rubrics, descriptions, publish-related fields, and more (per visible columns). |
| Modules | Module structure, names, positions, publish state. |
| Pages | Page titles, body HTML, publish dates, published flag (read-only where noted). |
| Quizzes | Classic quiz fields exposed in the grid (including time limit and allowed attempts via bulk actions). |
| New Quizzes | New Quizzes assignments: name, instructions, groups, rubric, points, dates, published state. |
| Discussions | Discussion topics and related fields; **Add Rating** bulk action appears on this tab. |
| Announcements | Announcements and their editable columns. |
| Files | Files and folders (renames and similar edits; folder **delete** is not available here — see Safety). |

**Review and Alignment**:

| Tab | Purpose |
|-----|---------|
| **ADA Compliance Sync** | Run accessibility scans, review findings in a grid, optionally generate AI fix previews and apply approved fixes. |
| **Standards Sync** | Accreditation profile (location, institution, program), workflow status, standards/outcomes trees, and content alignment tools. |

### 2.2 Toolbar (typical order)

- **Course** dropdown — Pick the Canvas course. Data loads when you change course or switch object tabs.
- **Bulk Actions** — Opens a menu of operations (contents depend on the active tab; see section 5).
- **Columns** — Show or hide grid columns in bulk (see section 7).
- **Sync Changes** — Pushes pending edits from the grid to Canvas (see section 6).
- **Revert Last Sync** — Appears when a revert snapshot exists; confirms before undoing the last grid sync for that context.
- **Last sync: …** — Opens **Sync History** when available.
- **Refresh** — Reloads data for the current tab.
- **Mode** — Opens **Application Mode Settings** (Demo / Production / Developer); Production and Developer require the mode password configured on the server.

### 2.3 Safety banner

A yellow banner explains that the tool calls the Canvas API directly, that **deletes are permanent**, that **folder deletion is disabled** in this app, and that you should use a **sandbox course** to practice. You can dismiss it; optional **Do not show again** stores that choice in the browser.

### 2.4 Developer tools

In **Developer** mode, a **System Debug Monitor** panel may be visible for technical troubleshooting (copy/clear log). **Demo** and **Production** hide that panel.

---

## 3. Working with the grid

### 3.1 Rows and selection

- Rows can be **selected** with checkboxes (and header selection where enabled).
- Many bulk actions apply to **selected rows**, or to **all rows that match the current filters** if nothing is selected (the UI states this where relevant — for example Search & Replace, Add Rating).

### 3.2 Editing cells

- **Editable** cells can be changed inline (text, numbers, dates, HTML where offered, dropdowns for groups/rubrics, etc.).
- After you edit, rows are tracked as **modified** until you **Sync Changes** or undo (see below).
- **Read-only** columns (for example **Published** on some types) cannot be edited in the cell; use **Publish** under Bulk Actions where supported.

### 3.3 Filters

Column header areas support **text**, **date range**, and **select** filters (where configured). Filtering narrows what you see; bulk actions that say “selected/filtered” can target **filtered rows** when no explicit row selection is made.

### 3.4 Undo last cell edit

With focus **not** inside an input or rich editor, **Ctrl+Z** runs **undo** for the last cell edit stack for the current tab (only in-memory edits; not a substitute for **Revert Last Sync** after pushing to Canvas).

---

## 4. Tab-specific toolbar behavior

These rules keep the Bulk Actions menu aligned with what the grid can do:

- **Modules** — **Points** is hidden; **Position** appears (same underlying modal, retitled). **Merge Modules** appears.
- **Files** — **Points**, **Assignment Group**, and **Publish** are hidden. If a **folder** is selected, **Delete** is disabled (folders must be removed in Canvas).
- **Quizzes** — **Time Limit** and **Allowed Attempts** appear.
- **Discussions** — **Add Rating** appears.
- **ADA Compliance Sync** — The Bulk Actions menu shows only **Fix** (other bulk actions are hidden on this tab).

---

## 5. Bulk Actions (reference)

Open **Bulk Actions** from the toolbar. Unless noted, select rows first when the app asks you to.

### 5.1 Search & Replace

- **Target Column** — Choose which field to change.
- **Search For** — Literal text or, with **Use Regex**, a pattern.
- **Replace With** — Replacement text.
- **Apply to Selected/Filtered** — Runs on selection, or on all filtered rows if none selected.

### 5.2 Date Shift (Smart Date & Time Shift)

- **Semester Offset Calculator** — Enter old and new semester start dates, then **Calculate** to fill **Days to Offset**.
- **Days to Offset** — Positive or negative whole days applied to chosen date columns.
- **Time Override** — Optional fixed time (minute resolution) for shifted dates; leave blank to preserve each row’s time.
- **Apply to Date Fields** — Checkboxes for which date columns to touch; **Toggle All** helps select/deselect.
- **Fixed Date Override** — Sets selected date columns to one calendar date/time (ignores offset). The help text explains clearing behavior for “clearing” dates via offset 0.
- **Apply Changes** — Updates the grid (then **Sync Changes** to send to Canvas).

### 5.3 Points / Position

- On most object tabs this is **Points/Weighting**: pick column, operation (**Set**, **Multiply**, **Add/Subtract**), and **Value**.
- On **Modules** it becomes **Position** with the same operations against the position column.

### 5.4 Time Limit (Quizzes tab)

- **Set to**, **Add**, or **Remove limit** (Canvas uses **minutes**, not seconds).

### 5.5 Allowed Attempts (Quizzes tab)

- **Set to**, **Add**, or **Set to unlimited (-1)**.

### 5.6 Add Rating (Discussions tab)

- **Allow Rating** or **Disallow Rating** for selected rows, or all filtered rows if none selected.

### 5.7 Assignment Group

- Move selected assignments/quizzes to an existing **Assignment Group**, or create a **New group name** when that option is available.

### 5.8 Publish

- **Published** or **Unpublished** for selected/filtered items that support it.

### 5.9 Clone

- **Non-modules** — **Clone Content** modal:
  - **Add to Grid (then Sync to Canvas)** — New rows appear as modified; **Sync Changes** creates them in Canvas.
  - **Structural Clone (Empty Shell)** / **Deep Clone (Modules only)** — Strategies for structure vs full copy where supported.
  - Naming: copies count, **Serialize names**, **Prefix** / **Suffix**.
- **Modules** — **Clone Module(s)** modal:
  - **Number of copies**, **Placement** (top, bottom, before/after selection), **Prefix** / **Base name** / **Suffix**, **Auto-increment suffix**.
  - **Structure Only**, **Structure + Shared Content**, or **Deep Copy**.

### 5.10 Merge Modules (Modules tab)

- Pick the **Target Item (the one to keep)**. Other selected modules are removed from the grid; their names are merged into the target per app logic. Confirm with **Confirm Merge**.

### 5.11 Delete

- **Non-modules** — **Delete Items**: type **DELETE** to confirm; action is **permanent** in Canvas.
- **Modules** — **Delete Module Only** vs **Delete Module and All Items** (destructive).

### 5.12 Fix (ADA Compliance Sync tab only)

- Starts the **accessibility fix preview** workflow (see section 8). Use after you have scan **Findings** displayed.

---

## 6. Sync Changes, history, and revert

### 6.1 What “Sync Changes” does

- Collects all **pending modifications** on the **current** tab.
- Creates **new** Canvas objects for temporary (“new”) rows where the tab supports creation (for example cloned items added to the grid).
- Sends **updates** for existing items via the app’s Canvas integration.
- Shows progress and a short result summary when finished.

You must **select a course** and have **at least one change**; otherwise the app warns you.

### 6.2 Sync History and Revert Last Sync

- **Sync History** lists recent sync-related activity.
- **Revert Last Sync** attempts to roll back the **last** sync operation that stored a reversible snapshot.

**Important:** The **Revert Sync** dialog states that **bulk action syncs are not revertable** in the current release. Treat **Sync Changes** after large bulk edits as **final** unless you have another recovery path (for example restoring the course from Canvas or re-running edits).

### 6.3 Refresh

**Refresh** reloads server data for the tab and clears the local grid view of stale rows; it does not replace the need to be careful before sync/delete.

---

## 7. Columns (Show/Hide)

**Columns** opens **Show/Hide Columns**:

- Checked vs unchecked columns follow the **mode** you choose: **Show checked columns** or **Hide checked columns** (the short help text at the top of the modal explains the behavior).
- **Apply** updates the grid layout.

---

## 8. ADA Compliance Sync

### 8.1 Overview

1. Select a **course**.
2. Open **ADA Compliance Sync**.
3. Configure **Resource types** (Pages, Assignments, Announcements, Discussions, Syllabus) and **rule sets** (**Canvas parity checks** and **Additional checks**).
4. Optional: **Canvas baseline (ms)** for performance comparison on the scan.
5. **Run Scan**.

### 8.2 After the scan

- Summary shows **findings** counts by severity, **resources scanned**, timing, and optional comparison to the Canvas baseline.
- **Export CSV** downloads findings for offline review.
- **Recent runs** table (stored in the browser) helps compare past scans.

### 8.3 Findings grid and Fix Queue

- If there are findings, a grid lists them; **Generate Fix Preview** builds proposed fixes (may call AI services depending on deployment).
- The **Fix Queue** section can show **filters**, a **cost/summary** line (when applicable), previews, and **Apply Approved Fixes**.
- Rate limits or caps may surface notices in the Fix Queue area; approve only what you intend to apply.

Use **Bulk Actions → Fix** on this tab as an alternative path to generate the fix preview workflow.

---

## 9. Standards Sync

### 9.1 Accreditation Profile

Cascading fields: **State** → **City** → **Institution** → **Program** → **Program Focus**. **Save Profile** persists your choices for the course context.

### 9.2 Workflow

Shows **stage** states (for example Workflow, Standards, Outcomes, Rubrics, Instruction, Resources, Quizzes) and whether stages are **locked**, plus a collapsible **operation log**.

### 9.3 Outcomes & Standards

- Loads standards trees by program/focus (with source and confidence labels when returned by the server).
- Tree actions: **Expand all**, **Collapse all**, **Select all leaves**, **Clear all leaves**.
- Buttons typically include **Apply to course**, **Get AI suggestions**, **Finalize standards**, and **Approve selected & create outcomes** (exact availability follows server data and workflow).

### 9.4 Content Alignment

Section for analyzing how course content aligns to selected standards/outcomes (content depends on loaded data).

For deeper technical detail on standards data, see other docs in the repository’s `docs/` folder as maintained by your team.

---

## 10. Limitations and good practice

- **Deletes** cannot be undone from this app; module deletes can remove substantial content.
- **Folder delete** is **disabled** in the Bulk Editor; manage folder removal in Canvas.
- **Revert** may not cover every operation; plan risky work in a **sandbox** or blueprint copy.
- **API and permissions** — Your token or OAuth scopes must allow the operations you perform; failures often appear as toast errors or in the debug log (Developer mode).
- **Concurrent users** — Two people editing the same course simultaneously can overwrite each other’s work; coordinate for high-risk changes.

---

## 11. Troubleshooting (short)

| Issue | What to try |
|--------|-------------|
| No courses / connection errors | Re-check Canvas URL and token, or re-authorize OAuth; confirm VPN or institutional network policies. |
| Sync fails for some rows | Use **Refresh**, verify the row still exists in Canvas, check assignment group / rubric IDs, and inspect error text in toasts or the debug panel. |
| Grid looks empty after tab switch | Select the course again; **Refresh**; confirm you are not on **Standards Sync** or **ADA Compliance** (those replace the grid with panels). |
| Wrong tab blocked with “Module Integration Pending” | **Tab interception** is a special dev flag; normal Demo/Production modes allow standard tabs. |

---

*This manual matches the application behavior as implemented in the Canvas Bulk Editor codebase. If your host customizes labels or hides features, defer to your local administrator.*
