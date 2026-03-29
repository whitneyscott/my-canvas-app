# Accreditation Module — Implementation Plan (Canonical)

Single source of truth for accreditation work in this repo.

**North star:** A **powerful standards alignment tool**—not only picking standards and surfacing suggestions, but helping teachers **bring assignment prompts and rubric language into explicit, auditable alignment** with the authoritative wording of selected standards (and with course outcomes), with clear before/apply flows and evidence an auditor can follow.

**Accreditation report writers:** Self-study and evidence binders are **brutally manual**. The product must **collect and join** alignment data—**standards, outcomes, rubrics, assignments, gaps, and change history**—into **stable exports** (CSV, JSON, optional bundles) so authors spend less time reconciling Canvas screens and spreadsheets.

---

## Accreditation Manager — intended workflow (product objective)

The tool is meant to support an end-to-end accreditation loop in Canvas, not only “pick standards”:

1. **Course context** — Capture institution, program, and focus (CIP) so standards resolution is scoped to the offering (`docs/USER_GUIDE.md` §9.1).
2. **Standards** — Load hierarchical standards for that context; the instructor selects applicable **leaf** (and optionally group) IDs; persist selection on the course accreditation profile (Standards Sync tab; Phase A).
3. **Outcomes** — **Materialize** selected standards as Canvas course outcomes (or link to existing ones) using stable `|STANDARDS:...|` metadata in outcome descriptions (Phase A.5).
4. **Content analysis** — **Scan** course artifacts (assignments, discussions, pages, announcements, quizzes, rubrics) against the selected standard set and surfaced text (Phase B: `getAccreditationAlignment` + alignment UI).
5. **Match existing content** — Show **current** mappings (outcome-linked standards, rubric criteria tags, resource-level suggestions) and **gaps** (e.g. items with weak or no alignment, assignments/discussions **without rubrics** where rubrics are the primary measurable link).
6. **Close gaps (assisted)** — Actions such as **apply suggested standards** to outcomes, **apply tagging** to resource bodies, **create rubric** from suggested criteria, and attach or align rubrics so assignments line up with measurable criteria (alignment UI + `createRubricForResource` / tagging APIs).
7. **Chain: standards → rubrics → assignments** — Standards map to **rubric criteria** text; assignments (and similar gradable items) align through **rubric attachment** and criterion-level tags (see storage table below). The UI workflow stages (Workflow → Standards → Outcomes → Rubrics → Instruction → Resources → Quizzes) reflect this progression (`public/js/main.js` stage labels + `GET .../accreditation/workflow`).
8. **Evidence for the report** — Produce a **single joined view** (and exports) that links **standard ID ↔ course outcome ↔ rubric / criterion ↔ graded artifact**, plus **gaps** and **workflow log** entries, so accreditation authors can draft narratives from data instead of manual archaeology.

**Where the longer narrative lives today (no single standalone spec):**

| Document | What it adds |
|----------|----------------|
| [`docs/USER_GUIDE.md`](./docs/USER_GUIDE.md) §9 | Operator-facing **Standards Sync**: profile cascade, **workflow** stages and log, outcomes & standards **buttons**, content alignment overview. |
| [`docs/STANDARDS_DATABASE_AND_UI.md`](./docs/STANDARDS_DATABASE_AND_UI.md) | Lookup DB/API, and **recommended** shared standards tree across profile, outcomes, rubrics, and “match to standards” on assignments/quizzes/pages (some of this is still consolidation work, not one shared component everywhere). |
| [`TODO.md`](./TODO.md) | Short **Standards Sync QA** checklist (regression-oriented, not product vision). |

**Honest gap:** `GET .../accreditation/instruction-alignment` exists for an “instruction” stage, but `getInstructionAlignmentSuggestions` in `canvas.service.ts` currently returns placeholder `option_a` / `option_b` (null). **Narrative suggestions for net-new instructional content** to fill standard gaps are not fully implemented yet; alignment + rubric/tagging flows cover most of the “match and remediate existing content” story.

### Have we built “sync assignment instructions to standards” and “adjust rubrics to standards language”?

**Not to the bar implied by that wording.** What exists today is a strong **scaffold**, not the full product promise.

| Target capability | What exists now | What is missing for a “powerful” tool |
|-------------------|-----------------|----------------------------------------|
| **Assignments ↔ standards** | Lexical **suggestions** over title + description (`getAccreditationAlignment`); **Apply tagging** appends a fixed **Accreditation Alignment** block (and machine comment) to assignment **description** via `applyResourceTagging`—in Canvas this is usually where instructions live, but it is **append-only**, not a structured rewrite of the prompt. | **Preview + apply** that revises or sections the **instruction text** so standards are woven in (objectives, measurable tasks, explicit standard IDs/titles from the resolver). Optional: map assignments to outcomes through Canvas APIs beyond description text. |
| **Rubrics ↔ standards language** | **Create** a new rubric from alignment UI with criteria built from suggestions; criteria may pass **`learning_outcome_id`** when creating. Alignment **suggests** matches from criterion text but does **not** treat `[StandardId]`-style tags in criteria as first-class “already aligned” the way `|STANDARDS:|` does for outcomes. | **Update existing** rubrics: rewrite or augment criterion **description/long_description** with **authoritative standard language** (title + descriptor from lookup), parse and display existing criterion tags, bulk “align wording” with diff preview, **associate existing** course rubrics to assignments (not only create-new). |

**Analysis vs remediation:** The **existing-content alignment pass** (`getAccreditationAlignment` → `suggestStandardsForText`) is **not useless**—it catches explicit **standard IDs in text** and rough **token overlap** with standard title/description—but it is **weak for real alignment**: synonyms, paraphrase, and pedagogical “this task measures that standard” relationships are largely missed. **Semantic inference** belongs in the sequence **after** the **truth layer** and **report-grade data collection** so exports stay honest and models only add labeled “suggested” columns.

**Data collection gap today:** **Outcomes** carry `|STANDARDS:|` (good for “which standards this outcome represents”). **Rubrics** may set `learning_outcome_id` on criteria when created through this app, but there is **no unified report artifact** that **joins** outcome standard sets ↔ rubric criteria ↔ assignment associations ↔ inferred/suggested rows. Report writers still bridge that mentally. **Closing that join is a top product priority** alongside truth-layer parsing.

**Quizzes — per-question / banks:** **Not implemented.** Alignment and tagging are **whole-quiz** only: suggestions use **quiz title + description + instructions** (`getAccreditationAlignment`); **Apply tagging** appends an alignment block to the **quiz** description (`applyQuizTagging` / new-quiz equivalent). There is **no** fetch of **individual questions**, no **standard/outcome per question**, no join to **question banks** or **New Quizzes item banks**, and no export row per stem. That is exactly the gap for **final exams built from pooled items**—quiz-level metadata is too coarse. For **New Quizzes**, native **per-question alignment** is generally **not exposed** on the API; the **question body/stem** usually **is** readable/writable—so **in-body tagging** (same family as assignment/page alignment blocks) is the likely persistence strategy. See **Phase D.5** below.

**Conclusion:** Phases A / A.5 / B delivered **discovery, outcomes materialization, a v1 lexical matcher, append tagging, create-rubric, and operation logging**. **Phase D** delivers the **hybrid sequence** below: truth → **exports / evidence package** → stronger inference → remediation (**Phase C** in parallel if lookup data blocks real courses).

---

## Start Here (Where we are RIGHT NOW)

Current status snapshot:
- Accreditation core foundation is complete (profile storage, outcomes mapping, CIP/program flow).
- Accreditation tab exists and is functional for manual profile + standards selection flow.
- **Phase A**, **Phase A.5**, and **Phase B** are implemented (selection tree, outcomes sync, alignment scan + assisted actions).
- **Phase D** is the **main forward work**, following the **hybrid sequence** (not “inference only” first).
- **Phase C** (lookup service hygiene) — run **in parallel** with D whenever institution/program/standards **upstream data** is wrong or stale; otherwise after early D slices.

If resuming after a break, use this **recommended order**:
1. **D.1 Truth layer** — Declared alignment only: **parse rubric criterion tags**, corpus fixes (e.g. syllabus), **selectedStandards** UX, roll up **outcome `|STANDARDS:|`** consistently in APIs.
2. **D.2 Reporting & data collection** — **Join graph** standard ↔ outcome ↔ rubric/criterion ↔ assignment (and discussion) ↔ gap flags; **CSV + JSON** export (and optional “accreditation report bundle” download); include **`learning_outcome_id`** on criteria and **parsed standard IDs** in one model; export **`logAccreditationOperation`** trail for audit narrative.
3. **D.3 Stronger inference** — Embeddings / structured LLM matcher; **never overwrite** declared columns in exports—add **suggested_score / rationale** columns.
4. **D.4 Remediation** — Instruction sync, rubric wording updates, associate existing rubric, real instruction-alignment API, richer matrix UI.
5. **Phase C** — Lookup service (`source=all`, DAPIP upsert decision, optional typeahead) as needed in parallel with 1–2.
6. **Phase D.5** — Per-question quiz / bank alignment: start after **D.2** export schema is sketched (question-level rows), or parallel **discovery** with D.1 if API research is blocking.

---

## Execution Queue (Next Work in Priority Order)

### Accreditation track
Status: Phases **A**, **A.5**, **B** are done in repo. **Phase D** follows **D.1 → D.2 → D.3 → D.4** (see Start Here). **Phase C** parallel when lookup blocks courses.

### Phase D — Deep alignment + accreditation evidence (priority)

Status: **D.1** largely implemented in API + alignment UI; **D.2** v1 report live (`GET /canvas/courses/:id/accreditation/report`); **D.3–D.5** still open.

#### D.1 — Truth layer (declared alignment only)

Goal: APIs and UI show **what is already claimed** in Canvas and parsed tags—before models invent links.

- [x] **Declared rubric alignment** — **Parse** criterion text for agreed conventions (e.g. `[QM-2.1]`); return **`existing_standards` per criterion** and rubric-level roll-up in alignment JSON (`declared_standards_roll_up`, bracket vs outcome-derived split).
- [x] **Canvas-declared links** — Surface **`learning_outcome_id`** on rubric criteria (from Canvas rubric payload) in alignment; map outcome id → `|STANDARDS:|` set for **outcome ↔ rubric criterion** edges (`existing_standards_from_outcome`).
- [x] **Corpus completeness** — Syllabus body in alignment resource list (`resource_type: syllabus` via course `syllabus_body`). Richer module traversal / caps doc still optional.
- [x] **Selected-standards UX** — When `selectedStandards` is empty: `alignment_warnings` + `standards_selection_mode: full_catalog_fallback` (and banner in Standards Sync alignment UI).
- [x] **Milestone (v1):** Declared columns drive **`/accreditation/report`** without inference.

#### D.2 — Reporting & data collection (accreditation report writer)

Goal: One **evidence package** that joins outcomes, rubrics, and graded artifacts so self-study authors **copy less from Canvas**.

- [x] **Join model** — `join_rows` per standard: `outcome_ids`, `canvas_aligned_assignment_ids` (from Canvas `outcome_alignments`), `rubric_criteria` touchpoints, `gap_flags`.
- [x] **Export surfaces** — **`GET /canvas/courses/:id/accreditation/report`** JSON default; **`?format=csv`** download. Links in alignment panel. Optional **ZIP bundle** still open.
- [x] **Gap columns** — `gap_flags` on each join row (`no_outcome_with_standard`, `no_canvas_assignment_alignment`, `no_rubric_criterion_tag_or_outcome_link`).
- [x] **Operation log export** — Full alignment snapshot + `operation_log` + `workflow_stages` embedded in JSON report.
- [x] **Optional narrative helpers** — `narrative_stub_sections` per standard (starter sentences only).
- [ ] **Milestone (full):** ZIP bundle + dedicated appendix CSV files per [docs/ACCREDITATION_EVIDENCE_BUNDLE_SPEC.md](./docs/ACCREDITATION_EVIDENCE_BUNDLE_SPEC.md) (multi-file).

#### D.3 — Stronger inference (after D.2)

Goal: Add **suggested** alignment that does not blur **declared** export columns.

- [ ] **Matcher pipeline** — Keep lexical path; add **embedding** and/or **LLM structured compare**; payload fields **`suggested_standards`, `score`, `rationale`** separate from **`declared_standards`**.
- [ ] **Milestone:** Pilot courses show materially better suggestion quality than v1 lexical (small gold set or reviewer sign-off).

#### D.4 — Remediation (after D.3)

Goal: **Preview + apply** on top of trustworthy signals; keep logging.

- [ ] **Assignment instruction alignment** — Side-by-side preview; apply with explicit policy; log operations.
- [ ] **Rubric standards language** — Update existing rubrics via API; bulk align with per-row approval.
- [ ] **Rubric ↔ assignment workflow** — Associate **existing** course rubric to assignment/discussion.
- [ ] **Instruction alignment API** — Replace stub `getInstructionAlignmentSuggestions` or retire until real.
- [ ] **Rich matrix UI** — Interactive standard × artifact view (export remains source of truth for binders).

**Phase D done when:** D.2 milestone met, D.3 improves suggestions without corrupting declared exports, D.4 covers the critical remediation paths, and **D.5** is at least scoped (API + Canvas constraints) with an MVP slice agreed.

#### D.5 — Per-question quiz alignment (classic + New Quizzes / banks)

Status: ⏳ Not started — **high value for assessment evidence and pooled finals**

Goal: Align **standards and/or course outcomes to each question** (stem + key answer text where useful), persist or export in a way that **survives** reuse from **question banks** and **item banks** (identity stable per bank item, not only per quiz instance).

**API reality (especially New Quizzes):** Do not assume a first-class “aligned outcomes” field per question in the REST/Quiz LTI surface. Plan on **tagging inside the question body** (human-visible line + machine-readable HTML comment, or agreed `|STANDARDS:|`-style prefix in stem HTML) wherever the API only exposes **question text**—mirroring resource tagging elsewhere. Classic quizzes may offer more endpoints; still validate whether outcome links exist per question before relying on them.

- [ ] **Discovery** — Map Canvas APIs for **classic** quiz questions (`/courses/:id/quizzes/:quiz_id/questions` and bank membership) vs **New Quizzes** / **Quiz LTI** item APIs (versioning differs by host); document what is writable vs export-only and **confirm whether per-question alignment is absent** (expect **tagging** as fallback).
- [ ] **Declared storage** — Prefer **bank-item–scoped** metadata: **tagging in question HTML** when native alignment is unavailable; otherwise Canvas outcome-on-question if the API ever exposes it. Goal: bank item carries alignment so pooled finals **inherit** it.
- [ ] **Alignment pass** — Extend `getAccreditationAlignment` (or sibling endpoint) with **`question_mappings`**: per question id, `existing_standards` / `suggested_standards`, optional `linked_outcome_ids`.
- [ ] **UI** — Standards Sync alignment section: expand quiz → **per-question** rows; apply/save per question (or bulk from bank editor path if UI lives elsewhere).
- [ ] **Report export** — D.2 join model gains **question_id** (and **bank_id** if available) columns for accreditation tables (“which standards does item X assess?”).

**Milestone:** Pilot course with a **bank-sourced** final can export a **question-level** standard map without manual copy from Canvas UI.

### Phase A — Increase standards resolution to substandards
Status: ✅ Completed (in repo)

- [x] Hierarchical standards tree in Standards Sync (`accStandardsList`, `bindAccStandardsTreeBlocks`, leaf `accStd` + branch toggles in `public/js/main.js`)
- [x] Resolver / payload carries parent/child and org grouping (standards API + tree build path)
- [x] Source/confidence surfaced in UI (`standards_source`, per-standard `sourceType` where present)

Goal:
- Retrieve and display finer-grained standards hierarchy (substandards/indicators), not only top-level standards.
- Preserve source and confidence metadata while increasing node detail.

Deliverables:
- Resolver returns hierarchical standards nodes with parent/child relationships.
- UI displays standards grouped by organization with expandable substandards.
- Selection flow supports leaf-level standards IDs in `selectedStandards`.
- Retrieval order remains: DB -> official API -> trusted file -> scraping -> AI fallback.
- Provenance (`sourceType`, `sourceUri`) and confidence remain visible in payload/UI.

Done when:
- Teacher can browse and select substandards (not only top-level org standards), then save selection.

### Phase A.5 — Connect selected standards to Canvas LMS outcomes (after A)
Status: ✅ Completed (in repo)

- [x] `POST .../accreditation/outcomes/sync` → `syncCourseOutcomesFromSelectedStandards`
- [x] `POST .../accreditation/outcomes/sync-org` → `syncOutcomesForOrg` (per-org groups, `|STANDARDS:|` in descriptions, idempotent skip when already linked)
- [x] `GET .../accreditation/outcomes/preview` for preview-before-create flow

Goal:
- Materialize selected standards into Canvas outcomes and keep mappings synchronized.

Deliverables:
- Create/reuse outcomes from selected standards (idempotent behavior).
- Persist standards-to-outcome linkage using existing standards prefix convention in outcome descriptions.
- Provide update flow to keep outcome mappings in sync when selected standards change.

Done when:
- Selected standards are reliably represented in Canvas outcomes with stable mapping on reload.

### Phase B — Content alignment view
Status: ✅ Completed in repo **as v1**; remains the **shell** for Phase D (previews, rubric edit, matrix).

- [x] `loadAccreditationAlignment` loads `/canvas/courses/:id/accreditation/alignment` and renders outcomes, rubrics, resources, classic + new quizzes, summary pills, and apply actions (`public/js/main.js`)
- [x] Backend alignment aggregation in `canvas.service.ts` (lexical `suggestStandardsForText`, gaps such as resources without rubrics, append-only tagging, create rubric)

Goal:
- Show how assignments/quizzes/rubrics align to selected standards.

Deliverables:
- Read view listing content items and linked rubric criteria with standard tags.
- Clear gap indicators (content with no mapped standard).

Done when:
- Tab shows real alignment data instead of placeholder.

**v1 limitation (feeds Phase D):** Matching is **token overlap**, not canonical “standards language” injection; rubric **existing** tags in criteria are not parsed like outcome `|STANDARDS:|`.

### Phase C — Lookup service completion tasks
Status: ⏳ Partially open

- [x] Update `POST /admin/sync` so `source=all` executes **both** CHEA and DAPIP with combined result metadata (`{ source: 'all', chea, dapip }` in `services/accreditation-lookup/src/main.ts`).
- [ ] Decide DAPIP write strategy: keep replace behavior or move to true upsert for historical continuity.
- [ ] Optional: institution typeahead endpoint/UI (e.g. College Scorecard search)—not present as `institutions-search` in repo yet.

---

## Completed Work (Do Not Rebuild)

### Accreditation core completed
- Profile storage in Canvas Page body.
- Start Here module + Accreditation Profile page flow.
- Standards Sync tab shell and custom load/render path.
- Outcomes mapping via `|STANDARDS:...|` prefix in outcome descriptions.
- Manual profile form save/load in tab.

### Institution & Program lookup completed
- `GET /college-scorecard/cities?state=`
- `GET /college-scorecard/institutions?state=&city=`
- `GET /college-scorecard/programs?schoolId=` (legacy)
- `GET /college-scorecard/programs-cip4?schoolId=`
- `GET /college-scorecard/cip6-options?cip4=`
- Profile fields wired: `state`, `city`, `institutionId`, `institutionName`, `program`, `programCip4`, `programTitle`, `programFocusCip6`
- UI flow complete: State -> City -> Institution -> Program -> Program Focus
- Legacy profile compatibility preserved

### CHEA lookup service completed (major pieces)
- Service scaffold, Docker, env template, TS build setup.
- PostgreSQL schema, migrations, indexes.
- Read API: `/health`, `/accreditors`, `/accreditors/:id`, `/institution/:unitid/accreditations`.
- Admin sync endpoint with auth guard.
- CHEA scraper + fingerprint + pending-review workflow.
- DAPIP ingestion + cron schedules.
- Mapping proposal/bootstrap scripts.

---

## Architecture Rules (Keep These True)

- **Persistence source of truth:** Course accreditation state persists in Canvas objects.
- **Do not use:** `syllabus_body` for accreditation persistence.
- **Lookup service scope:** Reference/index data only (supports discovery); does not replace Canvas as course-state store.
- **Tab integration:** `standards_sync` remains the accreditation UI surface.

---

## Storage and Parsing Conventions

### Canvas-native storage

| Data | Canvas Location | Format |
|------|-----------------|--------|
| Profile (level, mode, discipline, selected standards, version snapshot) | Canvas Page body | HTML comment block in page body |
| Outcome → standard mapping | Outcome `description` | Prefix at start of description |
| Rubric criterion → standard | Criterion `description` or `long_description` | Standard ID prefix in criterion text |
| Content alignment | Via rubric attachment | Assignment/quiz -> rubric -> criteria |

### Parse/update formats

Profile block in page body:
```
<!-- accreditation:{"v":1,"level":"Post-Secondary","mode":"ONLINE_ASYNC","discipline":"Nursing","degreeProgram":"BSN","selectedStandards":["QM-2.1","ABET-1a"],"versionSnapshot":{...}} -->
```

Outcome mapping in `description`:
```
|STANDARDS:QM-2.1,ABET-1a| Students will analyze and apply...
```

Criterion mapping in rubric text:
```
[QM-2.1] Demonstrates measurable competency in...
```

---

## References

- Canvas alignment merge rules + spike routes: [`docs/ACCREDITATION_CANVAS_ALIGNMENT_MERGE.md`](./docs/ACCREDITATION_CANVAS_ALIGNMENT_MERGE.md)
- Outcome evidence (rollups FERPA defaults) + contributing scores: [`docs/ACCREDITATION_EVIDENCE_BUNDLE_SPEC.md`](./docs/ACCREDITATION_EVIDENCE_BUNDLE_SPEC.md)
- Blueprint API evaluation (scale / drift): [`docs/ACCREDITATION_BLUEPRINT_EVALUATION.md`](./docs/ACCREDITATION_BLUEPRINT_EVALUATION.md)
- Operator guide (Standards Sync): [`docs/USER_GUIDE.md`](./docs/USER_GUIDE.md) §9
- Standards DB + UI patterns: [`docs/STANDARDS_DATABASE_AND_UI.md`](./docs/STANDARDS_DATABASE_AND_UI.md)
- Tab UI: `views/index.ejs`
- Frontend logic: `public/js/main.js`, `public/js/config.js`
- Canvas backend: `src/canvas/canvas.controller.ts`, `src/canvas/canvas.service.ts`
- College Scorecard: `src/college-scorecard/college-scorecard.controller.ts`, `src/college-scorecard/college-scorecard.service.ts`
- Lookup service: `services/accreditation-lookup/`
