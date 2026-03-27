# Accessibility Checks — Automated QA System (Implementation Plan)
## Version 3 — Added Canvas OSS local environment prerequisite (March 2026)

**Purpose:** Define a two-phase automated QA system for the Canvas accessibility **scanner** and **fixer**: (1) a programmatic test course builder, and (2) an automated QA runner that validates detection, fixes, and reporting against a manifest.

**Fix tiers (expected Auto / Suggested / Manual behavior per `rule_id`):** [`ACCESSIBILITY_CHECKPOINTS.md`](./ACCESSIBILITY_CHECKPOINTS.md).

**Constraints (non-negotiable):**

- Respect Canvas API rate limits using the same throttle-aware strategy as production scanning (concurrency caps, jittered backoff on `429`, optional `Retry-After`).
- Never read or mutate real learner-facing courses; QA operates only on a dedicated QA artifact course and optional sandbox tenant.
- Test course must be **clearly labeled** as a QA artifact (name, course code/SIS ID pattern, and internal metadata if available).
- Identify **manual-only** verification where full automation is impossible (AI fix quality, subjective rewrites).
- **QA tools must never run against a production or institution-managed Canvas instance.** All QA operations run against a local Canvas OSS instance only.

---

## Prerequisites — Local Canvas OSS Environment

Before implementing or running any QA tools, a local Canvas LMS open source instance must be set up on the developer's machine. This is a hard requirement — the QA course builder and runner must never operate against TJC's production Canvas or any other institution-managed Canvas instance.

### Why Canvas OSS (not a sandbox course on TJC Canvas)

A sandbox course on TJC's Canvas instance is still hosted on TJC's production server. Running automated QA tools against it carries these risks:

- Automated API calls hammering the server could affect performance for real users and students
- TJC IT infrastructure is outside your control — server changes or outages affect your QA runs
- Any accidental misuse of the API touches institutional infrastructure
- You cannot fully reset or control the environment between test runs

A local Canvas OSS instance runs entirely on your own machine, is completely isolated from TJC, and can be freely created, destroyed, and reset without any institutional risk.

### Setup

Canvas LMS open source runs via Docker. Instructure provides an official Docker-based setup:

**Repository:** `https://github.com/instructure/canvas-lms`

**Minimum requirements:**
- Docker Desktop installed and running
- At least 8GB RAM available for Docker
- At least 20GB free disk space
- macOS, Linux, or Windows with WSL2

**Quick start (Docker):**
```bash
git clone https://github.com/instructure/canvas-lms.git
cd canvas-lms
cp docker-compose/config/canvas.env.example docker-compose/config/canvas.env
docker-compose up -d
```

Canvas will be available at `http://localhost:3000` after initial setup completes (first run takes 15-30 minutes to build).

**After setup:**
1. Create an admin account
2. Generate an API token: Account → Settings → New Access Token
3. Set `CANVAS_BASE_URL=http://localhost:3000` and `CANVAS_TOKEN=<your-token>` in your local `.env`
4. Run the QA course builder: `npm run qa:accessibility:build`

### Environment variables for QA

Add these to your local `.env` (never commit to git):

```
QA_CANVAS_BASE_URL=http://localhost:3000
QA_CANVAS_TOKEN=<your-local-canvas-api-token>
QA_ACCESSIBILITY_ENABLED=1
QA_COURSE_ID=<populated automatically after first builder run>
```

The QA scripts must read from `QA_CANVAS_BASE_URL` and `QA_CANVAS_TOKEN` — separate from the production `CANVAS_BASE_URL` and `CANVAS_TOKEN` — so there is no possibility of accidentally pointing QA tools at TJC Canvas.

### Local Service Routing Switch

All Canvas API traffic in the app must be routable to the local Canvas OSS instance during QA runs. **Before implementing the QA tools, audit the codebase for an existing routing switch that redirects all Canvas API calls through a configurable base URL.** If one exists, document it here and confirm it works for both local and Render deployments. If one does not exist, it must be built.

#### Required behavior

- In **local QA mode**: all Canvas API calls route to `QA_CANVAS_BASE_URL` (e.g. `http://localhost:3000`) using `QA_CANVAS_TOKEN`
- In **local development mode** (non-QA): Canvas API calls route to the developer's configured `CANVAS_BASE_URL` using `CANVAS_TOKEN` as normal
- In **Render production/staging deployment**: Canvas API calls route to the institution's Canvas URL using the teacher's token as normal — QA mode must be impossible to accidentally activate on Render

#### Environment variable matrix

| Variable | Local QA | Local Dev | Render |
|---|---|---|---|
| `CANVAS_BASE_URL` | *(not used by QA tools)* | TJC Canvas URL | TJC Canvas URL |
| `CANVAS_TOKEN` | *(not used by QA tools)* | Developer token | Teacher token (per session) |
| `QA_CANVAS_BASE_URL` | `http://localhost:3000` | *(not set)* | *(must not be set)* |
| `QA_CANVAS_TOKEN` | Local Canvas OSS token | *(not set)* | *(must not be set)* |
| `QA_ACCESSIBILITY_ENABLED` | `1` | *(not set)* | *(must not be set / must be `0`)* |
| `NODE_ENV` | `development` | `development` | `production` |

#### Safety rules

- `QA_ACCESSIBILITY_ENABLED=1` must be **explicitly blocked** when `NODE_ENV=production` — even if someone accidentally sets it on Render, it must have no effect
- The routing switch must log a clearly visible warning at startup when QA mode is active so developers know their traffic is going to local Canvas OSS
- QA mode must never fall back silently to `CANVAS_BASE_URL` if `QA_CANVAS_BASE_URL` is not set — it must fail loudly with a clear error message

#### Implementation checklist (Cursor task)

Before building any QA tools, Cursor must:

1. Search the entire codebase for any existing Canvas base URL configuration, routing middleware, or HTTP client setup that centralizes Canvas API calls
2. Report whether a single configurable routing point exists or whether Canvas base URL is scattered across multiple call sites
3. If a clean routing switch exists — document it, confirm it supports the environment variable matrix above, and add the safety rules if missing
4. If no clean routing switch exists — implement one as a prerequisite to QA tooling:
   - Centralize all Canvas API base URL resolution into a single service or config function
   - Implement the environment variable matrix above
   - Add startup logging when QA mode is active
   - Add production guard that blocks QA mode when `NODE_ENV=production`
   - Add tests confirming the routing switch cannot activate on production

### Resetting the QA environment

To rebuild the test course from scratch:
```bash
npm run qa:accessibility:build -- --force-rebuild
```

To fully reset the local Canvas instance (nuclear option):
```bash
docker-compose down -v
docker-compose up -d
```

### Known limitations of Canvas OSS vs hosted Canvas

- Some features available in Instructure-hosted Canvas (New Quizzes, certain LTI tools) may not be available or may behave differently in Canvas OSS
- The capability probe in Phase 1 (§3.3.1) handles this by detecting available features at build time and recording `skipped_reason` in the manifest when a feature is unavailable
- This is expected and acceptable — the QA suite covers what Canvas OSS supports; gaps are documented in the manifest

---

## 0. Codebase Context (Updated March 2026)

This section captures significant codebase changes made since the original plan was drafted. The QA system must account for all of these.

### 0.1 Rule Registry

`ACCESSIBILITY_FIXABILITY_MAP` is now the **single source of truth** for all rule classifications. Each rule entry now includes:

- `fix_strategy` — `auto` | `suggested` | `manual_only`
- `fix_type` — typed `AccessibilityFixType` enum value (compile-time enforced)
- `uses_ai` — `boolean` — whether this rule uses the Anthropic API for suggestions
- `is_image_rule` — `boolean` — whether this rule requires vision/image analysis
- `uses_second_stage_ai` — `boolean` — whether this rule triggers a second full-document AI call via `buildAiCheckpointGuidedFix` (currently `true` only for `color_only_information`, `sensory_only_instructions`, `landmark_structure_quality`)

`ACCESSIBILITY_AI_SUGGESTED_RULES` and `ACCESSIBILITY_IMAGE_RULES` are now **derived sets** from the registry, not manually maintained. Any fixture expectation that depends on AI vs heuristic behavior must reference `uses_ai` from the registry, not a hardcoded list.

### 0.2 Current Fix Strategy Counts

As of March 2026 after reclassifications:

| fix_strategy | Count | Notes |
|---|---|---|
| `auto` | ~16 | Includes rules reclassified from `suggested` this session |
| `suggested` | ~36 | Mix of AI-assisted and heuristic-assisted |
| `manual_only` | 11 | Unchanged |

**Rules reclassified to `auto` this session** (previously `suggested`, had heuristic handlers already):
- `heading_h1_in_body`, `heading_duplicate_h1`, `table_header_scope_missing`, `form_placeholder_as_label`

**Rules reclassified from AI to `auto` heuristic this session:**
- `heading_empty`, `list_not_semantic`, `table_missing_header`, `aria_invalid_role`

**Rules reclassified from AI to heuristic `suggested` this session:**
- `heading_too_long`, `heading_skipped_level`, `iframe_missing_title`, `link_file_missing_type_size_hint`, `aria_hidden_focusable`, `table_missing_caption`, `lang_inline_missing`, `lang_invalid`

**Rules promoted from `manual_only` to heuristic `suggested` this session:**
- `table_layout_heuristic`

### 0.3 Temporarily AI-Pathed Rules (TODO: heuristic handlers pending)

The following five rules were placed on the AI path as a temporary fix to resolve broken preview (previously returned null). Each has a `// TODO: replace with heuristic handler` comment in the registry. Fixture expectations for these rules **must be updated** when their heuristic handlers ship:

- `link_empty_name`
- `link_broken` *(now has a teacher-supplied URL handler — no longer fully AI)*
- `list_not_semantic` *(reclassified to auto heuristic this session — TODO resolved)*
- `table_missing_header` *(reclassified to auto heuristic this session — TODO resolved)*
- `aria_invalid_role` *(reclassified to auto heuristic this session — TODO resolved)*
- `lang_invalid` *(reclassified to heuristic suggested this session — TODO resolved)*

### 0.4 Double-AI Rules

Three rules trigger a second full-document AI call via `buildAiCheckpointGuidedFix` in addition to the structured suggestion call. These are the most expensive rules in the system and are tagged `uses_second_stage_ai: true` in the registry:

- `color_only_information`
- `sensory_only_instructions`
- `landmark_structure_quality`

The QA runner must report these separately and log second-stage token usage independently.

### 0.5 Dual-Option Fix Rules

Two rules present the teacher with two explicit fix options rather than a single suggestion. The QA runner must test **both options** independently for each:

- `aria_hidden_focusable` — Option A: remove `aria-hidden`; Option B: add `tabindex="-1"`
- `table_layout_heuristic` — Option A: add `role="presentation"` (layout table); Option B: add proper `<th>` headers (data table)

### 0.6 AI Token Optimization

All remaining AI rules now use optimized token settings:

- **Sonnet** (`claude-sonnet-4-6`) for image rules (`is_image_rule: true`)
- **Haiku** (`claude-haiku-4-5-20251001`) for all text-only AI rules
- Prompt caching active (`cache_control: { type: "ephemeral" }` on static instruction block)
- `max_tokens: 250` for structured suggestions
- Per-call token logging: model, rule_id, resource_type, input_tokens, output_tokens, cached tokens
- Session-level aggregate token counter in CanvasService

The QA runner **may optionally assert** correct model selection by inspecting token usage logs during a test run (Sonnet for image rules, Haiku for text rules).

### 0.7 Language Detection

`lang_inline_missing` and `lang_invalid` now use the **franc** language detection library for heuristic language identification. Fixture HTML for these rules must contain sufficient text (minimum ~50 words recommended) for franc to produce reliable detection results.

---

## 1. Architecture Overview

| Layer | Responsibility |
|-------|------------------|
| **Test Course Builder (Phase 1)** | Creates/updates a single Canvas course; injects HTML and file attachments per rule and content type; emits a **manifest** (JSON + checksum). |
| **Fixture library** | Versioned definitions: per-`rule_id`, per–content-type snippets, boundary variants, clean controls, and mixed-violation bundles. |
| **Artifact store** | Canonical location for pre-built binary fixtures (PDF, Office, media) referenced by the builder; content-addressed hashes in the manifest. |
| **QA Runner (Phase 2)** | Reads manifest; drives scanner API; asserts expected findings; drives fix-preview and fix-apply; re-scans; validates HTML; optional undo round-trip. |
| **Report sink** | Structured report (JSON for machines, summary Markdown for humans); optional push into AG Grid–backed UI as a "QA run" entity. |

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
| `uses_ai` | Derived from registry at build time; recorded for runner model-selection assertions. |
| `is_image_rule` | Derived from registry at build time; signals that fixture HTML must include an image element. |
| `uses_second_stage_ai` | Derived from registry; signals runner to expect and log second-stage AI token usage separately. |
| `dual_option` | Optional: `true` if rule presents two fix options (e.g. `aria_hidden_focusable`, `table_layout_heuristic`). Runner tests both options independently when set. |
| `pending_heuristic` | Optional: `true` if rule is temporarily on AI path with a TODO comment — fixture expectations may change when heuristic handler ships. |

**Manifest storage:**

- **Primary:** Committed JSON under `test/fixtures/accessibility-qa/` (or similar) **after** a successful build, with `course_id` and resource IDs populated — or a split: **template manifest** (no IDs) in repo, **environment manifest** (with IDs) in a secure artifact bucket or local-only file excluded from git.
- **Runner contract:** Runner accepts `--manifest path` or `QA_MANIFEST_URL`; fails fast if `course_id` missing for remote assertions.
- **Registry sync:** Builder must read `ACCESSIBILITY_FIXABILITY_MAP` at build time and populate `uses_ai`, `is_image_rule`, `uses_second_stage_ai` per rule from the registry — never hardcode these values in fixture definitions.

### 2.2 Regression baseline

Separate from manifest: a **last-known-good** snapshot of scanner+fixer outcomes per `fixture_id` (pass/fail, hash of relevant HTML). Used only in Phase 2 for regression detection. Optionally split **strict-only** baseline for CI gates vs full baseline including `best_effort`.

### 2.3 QA run report schema (Phase 2 output)

- `run_id`, `timestamp`, `manifest_version`, `runner_version`.
- Per `fixture_id`: scanner result, fixer result, timings, errors, `expectation_tier`, `reversibility_level` (A/B/C as in §4.2.2).
- Aggregates: by `rule_id`, by `content_type`, by `fix_strategy` (`auto` / `suggested` / `manual_only`), and by tier (`strict` vs `best_effort`).
- **AI cost aggregates:** Total tokens consumed per run, broken down by model (Sonnet vs Haiku), by rule, and by first-stage vs second-stage AI calls. Surfaced in report for cost monitoring.

### 2.4 Rule expectation tiers (strict vs best-effort)

Not every catalog rule is equally suitable for **hard** E2E assertions:

| Tier | Meaning | Runner behavior |
|------|---------|-----------------|
| **`strict`** | Deterministic markup rules (missing alt, empty heading, adjacent duplicate links, etc.). | Missing detection = **fail**; false positive on clean control = **fail** (per policy). |
| **`best_effort`** | Heuristic or context-heavy rules (landmark structure, keyboard-trap heuristic, layout-table heuristic, long-page thresholds). | May require **large HTML** or specific document shape; runner treats miss as **warn** or **skip** unless `strict_mode` CLI flag forces fail. |

- Each `fixture_id` sets `expectation_tier` in the manifest.
- **CI default:** Fail the build only on `strict` regressions; surface `best_effort` in report as **informational** unless `--qa-strict-all` is set.
- **Coverage completeness:** "Every rule" in the catalog = at least one fixture **attempt**; some rows may be `skipped_reason` + `best_effort` until fixtures are perfected.
- **Heuristic-only rules** (newly reclassified from AI this session) should start as `best_effort` until their handlers are proven stable across a range of real course content, then promoted to `strict`.

### 2.5 Broken-link and HTTP-dependent rules (first-class design)

`link_broken` and similar checks are **flaky** if they depend on arbitrary external URLs or third-party uptime.

- **Preferred:** Inject links to URLs **under your control**: same Canvas instance path that returns 404 (e.g. course file path that does not exist, or documented test path), or a **stable internal redirect** in your app if the scanner resolves links through a proxy.
- **Acceptable for staging:** A dedicated **allowlisted** host (e.g. `httpstat.us/404`) with **retry + tolerance** in the runner (e.g. max 2 attempts); failures tagged `failure_domain: infrastructure` not `scanner`.
- **Unit/integration layer:** Scanner logic for HTTP status should have **mocked fetch** tests independent of E2E; E2E only **smokes** that the wiring runs.
- Manifest should record **`broken_link_url`** per fixture so reruns are comparable.
- **`link_broken` fix behavior:** The fix handler now prompts the teacher to supply the correct URL via an editable text input in the preview UI. QA runner must simulate teacher URL input and assert the corrected href is applied on the next scan.

---

## 3. Phase 1 — Test Course Builder

### 3.1 Course identity and protection

- **Naming:** Fixed prefix e.g. `[QA][A11y] Automated Fixtures` + short environment suffix (`dev`, `staging`) if multiple bases exist.
- **Course code / SIS:** Dedicated pattern (e.g. `QA-A11Y-FIX` + suffix) so searches and accidental enrollment are obvious.
- **Protection:** Documented runbook: restrict enrollment to QA admins; optional Canvas **blueprint** or subaccount isolation; never sync to production terms.
- **Modification safety:** Builder uses **idempotent** upsert: same logical fixture updates the same page/assignment by **stable external key** stored in page body as HTML comment or in a custom "manifest pointer" page — *plan only*: prefer **lookup by title + code** before create, to avoid duplicates.

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
| **Syllabus** | Course `syllabus_body` update (single surface — **one combined syllabus page** with anchored sections per rule, or accept one syllabus = many rules in one HTML). | Course id + note "syllabus composite". |
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

- **Dedicated "kitchen sink" pages** (one per content type): single HTML containing non-overlapping snippets where possible; where two rules conflict (e.g. same `img` cannot be both missing alt and alt-too-long), **split across two resources** or two sections with clear manifest entries `mixed_with` pointing to co-located ids.
- **Realistic bundles:** e.g. link that is `link_new_tab_no_warning` + `link_file_missing_type_size_hint` + `adjacent_duplicate_links` in one paragraph — one manifest row with `expected_findings` listing multiple `rule_id`s with counts.

### 3.6 Clean control items

- For **each content type**, at least one resource with **valid** semantic HTML (headings, lists, labeled inputs, good links) and **no** intentional violations.
- Manifest marks `is_clean_control: true` and links `clean_control_pair_id` from violation fixtures to assert **false positives** on controls in Phase 2.

### 3.7 Special fixture requirements for new rule types

#### Language detection rules (`lang_inline_missing`, `lang_invalid`)
Fixtures for these rules must contain **sufficient text for franc language detection** — minimum ~50 words of coherent text in the target language. Short snippets may produce unreliable franc results and cause flaky test outcomes.

#### Dual-option rules (`aria_hidden_focusable`, `table_layout_heuristic`)
Each dual-option rule requires **two fixture variants**:
- Variant A: HTML that correctly calls for Option A fix (e.g. focusable element that should have `aria-hidden` removed)
- Variant B: HTML that correctly calls for Option B fix (e.g. focusable element that should have `tabindex="-1"`)

Runner must test both options and assert the correct HTML mutation for each.

#### Double-AI rules (`color_only_information`, `sensory_only_instructions`, `landmark_structure_quality`)
Fixtures for these rules must be tagged `uses_second_stage_ai: true` in the manifest. Runner must:
- Log first-stage and second-stage token usage separately
- Not block on semantic correctness of AI output (block on structure/presence only)
- Report estimated cost per fixture run given double-call nature

#### `iframe_missing_title` (heuristic pattern matching)
Fixtures must include iframes with recognizable src patterns (YouTube, Vimeo, Google Docs, Google Forms) AND at least one unrecognized domain to verify the fallback `[domain] embedded content` pattern.

### 3.8 Implementation order (Phase 1)

1. Define manifest JSON schema + fixture ID naming convention + **`expectation_tier`** per fixture — include new fields from §2.1.
2. Add artifact store layout + document hashes for binary fixtures (placeholders OK until files exist).
3. Implement course create/find + naming convention.
4. Implement Pages + Assignments injection (highest ROI for HTML rules).
5. Add Announcements, Discussions, Syllabus (composite strategy).
6. Add Quizzes + Module items: **capability probe** first (§3.3.1); manifest `skipped_reason` when API cannot preserve HTML; fallback coverage on Pages.
7. Add file upload pipeline + linked HTML for file-based rules.
8. Emit manifest writer + validation (schema check) — include registry sync step to populate `uses_ai`, `is_image_rule`, `uses_second_stage_ai` from `ACCESSIBILITY_FIXABILITY_MAP`.
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
- **Suggested fixes:** Same pipeline but only after explicit "approve" step in runner config (simulate user approval); assert post-apply scan.
- **`afterHtml` / `proposed_html` well-formedness:** Parse with HTML parser (server-side); reject unclosed tags / broken fragments where fix returns snippet; for full-body `proposed_html`, validate document fragment policy. Apply **multi-fix policy** below before interpreting failures.
- **Heuristic handler validation:** For rules reclassified from AI to heuristic this session, assert that `callClaudeStructuredSuggestion` is **not called** during preview — verify via token usage logs showing zero AI tokens for these rules.
- **Model selection validation (optional):** For remaining AI rules, assert correct model selection via token usage logs — `is_image_rule: true` rules must use Sonnet; `is_image_rule: false` rules must use Haiku.

#### 4.2.1 Multi-fix ordering (same resource)

Applying **multiple** fixes to the **same** HTML body can fail if each preview was computed from the **original** snapshot and full-document `proposed_html` overwrites prior changes.

**Runner policy (choose one and document in runbook):**

| Mode | Behavior |
|------|----------|
| **`sequential_reapply` (recommended for v1)** | For a given resource, apply **one approved fix at a time**; after each apply, **re-fetch** HTML and **regenerate** preview for the next finding, or re-run scan and only assert the targeted rule cleared. |
| **`single_rule_per_resource` (strict)** | Manifest ensures at most **one** auto/suggested fix target per resource per run; mixed-violation pages are scanner-only until merge logic exists. |
| **`merged_apply` (future)** | Product supplies merged `proposed_html` from a single preview batch; runner applies once — requires builder/manifest alignment with product behavior. |

Until merge is proven stable, **default QA to `sequential_reapply` or `single_rule_per_resource`** to avoid false **fixer** failures.

#### 4.2.2 Dual-option fix validation

For rules with `dual_option: true` in the manifest (`aria_hidden_focusable`, `table_layout_heuristic`):

- Runner must test **both options independently** using the two fixture variants defined in §3.7.
- For Option A fixture: approve Option A, re-scan, assert violation cleared and Option B not applied.
- For Option B fixture: approve Option B, re-scan, assert violation cleared and Option A not applied.
- Both options must produce valid, well-formed HTML.
- Report pass/fail per option variant, not just per rule.

#### 4.2.3 Reversibility and undo

| Level | What to automate |
|-------|------------------|
| **A — Snapshot compare** | Before fix: store full body + `content_hash`. After fix: fetch body. **Undo** via product undo API **if it exists**; else restore from stored snapshot **only in test harness** (not production user flow). |
| **B — Snippet round-trip** | Where fix uses localized `before_html` / `after_html`, assert replacing `after` with `before` in isolation restores substring (fragile if overlapping fixes). |
| **C — Manual** | AI-generated `proposed_html` where meaning matters: mark **reversibility: not_automated** in report; human spot-check. |

**Pass criteria for CI:** Level A with test-harness restore **or** product undo; Level B optional per rule; Level C never blocks build.

### 4.3 Manual verification gates (cannot fully automate)

- **AI-generated** alt text, link replacement URLs, heading rewrites, table captions from Claude: automate **presence** and **length** bounds; **not** semantic correctness — flag for human spot-check list in report.
- **Double-AI rules** (`color_only_information`, `sensory_only_instructions`, `landmark_structure_quality`): automate structure and presence checks; flag second-stage output for human spot-check. Log both first and second-stage token usage.
- **Franc language detection** (`lang_inline_missing`, `lang_invalid`): automate that a valid BCP 47 lang attribute is applied; do not assert specific language value for short or ambiguous fixture text — mark as `best_effort`.
- **Contrast / color:** May depend on client rendering — note environment variance.
- **Broken link HTTP checks:** Follow §2.5 — do not treat third-party downtime as a scanner regression; tag `failure_domain` appropriately.
- **`link_broken` teacher URL input:** Automate that the corrected href is applied when runner simulates teacher input; do not assert the URL is semantically correct.

### 4.4 Reporting

- **Structure:** Hierarchical: Run → Content type → Rule → Fixture → { scanner, fixer, reversibility }.
- **Pass/fail:** Per `rule_id`, per `content_type`, per `fix_strategy` rollup; **separate rollups** for `expectation_tier: strict` vs `best_effort` so informational rows do not obscure hard failures.
- **Distinguish failures:** `failure_domain: scanner | fixer | infrastructure | manifest_mismatch`.
- **Regressions:** Diff against regression baseline file; any flip from pass→fail → `REGRESSION` with link to prior run id.
- **AI cost section:** Per-run token totals by model, by rule, by first vs second stage. Flag any rule consuming unexpectedly high tokens (e.g. heuristic rule that should have zero AI tokens but shows non-zero).
- **Pending heuristic rules:** Fixtures tagged `pending_heuristic: true` are reported separately with a note that expectations may change when the heuristic handler ships.
- **AG Grid:** Expose report as row data: columns `fixture_id`, `rule_id`, `content_type`, `scanner_status`, `fix_status`, `notes`, `failure_domain`, `ai_tokens_used`, `model_used`; filter/sort like other bulk grids; optional "load run JSON" for deep link.

### 4.5 CI/CD integration

- **Manual / on-demand:** CLI `npm run qa:accessibility` (or documented script) with env `CANVAS_TOKEN`, `QA_COURSE_ID` or builder-created id, `MANIFEST_PATH`.
- **Pipeline (future):** Nightly or pre-deploy on staging Canvas only; secrets in CI vault; **no** production Canvas URL; fail build on regression flag; artifact upload of JSON report.

### 4.6 Rate limiting

- Runner batches API calls like the scanner: sequential or low-concurrency scan chunks; same backoff on `429`; optional `--max-concurrency` default 1 for QA stability.

### 4.7 Implementation order (Phase 2)

1. Manifest loader + schema validation (including `expectation_tier`, `skipped_reason`, `broken_link_url`, new fields from §2.1).
2. Scanner assertion engine (single content type: pages); respect **strict** vs **best_effort** gates.
3. Fix-preview + fix-apply loop + re-scan for `auto` rules using **sequential_reapply** or **single_rule_per_resource** (§4.2.1).
4. Dual-option fix validation for `aria_hidden_focusable` and `table_layout_heuristic` (§4.2.2).
5. Extend to all content types in manifest; quiz capability probe skips documented in report.
6. HTML well-formedness + reversibility Level A/B where supported.
7. AI token validation — assert zero AI tokens for heuristic rules; assert correct model for remaining AI rules.
8. Report JSON (tiered rollups + AI cost section) + AG Grid integration.
9. Regression baseline compare (strict-only optional for CI).
10. CI documentation and staging-only wiring.

**Dependencies:** Phase 1 manifest stable; scanner and fix endpoints unchanged contract-wise.

---

## 5. Cross-Phase Dependencies

| Dependency | Owner |
|------------|--------|
| Catalog `rule_id` list ↔ builder fixtures | Single source: `ACCESSIBILITY_FIXABILITY_MAP` + scanner implementation |
| `uses_ai`, `is_image_rule`, `uses_second_stage_ai` fields | Registry (`ACCESSIBILITY_FIXABILITY_MAP`) — builder reads at build time |
| Manifest schema | Phase 1 defines v1; Phase 2 locks consumers |
| Binary fixtures | Phase 1 requires before file-based rules appear in reports |
| Dual-option fixture variants | Phase 1 must produce two variants per dual-option rule |
| franc language detection library | Must be installed before Phase 1 language rule fixtures are validated |
| AG Grid | Phase 2 last; can ship JSON-only report first |

---

## 6. Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Canvas API differences (classic vs New Quizzes) | Capability probe (§3.3.1); manifest `skipped_reason`; fallback fixtures on Pages. |
| Drift between doc and scanner thresholds | Single source in code; manifest expectations generated from same constants in future implementation. |
| Heuristic rules never stabilize | Use `best_effort` tier; large fixtures; optional human sign-off per release. |
| Multi-fix on one resource | Default **sequential_reapply** or **single_rule_per_resource** (§4.2.1). |
| AI nondeterminism | Separate "AI smoke" tier; do not block release on wording; block on structure/errors only. |
| Double-AI rules produce high cost during QA runs | Log and report second-stage token usage separately; consider running double-AI rule fixtures on a reduced schedule (weekly vs nightly). |
| Accidental course deletion | Naming + subaccount + runbook; backup manifest with resource IDs. |
| Registry drift from manifest | Builder reads `ACCESSIBILITY_FIXABILITY_MAP` at build time to populate `uses_ai`, `is_image_rule`, `uses_second_stage_ai` — never hardcode in fixtures. |
| Temporarily-AI rules changing behavior when heuristic handlers ship | Fixtures tagged `pending_heuristic: true`; runner reports these separately; fixture expectations updated when TODO comments are resolved. |
| franc returning wrong language for short fixture text | Minimum ~50 words of coherent text required for language fixtures; runner marks language detection results `best_effort`. |
| Dual-option rules — wrong option applied | Two fixture variants required per dual-option rule; runner tests each independently (§4.2.2). |

---

## 7. Deliverables Checklist

- [x] Manifest JSON Schema drafted (`test/fixtures/accessibility-qa/manifest.schema.json`) — **needs update for new fields in §2.1**.
- [x] Fixture definitions for Pages + Assignments (`test/fixtures/accessibility-qa/fixtures.json`) — **needs update for reclassified rules and new rule types**.
- [x] Runbook: create/rebuild QA course, rotate credentials, where reports live (`test/fixtures/accessibility-qa/RUNBOOK.md`).
- [x] Builder script (`npm run qa:accessibility:build`) — **needs registry sync step**.
- [x] Runner script (`npm run qa:accessibility:run`); QA auth via `X-QA-Canvas-Token` / `X-QA-Canvas-Url` when `QA_ACCESSIBILITY_ENABLED=1` — **needs dual-option and AI token validation**.
- [ ] List of **manual** AI QA spots per rule — **now includes double-AI rules and franc language detection**.
- [x] Documented default: **sequential_reapply** or **single_rule_per_resource** for fix QA.
- [ ] Allowlisted / internal **broken link** URLs for E2E (§2.5).
- [ ] Dual-option fixture variants for `aria_hidden_focusable` and `table_layout_heuristic`.
- [ ] Minimum-length text fixtures for `lang_inline_missing` and `lang_invalid` (franc requirement).
- [ ] iframe fixture variants covering YouTube, Vimeo, Google Docs, Google Forms, and unknown domain patterns.

---

*End of plan. Version 2 — Updated March 2026.*