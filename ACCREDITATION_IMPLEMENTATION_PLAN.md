# Accreditation Module — Implementation Plan

This plan adapts [accreditation_plan_v2.md](accreditation_plan_v2.md) to Canvas-native storage and the existing Canvas Bulk Editor architecture. Behavior, workflow, and AI specifications remain in the functional spec; this document covers storage, integration, and phased build order.

---

## 1. Storage Architecture (Canvas-Native)

No database or external file store. All accreditation data lives in Canvas objects. **Do not use `syllabus_body`** — the Canvas Syllabus link shows due dates, not a true syllabus; many institutions use Concourse Syllabus for syllabi.

| Data | Canvas Location | Format |
|------|-----------------|--------|
| Profile (level, mode, discipline, selected standards, version snapshot) | Canvas Page body | HTML comment block in page body (see Parsing Conventions) |
| Outcome → standard mapping | Outcome `description` | Parsable prefix at start of description |
| Rubric criterion → standard | Criterion `description` or `long_description` | Standard ID prefix in criterion text |
| Content alignment | Via rubric attachment | Assignment/quiz → rubric → criteria (standard IDs embedded in criteria) |

**Page placement:** Create Canvas Pages for each Concourse Syllabus section that corresponds to outcomes and standards. Place all such pages in the **Start Here** module — create that module if it does not exist. These pages will later be synced to Concourse Syllabus through a separate project.

---

## 2. Parsing Conventions

Stable formats for parse and update:

**Profile block (in Page body, e.g. Accreditation Profile page):**
```
<!-- accreditation:{"v":1,"level":"Post-Secondary","mode":"ONLINE_ASYNC","discipline":"Nursing","degreeProgram":"BSN","selectedStandards":["QM-2.1","ABET-1a"],"versionSnapshot":{...}} -->
```

**Outcome mapping (start of outcome `description`):**
```
|STANDARDS:QM-2.1,ABET-1a| Students will analyze and apply...
```

**Criterion standard (start of rubric criterion `description`):**
```
[QM-2.1] Demonstrates measurable competency in...
```

---

## 3. Project Integration

**Tab:** Use existing `standards_sync` tab as the Accreditation tab (spec Section 7).

**Config:** `standards_sync` is a special tab and does not use the standard loadTabData / FIELD_DEFINITIONS pattern. Custom load and render logic.

**Backend:** Extend `src/canvas/canvas.service.ts` for:
- Course `syllabus_body` read and update (already fetched in getCourseDetails)
- Canvas Learning Outcomes API (outcomes, outcome groups)
- Rubric API (assignment rubrics, rubric criteria)

**No new storage:** All persistence in Canvas.

---

## 4. Phased Implementation Sequence

| Phase | Scope | Deliverable |
|-------|-------|-------------|
| 1 | Plan document | `ACCREDITATION_IMPLEMENTATION_PLAN.md` (this file) |
| 2 | Profile storage | Parse/write accreditation JSON in Canvas Page body (Accreditation Profile page); ensure Start Here module exists; backend + utility |
| 3 | Standards Sync tab shell | Tab loads; displays profile + placeholder panels |
| 4 | Outcomes + standard mapping | Fetch outcomes; parse/write standard IDs in descriptions |
| 5.1 | Profile form | Manual selection of State, City, Institution, and Program; save to profile |
| 5.2 | AI discovery | AI suggests standards from profile + Canvas course context; teacher selects and applies |
| 6 | Content alignment view | Show assignments/rubrics with standard IDs |
| 7+ | Later phases | Per spec Sections 6–8 (QM checks, gap detection, etc.) |

---

## 5. Cross-Reference

- **Functional spec:** [accreditation_plan_v2.md](accreditation_plan_v2.md)
- **Tab:** `standards_sync` in `views/index.ejs`
- **Backend:** `src/canvas/canvas.service.ts`, `src/canvas/canvas.controller.ts`
- **Frontend config:** `public/js/config.js`, `public/js/main.js`
