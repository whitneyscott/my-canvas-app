# Accreditation Module — Implementation Plan (Canonical)

Single source of truth for accreditation work in this repo.

---

## Start Here (Where we are RIGHT NOW)

### Accessibility rules audit (do this before more feature work)

Re-run a full pass over **every** accessibility check we ship (`ACCESSIBILITY_CHECKS.md` catalog + `ACCESSIBILITY_FIXABILITY_MAP` / `fix_type` wiring in `canvas.service.ts`).

- For each `rule_id`, decide: **deterministic and reversible** (same input HTML → same safe fix) vs **needs human / AI / context**.
- Anything that is **really deterministic** must be **treated as such in code**: `auto_fixable: true`, `fix_strategy: 'auto'`, a real `fix_type` executor (or merge into an existing one), and preview/apply behavior consistent with other auto rules—not left as `manual_only` or “suggested” unless there is a documented reason.
- Fix mismatches: tighten the map, implement missing executors, and remove false “high risk” labels where the transform is purely mechanical (e.g. inline contrast when both colors are known in `style=""`).
- Cross-check against `ACCESSIBILITY_CHECKS_QA_PLAN.md` **strict** vs **best-effort** tiers so tests and product expectations stay aligned.
- Keep **`ACCESSIBILITY_FIXABILITY_MAP`** (runtime config in the LTI-launched tool) authoritative; align executors with it, then update [`ACCESSIBILITY_CHECKPOINTS.md`](./ACCESSIBILITY_CHECKPOINTS.md) as the human mirror (Auto vs Suggested vs Manual-only).

This audit is a **blocking hygiene step** whenever we add or change rules—not optional polish.

---

Current status snapshot:
- Accreditation core foundation is complete (profile storage, outcomes mapping, CIP/program flow).
- Accreditation tab exists and is functional for manual profile + standards selection flow.
- **Phase A** (hierarchical standards in UI), **Phase A.5** (outcomes sync APIs + Canvas outcome creation), and **Phase B** (alignment tab backed by `/accreditation/alignment`) are implemented in code—see phase sections below.
- Accessibility work is now urgent and should run as the primary execution track.
- Remaining accreditation work is concentrated in **Phase C** (lookup service) plus ongoing polish and the accessibility audit block above.

If resuming after a break, do these in order:
1. **Accessibility MVP track** (weekend-only phased plan below) + accessibility rules audit (top of this doc)
2. **Lookup service cleanup** (`Phase C` only—`source=all`, DAPIP upsert decision, optional typeahead)
3. Polish or extend accreditation only as needed (A / A.5 / B are no longer greenfield)

---

## Execution Queue (Next Work in Priority Order)

### Accessibility MVP Track (weekend-only timeline)
Status: 🚧 Active priority track

This is the realistic phased release path assuming coding happens on weekends only.

| Phase | Target Weekend | Scope | Release Outcome |
|------|-----------------|-------|-----------------|
| 0 | Apr 4-5, 2026 | Tier 1 detection only + report/export + manual triage flow | Compliance triage release |
| 1 | May 9-10, 2026 | Delta scans, throttling/backoff, stable course-level scans, core dashboard UX | Usable accessibility MVP |
| 2 | Jun 13-14, 2026 | Hardening: checkpoint resume, telemetry, safe autofix subset, large-course QA | Hardened v1 candidate |
| 3 | Jun 20-28, 2026 | Final bugfix/polish and release window | Stabilized public release |

Implementation notes:
- Tier 1 and Tier 2 rules live in `ACCESSIBILITY_CHECKS.md`.
- Build for rate limits from day one (delta scans + adaptive throttling).
- Keep autofix limited to deterministic reversible actions until v1 stability is proven.
- Display accessibility findings in an AG Grid interface (filter/sort parity with other tabs) to support rapid triage workflows.

**Repo note (Mar 2026):** Much of the Phase 0–1 *capability* (Tier 1/2 catalog, AG Grid triage, export/fix flows) already exists in the codebase ahead of the weekend calendar. Treat the table as **release gating / hardening milestones**, not “nothing built until Apr/May.”

### Accreditation Track (after Accessibility MVP baseline)
Status: ⏳ Deferred behind accessibility urgency (only **Phase C** and polish remain as net-new accreditation work)

### Phase A — Increase standards resolution to substandards (next)
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

### Phase B — Content alignment view (next after A)
Status: ✅ Completed (in repo; iterative polish OK)

- [x] `loadAccreditationAlignment` loads `/canvas/courses/:id/accreditation/alignment` and renders outcomes, rubrics, resources, classic + new quizzes, summary pills, and apply actions (`public/js/main.js`)
- [x] Backend alignment aggregation in `canvas.service.ts` (suggestions, gaps such as resources without rubrics, tagging helpers)

Goal:
- Show how assignments/quizzes/rubrics align to selected standards.

Deliverables:
- Read view listing content items and linked rubric criteria with standard tags.
- Clear gap indicators (content with no mapped standard).

Done when:
- Tab shows real alignment data instead of placeholder.

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

- Tab UI: `views/index.ejs`
- Frontend logic: `public/js/main.js`, `public/js/config.js`
- Canvas backend: `src/canvas/canvas.controller.ts`, `src/canvas/canvas.service.ts`
- College Scorecard: `src/college-scorecard/college-scorecard.controller.ts`, `src/college-scorecard/college-scorecard.service.ts`
- Lookup service: `services/accreditation-lookup/`
- Accessibility rules catalog: `ACCESSIBILITY_CHECKS.md` (Tier 1 minimum baseline + Tier 2 expanded checks)
