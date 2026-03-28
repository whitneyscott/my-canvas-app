# Accessibility Checks — Automated QA System (Implementation Plan)
## Version 3 — Added Canvas OSS local environment prerequisite (March 2026)

**Purpose:** Define a two-phase automated QA system for the Canvas accessibility **scanner** and **fixer**: (1) a programmatic test course builder, and (2) an automated QA runner that validates detection, fixes, and reporting against a manifest.

**Fix tiers (SSOT, per `rule_id`):** `ACCESSIBILITY_FIXABILITY_MAP` in [`src/canvas/canvas.service.ts`](./src/canvas/canvas.service.ts) — runtime config for the LTI-launched Bulk Editor. **Doc mirror:** [`ACCESSIBILITY_CHECKPOINTS.md`](./ACCESSIBILITY_CHECKPOINTS.md). **Subjective spot-check index:** [`test/fixtures/accessibility-qa/MANUAL_AI_QA_SPOTS.md`](./test/fixtures/accessibility-qa/MANUAL_AI_QA_SPOTS.md).

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

After setup, open the URL shown by your compose port mapping (official `canvas-lms` stack often maps **web to host port 80** — e.g. `http://localhost/`). Use `docker ps` on **`canvas-web`** for the exact host port.

**After setup:**
1. Create an admin account
2. Generate an API token: Account → Settings → New Access Token
3. Set `CANVAS_ACCESS_TOKEN=<your-token>` in `.env`. Set either **`CANVAS_BASE_URL`** (any host) or **`CANVAS_QA_PROFILE=docker`** / **`online`** so the QA scripts know which default API base applies (see RUNBOOK).
4. Run the QA course builder: `npm run qa:accessibility:build` (script: `scripts/accessibility-qa-builder.js`)

### Environment variables for QA

Add these to your local `.env` (never commit to git):

```
QA_CANVAS_BASE_URL=http://127.0.0.1/api/v1
QA_CANVAS_TOKEN=<your-local-canvas-api-token>
QA_ACCESSIBILITY_ENABLED=1
QA_COURSE_ID=<populated automatically after first builder run>
```

**QA scripts (`accessibility-qa-helpers.js`):** **Token:** `CANVAS_ACCESS_TOKEN`, then `CANVAS_TOKEN`, then `QA_CANVAS_TOKEN`. **API base:** `CANVAS_BASE_URL` / `QA_CANVAS_BASE_URL` if set; otherwise **`CANVAS_QA_PROFILE`** (`docker`|`local` → `http://127.0.0.1/api/v1` — host port **80**, usual official `canvas-lms` compose; `online`|`hosted` → Instructure API default). No third hidden default — missing both URL and profile is an error. Project `.env` is loaded for CLI runs without overriding existing shell env. **Browser login** in `AppController` keeps its own defaults; that path is separate.

### Local Service Routing Switch

**Implemented:** In `src/main.ts`, when `QA_ACCESSIBILITY_ENABLED=1` and a request path starts with `/canvas/`, middleware reads `X-QA-Canvas-Token` and `X-QA-Canvas-Url` and writes `session.canvasToken` and `session.canvasUrl` (API base with `/api/v1`). `CanvasService` then uses the session for outbound Canvas calls on that request. Normal teacher flows (LTI/session) are unchanged when those headers are absent.

**Runner wiring:** `scripts/accessibility-qa-runner.js` calls `GET {API_BASE_URL}/canvas/courses/{courseId}/accessibility/scan` with those headers (`API_BASE_URL` defaults to `http://127.0.0.1:3002`, the Nest app port in `main.ts`).

**Done:** `qaAccessibilityHeadersAllowed()` in `src/qa-accessibility-env.ts` disables QA header handling when `NODE_ENV=production`; startup warns when `QA_ACCESSIBILITY_ENABLED=1` (production vs non-production message). Unit tests in `src/qa-accessibility-env.spec.ts`.

**Still open:** Optional hardening — remove `CANVAS_*` fallback from QA scripts so mis-pointing at institutional Canvas is harder.

#### Target behavior

- **Local QA (runner):** Headers + OSS URL/token; app reaches Canvas at header URL.
- **Local dev (UI):** Session/LTI Canvas URL and token as usual.
- **Render production:** Teacher token per session; QA header path should not apply once production guard exists.

#### Environment variable matrix

| Variable | Local QA | Local Dev | Render |
|---|---|---|---|
| `CANVAS_BASE_URL` | Explicit Canvas API base for scripts (wins over profile) | Institution/dev Canvas | Institution Canvas |
| `CANVAS_ACCESS_TOKEN` / `CANVAS_TOKEN` / `QA_CANVAS_TOKEN` | Script token chain | Dev token | N/A for header QA path |
| `CANVAS_QA_PROFILE` | `docker` / `online` (etc.) when URL not set | Set in `.env` for local QA | *(typically unset)* |
| `QA_CANVAS_BASE_URL` | Overrides `CANVAS_BASE_URL` when set | *(not set)* | *(must not be set)* |
| `QA_CANVAS_TOKEN` | OSS token (recommended) | *(not set)* | *(must not be set)* |
| `QA_ACCESSIBILITY_ENABLED` | `1` on Nest process for runner | *(not set)* | *(ignored for header override when `NODE_ENV=production`)* |
| `API_BASE_URL` / `QA_API_BASE_URL` | Runner → Nest (default `http://127.0.0.1:3002`) | — | — |
| `NODE_ENV` | `development` | `development` | `production` |

#### Safety rules

- `QA_ACCESSIBILITY_ENABLED=1` has **no header override effect** when `NODE_ENV=production` — **implemented** via `qaAccessibilityHeadersAllowed()`.
- Startup warning when `QA_ACCESSIBILITY_ENABLED=1` — **implemented** in `main.ts`.
- Prefer failing loudly in scripts if `QA_CANVAS_*` is required (optional hardening); today scripts allow `CANVAS_*` fallback.

#### Implementation checklist (remaining)

1. ~~Locate Canvas base URL / token resolution~~ — session + `CanvasService` for `/canvas/*`; QA override via headers in `main.ts`.
2. ~~`NODE_ENV=production` guard for QA middleware~~ — `src/qa-accessibility-env.ts` + `main.ts`.
3. ~~Startup logging when `QA_ACCESSIBILITY_ENABLED=1`~~.
4. ~~Tests for production guard~~ — `qa-accessibility-env.spec.ts`.
5. Optional: script env strict mode using only `QA_CANVAS_*`.

### Resetting the QA environment

Re-running the builder updates existing pages/assignments in place (idempotent by title/code/slug). A dedicated `--force-rebuild` flag is **not implemented** in `scripts/accessibility-qa-builder.js` yet; delete or recreate the course in Canvas if a full wipe is required.

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

### 0.0 Repository layout (this project)

| Area | Path | Role |
|------|------|------|
| Nest API + Canvas integration | `src/` (`app.module.ts`, `src/canvas/canvas.controller.ts`, `src/canvas/canvas.service.ts`) | Accessibility scan/fix logic and `ACCESSIBILITY_FIXABILITY_MAP` live in **`canvas.service.ts`** (large file). |
| QA course build / scan runner | `scripts/accessibility-qa-builder.js`, `scripts/accessibility-qa-runner.js` | Node CLI; no Nest bootstrap. Builder writes `test/fixtures/accessibility-qa/manifest.json`. |
| Fixture definitions | `test/fixtures/accessibility-qa/fixtures.json`, `manifest.schema.json` | Source fixtures; manifest is generated by the builder. |
| Operator docs | `test/fixtures/accessibility-qa/RUNBOOK.md` | Env vars and commands (keep in sync with this plan). |
| Other Canvas automation | `src/automated-test/` | Separate feature (`/automated-test/...`); not the accessibility QA pipeline. |
| Jest unit tests | `src/**/*.spec.ts` (e.g. `accessibility-fix-registry.spec.ts`) | Registry invariants; `canvas.service.spec.ts` smoke-tests Tier 1 rules. Jest **`moduleFileExtensions`** order is **`ts` then `js`** so stray `src/**/*.js` next to `.ts` does not shadow sources. |

Default HTTP port for the Nest app is **`3002`** (`PORT` in `main.ts`), not Canvas’s `3000`.

### 0.1 Rule Registry

`ACCESSIBILITY_FIXABILITY_MAP` in **`src/canvas/canvas.service.ts`** is the **single source of truth** for all rule classifications. Each rule entry now includes:

- `fix_strategy` — `auto` | `suggested` | `manual_only`
- `fix_type` — typed `AccessibilityFixType` enum value (compile-time enforced)
- `uses_ai` — `boolean` — whether this rule uses the Anthropic API for suggestions
- `is_image_rule` — `boolean` — whether this rule requires vision/image analysis
- `uses_second_stage_ai` — `boolean` — whether this rule triggers a second full-document AI call via `buildAiCheckpointGuidedFix` (currently `true` only for `color_only_information`, `sensory_only_instructions`, `landmark_structure_quality`)

`ACCESSIBILITY_AI_SUGGESTED_RULES` and `ACCESSIBILITY_IMAGE_RULES` are now **derived sets** from the registry, not manually maintained. Any fixture expectation that depends on AI vs heuristic behavior must reference `uses_ai` from the registry, not a hardcoded list.

### 0.2 Current Fix Strategy Counts

Counts are maintained in code; re-count after registry edits (grep `fix_strategy` in `canvas.service.ts`):

| fix_strategy | Count (Mar 2026, repo) | Notes |
|---|---|---|
| `auto` | 20 | Includes several former `suggested` / AI-path rules now heuristic |
| `suggested` | 25 | Mix of AI-assisted and heuristic-assisted |
| `manual_only` | 10 | |
| **Total** | **55** | |

Recent direction (historical, for context): rules such as `heading_h1_in_body`, `heading_duplicate_h1`, `table_header_scope_missing`, `form_placeholder_as_label` moved toward `auto`; `heading_empty`, `list_not_semantic`, `table_missing_header`, `aria_invalid_role` toward heuristic auto; `lang_inline_missing`, `lang_invalid`, `iframe_missing_title`, and others toward heuristic `suggested`; `table_layout_heuristic` toward `suggested`.

### 0.3 Temporarily AI-Pathed Rules (TODO: heuristic handlers pending)

In `ACCESSIBILITY_FIXABILITY_MAP`, only **`link_empty_name`** still carries `// TODO: replace with heuristic handler`. Fixture expectations for that rule **must be updated** when a non-AI handler ships.

`link_broken` uses teacher-supplied URL input in the preview flow; treat it as a special case in the runner (§2.5), not as “fully AI.”

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

### 0.8 Video embeds — SproutVideo (product standard)

Bulk course content in this app **standardizes on SproutVideo** for video: pages and assignments use **SproutVideo `<iframe>` embeds** (typical hostnames under **`sproutvideo.com`**, e.g. `videos.sproutvideo.com` / CDN/player subdomains — match whatever the live embed `src` uses in production).

**QA implication:** Any **`iframe_missing_title`** (or future iframe accessibility) fixture matrix must **prioritize SproutVideo** — at minimum:

- One fixture: SproutVideo `iframe` **without** `title` (fix path / manual verify that suggested title is acceptable; today `applyIframeTitleSuggest` derives `Embedded content from <hostname>`).
- Optional: SproutVideo `iframe` **with** valid `title` as clean or negative control.

Other providers (YouTube, Vimeo, Google Docs/Forms) remain **secondary** parity checks for generic URL parsing and caption-unknown heuristics where applicable; they do **not** replace SproutVideo coverage.

---

## 1. Architecture Overview

| Layer | Responsibility |
|-------|------------------|
| **Test Course Builder (Phase 1)** | Creates/updates a single Canvas course; injects HTML and file attachments per rule and content type; emits a **manifest** (JSON + checksum). |
| **Fixture library** | Versioned definitions: per-`rule_id`, per–content-type snippets, boundary variants, clean controls, and mixed-violation bundles. |
| **Artifact store** | Canonical location for pre-built binary fixtures (PDF, Office, media) referenced by the builder; content-addressed hashes in the manifest. |
| **QA Runner (Phase 2)** | Reads manifest; drives scanner API; asserts expected findings; drives fix-preview and fix-apply; re-scans; validates HTML; optional undo round-trip. |
| **Report sink** | Structured report (JSON for machines, summary Markdown for humans); optional push into AG Grid–backed UI as a "QA run" entity. |

**Implementation status (this repo):** Phase 1 is **partial**: `accessibility-qa-builder.js` implements **pages + assignments** only; skips other content types with `skipped_reason: content_type_not_implemented`. After `nest build`, the builder loads `ACCESSIBILITY_FIXABILITY_MAP` from **`dist/canvas/canvas.service.js`** and writes `fix_strategy`, `uses_ai`, `is_image_rule`, `uses_second_stage_ai`, `dual_option`, and `pending_heuristic` on manifest rows (`npm run qa:accessibility:build` runs `nest build` first). Phase 2 runner: **scanner assertions** for manifest fixtures; **strict tier** verified **green** at **23/23** rows on local Canvas OSS (**22** violations + clean control), e.g. `report-qa-1774710091861.json` (Mar 2026), including dual-option `dual_option_choice` rows. Scan matching uses **`resource_type` + `resource_id`** aligned with the API (wiki **`page` URL slug** as `resource_id`, not numeric id only). Optional **`QA_FIX_AUTO=1`** path (preview → apply → re-scan for non-AI `auto` rules; skips `dual_option` and `uses_ai` unless `QA_FIX_AUTO_AI=1`). CLI Canvas API base: **`CANVAS_BASE_URL`** or **`CANVAS_QA_PROFILE`** (`docker` vs `online` defaults); scripts load `.env` without overriding the shell. Scanner emits **`text_justified`**, **`font_size_too_small`**, **`iframe_missing_title`**, and refined **`aria_hidden_focusable`** / **`table_layout_heuristic`** (see dual-option QA notes). **Still open:** strict AI token assertions, broader content types, file uploads.

**Data flow:** Builder → Canvas + **`test/fixtures/accessibility-qa/manifest.json`** → Runner calls Nest **`/canvas/courses/:id/accessibility/scan`** with QA headers → Runner writes **`report-<run_id>.json`** (and optional future baseline diff).

The bulk editor UI uses **AG Grid** (`ag-grid-community`) for course tooling; a dedicated **QA run grid** is still optional/planned — JSON reports are the current output.

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
- **Implemented (repo):** Allowlist defaults and HTTP probe live in [`src/canvas/accessibility-link-probe.ts`](./src/canvas/accessibility-link-probe.ts) (`getLinkCheckAllowlistHosts`, `probeHttpUrlBroken`). Extend hosts with env **`ACCESSIBILITY_LINK_CHECK_HOSTS`** (comma-separated). Scanner emits **`link_broken`** only for `http(s)` links whose hostname is allowlisted. QA fixtures use **`https://httpbin.org/status/404`** with manifest **`broken_link_url`** (GET + redirect follow; **`httpstat.us`** remains an optional default host). Runner refetches scan up to **`QA_LINK_SCAN_RETRIES`** (default 3) for `link_broken` rows when the probe is flaky.
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

**Primary (required for this product):** **SproutVideo** — include at least one `<iframe>` whose `src` uses the same **SproutVideo host pattern** as production embeds (e.g. `https://videos.sproutvideo.com/embed/...` or the hostname your tenant uses). Assert fix-preview / suggested title behavior for that embed; the implementation uses hostname-derived titles (`Embedded content from <hostname>` in `applyIframeTitleSuggest`).

**Secondary (recommended parity):** Additional iframes for YouTube, Vimeo, Google Docs, or Google Forms where those appear in legacy or copied content.

**Fallback:** At least one iframe with an **unrecognized** or internal `src` to verify generic domain / fallback labeling when the URL does not match a known vendor pattern.

### 3.8 Implementation order (Phase 1)

1. ~~Define manifest JSON schema + fixture ID naming convention + **`expectation_tier`** per fixture — include new fields from §2.1.~~ — **done** (`manifest.schema.json`, `fixtures.json`).
2. Add artifact store layout + document hashes for binary fixtures (placeholders OK until files exist). — **not done**
3. ~~Implement course create/find + naming convention.~~ — **done** (builder creates/reuses QA course).
4. ~~Implement Pages + Assignments injection (highest ROI for HTML rules).~~ — **done**
5. Add Announcements, Discussions, Syllabus (composite strategy). — **not done**
6. Add Quizzes + Module items: **capability probe** first (§3.3.1); manifest `skipped_reason` when API cannot preserve HTML; fallback coverage on Pages. — **not done**
7. Add file upload pipeline + linked HTML for file-based rules. — **not done**
8. ~~Emit manifest writer + validation (schema check) — include registry sync step to populate `uses_ai`, `is_image_rule`, `uses_second_stage_ai` from `ACCESSIBILITY_FIXABILITY_MAP`~~ — **done** in `accessibility-qa-builder.js` (reads compiled `dist/canvas/canvas.service.js` after `nest build`).
9. ~~Document runbook: rebuild, reuse, protection.~~ — **done** (`RUNBOOK.md`).

**Dependencies:** Canvas API token + base URL in env; Nest app for runner scan endpoint. Phase 2 **scanner** assertions are **in use** for pages + assignments; full fix QA remains partial.

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

- **Manual / on-demand:** `npm run qa:accessibility:build` then start Nest with `QA_ACCESSIBILITY_ENABLED=1`, then `npm run qa:accessibility:run`. Env vars: see [`test/fixtures/accessibility-qa/RUNBOOK.md`](./test/fixtures/accessibility-qa/RUNBOOK.md) (`CANVAS_ACCESS_TOKEN`, `CANVAS_BASE_URL` **or** `CANVAS_QA_PROFILE`, `API_BASE_URL`, manifest/report overrides). There is **no** single `npm run qa:accessibility` umbrella script.
- **Pipeline (future):** Nightly or pre-deploy against Canvas OSS or isolated staging only; secrets in CI vault; **no** production Canvas URL; fail build on regression flag; artifact upload of JSON report.

### 4.6 Rate limiting

- Runner batches API calls like the scanner: sequential or low-concurrency scan chunks; same backoff on `429`; optional `--max-concurrency` default 1 for QA stability.

### 4.7 Implementation order (Phase 2)

1. ~~Manifest loader + schema validation (including `expectation_tier`, `skipped_reason`, `broken_link_url`, new fields from §2.1).~~ — **done** (`accessibility-qa-runner.js` + `manifest.schema.json`).
2. ~~Scanner assertion engine; respect **strict** vs **best_effort** gates.~~ — **done** for **pages + assignments** in manifest (strict OSS **23/23**, `report-qa-1774710091861.json`).
3. ~~Fix-preview + fix-apply loop + re-scan for `auto` rules using **sequential_reapply** or **single_rule_per_resource** (§4.2.1).~~ — **partial** (`QA_FIX_AUTO=1` optional path; not full matrix).
4. ~~Dual-option fix validation for `aria_hidden_focusable` and `table_layout_heuristic` (§4.2.2).~~ — **done** for scanner + runner wiring; **fix** path smoke with `QA_FIX_AUTO=1` left to operator / future report artifact.
5. Extend to all content types in manifest; quiz capability probe skips documented in report. — **not done** (builder still pages + assignments only).
6. HTML well-formedness + reversibility Level A/B where supported. — **not done** (beyond incidental fix path).
7. AI token validation — assert zero AI tokens for heuristic rules; assert correct model for remaining AI rules. — **not done**
8. Report JSON (tiered rollups + AI cost section) + AG Grid integration. — **partial** (JSON report + strict/best-effort summary; no AG Grid QA surface).
9. Regression baseline compare (strict-only optional for CI). — **not done**
10. CI documentation and staging-only wiring. — **not done** (on-demand RUNBOOK only).

**Dependencies:** Phase 1 manifest stable for targeted content types; Nest route `GET /canvas/courses/:id/accessibility/scan` stable; fix/preview endpoints unchanged contract-wise when fix QA is added.

---

## 5. Cross-Phase Dependencies

| Dependency | Owner |
|------------|--------|
| Catalog `rule_id` list ↔ builder fixtures | Single source: `ACCESSIBILITY_FIXABILITY_MAP` (tool runtime) + scanner implementation |
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

**Where we are (Mar 2026):** **Scanner** supports **`pages`**, **`assignments`**, **`announcements`**, **`discussions`**, **`syllabus`** (`ACCESSIBILITY_SUPPORTED_TYPES`). **Builder** mirrors every **page** violation into matching **announcement** + **discussion** topics (titles `[QA] Ann …` / `[QA] Disc …`) and builds one **merged syllabus** body from all page-violation HTML with manifest row **`syllabus_composite_page_violations`**. **Strict row count** scales with `fixtures.json` (base pages + assignments + clean + ann/disc clones + composite syllabus). Next gaps: **`quizzes`** / **`modules`** (not in scan yet), optional non-Sprout iframe parity, **CI** wiring.

- [x] Manifest JSON Schema (`test/fixtures/accessibility-qa/manifest.schema.json`) — registry fields (`fix_strategy`, `uses_ai`, `is_image_rule`, `uses_second_stage_ai`, `dual_option`, `pending_heuristic`), `broken_link_url`, `canvas_capability` property placeholders; optional: richer `canvas_capability` inner shape per §2.1.
- [x] Fixture definitions (`test/fixtures/accessibility-qa/fixtures.json`) — pages + assignments **strict scanner** set (**28** violation rows + clean control), including **`lang_inline_missing`** (50+ word Spanish span, franc) and **`lang_invalid`** (`lang="english"`), **dual-option** rows, **SproutVideo `iframe_missing_title`**, **`link_broken`**. **Still to add:** optional YouTube/Vimeo/Docs iframe parity rows, more content types.
- [x] Runbook (`test/fixtures/accessibility-qa/RUNBOOK.md`) — env vars, `QA_FIX_AUTO`, production QA note, builder `nest build` prerequisite.
- [x] Builder (`scripts/accessibility-qa-builder.js`) — course create/reuse, **pages + assignments + announcements + discussions** (discussion API), **merged syllabus** from page violations, manifest emit, **registry sync from `dist`** after `nest build`. **Still missing:** `--force-rebuild`, **quizzes/modules** (scan does not load them yet), file-upload pipeline.
- [x] Runner (`scripts/accessibility-qa-runner.js`) — manifest load + schema validation, **strict/best-effort** scanner assertions, JSON report, **`QA_FIX_AUTO`** for **`auto`** / dual-option suggested fixes, **`QA_LINK_SCAN_RETRIES`** refetch for **`link_broken`** rows. **Still missing:** AI token assertions, broader suggested-flow simulation, regression baseline diff, full `link_broken` fix-preview teacher-URL simulation.
- [x] `NODE_ENV=production` guard + startup warning for `QA_ACCESSIBILITY_ENABLED` (`src/qa-accessibility-env.ts`, `main.ts`).
- [x] Subjective QA spot-check index — [`test/fixtures/accessibility-qa/MANUAL_AI_QA_SPOTS.md`](./test/fixtures/accessibility-qa/MANUAL_AI_QA_SPOTS.md) (supplements runtime tier config `ACCESSIBILITY_FIXABILITY_MAP` + doc mirror [`ACCESSIBILITY_CHECKPOINTS.md`](./ACCESSIBILITY_CHECKPOINTS.md); linked from RUNBOOK).
- [x] Documented default: **sequential_reapply** or **single_rule_per_resource** for fix QA (applies once fix loop exists).
- [x] Allowlisted **broken link** URLs for E2E (§2.5) — `accessibility-link-probe.ts`, fixtures + manifest `broken_link_url`, runner retries.
- [x] Dual-option **fix** fixture variants + runner: manifest **`dual_option_choice`** on **pages + assignments** for both rules; **`QA_FIX_AUTO=1`** applies chosen option via `edited_suggestion`. Scanner: **`tabindex="-1"`** exempts `aria_hidden_focusable`; **`role="presentation"`** on `<table>` suppresses `table_layout_heuristic` after layout fix.
- [x] Minimum-length text fixtures for `lang_inline_missing` and `lang_invalid` (franc + scanner in `accessibility-heuristics.ts` / `canvas.service.ts`).
- [x] **Iframe fixtures (SproutVideo-first):** **SproutVideo** `src` without `title` on **pages + assignments** + Tier 2 scanner emission + **`suggestIframeTitleFromSrc`** Sprout label — **done**. Optional: YouTube, Vimeo, Google Docs/Forms, unknown-domain rows (§0.8, §3.7).

---

*End of plan. Version 3 — March 2026 (aligned with Canvas-Bulk-Editor repo layout and scripts).*