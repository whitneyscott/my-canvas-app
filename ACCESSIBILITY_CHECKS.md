# Accessibility Checks Catalog

Purpose: define the minimum and expanded accessibility checks for Canvas Bulk Editor auditing/remediation.

- Tier 1 = minimum baseline (Canvas parity)
- Tier 2 = expanded checks for stronger institutional compliance coverage

**Implementation status:** Rules below are marked when the **scanner emits** `rule_id` findings (`canvas.service.ts` Tier 1 / Tier 2 evaluators). **Fix strategy and fixability flags** (what the LTI-launched tool treats as auto vs suggested vs manual) live in **`ACCESSIBILITY_FIXABILITY_MAP`** in `canvas.service.ts` (some `rule_id`s have fix wiring but **no scanner yet**—left unchecked here).

**Human-readable mirror (Auto / Suggested / Manual tables):** [`ACCESSIBILITY_CHECKPOINTS.md`](./ACCESSIBILITY_CHECKPOINTS.md).

**Subjective fix QA (preview/apply spot-checks):** [`test/fixtures/accessibility-qa/MANUAL_AI_QA_SPOTS.md`](./test/fixtures/accessibility-qa/MANUAL_AI_QA_SPOTS.md).

---

## **QA: Broken-course generator (required)**

**Goal:** Maintain an **automatic** way to create a **dedicated Canvas course** (or sandbox shell) populated with **artifacts that intentionally trigger every `rule_id`** in the accessibility checker, so you can run **end-to-end QA**: scan → grid → fix preview → apply → re-scan, without hunting production content.

**Deliverable:** A generator (script or small admin flow) that:

| Done | Requirement | Detail |
|:----:|-------------|--------|
| [ ] | **Coverage** | At least one **HTML body** per rule (or one combined page with **labeled sections** per rule, if some rules conflict in one snippet—document the split). |
| [ ] | **Resource mix** | Pages, assignments, announcements, discussions, syllabus—matching `ACCESSIBILITY_SUPPORTED_TYPES` / scan targets. |
| [ ] | **Deterministic** | Same generator version → same expected rule hits (golden list: `rule_id` → resource + snippet id). |
| [ ] | **Safe** | Use a **throwaway course** or naming like `[QA] A11y Broken Fixtures` so it never ships to learners. |
| [ ] | **CI / regression** | Optional: headless or API-driven **“expect N findings for rule X”** assertions against generated HTML strings before Canvas upload. |

**Non-goals for v1:** Perfect WCAG pedagogy; the point is **checker coverage**, not course design.

**Process:** After any new rule or scanner change, **update the generator** in the same PR or immediately after, and run the **full QA checklist** on the broken course.

**Full implementation plan:** [`ACCESSIBILITY_CHECKS_QA_PLAN.md`](./ACCESSIBILITY_CHECKS_QA_PLAN.md). **Runbook:** [`test/fixtures/accessibility-qa/RUNBOOK.md`](./test/fixtures/accessibility-qa/RUNBOOK.md).

---

## Scope (initial)

Resource types to scan first:
- [x] Pages
- [x] Assignments

Then expand to:
- [x] Announcements
- [x] Syllabus
- [x] Discussions

---

## Tier 1 — Minimum Baseline (Canvas-Parity Start)

### Images
- [x] Missing alt text (`img_missing_alt`)
- [x] Alt text too long (set policy threshold; recommended 200 chars for course checker parity) (`img_alt_too_long`)
- [x] Alt text appears to be filename (`img_alt_filename`)

### Tables
- [x] Missing table header (`<th>`) (`table_missing_header`)
- [x] Missing/invalid table header scope (`table_header_scope_missing`)
- [x] Missing table caption (`table_missing_caption`)

### Headings
- [x] Skipped heading levels (`heading_skipped_level`)
- [x] Heading too long (>120 chars) (`heading_too_long`)
- [x] H1 used inside body content (`heading_h1_in_body`)

### Lists
- [x] Visual list content not marked up as semantic list (`ul/ol/li`) (`list_not_semantic`)

### Links
- [x] Adjacent links to same URL (should be merged) (`adjacent_duplicate_links`)
- [x] Broken/split links caused by spacing/content fragmentation (`link_split_or_broken`)

### Contrast
- [x] Small text contrast below WCAG AA (4.5:1) — inline `style` color + background only (`small_text_contrast`)
- [x] Large text contrast below WCAG AA (3:1) — same (`large_text_contrast`)

---

## Tier 2 — Expanded Compliance Checks

### Navigation and link quality
- [x] Empty links and empty buttons (no accessible name) (`link_empty_name`, `button_empty_name`)
- [x] Generic/ambiguous link text ("click here", "read more") without context (`link_ambiguous_text`)
- [x] New-tab links without warning text/indicator (`link_new_tab_no_warning`)
- [x] File links without type/size hint (PDF/DOC/PPT) (`link_file_missing_type_size_hint`)
- [ ] Broken links (HTTP error responses such as 404/403/500) (`link_broken` — fix metadata only; no live HTTP check in scanner)

### Language and internationalization
- [ ] Missing document language (`lang` on root HTML) (`lang_missing` — fix metadata only)
- [ ] Invalid or unrecognized language code in `lang` (`lang_invalid` — fix metadata only)
- [ ] Missing inline language override for mixed-language content (`lang_inline_missing` — fix metadata only)

### Heading and structure quality
- [x] Duplicate H1 or empty headings (`heading_duplicate_h1`, `heading_empty`)
- [x] Headings used purely for visual styling (`heading_visual_only_style`)
- [x] Landmark structure quality flags (`main`, `nav`, `region`) on long pages (`landmark_structure_quality`)

### Lists and tables (advanced)
- [x] Empty list items (`list_empty_item`)
- [x] Layout-table heuristic flags (`table_layout_heuristic`)
- [x] Complex table associations (rowspan/colspan without clear header relationships) (`table_complex_assoc_missing`)

### Images and non-text content
- [x] Decorative image misuse (decorative image has meaningful alt or meaningful image has empty alt) (`img_decorative_misuse`, `img_meaningful_empty_alt`)
- [x] Potential text-in-image readability warnings (`img_text_in_image_warning`)

### Media/time-based content
- [x] Video without captions (`video_missing_captions`)
- [x] Audio-only without transcript (`audio_missing_transcript`) — heuristic (page text must mention “transcript” to clear)
- [x] Autoplay media (`media_autoplay`)
- [x] Motion/animation warning flags (e.g., GIF-heavy content) (`motion_gif_warning`)
- [ ] Session timeout without warning/extension mechanism (`session_timeout_no_warning` — fix metadata only)
- [x] Embedded YouTube/Vimeo: captions cannot be confirmed from markup (`video_embed_caption_unknown`)

### Color, sensory, and readability
- [ ] Information conveyed by color alone (`color_only_information` — fix metadata only)
- [ ] Instructions based only on sensory cues (left/right/red/etc.) (`sensory_only_instructions` — fix metadata only)
- [x] Fully justified paragraph text (`text_justified`)
- [x] Inline hardcoded font sizes below 10px (`font_size_too_small`)

### Embedded content
- [x] Iframes without meaningful `title` (`iframe_missing_title`)

### Forms and interactive controls
- [x] Inputs/selects/textareas without labels (`form_control_missing_label`)
- [x] Placeholder used as label (`form_placeholder_as_label`)
- [x] Required-state not programmatically conveyed (`form_required_not_programmatic`)
- [x] Error message not associated with control (`form_error_unassociated`)

### ARIA and semantic validity
- [x] Invalid ARIA roles/attributes (`aria_invalid_role`)
- [x] `aria-hidden="true"` on focusable elements (`aria_hidden_focusable`)
- [x] Duplicate IDs (`duplicate_id`)
- [x] Focusability/keyboard-trap heuristic warnings (where detectable) (`keyboard_focus_trap_heuristic`)

### Document/file accessibility (if linked/attached)
- [ ] PDF likely image-only (no text layer) — not implemented; see below
- [x] Linked PDF: accessibility unknown / verify (`doc_pdf_accessibility_unknown`) — link-level flag, not file introspection
- [x] DOC/PPT structural accessibility flags (headings, slide titles, alt text) — as `doc_office_structure_unknown` (verify linked file)
- [x] Spreadsheet header/merge risk flags (`doc_spreadsheet_headers_unknown`)

---

## Operational Metadata (for every rule)

Each rule should define:
- [x] `rule_id`
- [x] `tier` (1 or 2) — on each scan finding and CSV (`ACCESSIBILITY_TIER1_RULE_IDS` → Tier 1; else Tier 2); AG Grid **Tier** column
- [x] `severity` (blocker/high/medium/low)
- [ ] `wcag_ref` (if applicable)
- [x] `resource_types` — implied by scan target
- [x] `auto_fixable` (true/false)
- [x] `fix_strategy` (`auto` | `suggested` | `manual_only`)
- [x] `false_positive_risk` (low/medium/high)
- [ ] `default_enabled` (true/false)
- [x] `rule_version` — single version on scan report / CSV (`tier2-v1`), not per-rule

`fix_strategy` definitions:
- `auto`: tool applies fix automatically
- `suggested`: tool proposes fix/value for human review and approval
- `manual_only`: tool flags only; human judgment required

Assignment guideline:
- `auto_fixable: true` + `false_positive_risk: low` -> `fix_strategy: auto`
- `auto_fixable: true` + `false_positive_risk: medium` -> `fix_strategy: suggested`
- `auto_fixable: false` + `false_positive_risk: low` -> `fix_strategy: suggested`
- `auto_fixable: false` + `false_positive_risk: medium|high` -> `fix_strategy: manual_only`

---

## Suggested rollout

1. [x] Implement all Tier 1 checks first.
2. [x] Add Tier 2 checks with low false-positive risk.
3. [ ] Gate higher-risk Tier 2 checks behind feature flags.
4. [x] Add auto-fix only for deterministic, reversible transformations.

---

## Performance and Rate-Limit Strategy

Goal: beat Canvas perceived scan time for repeat runs while staying within API limits.

### Fast scan architecture
- [ ] Use two passes:
  - Index pass (cheap): list resources with `id` + `updated_at`.
  - Detail pass (expensive): fetch full body only for changed/new resources.
- [ ] Persist a scan manifest (`resource_id`, `updated_at`, `content_hash`, `last_scan_at`, `last_rule_version`).
- [ ] Re-scan unchanged content only when rule version changes.

### Throttle-aware execution
- [ ] Start with low concurrency and adapt dynamically.
- [ ] On `429`, honor `Retry-After`, reduce concurrency, and apply jittered backoff. *(partial: limited retry in some Canvas fetch paths)*
- [ ] Ramp concurrency back up slowly after a stable success window.
- [ ] Isolate queues by resource type (pages, assignments, discussions) to prevent starvation.

### Cost control
- [ ] Run cheap structural checks first; only run expensive checks when triggered.
- [ ] Cache normalized DOM and per-rule outcomes by `content_hash`. *(partial: `content_hash` used for fix apply idempotency)*
- [ ] Batch writes of findings/results; avoid per-item persistence overhead.

### Reliability
- [ ] Save checkpoints continuously so interrupted scans resume instead of restart.
- [ ] Prefer continuous delta scans over repeated full scans.
- [ ] Track scan telemetry: items scanned, changed items, 429 count, avg latency, total duration.
