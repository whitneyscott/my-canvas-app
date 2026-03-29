# Accreditation evidence bundle — CSV / JSON column spec (target)

Single export for **report writers**: join **declared** alignment, **Canvas native** links, optional **course-level outcome statistics**, **gaps**, and **change log**. Implementation tracks [ACCREDITATION_IMPLEMENTATION_PLAN.md](../ACCREDITATION_IMPLEMENTATION_PLAN.md) Phase D.2.

## FERPA and outcome evidence (implemented spikes)

| Nest route | Canvas API | Default behavior |
|------------|------------|------------------|
| `GET /canvas/courses/:id/accreditation/outcome-evidence` | `GET .../outcome_rollups?aggregate=course` | **Course aggregate only** — no per-student rows in the JSON. |
| `GET /canvas/courses/:id/accreditation/outcomes/:outcomeId/contributing-scores?user_ids=1,2,3` | `contributing_scores` | **Opt-in** — requires explicit comma-separated Canvas user ids; omit to get a FERPA-safe refusal object from the service. |

Do not add bulk student exports without institutional policy and role checks.

## Bundle contents (logical files)

### 1. `course_metadata.json`

| Field | Type | Description |
|-------|------|-------------|
| `course_id` | number | Canvas course id |
| `exported_at` | ISO-8601 | Generation time |
| `cip` | string? | Effective CIP used for standards resolution |
| `profile_snapshot` | object? | Subset of accreditation profile (level, mode, selectedStandards, institution fields) |
| `blueprint` | object? | Reserved: blueprint parent id, last sync (see [ACCREDITATION_BLUEPRINT_EVALUATION.md](./ACCREDITATION_BLUEPRINT_EVALUATION.md)) |

### 2. `standards_coverage.csv`

| Column | Description |
|--------|-------------|
| `standard_id` | Accreditor standard id |
| `standard_title` | From resolver |
| `in_selected_standards` | boolean |
| `outcome_ids` | Canvas outcome ids whose `\|STANDARDS:\|` includes this id (pipe-delimited) |
| `assignment_ids_canvas_aligned` | Assignments with Canvas `outcome_alignments` to those outcomes (pipe-delimited) |
| `assignment_ids_tagged` | Assignments with parsed body tag including id (future) |
| `rubric_ids_with_criterion` | Rubrics linking to those outcomes or tags (future) |
| `gap_flags` | Semicolon list: `no_artifact`, `no_canvas_alignment`, `no_outcome`, etc. |

### 3. `artifacts.csv` (row per assessable artifact)

| Column | Description |
|--------|-------------|
| `artifact_type` | assignment, discussion, quiz, new_quiz, page, … |
| `artifact_id` | Canvas id or slug |
| `title` | |
| `url` | Canvas html_url when known |
| `standard_ids_declared_tag` | Parsed from HTML (future) |
| `standard_ids_from_canvas_outcomes` | Via outcome_alignments → outcome description |
| `standard_ids_lexical_suggested` | Top suggestions (optional column; label as inferred) |
| `canvas_aligned_outcome_ids` | Raw outcome ids from Canvas alignment API |
| `has_rubric` | boolean |
| `rubric_id` | if single primary |
| `gap_no_rubric` | boolean for types where rubric expected |

### 4. `canvas_outcome_alignments.csv`

Raw or normalized rows from Canvas `outcome_alignments`:

| Column | Description |
|--------|-------------|
| `learning_outcome_id` | Canvas outcome id (alignment row `id`) |
| `assignment_id` | nullable |
| `assessment_id` | nullable (live assessment) |
| `title` | |
| `url` | |
| `submission_types` | |

### 5. `outcome_rollups_course.json` (optional include)

Response slice from `outcome-evidence` endpoint: `rollups`, `linked` (outcomes, groups), `raw_error` if any. Course aggregate only.

### 6. `accreditation_operations.csv`

Append-only log from `logAccreditationOperation` (operation type, stage, timestamp, JSON payload) for audit narrative.

### 7. `merge_conflicts.csv` (optional)

Output of merge rules from [ACCREDITATION_CANVAS_ALIGNMENT_MERGE.md](./ACCREDITATION_CANVAS_ALIGNMENT_MERGE.md):

| Column | Description |
|--------|-------------|
| `assignment_id` | |
| `conflict_code` | e.g. `lexical_vs_canvas`, `tag_vs_canvas` |
| `detail` | Short text |

## JSON bundle root shape (single file alternative)

```json
{
  "v": 1,
  "course_metadata": {},
  "standards_coverage": [],
  "artifacts": [],
  "canvas_outcome_alignments": [],
  "outcome_rollups_course": null,
  "accreditation_operations": [],
  "merge_conflicts": []
}
```

## Implementation note

- **Live:** `GET /canvas/courses/:courseId/accreditation/report` returns JSON with embedded `alignment`, `canvas_outcome_alignments`, `join_rows`, `narrative_stub_sections`, `operation_log`, and `workflow_stages`. Append **`?format=csv`** for a single join-table CSV download.
- **Still open:** multi-file ZIP matching every table in this spec; POST/async export if courses are huge.
