# Accessibility Checks Catalog

Purpose: define the minimum and expanded accessibility checks for Canvas Bulk Editor auditing/remediation.

- Tier 1 = minimum baseline (Canvas parity)
- Tier 2 = expanded checks for stronger institutional compliance coverage

---

## Scope (initial)

Resource types to scan first:
- Pages
- Assignments

Then expand to:
- Announcements
- Syllabus
- Discussions

---

## Tier 1 — Minimum Baseline (Canvas-Parity Start)

### Images
- Missing alt text
- Alt text too long (set policy threshold; recommended 200 chars for course checker parity)
- Alt text appears to be filename

### Tables
- Missing table header (`<th>`)
- Missing/invalid table header scope
- Missing table caption

### Headings
- Skipped heading levels
- Heading too long (>120 chars)
- H1 used inside body content

### Lists
- Visual list content not marked up as semantic list (`ul/ol/li`)

### Links
- Adjacent links to same URL (should be merged)
- Broken/split links caused by spacing/content fragmentation

### Contrast
- Small text contrast below WCAG AA (4.5:1)
- Large text contrast below WCAG AA (3:1)

---

## Tier 2 — Expanded Compliance Checks

### Navigation and link quality
- Empty links and empty buttons (no accessible name)
- Generic/ambiguous link text ("click here", "read more") without context
- New-tab links without warning text/indicator
- File links without type/size hint (PDF/DOC/PPT)

### Heading and structure quality
- Duplicate H1 or empty headings
- Headings used purely for visual styling
- Landmark structure quality flags (`main`, `nav`, `region`) on long pages

### Lists and tables (advanced)
- Empty list items
- Layout-table heuristic flags
- Complex table associations (rowspan/colspan without clear header relationships)

### Images and non-text content
- Decorative image misuse (decorative image has meaningful alt or meaningful image has empty alt)
- Potential text-in-image readability warnings

### Media/time-based content
- Video without captions
- Audio-only without transcript
- Autoplay media
- Motion/animation warning flags (e.g., GIF-heavy content)

### Forms and interactive controls
- Inputs/selects/textareas without labels
- Placeholder used as label
- Required-state not programmatically conveyed
- Error message not associated with control

### ARIA and semantic validity
- Invalid ARIA roles/attributes
- `aria-hidden="true"` on focusable elements
- Duplicate IDs
- Focusability/keyboard-trap heuristic warnings (where detectable)

### Document/file accessibility (if linked/attached)
- PDF likely image-only (no text layer)
- PDF missing tags/title/lang/bookmarks (when detectable)
- DOC/PPT structural accessibility flags (headings, slide titles, alt text)
- Spreadsheet header/merge risk flags

---

## Operational Metadata (for every rule)

Each rule should define:
- `rule_id`
- `tier` (1 or 2)
- `severity` (blocker/high/medium/low)
- `wcag_ref` (if applicable)
- `resource_types`
- `auto_fixable` (true/false)
- `false_positive_risk` (low/medium/high)
- `default_enabled` (true/false)
- `rule_version`

---

## Suggested rollout

1. Implement all Tier 1 checks first.
2. Add Tier 2 checks with low false-positive risk.
3. Gate higher-risk Tier 2 checks behind feature flags.
4. Add auto-fix only for deterministic, reversible transformations.

---

## Performance and Rate-Limit Strategy

Goal: beat Canvas perceived scan time for repeat runs while staying within API limits.

### Fast scan architecture
- Use two passes:
  - Index pass (cheap): list resources with `id` + `updated_at`.
  - Detail pass (expensive): fetch full body only for changed/new resources.
- Persist a scan manifest (`resource_id`, `updated_at`, `content_hash`, `last_scan_at`, `last_rule_version`).
- Re-scan unchanged content only when rule version changes.

### Throttle-aware execution
- Start with low concurrency and adapt dynamically.
- On `429`, honor `Retry-After`, reduce concurrency, and apply jittered backoff.
- Ramp concurrency back up slowly after a stable success window.
- Isolate queues by resource type (pages, assignments, discussions) to prevent starvation.

### Cost control
- Run cheap structural checks first; only run expensive checks when triggered.
- Cache normalized DOM and per-rule outcomes by `content_hash`.
- Batch writes of findings/results; avoid per-item persistence overhead.

### Reliability
- Save checkpoints continuously so interrupted scans resume instead of restart.
- Prefer continuous delta scans over repeated full scans.
- Track scan telemetry: items scanned, changed items, 429 count, avg latency, total duration.
