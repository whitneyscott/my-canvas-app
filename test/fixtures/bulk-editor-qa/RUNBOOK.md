# Bulk Editor core QA — Runbook

On-demand API QA for Nest **`/canvas/*`** bulk editor routes. **Does not** call **`/accreditation/`** or **`/accessibility/`** (those have separate flows).

## Prerequisites

- Local Canvas OSS (same policy as [ACCESSIBILITY_CHECKS_QA_PLAN.md](../../ACCESSIBILITY_CHECKS_QA_PLAN.md))
- Node 18+
- `.env` with one Canvas token and `CANVAS_BASE_URL` or `CANVAS_QA_PROFILE` (see [accessibility RUNBOOK](../accessibility-qa/RUNBOOK.md))

## 1. Build QA course (Phase 1)

```powershell
cd C:\dev\Canvas-Bulk-Editor
npm run kill:api-port
npm run qa:bulk:build:force
```

Wait for `Manifest written to ...\test\fixtures\bulk-editor-qa\manifest.json`.

## 2. Start API

```powershell
cd C:\dev\Canvas-Bulk-Editor
npm run kill:api-port
npm run start:api
```

Requires `QA_ACCESSIBILITY_ENABLED=1` on the Nest process (e.g. `.env`).

## 3. Run runner

**Read-only smoke (default):**

```powershell
cd C:\dev\Canvas-Bulk-Editor
$env:API_BASE_URL = "http://127.0.0.1:3002"
npm run qa:bulk:run
```

**Include safe writes** (`PUT` bulk no-op title / name on seeded resources):

```powershell
$env:QA_BULK_INCLUDE_SAFE_WRITE = "1"
npm run qa:bulk:run
```

**Destructive POST/DELETE cases** (only if present in `fixtures.json` and flagged):

```powershell
$env:QA_BULK_ALLOW_MUTATIONS = "1"
npm run qa:bulk:run
```

Optional: `$env:QA_BULK_DELAY_MS = "100"` between requests if Canvas returns `429`.

## Artifacts

- Input: [fixtures.json](./fixtures.json) (case definitions)
- Generated: `manifest.json` (course id + resource ids from builder)
- Output: `report-bulk-qa-<run_id>.json` (gitignored)

## Env vars

| Var | Description |
|-----|-------------|
| `API_BASE_URL` | Nest base (default `http://127.0.0.1:3002`) |
| `MANIFEST_PATH` | Override path to `manifest.json` |
| `FIXTURES_PATH` | Override path to `fixtures.json` |
| `QA_BULK_INCLUDE_SAFE_WRITE` | Set `1` to run `safe_write` tier cases |
| `QA_BULK_ALLOW_MUTATIONS` | Set `1` to run `destructive` tier cases |
| `QA_BULK_DELAY_MS` | Milliseconds to sleep between requests |
| `QA_BULK_REPORT_PATH` | Override report output path |
