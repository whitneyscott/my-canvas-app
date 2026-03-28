# Accessibility QA — Runbook

Per [ACCESSIBILITY_CHECKS_QA_PLAN.md](../../ACCESSIBILITY_CHECKS_QA_PLAN.md).

## Prerequisites

- Canvas instance (dev/staging; never production)
- Canvas API token with course create/edit scope
- Node 18+

## 1. Build QA course (Phase 1)

`npm run qa:accessibility:build` runs **`nest build`** first so the builder can load `ACCESSIBILITY_FIXABILITY_MAP` from `dist/canvas/canvas.service.js` and embed registry fields in the manifest. It writes **wiki pages**, **assignments**, **announcements**, and **discussions** (cloned from each non-clean **page** row in `fixtures.json`), sets **course syllabus** to a **composite** of all page-violation HTML, and appends manifest row **`syllabus_composite_page_violations`** with multi-rule `expected_findings`.

```bash
export CANVAS_ACCESS_TOKEN="your_canvas_api_token"

npm run qa:accessibility:build
```

**Force a brand-new QA course** (deletes `[QA][A11y] Automated Fixtures` when the token is allowed to, then creates a new course — new `course_id` in `manifest.json`):

```powershell
npm run qa:accessibility:build:force
```

Same as `npm run qa:accessibility:build -- --force-rebuild`. If **`DELETE /api/v1/courses/:id`** is denied, the script warns and continues with the existing reuse/create behavior.

Token resolution: any **one** of **`CANVAS_ACCESS_TOKEN`**, **`CANVAS_TOKEN`**, or **`QA_CANVAS_TOKEN`** (from project `.env` after load, or from the shell / Render). If more than one is set **to different values**, the QA scripts exit with an error so nothing is silently overridden.

**Canvas API base (differentiated — no silent single default):**

1. If **`CANVAS_BASE_URL`** or **`QA_CANVAS_BASE_URL`** is set, that URL is used (any host).
2. Else **`CANVAS_QA_PROFILE`** (alias **`QA_CANVAS_PROFILE`**) must select which *known* default applies:
   - **`docker`** or **`local`** → `http://127.0.0.1/api/v1` (host port **80**, matching common `canvas-lms` `docker compose`: `0.0.0.0:80->80/tcp`). `127.0.0.1` avoids Windows IPv6 `localhost` issues. Custom port → set **`CANVAS_BASE_URL`**.
   - **`online`** or **`hosted`** → `https://canvas.instructure.com/api/v1` (hosted Instructure-style API host)

If neither an explicit URL nor a profile is set, the scripts exit with an error. The builder and runner load the project **`.env`** first (without overriding variables already set in the shell).

The Bulk Editor **browser** login still uses its own default URL in `AppController`; that is separate from these CLI rules.

Creates/updates course `[QA][A11y] Automated Fixtures` (code `QA-A11Y-FIX`), injects Pages and Assignments with intentional violations, writes `test/fixtures/accessibility-qa/manifest.json` (includes `fix_strategy`, `uses_ai`, `is_image_rule`, `uses_second_stage_ai`, `dual_option`, `pending_heuristic` per fixture where applicable).

## 2. Run QA (Phase 2)

**Before starting the API (optional but recommended if the port is stuck):** free Nest’s default port — `npm run kill:api-port` (stops whatever is **listening on 3002**). Override with `powershell -File scripts/kill-listen-port.ps1 3002` or pass another port as the argument.

Start the app with QA auth enabled:

```bash
export QA_ACCESSIBILITY_ENABLED=1
npm run start:api
```

In another terminal:

```bash
export CANVAS_ACCESS_TOKEN="your_canvas_api_token"
export API_BASE_URL="http://127.0.0.1:3002"   # default in runner (avoids Windows localhost/IPv6 issues)

npm run qa:accessibility:run
```

Runner loads manifest, calls **`GET .../accessibility/scan` once** at the start (full course), asserts expected findings from that snapshot, then (when `QA_FIX_AUTO=1`) runs `fix-preview-item` → `fix-apply` and verifies each fix with **`POST .../accessibility/evaluate-html`** (Canvas HTML refetch on the server — no mid-loop course scan). After all fixtures, it runs a **second full `GET` scan by default** and writes **`initial_scan`**, **`final_scan`**, and **`scan_compare`** on the report. Telemetry: stderr lines prefixed **`[QA_SCAN]`** plus `test/fixtures/accessibility-qa/qa-scan-telemetry.jsonl` and **`qa-scan-telemetry.latest.json`** (gitignored). Exits 1 on strict-tier scanner failures and, when fix QA is on, strict-tier **fix** failures.

**Optional auto-fix verification:** set `QA_FIX_AUTO=1` for `fix-preview-item` → `fix-apply` → **evaluate-html** (not a course re-scan). **Auto rules:** `fix_strategy === 'auto'` (skips `uses_ai` unless `QA_FIX_AUTO_AI=1`). **Dual-option suggested rules:** manifest rows with `dual_option_choice` use `edited_suggestion` as today. Rows with `dual_option` but no `dual_option_choice` are skipped for fix. Default is scan-only (`QA_FIX_AUTO` unset). **`QA_FIX_VERIFY=apply_only`** skips evaluate-html after apply (apply-only; weaker).

**Fix-mode needs a course that still has violations:** run **`npm run qa:accessibility:build`** or **`npm run qa:accessibility:build:force`** **before** the fix run (same workflow — do not paste two `qa:accessibility:run` commands back-to-back without a build in between). Full PowerShell flow is in **§2.1**.

To leave fix-mode in a shell: `Remove-Item Env:QA_FIX_AUTO -ErrorAction SilentlyContinue` (or new window) before a scan-only run.

**Scan-only, then fix-mode in the same PowerShell session:** before the scan-only run, clear fix mode so the first command cannot mutate Canvas:

```powershell
Remove-Item Env:QA_FIX_AUTO -ErrorAction SilentlyContinue
```

If `QA_FIX_AUTO` was still set from earlier, the first `qa:accessibility:run` **applies fixes**; the second run (with fix on again) then often shows strict scanner **`got 0`** and `fix_fail=0` — not because the tool is broken, but because the course was already cleared on the first command.

**Note:** fix mode **mutates** the QA course HTML in Canvas (then re-scans). If you need a clean course again, re-run `npm run qa:accessibility:build` afterward.

### 2.1 Verify auto + dual-option fixes (full tool)

**Every** fix run **writes** Canvas HTML. A **second** `qa:accessibility:run:fix` (or `run:fix:ai`) **without** a new `qa:accessibility:build` will usually show **strict scanner failures** on all **`fix_strategy: auto`** rows (`got 0` for the expected rule): those pages/topics were already cleared on the last fix pass. **`fix_fail` can still be 0** — that only measures preview/apply errors, not “violations still present.”

**Required order (one runner command per workflow — rebuild before each fix pass):** `kill:api-port` → **`qa:accessibility:build`** or **`qa:accessibility:build:force`** → start API → **one** `qa:accessibility:run` with `QA_FIX_AUTO=1`. After that fix pass, if you want another fix pass or a trustworthy scan-only, **build again** — do not run `qa:accessibility:run` twice in a row without a build between.

The builder and the runner are **often different terminals** (or different windows). That is fine: the runner only reads `test/fixtures/accessibility-qa/manifest.json` from disk and calls the API. Use the **same repo path** and **same Canvas token/base** as the builder; wait until the builder prints **`Manifest written to`** before starting the runner.

**PowerShell — fix mode (single paste, one run):**

```powershell
cd C:\dev\Canvas-Bulk-Editor
npm run kill:api-port
npm run qa:accessibility:build:force
```

Terminal A (leave running):

```powershell
cd C:\dev\Canvas-Bulk-Editor
$env:QA_ACCESSIBILITY_ENABLED = "1"
npm run start:api
```

Terminal B:

```powershell
cd C:\dev\Canvas-Bulk-Editor
$env:API_BASE_URL = "http://127.0.0.1:3002"
$env:QA_FIX_AUTO = "1"
npm run qa:accessibility:run
```

Equivalent to **`npm run qa:accessibility:run:fix`** when that script sets `QA_FIX_AUTO=1`. Runs **`fix-preview-item` → `fix-apply` → evaluate-html** for manifest rows with **`fix_strategy === 'auto'`** and `uses_ai === false`, and for **`dual_option` + `dual_option_choice`** rows. **`fix_strategy: suggested`** rows without dual-option still show `fix_status` **skip** (expected). Exit **0** only if strict **scanner** and strict **fix** tiers both pass (`fix_fail=0`). A **final full course scan** still runs after the loop unless **`QA_FINAL_SCAN=0`**.

**Optional — include `uses_ai` auto fixes:** set **`ANTHROPIC_API_KEY`** (see app `.env` / ConfigService), then:

```powershell
cd C:\dev\Canvas-Bulk-Editor
npm run qa:accessibility:run:fix:ai
```

Costs API tokens; run only when you intend to validate AI-backed auto fixes.

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
| API_BASE_URL | — | ✓ | App URL (default `http://127.0.0.1:3002` in runner) |
| MANIFEST_PATH | — | ✓ | Override manifest path |
| QA_STRICT_ALL | — | ✓ | Set `1` to fail on best_effort tier too |
| QA_REPORT_PATH | — | ✓ | Override report output path |
| QA_FIX_AUTO | — | ✓ | Set `1` to verify non-AI `auto` fixes (preview → apply → **evaluate-html**); or **`npm run qa:accessibility:run:fix`** |
| QA_FIX_VERIFY | — | ✓ | Default: after apply, **POST evaluate-html** refetches HTML and asserts the rule cleared. Set **`apply_only`** to skip that check. |
| QA_FINAL_SCAN | — | ✓ | Default (unset): run a **second full `GET` scan** after fixtures and fill **`scan_compare`**. Set **`0`** to skip final scan (faster / rate-limit escape; no whole-course before/after delta in the report). |
| QA_FIX_AUTO_AI | — | ✓ | Set `1` with `QA_FIX_AUTO=1` for `uses_ai` auto rules; or **`npm run qa:accessibility:run:fix:ai`** (needs **`ANTHROPIC_API_KEY`** on the Nest process) |
| ANTHROPIC_API_KEY | — | (server) | Required only for `QA_FIX_AUTO_AI` / `run:fix:ai` when applying AI-backed auto fixes |
| CANVAS_SERVICE_DEBUG | — | (server) | Set **`1`** for verbose `[Service]` / `fetchPaginatedData` / `updateAssignment` / `updateQuiz` logs (default off). |
| QA_DEBUG_SCAN | — | ✓ | Set `1` to log scan finding counts and sample `resource_type:resource_id` keys (debug) |
| QA_BASELINE_REPORT | — | ✓ | Path to a prior **`report-qa-*.json`**; after the run, exit **1** if any **strict** row that **passed** in the baseline **fails** now (scanner and, when `QA_FIX_AUTO=1`, fix). Alias: **`QA_BASELINE_PATH`**. |
| QA_LINK_SCAN_RETRIES | — | ✓ | For flaky **`link_broken`** scanner asserts: delay + **evaluate-html** retries (no course rescan); default `3` |
| ACCESSIBILITY_LINK_CHECK_HOSTS | — | (server) | Comma-separated extra hostnames allowed for `link_broken` HTTP probes in the Nest process (defaults include `httpbin.org`, `httpstat.us`) |

## Server note

With `QA_ACCESSIBILITY_ENABLED=1`, **header override is disabled when `NODE_ENV=production`**, even if the variable is set. The process logs a warning at startup when `QA_ACCESSIBILITY_ENABLED=1`.

## Connection refused / `fetch failed` / `ECONNREFUSED`

Run these **on the same PC** where Docker and the repo live (your terminal, not a remote agent).

**`qa:accessibility:run` → “fetch failed” (Nest, not Canvas):** The runner defaults to **`http://127.0.0.1:3002`** so Windows does not resolve `localhost` to IPv6 while Nest listens on IPv4 only. Start **`npm run start:api`** with **`QA_ACCESSIBILITY_ENABLED=1`** first. Confirm **`netstat -ano | findstr :3002`** shows `LISTENING`. Set **`API_BASE_URL`** only if you use another host/port.

If **`.env`** sets **`API_BASE_URL=http://localhost:3002`**, that overrides the runner default — use **`http://127.0.0.1:3002`** there instead, or remove the line so the script default applies.

1. **Confirm the real published port**  
   `docker ps` — find **`canvas-web`** (or `web`): e.g. `0.0.0.0:80->80/tcp` → use `http://127.0.0.1/api/v1`; `0.0.0.0:3000->3000/tcp` → `http://127.0.0.1:3000/api/v1`. Set **`CANVAS_BASE_URL`** to match the **left** (host) port.

2. **Confirm the host can reach Canvas**  
   Match `docker ps` (e.g. `curl.exe -I http://127.0.0.1/` for host port 80, or `http://127.0.0.1:3000/` if mapped there). You should get an HTTP response, not timeout/refused.

3. **Windows + Node: prefer `127.0.0.1` over `localhost`**  
   Node may resolve `localhost` to IPv6 (`::1`) while Docker only listens on IPv4. The **`docker`** profile default uses `http://127.0.0.1/api/v1` (port 80). If you set **`CANVAS_BASE_URL`** yourself, use `127.0.0.1` unless you know IPv6 works.

4. **Override with an explicit URL**  
   In `.env`: `CANVAS_BASE_URL=http://127.0.0.1/api/v1` (port 80) or `http://127.0.0.1:<port>/api/v1` — wins over `CANVAS_QA_PROFILE`.

5. **Token**  
   The token must be issued **on that same Canvas instance** (Account → Settings → New Access Token).

### Canvas `401` / `Invalid access token`

Canvas returns that when the bearer **does not match any row** in this instance’s `access_tokens` (wrong secret, wrong instance, or DB reset). It is **not** the same shape as rate limits (`429`). Confirmed RCA for local OSS: [CANVAS_TOKEN_RCA.md](./CANVAS_TOKEN_RCA.md).

**Before a long run:** Bash/WSL:  
`curl -sS -w "\n%{http_code}\n" -H "Authorization: Bearer $CANVAS_ACCESS_TOKEN" "http://127.0.0.1/api/v1/users/self"`  
PowerShell: same URL with `-H "Authorization: Bearer $env:CANVAS_ACCESS_TOKEN"`. Expect HTTP `200`. If `401`, fix token/URL before `qa:accessibility:build` or `qa:accessibility:run`.

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
curl -sI http://127.0.0.1/ | head -n1
```

If Canvas uses another host port, set `CANVAS_BASE_URL` in `.env` to `http://127.0.0.1:<port>/api/v1`. If you insist on running Node from **Windows** while Docker runs only in WSL, Docker Desktop must forward that port to Windows; if the builder still refuses, switch to running the command from WSL as above.

## Human spot-checks (tiers vs subjective list)

**Per-rule Auto / Suggested / Manual only (runtime):** `ACCESSIBILITY_FIXABILITY_MAP` in [`src/canvas/canvas.service.ts`](../../src/canvas/canvas.service.ts). **Readable tables:** [`ACCESSIBILITY_CHECKPOINTS.md`](../../ACCESSIBILITY_CHECKPOINTS.md).

**Subjective verification** (AI wording, franc, iframe heuristics, etc.): [MANUAL_AI_QA_SPOTS.md](./MANUAL_AI_QA_SPOTS.md).

Strict `qa:accessibility:run` asserts **scanner** expectations; optional `QA_FIX_AUTO` / `QA_FIX_AUTO_AI` add fix pipeline checks per §2 above.

## Protection

- Course name/code clearly labeled as QA
- Never use production Canvas URL
- Restrict enrollment to QA admins in Canvas
