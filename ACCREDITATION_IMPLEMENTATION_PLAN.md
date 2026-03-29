# Accreditation Module — Implementation Plan (Canonical)

Single source of truth for accreditation work in this repo.

**North star:** A **powerful standards alignment tool**—not only picking standards and surfacing suggestions, but helping teachers **bring assignment prompts and rubric language into explicit, auditable alignment** with the authoritative wording of selected standards (and with course outcomes), with clear before/apply flows and evidence an auditor can follow.

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

**Analysis vs remediation:** The **existing-content alignment pass** (`getAccreditationAlignment` → `suggestStandardsForText`) is **not useless**—it catches explicit **standard IDs in text** and rough **token overlap** with standard title/description—but it is **weak for real alignment**: synonyms, paraphrase, and pedagogical “this task measures that standard” relationships are largely missed. **Strengthening that analysis is Phase D.1 and the first implementation priority** before leaning on the same scores to drive instruction rewrites or rubric wording changes.

**Conclusion:** Phases A / A.5 / B delivered **discovery, outcomes materialization, a v1 lexical matcher, append tagging, and create-rubric**. **Phase D** delivers **better evidence of alignment on existing artifacts first (D.1)**, then **instruction-level sync** and **rubric language alignment** (D.2) on top of trustworthy signals.

---

## Start Here (Where we are RIGHT NOW)

Current status snapshot:
- Accreditation core foundation is complete (profile storage, outcomes mapping, CIP/program flow).
- Accreditation tab exists and is functional for manual profile + standards selection flow.
- **Phase A**, **Phase A.5**, and **Phase B** are implemented (selection tree, outcomes sync, alignment scan + assisted actions).
- **Phase D** is the **main forward work**: start with **stronger analysis of existing content (D.1)**, then **deep remediation** (instructions + rubric language + instruction-gap API) **(D.2)**.
- **Phase C** (lookup service hygiene) remains important but is **behind** Phase D for product impact.

If resuming after a break, do these in order:
1. **Phase D.1** — Stronger **analysis** of existing content (matcher upgrade, declared rubric tags, corpus coverage, confidence UX)
2. **Phase D.2** — **Remediation**: assignment instruction sync, rubric language updates, associate existing rubrics, real instruction-alignment API, matrix/export
3. **Phase C** — Lookup service (`source=all`, DAPIP upsert decision, optional typeahead)

---

## Execution Queue (Next Work in Priority Order)

### Accreditation track
Status: Phases **A**, **A.5**, **B** are done in repo. **Phase D.1** (stronger analysis) is the **first** build slice; **D.2** then **Phase C**.

### Phase D — Deep alignment (priority)

Status: ⏳ Not started (defined here)

**Order:** **D.1 first** (analysis you can trust), then **D.2** (writes and evidence). Premature “AI rewrite assignment” on top of a weak matcher produces confident wrong edits.

#### D.1 — Stronger analysis of existing content (do this first)

Goal: The alignment view and APIs should reflect **declared** mappings accurately and **infer** likely alignment with **semantic or model-assisted** scoring—not only token overlap—so teachers see defensible suggestions and gaps.

- [ ] **Matcher pipeline** — Tiered approach: keep fast **lexical** path for ID-in-text and exact-ish overlap; add **embedding** similarity (standard title + description vs artifact text) and/or optional **LLM structured compare** (course + artifact snippet + standard list → scores/rationale); surface **confidence** and **human-readable reason** in payload and UI.
- [ ] **Declared rubric alignment** — **Parse** criterion text for agreed conventions (e.g. `[QM-2.1]` per storage table); return **`existing_standards` per criterion** (and rubric-level roll-up) in alignment JSON so the UI shows **aligned vs gap** without guessing.
- [ ] **Corpus completeness** — Include **syllabus** and richer **module** traversal where feasible; document caps; optional “analyze this subset” for large courses.
- [ ] **Selected-standards UX** — When `selectedStandards` is empty, **warn** or gate “full catalog” scoring so analysis scope matches teacher intent.
- [ ] **Milestone:** D.1 done when stakeholders agree suggestions and gap lists are **materially more accurate** than v1 lexical scoring on a pilot course set (measure false positive/negative informally or with a small gold set).

#### D.2 — Remediation, rubric language, evidence (after D.1)

Goal: **Preview + apply** changes to instructions and rubrics, plus demonstrable coverage—built on D.1 signals.

- [ ] **Assignment instruction alignment** — Authoritative standard text; **side-by-side preview**; **apply** with explicit policy (scoped section vs append). Log operations.
- [ ] **Rubric standards language** — **Update existing** rubrics via Canvas API; **current vs suggested** criterion rows using lookup text; optional bulk align with per-row approval.
- [ ] **Rubric ↔ assignment workflow** — **Associate existing** course rubric to assignment/discussion where API allows; surface next to “create rubric.”
- [ ] **Instruction alignment API** — Replace stub `option_a` / `option_b` in `getInstructionAlignmentSuggestions` or retire until real.
- [ ] **Coverage evidence** — Standard × artifact **matrix** or CSV (tag, rubric, outcome, gap).

**Phase D done when:** D.1 milestone met **and** D.2 allows a reviewer to trace **selected standards → analysis quality → optional applied edits** without relying on token-scored guesses alone.

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

- [ ] Update `POST /admin/sync` so `source=all` executes **both** CHEA and DAPIP with combined result metadata (today `source=all` still queues CHEA-only in `services/accreditation-lookup/src/main.ts`).
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

- Operator guide (Standards Sync): [`docs/USER_GUIDE.md`](./docs/USER_GUIDE.md) §9
- Standards DB + UI patterns: [`docs/STANDARDS_DATABASE_AND_UI.md`](./docs/STANDARDS_DATABASE_AND_UI.md)
- Tab UI: `views/index.ejs`
- Frontend logic: `public/js/main.js`, `public/js/config.js`
- Canvas backend: `src/canvas/canvas.controller.ts`, `src/canvas/canvas.service.ts`
- College Scorecard: `src/college-scorecard/college-scorecard.controller.ts`, `src/college-scorecard/college-scorecard.service.ts`
- Lookup service: `services/accreditation-lookup/`
