# Accessibility Checks — Automated QA System (Implementation Plan)

**Purpose:** Define a two-phase automated QA system for the Canvas accessibility **scanner** and **fixer**: (1) a programmatic test course builder, and (2) an automated QA runner that validates detection, fixes, and reporting against a manifest.

**Fix tiers (expected Auto / Suggested / Manual behavior per `rule_id`):** [`ACCESSIBILITY_CHECKPOINTS.md`](./ACCESSIBILITY_CHECKPOINTS.md).

**Constraints (non-negotiable):**

- Respect Canvas API rate limits using the same throttle-aware strategy as production scanning (concurrency caps, jittered backoff on `429`, optional `Retry-After`).
- Never read or mutate real learner-facing courses; QA operates only on a dedicated QA artifact course and optional sandbox tenant.
- Test course must be **clearly labeled** as a QA artifact (name, course code/SIS ID pattern, and internal metadata if available).
- Identify **manual-only** verification where full automation is impossible (AI fix quality, subjective rewrites).

---

## 1. Architecture Overview

| Layer | Responsibility |
|-------|------------------|
| **Test Course Builder (Phase 1)** | Creates/updates a single Canvas course; injects HTML and file attachments per rule and content type; emits a **manifest** (JSON + checksum). |
| **Fixture library** | Versioned definitions: per-`rule_id`, per–content-type snippets, boundary variants, clean controls, and mixed-violation bundles. |
| **Artifact store** | Canonical location for pre-built binary fixtures (PDF, Office, media) referenced by the builder; content-addressed hashes in the manifest. |
| **QA Runner (Phase 2)** | Reads manifest; drives scanner API; asserts expected findings; drives fix-preview and fix-apply; re-scans; validates HTML; optional undo round-trip. |
| **Report sink** | Structured report (JSON for machines, summary Markdown for humans); optional push into AG Grid–backed UI as a “QA run” entity. |

**Data flow:** Builder → Canvas + **manifest file** (repo or object store) → Runner consumes manifest + Canvas IDs → Runner outputs **report** + regression baseline diff.

---

## 2. Shared Data Structures

### 2.1 Manifest (Phase 1 output, Phase 2 input)

Single top-level document, versioned (`manifest_version`), tied to:

- `builder_version` (semver or git SHA of fixture definitions).
- `canvas_base_url` (for audit trail).
- `course_id`, `course_name`, `course_code` / SIS pattern used for QA identification.
- `created_at`, `rebuilt_at` (if idempotent rebuild).

**Per fixture entry** (array):

| Field | Description |
|-------|-------------|
| `fixture_id` | Stable string, e.g. `page_img_alt_too_long_200`. |
| `rule_id` | Catalog `rule_id` (may repeat across entries). |
| `content_type` | `pages` \| `assignments` \| `announcements` \| `syllabus` \| `discussions` \| `quizzes` \| `modules` |
| `canvas_resource_type` | API entity name for updates. |
| `resource_id` | Filled after create (or lookup). |
| `location_hint` | Human path: page URL slug, assignment name, module name, quiz title, etc. |
| `injection_method` | `api_html` \| `api_upload` \| `hybrid` |
| `expected_findings` | List of `{ rule_id, count_min, count_max, snippet_substring? }` for scanner assertions. |
| `boundary_variant` | Optional: e.g. `alt_len_126`, `alt_len_200`, `alt_len_125` for boundary testing. |
| `mixed_with` | Optional: other `fixture_id`s co-located in same HTML body. |
| `artifact_ref` | For files: `{ sha256, filename, rule_target }`. |
| `clean_control_pair_id` | Links a violation fixture to its clean twin for false-positive checks. |
| `expectation_tier` | `strict` \| `best_effort` — see §2.4. |
| `broken_link_url` | Optional: canonical URL used for `link_broken` fixtures (see §2.5). |
| `canvas_capability` | Optional: `{ quizzes_rich_text: boolean, new_quizzes: boolean }` filled by builder probe; drives skips. |
| `skipped_reason` | If builder or runner skips this fixture: human-readable string (e.g. `new_quizzes_api_unavailable`). |

**Manifest storage:**

- **Primary:** Committed JSON under `test/fixtures/accessibility-qa/` (or similar) **after** a successful build, with `course_id` and resource IDs populated — or a split: **template manifest** (no IDs) in repo, **environment manifest** (with IDs) in a secure artifact bucket or local-only file excluded from git.
- **Runner contract:** Runner accepts `--manifest path` or `QA_MANIFEST_URL`; fails fast if `course_id` missing for remote assertions.

### 2.2 Regression baseline

Separate from manifest: a **last-known-good** snapshot of scanner+fixer outcomes per `fixture_id` (pass/fail, hash of relevant HTML). Used only in Phase 2 for regression detection. Optionally split **strict-only** baseline for CI gates vs full baseline including `best_effort`.

### 2.3 QA run report schema (Phase 2 output)

- `run_id`, `timestamp`, `manifest_version`, `runner_version`.
- Per `fixture_id`: scanner result, fixer result, timings, errors, `expectation_tier`, `reversibility_level` (A/B/C as in §4.2.2).
- Aggregates: by `rule_id`, by `content_type`, by `fix_strategy` (`auto` / `suggested` / `manual_only`), and by tier (`strict` vs `best_effort`).

### 2.4 Rule expectation tiers (strict vs best-effort)

Not every catalog rule is equally suitable for **hard** E2E assertions:

| Tier | Meaning | Runner behavior |
|------|---------|-----------------|
| **`strict`** | Deterministic markup rules (missing alt, empty heading, adjacent duplicate links, etc.). | Missing detection = **fail**; false positive on clean control = **fail** (per policy). |
| **`best_effort`** | Heuristic or context-heavy rules (landmark structure, keyboard-trap heuristic, layout-table heuristic, long-page thresholds). | May require **large HTML** or specific document shape; runner treats miss as **warn** or **skip** unless `strict_mode` CLI flag forces fail. |

- Each `fixture_id` sets `expectation_tier` in the manifest.
- **CI default:** Fail the build only on `strict` regressions; surface `best_effort` in report as **informational** unless `--qa-strict-all` is set.
- **Coverage completeness:** “Every rule” in the catalog = at least one fixture **attempt**; some rows may be `skipped_reason` + `best_effort` until fixtures are perfected.

### 2.5 Broken-link and HTTP-dependent rules (first-class design)

`link_broken` and similar checks are **flaky** if they depend on arbitrary external URLs or third-party uptime.

- **Preferred:** Inject links to URLs **under your control**: same Canvas instance path that returns 404 (e.g. course file path that does not exist, or documented test path), or a **stable internal redirect** in your app if the scanner resolves links through a proxy.
- **Acceptable for staging:** A dedicated **allowlisted** host (e.g. `httpstat.us/404`) with **retry + tolerance** in the runner (e.g. max 2 attempts); failures tagged `failure_domain: infrastructure` not `scanner`.
- **Unit/integration layer:** Scanner logic for HTTP status should have **mocked fetch** tests independent of E2E; E2E only **smokes** that the wiring runs.
- Manifest should record **`broken_link_url`** per fixture so reruns are comparable.

---

## 3. Phase 1 — Test Course Builder

### 3.1 Course identity and protection

- **Naming:** Fixed prefix e.g. `[QA][A11y] Automated Fixtures` + short environment suffix (`dev`, `staging`) if multiple bases exist.
- **Course code / SIS:** Dedicated pattern (e.g. `QA-A11Y-FIX` + suffix) so searches and accidental enrollment are obvious.
- **Protection:** Documented runbook: restrict enrollment to QA admins; optional Canvas **blueprint** or subaccount isolation; never sync to production terms.
- **Modification safety:** Builder uses **idempotent** upsert: same logical fixture updates the same page/assignment by **stable external key** stored in page body as HTML comment or in a custom “manifest pointer” page — *plan only*: prefer **lookup by title + code** before create, to avoid duplicates.

### 3.2 Detect existing course and reuse vs rebuild

- **Discovery:** List courses (filtered by SIS/course code pattern or name prefix) via existing API integration.
- **Policy (configurable):**
  - `reuse_if_manifest_compatible`: if manifest version and fixture set match, skip heavy writes.
  - `force_rebuild`: delete content resources in course or delete course and recreate (destructive; gated by env flag).
- **Output:** Always write fresh **manifest** after build; include `rebuild_reason` if full rebuild occurred.

### 3.3 Content types and injection strategy

| Content type | Violation injection | Manifest recording |
|--------------|---------------------|--------------------|
| **Pages** | Create/update wiki page `body` via API with intentional HTML blocks per section. | `resource_id` = page id or URL slug; `fixture_id` per section comment in HTML. |
| **Assignments** | `description` field via assignments API. | Assignment `id`; optional one assignment per fixture or one per mixed bundle (documented). |
| **Announcements** | Create announcement with HTML `message`. | Announcement `id`. |
| **Syllabus** | Course `syllabus_body` update (single surface — **one combined syllabus page** with anchored sections per rule, or accept one syllabus = many rules in one HTML). | Course id + note “syllabus composite”. |
| **Discussions** | Topic `message` HTML. | Discussion topic `id`. |
| **Quizzes** | Quiz `description`; per-question **question text** HTML where API allows rich text. | Quiz `id`, question `id`s listed per fixture. |
| **Module items** | Module **text** or **external URL** descriptions per Canvas capabilities; if only plain text, inject minimal violation or link to a page fixture. | Module `id`, item `id`. |

#### 3.3.1 Quizzes: Classic vs New Quizzes and API surface

- **Discovery phase (builder):** At build time, run a **capability probe**: create or locate a throwaway quiz, set rich HTML on `description` and at least one question, read back and confirm HTML is preserved (not stripped to plain text).
- **Record results** in manifest `canvas_capability` (and optionally top-level manifest `canvas_quiz_notes`).
- **New Quizzes** may use different endpoints than Classic Quizzes; if the integration only targets Classic, manifest entries for New Quizzes should use `skipped_reason: new_quizzes_not_in_scope_v1` rather than silent omission.
- **Fallback:** If question body cannot hold HTML violations, inject the same rule on a **Page** fixture tagged `rule_id` + `note: primary_surface_page_due_to_quiz_limits` so the rule remains covered elsewhere.

**File-based rules (upload path):**

| Rule target | Artifact | Injection |
|-------------|----------|-----------|
| `doc_pdf_accessibility_unknown` | Pre-built PDF in artifact store | Page/assignment **link** to file in course files or attachment URL after upload to course files API. |
| `doc_office_structure_unknown` | Pre-built `.docx` / `.pptx` | Same: link in HTML after upload. |
| `doc_spreadsheet_headers_unknown` | Pre-built `.xlsx` or `.csv` | Same. |
| `video_missing_captions` | Short silent MP4 (no caption track) uploaded; embed via `<video>` in HTML **or** link to file — match what scanner actually inspects (inline vs link heuristic). |
| `audio_missing_transcript` | Short MP3 uploaded; `<audio>` in HTML without transcript cue. |

Each file: **hash**, original filename, target `rule_id`, and **upload response id** in manifest.

### 3.4 Boundary cases

- Central **variant matrix** in fixture definitions, e.g. for `img_alt_too_long`:
  - Variant A: alt length **125** (at threshold — expect pass or per-policy).
  - Variant B: **126** (just over).
  - Variant C: **200** (catalog parity / scanner message).
- Builder emits **separate `fixture_id`s** per variant; manifest `expected_findings` encodes whether the scanner should fire for 125 or not (per current `ACCESSIBILITY_CHECKS.md` threshold: 200 in catalog text — **runner must align expectations with code**, not doc drift).
- Same pattern for other numeric thresholds (contrast, heading length) as rules evolve.

### 3.5 Mixed-violation items

- **Dedicated “kitchen sink” pages** (one per content type): single HTML containing non-overlapping snippets where possible; where two rules conflict (e.g. same `img` cannot be both missing alt and alt-too-long), **split across two resources** or two sections with clear manifest entries `mixed_with` pointing to co-located ids.
- **Realistic bundles:** e.g. link that is `link_new_tab_no_warning` + `link_file_missing_type_size_hint` + `adjacent_duplicate_links` in one paragraph — one manifest row with `expected_findings` listing multiple `rule_id`s with counts.

### 3.6 Clean control items

- For **each content type**, at least one resource with **valid** semantic HTML (headings, lists, labeled inputs, good links) and **no** intentional violations.
- Manifest marks `is_clean_control: true` and links `clean_control_pair_id` from violation fixtures to assert **false positives** on controls in Phase 2.

### 3.7 Implementation order (Phase 1)

1. Define manifest JSON schema + fixture ID naming convention + **`expectation_tier`** per fixture.
2. Add artifact store layout + document hashes for binary fixtures (placeholders OK until files exist).
3. Implement course create/find + naming convention.
4. Implement Pages + Assignments injection (highest ROI for HTML rules).
5. Add Announcements, Discussions, Syllabus (composite strategy).
6. Add Quizzes + Module items: **capability probe** first (§3.3.1); manifest `skipped_reason` when API cannot preserve HTML; fallback coverage on Pages.
7. Add file upload pipeline + linked HTML for file-based rules.
8. Emit manifest writer + validation (schema check).
9. Document runbook: rebuild, reuse, protection.

**Dependencies:** Existing Canvas auth and HTTP helpers; no Phase 2 until manifest is stable for one vertical slice (e.g. pages only).

---

## 4. Phase 2 — Automated QA Runner

### 4.1 Scanner validation

- Load manifest; for each `fixture_id` with `expected_findings`:
  - Invoke **same access path** as production: course accessibility scan API (or service method) scoped to resources listed in manifest.
  - **Assert:** For each expected `rule_id`, count within `[count_min, count_max]` on that resource (match by `resource_type` + `resource_id` + optional snippet substring).
- **Missed violation:** If expected rule not present → **scanner failure** for that `fixture_id` + `rule_id`.
- **False positive:** Run scan on **clean control** fixtures; any finding → **scanner false positive** (severity high; blocks release if policy says so).

### 4.2 Fix validation

- **Auto fixes:** For each fixture where `fix_strategy === 'auto'` and preview returns an action, approve apply (or direct apply API) → **re-scan** → assert rule cleared (or acceptable residual per policy).
- **Suggested fixes:** Same pipeline but only after explicit “approve” step in runner config (simulate user approval); assert post-apply scan.
- **`afterHtml` / `proposed_html` well-formedness:** Parse with HTML parser (server-side); reject unclosed tags / broken fragments where fix returns snippet; for full-body `proposed_html`, validate document fragment policy. Apply **multi-fix policy** below before interpreting failures.

#### 4.2.1 Multi-fix ordering (same resource)

Applying **multiple** fixes to the **same** HTML body can fail if each preview was computed from the **original** snapshot and full-document `proposed_html` overwrites prior changes.

**Runner policy (choose one and document in runbook):**

| Mode | Behavior |
|------|----------|
| **`sequential_reapply` (recommended for v1)** | For a given resource, apply **one approved fix at a time**; after each apply, **re-fetch** HTML and **regenerate** preview for the next finding, or re-run scan and only assert the targeted rule cleared. |
| **`single_rule_per_resource` (strict)** | Manifest ensures at most **one** auto/suggested fix target per resource per run; mixed-violation pages are scanner-only until merge logic exists. |
| **`merged_apply` (future)** | Product supplies merged `proposed_html` from a single preview batch; runner applies once — requires builder/manifest alignment with product behavior. |

Until merge is proven stable, **default QA to `sequential_reapply` or `single_rule_per_resource`** to avoid false **fixer** failures.

#### 4.2.2 Reversibility and undo

| Level | What to automate |
|-------|------------------|
| **A — Snapshot compare** | Before fix: store full body + `content_hash`. After fix: fetch body. **Undo** via product undo API **if it exists**; else restore from stored snapshot **only in test harness** (not production user flow). |
| **B — Snippet round-trip** | Where fix uses localized `before_html` / `after_html`, assert replacing `after` with `before` in isolation restores substring (fragile if overlapping fixes). |
| **C — Manual** | AI-generated `proposed_html` where meaning matters: mark **reversibility: not_automated** in report; human spot-check. |

**Pass criteria for CI:** Level A with test-harness restore **or** product undo; Level B optional per rule; Level C never blocks build.

### 4.3 Manual verification gates (cannot fully automate)

- **AI-generated** alt text, link replacement URLs, heading rewrites, table captions from Claude: automate **presence** and **length** bounds; **not** semantic correctness — flag for human spot-check list in report.
- **Contrast / color:** May depend on client rendering — note environment variance.
- **Broken link HTTP checks:** Follow §2.5 — do not treat third-party downtime as a scanner regression; tag `failure_domain` appropriately.

### 4.4 Reporting

- **Structure:** Hierarchical: Run → Content type → Rule → Fixture → { scanner, fixer, reversibility }.
- **Pass/fail:** Per `rule_id`, per `content_type`, per `fix_strategy` rollup; **separate rollups** for `expectation_tier: strict` vs `best_effort` so informational rows do not obscure hard failures.
- **Distinguish failures:** `failure_domain: scanner | fixer | infrastructure | manifest_mismatch`.
- **Regressions:** Diff against regression baseline file; any flip from pass→fail → `REGRESSION` with link to prior run id.
- **AG Grid:** Expose report as row data: columns `fixture_id`, `rule_id`, `content_type`, `scanner_status`, `fix_status`, `notes`, `failure_domain`; filter/sort like other bulk grids; optional “load run JSON” for deep link.

### 4.5 CI/CD integration

- **Manual / on-demand:** CLI `npm run qa:accessibility` (or documented script) with env `CANVAS_TOKEN`, `QA_COURSE_ID` or builder-created id, `MANIFEST_PATH`.
- **Pipeline (future):** Nightly or pre-deploy on staging Canvas only; secrets in CI vault; **no** production Canvas URL; fail build on regression flag; artifact upload of JSON report.

### 4.6 Rate limiting

- Runner batches API calls like the scanner: sequential or low-concurrency scan chunks; same backoff on `429`; optional `--max-concurrency` default 1 for QA stability.

### 4.7 Implementation order (Phase 2)

1. Manifest loader + schema validation (including `expectation_tier`, `skipped_reason`, `broken_link_url`).
2. Scanner assertion engine (single content type: pages); respect **strict** vs **best_effort** gates.
3. Fix-preview + fix-apply loop + re-scan for `auto` rules using **sequential_reapply** or **single_rule_per_resource** (§4.2.1).
4. Extend to all content types in manifest; quiz capability probe skips documented in report.
5. HTML well-formedness + reversibility Level A/B where supported.
6. Report JSON (tiered rollups) + AG Grid integration.
7. Regression baseline compare (strict-only optional for CI).
8. CI documentation and staging-only wiring.

**Dependencies:** Phase 1 manifest stable; scanner and fix endpoints unchanged contract-wise.

---

## 5. Cross-Phase Dependencies

| Dependency | Owner |
|------------|--------|
| Catalog `rule_id` list ↔ builder fixtures | Single source: `ACCESSIBILITY_FIXABILITY_MAP` + scanner implementation |
| Manifest schema | Phase 1 defines v1; Phase 2 locks consumers |
| Binary fixtures | Phase 1 requires before file-based rules appear in reports |
| AG Grid | Phase 2 last; can ship JSON-only report first |

---

## 6. Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Canvas API differences (classic vs New Quizzes) | Capability probe (§3.3.1); manifest `skipped_reason`; fallback fixtures on Pages. |
| Drift between doc and scanner thresholds | Single source in code; manifest expectations generated from same constants in future implementation. |
| Heuristic rules never stabilize | Use `best_effort` tier; large fixtures; optional human sign-off per release. |
| Multi-fix on one resource | Default **sequential_reapply** or **single_rule_per_resource** (§4.2.1). |
| AI nondeterminism | Separate “AI smoke” tier; do not block release on wording; block on structure/errors only. |
| Accidental course deletion | Naming + subaccount + runbook; backup manifest with resource IDs. |

---

## 7. Deliverables Checklist

- [x] Manifest JSON Schema drafted (`test/fixtures/accessibility-qa/manifest.schema.json`).
- [x] Fixture definitions for Pages + Assignments (`test/fixtures/accessibility-qa/fixtures.json`).
- [x] Runbook: create/rebuild QA course, rotate credentials, where reports live (`test/fixtures/accessibility-qa/RUNBOOK.md`).
- [x] Builder script (`npm run qa:accessibility:build`).
- [x] Runner script (`npm run qa:accessibility:run`); QA auth via `X-QA-Canvas-Token` / `X-QA-Canvas-Url` when `QA_ACCESSIBILITY_ENABLED=1`.
- [ ] List of **manual** AI QA spots per rule.
- [x] Documented default: **sequential_reapply** or **single_rule_per_resource** for fix QA (runner uses scan-only assertions in v1).
- [ ] Allowlisted / internal **broken link** URLs for E2E (§2.5).

---

*End of plan.*
