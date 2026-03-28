# Accessibility QA — Runbook

Per [ACCESSIBILITY_CHECKS_QA_PLAN.md](../../ACCESSIBILITY_CHECKS_QA_PLAN.md).

## Prerequisites

- Canvas instance (dev/staging; never production)
- Canvas API token with course create/edit scope
- Node 18+

## 1. Build QA course (Phase 1)

`npm run qa:accessibility:build` runs **`nest build`** first so the builder can load `ACCESSIBILITY_FIXABILITY_MAP` from `dist/canvas/canvas.service.js` and embed registry fields in the manifest.

```bash
export CANVAS_ACCESS_TOKEN="your_canvas_api_token"

npm run qa:accessibility:build
```

Token resolution: **`CANVAS_ACCESS_TOKEN`**, then `CANVAS_TOKEN`, then `QA_CANVAS_TOKEN`. Canvas API base: **`CANVAS_BASE_URL`** or **`QA_CANVAS_BASE_URL`** if set; otherwise **`http://localhost:3000/api/v1`** (Canvas LMS in Docker / local OSS). For hosted Instructure (or any other host), set `CANVAS_BASE_URL` (e.g. `https://yourschool.instructure.com/api/v1`).

Creates/updates course `[QA][A11y] Automated Fixtures` (code `QA-A11Y-FIX`), injects Pages and Assignments with intentional violations, writes `test/fixtures/accessibility-qa/manifest.json` (includes `fix_strategy`, `uses_ai`, `is_image_rule`, `uses_second_stage_ai`, `dual_option`, `pending_heuristic` per fixture where applicable).

## 2. Run QA (Phase 2)

Start the app with QA auth enabled:

```bash
export QA_ACCESSIBILITY_ENABLED=1
npm run start:api
```

In another terminal:

```bash
export CANVAS_ACCESS_TOKEN="your_canvas_api_token"
export API_BASE_URL="http://localhost:3002"   # default

npm run qa:accessibility:run
```

Runner loads manifest, calls scan API with `X-QA-Canvas-Token` and `X-QA-Canvas-Url`, asserts expected findings (resource types `page` / `assignment` match the API), writes `test/fixtures/accessibility-qa/report-<run_id>.json`. Exits 1 on strict-tier scanner failures and, when fix QA is on, strict-tier **fix** failures.

**Optional auto-fix verification:** set `QA_FIX_AUTO=1` to run `fix-preview-item` → `fix-apply` → re-scan per strict `auto` fixture (skips `uses_ai` rules unless `QA_FIX_AUTO_AI=1`, skips `dual_option` rows). Default is scan-only (`QA_FIX_AUTO` unset).

## Env vars

| Var | Builder | Runner | Description |
|-----|---------|--------|-------------|
| CANVAS_ACCESS_TOKEN | ✓ | ✓ | Canvas API token (preferred name in this repo’s `.env`) |
| CANVAS_TOKEN | ✓ | ✓ | Alternate token (optional) |
| QA_CANVAS_TOKEN | ✓ | ✓ | Alternate token for QA-only runs (optional) |
| CANVAS_BASE_URL | ✓ | ✓ | Canvas API base; optional if default matches Docker OSS (`http://localhost:3000/api/v1`) |
| QA_CANVAS_BASE_URL | ✓ | ✓ | Overrides `CANVAS_BASE_URL` when set |
| QA_ACCESSIBILITY_ENABLED | — | (server) | Set `1` so server accepts QA headers |
| API_BASE_URL | — | ✓ | App URL (default `http://localhost:3002`) |
| MANIFEST_PATH | — | ✓ | Override manifest path |
| QA_STRICT_ALL | — | ✓ | Set `1` to fail on best_effort tier too |
| QA_REPORT_PATH | — | ✓ | Override report output path |
| QA_FIX_AUTO | — | ✓ | Set `1` to verify non-AI `auto` fixes (preview → apply → re-scan) |
| QA_FIX_AUTO_AI | — | ✓ | Set `1` with `QA_FIX_AUTO=1` to include `uses_ai` auto rules (calls Anthropic) |

## Server note

With `QA_ACCESSIBILITY_ENABLED=1`, **header override is disabled when `NODE_ENV=production`**, even if the variable is set. The process logs a warning at startup when `QA_ACCESSIBILITY_ENABLED=1`.

## Protection

- Course name/code clearly labeled as QA
- Never use production Canvas URL
- Restrict enrollment to QA admins in Canvas
