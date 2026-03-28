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

Token resolution: **`CANVAS_ACCESS_TOKEN`**, then `CANVAS_TOKEN`, then `QA_CANVAS_TOKEN`.

**Canvas API base (differentiated — no silent single default):**

1. If **`CANVAS_BASE_URL`** or **`QA_CANVAS_BASE_URL`** is set, that URL is used (any host).
2. Else **`CANVAS_QA_PROFILE`** (alias **`QA_CANVAS_PROFILE`**) must select which *known* default applies:
   - **`docker`** or **`local`** → `http://127.0.0.1:3000/api/v1` (typical Canvas OSS in Docker; `127.0.0.1` avoids Windows IPv6 `localhost` issues)
   - **`online`** or **`hosted`** → `https://canvas.instructure.com/api/v1` (hosted Instructure-style API host)

If neither an explicit URL nor a profile is set, the scripts exit with an error. The builder and runner load the project **`.env`** first (without overriding variables already set in the shell).

The Bulk Editor **browser** login still uses its own default URL in `AppController`; that is separate from these CLI rules.

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
| CANVAS_BASE_URL | ✓ | ✓ | Canvas API base when set (wins over profile) |
| QA_CANVAS_BASE_URL | ✓ | ✓ | Overrides `CANVAS_BASE_URL` when set |
| CANVAS_QA_PROFILE | ✓ | ✓ | `docker` \| `local` \| `online` \| `hosted` when URL envs unset |
| QA_CANVAS_PROFILE | ✓ | ✓ | Same as `CANVAS_QA_PROFILE` |
| QA_ACCESSIBILITY_ENABLED | — | (server) | Set `1` so server accepts QA headers |
| API_BASE_URL | — | ✓ | App URL (default `http://localhost:3002`) |
| MANIFEST_PATH | — | ✓ | Override manifest path |
| QA_STRICT_ALL | — | ✓ | Set `1` to fail on best_effort tier too |
| QA_REPORT_PATH | — | ✓ | Override report output path |
| QA_FIX_AUTO | — | ✓ | Set `1` to verify non-AI `auto` fixes (preview → apply → re-scan) |
| QA_FIX_AUTO_AI | — | ✓ | Set `1` with `QA_FIX_AUTO=1` to include `uses_ai` auto rules (calls Anthropic) |

## Server note

With `QA_ACCESSIBILITY_ENABLED=1`, **header override is disabled when `NODE_ENV=production`**, even if the variable is set. The process logs a warning at startup when `QA_ACCESSIBILITY_ENABLED=1`.

## Connection refused / `fetch failed` / `ECONNREFUSED`

Run these **on the same PC** where Docker and the repo live (your terminal, not a remote agent).

1. **Confirm the real published port**  
   `docker ps` — find the Canvas container and the host mapping (e.g. `0.0.0.0:3000->3000/tcp`). If the left side is not `3000`, set **`CANVAS_BASE_URL`** to that port, e.g. `http://127.0.0.1:8080/api/v1`.

2. **Confirm the host can reach Canvas**  
   `curl.exe -I http://127.0.0.1:3000/` (use your port). You should get an HTTP response, not timeout/refused.

3. **Windows + Node: prefer `127.0.0.1` over `localhost`**  
   Node may resolve `localhost` to IPv6 (`::1`) while Docker only listens on IPv4 — same machine still fails. The **`docker`** profile default uses `http://127.0.0.1:3000/api/v1`. If you set **`CANVAS_BASE_URL`** yourself, use `127.0.0.1` unless you know IPv6 works.

4. **Override with an explicit URL**  
   In `.env`: `CANVAS_BASE_URL=http://127.0.0.1:<port>/api/v1` — this wins over `CANVAS_QA_PROFILE`.

5. **Token**  
   The token must be issued **on that same Canvas instance** (Account → Settings → New Access Token).

## WSL2: Canvas `docker compose` in Ubuntu, repo on `/mnt/c/...`

Docker publishes ports on the **Linux** side. **`127.0.0.1` in Windows PowerShell is not always the same stack as `127.0.0.1` inside WSL.**

**Reliable approach:** run the QA scripts from **the same WSL distro** where you ran `docker compose up`:

```bash
cd /mnt/c/dev/Canvas-Bulk-Editor
# use Node/npm installed in WSL, or nvm
npm run qa:accessibility:build
```

Check reachability **in WSL** (not `curl.exe`):

```bash
curl -sI http://127.0.0.1:3000/ | head -n1
```

If Canvas uses another host port, set `CANVAS_BASE_URL` in `.env` to `http://127.0.0.1:<port>/api/v1`. If you insist on running Node from **Windows** while Docker runs only in WSL, Docker Desktop must forward that port to Windows; if the builder still refuses, switch to running the command from WSL as above.

## Protection

- Course name/code clearly labeled as QA
- Never use production Canvas URL
- Restrict enrollment to QA admins in Canvas
