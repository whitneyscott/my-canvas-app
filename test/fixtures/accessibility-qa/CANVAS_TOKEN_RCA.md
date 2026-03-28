# Canvas `401 Invalid access token` — RCA (OSS)

Evidence from **this** Canvas OSS stack: `canvas-web-1` access logs, `development.log`, and `canvas-postgres-1` `canvas_development.access_tokens`. Docker CLI from Windows: `wsl -e docker …`.

## 1. Failure window (first 401 + burst)

**Earliest `401` in `canvas-web-1` logs (sampled full history):**

- `2026-03-28 13:53:31 +0000` — `GET /api/v1/courses?per_page=100&include[]=course_image` — `401` — body size `59` — `User-Agent: node` — client `172.18.0.1` (Docker host → container).

**Later burst (same signature):**

- `2026-03-28 19:27:53 +0000` through `19:28:06 +0000` — parallel `GET` to `/api/v1/courses/20/...` (pages, assignments, discussions, modules, quizzes, course) — all `401` — `59` bytes — `node`.

**Contrast (same day, success):**

- e.g. `2026-03-28 19:06:50 +0000` — `/api/v1/courses/20/pages/...` — Rails context shows **user 1** and permission checks for course 20 (valid bearer for that period).

## 2. Canvas auth logs (Rails)

Request id for first failure: `5fe4bd6d-4f98-4906-a0b3-80c94f0c5e74` at `2026-03-28 13:53:31 +0000`.

`development.log` shows:

- `AccessToken Load` with  
  `WHERE "access_tokens"."crypted_token" = 'd4388207028051ec5169e2176b4a18f984cf5326'`
- Controller runs but Sentry/context tags include **`user_id: nil`**, **`response_code: 401`**
- `Completed 401 Unauthorized`

Request id for a `19:27:53` failure: `4e077ba1-6cd8-4904-bd0c-f6c437b27f32` — **same** `crypted_token` value in SQL.

**Interpretation:** Canvas hashed the presented bearer and looked up that digest. Authentication failed before a user was bound (`user_id: nil`).

## 3. Token record (PostgreSQL)

As `postgres` on `canvas_development`:

```sql
SELECT id, user_id, token_hint, workflow_state, last_used_at, expires_at
FROM access_tokens
WHERE crypted_token = 'd4388207028051ec5169e2176b4a18f984cf5326';
```

**Result: 0 rows.**

So the secret sent on those requests is **not** any access token stored in this database (wrong value for this instance, token from another environment, typo, truncation, or DB reset after the token was minted elsewhere).

Recent rows **do** exist (e.g. `id` 240, `workflow_state` `active`, `user_id` 1, `last_used_at` on `2026-03-28`) — the instance is healthy; the failing client used a **different** digest than those rows.

## 4. Root cause class

| Bucket | Applies? |
|--------|----------|
| Rate limit revoking token | **No** — throttling logged separately; failure is `401` with missing user, not `429`. |
| Revoked row still present | **No** — digest **not in** `access_tokens` at all. |
| Instance / URL mismatch only | **Partially** — URL was correct (`127.0.0.1`, `/api/v1`). The **credential** did not belong to this DB. |
| **Unknown / wrong bearer for this Canvas DB** | **Yes** — definitive: `crypted_token` lookup returns no row. |

**Label:** **Wrong or unknown API token for this Canvas instance** (secret does not correspond to any `access_tokens` row in `canvas_development`).

## 5. Operational safeguards (no app code required)

1. **Preflight** — Before long QA runs:  
   `curl -sS -o NUL -w "%{http_code}" -H "Authorization: Bearer $CANVAS_ACCESS_TOKEN" "http://127.0.0.1/api/v1/users/self"`  
   Expect `200`. On `401`, stop; fix token or `CANVAS_BASE_URL` before `qa:accessibility:run` / builder.

2. **One token value** — QA scripts accept any of `CANVAS_ACCESS_TOKEN`, `CANVAS_TOKEN`, or `QA_CANVAS_TOKEN`, but if several are set to **different** strings they exit with an error (no silent precedence). Echo last 4 chars only when debugging.

3. **Fail fast** — On first Nest/Canvas `401` with `Invalid access token`, abort the run; do not rely on “maybe later requests work.”

4. **Diagnostic bundle** (archive when it happens again):  
   - UTC timestamp of first `401` from `docker logs canvas-web-1` (or grep `401` lines).  
   - One `request_id` from `development.log` for that second.  
   - Output of the SQL above with the `crypted_token` from that log line (confirms 0 vs 1 row).  
   - Redacted: `CANVAS_BASE_URL`, token hint from UI, not the full token.

5. **WSL vs Windows** — If Canvas runs in WSL Docker, run builder/runner from the same network context that can reach the mapped port; see [RUNBOOK.md](./RUNBOOK.md) § WSL2.

6. **After Canvas DB reset / new compose volume** — Re-create access tokens in the UI; old bearer strings are invalid permanently for the new DB.

## 6. Commands reference (WSL)

```bash
docker logs canvas-web-1 2>&1 | grep ' 401 ' | head
docker exec canvas-web-1 grep -a 'REQUEST_ID' /usr/src/app/log/development.log
docker exec canvas-postgres-1 psql -U postgres -d canvas_development -c "SELECT id, token_hint, workflow_state FROM access_tokens ORDER BY id DESC LIMIT 5;"
```

Replace `REQUEST_ID` with the UUID from the `Started GET` line’s bracket prefix in `development.log`.
