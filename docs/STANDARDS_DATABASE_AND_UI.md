# Standards database & UI (ASLTA / BEI template)

## Storage

- **Service:** `services/accreditation-lookup`
- **Tables:** `standards_organization`, `standard_node` (hierarchy via `parent_public_id`, `kind` = `group` | `leaf`), `standards_sync_state`
- **Seed files:** `services/accreditation-lookup/data/standards/aslta.json`, `bei.json`
- **API:** `GET /standards?org=ASLTA` (or `BEI`) returns flat nodes with `parentId`, `kind`, `groupCode`, `sortOrder`
- **Refresh:** `POST /admin/sync` with `source: "standards"` (auth: `ADMIN_SYNC_SECRET`); weekly cron Monday 05:00 UTC (when secret is set)
- **Canvas app:** resolves standards via `ACCREDITATION_LOOKUP_URL` + `/standards?org=…`; prefers **abbreviation** over numeric accreditor `id` so CHEA rows map to org keys like `ASLTA`

## Display: rubrics & resource ↔ standards

**Recommended approach**

1. **Standards Sync tab** — Keep course-level **profile** + **selected** top-level or leaf IDs (stored in Canvas accreditation profile page). Tree UI can expand **group** nodes and check **leaf** indicators only (or allow domain-level selection if you add that policy).

2. **Outcomes** — Already support `|STANDARDS:id1,id2|` in outcome descriptions. When editing outcomes (or creating them from standards), show a **tree filtered to the course’s selected standards org(s)** and **leaf** rows as checkboxes; groups as expand-only headers.

3. **Rubrics** — When creating/editing a rubric (or rubric criteria), reuse the **same tree component**:
   - Filter to **leaf** `kind` for alignments that must be measurable
   - Optional: allow **group**-level tag for high-level mapping only

4. **Assignments / quizzes / pages** — “Match to standards” flows should call the same **standards payload** (`getAccreditationStandardsForCourse` or a dedicated endpoint returning hierarchical structure) and store chosen IDs in metadata you already use (e.g. outcome links, description tags, or a future JSON field).

**Why shared component:** One hierarchy + one ID scheme avoids drift between profile picker, outcomes, and rubrics.

**Next implementation steps (frontend):** Extract a small **standards tree** module (expand/collapse, leaf-only selection mode); mount it from Standards Sync, outcome editor, and rubric editor entry points with `leafOnly: true` for fine-grained indicators.
