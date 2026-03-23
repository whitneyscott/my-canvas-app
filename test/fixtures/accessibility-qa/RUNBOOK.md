# Accessibility QA — Runbook

Per [ACCESSIBILITY_CHECKS_QA_PLAN.md](../../ACCESSIBILITY_CHECKS_QA_PLAN.md).

## Prerequisites

- Canvas instance (dev/staging; never production)
- Canvas API token with course create/edit scope
- Node 18+

## 1. Build QA course (Phase 1)

```bash
export CANVAS_TOKEN="your_canvas_api_token"
export CANVAS_BASE_URL="https://your-canvas.instance.edu/api/v1"

npm run qa:accessibility:build
```

Creates/updates course `[QA][A11y] Automated Fixtures` (code `QA-A11Y-FIX`), injects Pages and Assignments with intentional violations, writes `test/fixtures/accessibility-qa/manifest.json`.

## 2. Run QA (Phase 2)

Start the app with QA auth enabled:

```bash
export QA_ACCESSIBILITY_ENABLED=1
npm run start:api
```

In another terminal:

```bash
export CANVAS_TOKEN="your_canvas_api_token"
export CANVAS_BASE_URL="https://your-canvas.instance.edu/api/v1"
export API_BASE_URL="http://localhost:3002"   # default

npm run qa:accessibility:run
```

Runner loads manifest, calls scan API with `X-QA-Canvas-Token` and `X-QA-Canvas-Url`, asserts expected findings, writes `test/fixtures/accessibility-qa/report-<run_id>.json`. Exits 1 on strict-tier failures.

## Env vars

| Var | Builder | Runner | Description |
|-----|---------|--------|-------------|
| CANVAS_TOKEN | ✓ | ✓ | Canvas API token |
| CANVAS_BASE_URL | ✓ | ✓ | Canvas API base (e.g. `https://canvas.example.edu/api/v1`) |
| QA_ACCESSIBILITY_ENABLED | — | (server) | Set `1` so server accepts QA headers |
| API_BASE_URL | — | ✓ | App URL (default `http://localhost:3002`) |
| MANIFEST_PATH | — | ✓ | Override manifest path |
| QA_STRICT_ALL | — | ✓ | Set `1` to fail on best_effort tier too |
| QA_REPORT_PATH | — | ✓ | Override report output path |

## Protection

- Course name/code clearly labeled as QA
- Never use production Canvas URL
- Restrict enrollment to QA admins in Canvas
