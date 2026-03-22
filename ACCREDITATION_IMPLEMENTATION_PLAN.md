# Accreditation Module — Implementation Plan (Canonical)

Single source of truth for accreditation work in this repo.

---

## Start Here (Where we are RIGHT NOW)

Current status snapshot:
- Accreditation core foundation is complete (profile storage, outcomes mapping, CIP/program flow).
- Accreditation tab exists and is functional for manual profile + standards selection flow.
- Accessibility work is now urgent and should run as the primary execution track.
- Remaining accreditation work is now mostly product logic/UX, not data plumbing.

If resuming after a break, do these in order:
1. **Accessibility MVP track** (weekend-only phased plan below)
2. **AI standards discovery in Accreditation tab** (`Phase A`)
3. **Content alignment view** (`Phase B`)
4. **Lookup service cleanup decisions** (`Phase C`)

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

### Accreditation Track (after Accessibility MVP baseline)
Status: ⏳ Deferred behind accessibility urgency

### Phase A — AI standards discovery (next)
Status: ⏳ Not completed

Goal:
- Suggest standards from profile + course context.
- Let teacher review/select, then apply.
- Resolve standards per selected organization using source-priority retrieval with AI fallback.

Deliverables:
- Suggestion endpoint or service integration for standards recommendations.
- Confidence/rationale shown in UI for each recommendation.
- Apply flow writes selected standards to profile (`selectedStandards`) and reflects immediately in tab state.
- Retrieval order: DB -> official API -> trusted file -> scraping -> AI fallback.
- Return provenance (`sourceType`, `sourceUri`) and confidence for each standards payload.

Done when:
- Teacher can click a discovery action, review suggested standards, and apply without manual ID entry.

### Phase B — Content alignment view (next after A)
Status: ⏳ Not completed (placeholder currently)

Goal:
- Show how assignments/quizzes/rubrics align to selected standards.

Deliverables:
- Read view listing content items and linked rubric criteria with standard tags.
- Clear gap indicators (content with no mapped standard).

Done when:
- Tab shows real alignment data instead of placeholder.

### Phase C — Lookup service completion tasks
Status: ⏳ Partially open

Remaining items:
- Update `POST /admin/sync` so `source=all` executes both CHEA and DAPIP and returns combined result metadata.
- Decide DAPIP write strategy: keep replace behavior or move to true upsert for historical continuity.
- Optional: institution typeahead endpoint/UI (`/college-scorecard/institutions-search`).

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
