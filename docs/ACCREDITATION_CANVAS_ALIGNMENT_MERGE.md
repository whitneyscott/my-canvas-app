# Canvas outcome alignments vs accreditation lexical alignment

## API spike (implemented)

| Endpoint | Purpose |
|----------|---------|
| `GET /canvas/courses/:courseId/accreditation/canvas-outcome-alignments` | Proxies Canvas `GET /api/v1/courses/:course_id/outcome_alignments`. Optional query `assignment_id`. |
| `GET /canvas/courses/:courseId/accreditation/alignment-merge-preview` | Returns Canvas alignments plus `getAccreditationAlignment` and a per-assignment merge summary. |

Canvas docs: [Outcomes API](https://canvas.instructure.com/doc/api/outcomes.html) (`outcome_alignments`).

## Data sources to merge

1. **Canvas native** — `outcome_alignments`: links **learning outcome** to **assignment** (or live assessment). The alignment row’s `id` is the **learning outcome id** in Canvas.
2. **Outcome descriptions** — `|STANDARDS:id1,id2|` on each outcome (parsed in `getCourseOutcomeLinks`) maps Canvas outcomes to **accreditor standard IDs**.
3. **Rubric criteria** — `learning_outcome_id` on criteria (when present) is another bridge from graded activity to outcomes (not yet folded into `alignment-merge-preview`; see evidence bundle spec).
4. **Lexical suggestions** — `suggestStandardsForText` on assignment title + description in `getAccreditationAlignment` → `resource_mappings` for `resource_type === 'assignment'`.
5. **Body tagging** — `--- Accreditation Alignment ---` blocks and `<!-- accreditation:... -->` in assignment HTML (truth layer for D.1; not yet parsed in merge preview).

## Recommended merge rules (precedence for exports)

Use explicit columns so auditors see source, not a black box:

| Column | Source |
|--------|--------|
| `standard_ids_from_canvas_alignments` | For each assignment: collect aligned **outcome ids** → map each outcome through `parseStandardsFromDescription` → union of standard IDs. |
| `standard_ids_lexical_suggested` | Top N suggestions from lexical matcher (already scored). |
| `standard_ids_from_rubric_criteria` | Parsed `[TAG]` or future declared fields on rubric rows linked to the assignment. |
| `standard_ids_from_assignment_tag` | Parsed from assignment HTML accreditation block when implemented. |

**Conflict flags** (examples):

- `canvas_outcomes_present` but `lexical_suggestions_empty` — formal alignment in Canvas; tool did not text-match (OK if intentional).
- `lexical_suggestions_present` but `canvas_alignments_empty` — possible gap: teacher never set Canvas alignments.
- Non-empty intersection of `standard_ids_from_canvas_alignments` and `standard_ids_lexical_suggested` — **reinforced**.
- Disjoint sets — **review**: wording vs. formal alignment disagree.

**Precedence for a single “declared” row** (policy choice; document in institution SOP):

1. Parsed tags in assignment/rubric (explicit teacher intent in content).
2. Canvas `outcome_alignments` mapped through outcome `|STANDARDS:|`.
3. Lexical suggestions (never overwrite 1–2 without human confirm).

## Permissions

`outcome_alignments` may require `manage_grades` or `view_all_grades` depending on host; failures return `raw_error` on the Canvas spike payload without throwing from Nest.

## Next steps

- Extend merge preview with rubric `learning_outcome_id` and parsed criterion tags.
- Parse assignment body accreditation block into `standard_ids_from_assignment_tag`.
