# Accreditation Lookup Microservice — Implementation Plan

## Overview

Standalone, read-only microservice mapping CIP codes to accreditation bodies. New repo/package next to Canvas Bulk Editor; no edits to existing Canvas code.

---

## Phase 1: Project scaffold

1.1 Create new repo folder (e.g. `accreditation-lookup-service`) beside Canvas-Bulk-Editor.

1.2 Initialize Node.js project:

- `package.json` with name, version, `type: "module"` (or `"commonjs"`)
- Dependencies: express, pg, playwright, node-cron, dotenv
- Dev dependencies: typescript, @types/node, @types/express, ts-node, nodemon

1.3 Add `tsconfig.json`: target ES2020+, strict mode, output `dist/`.

1.4 Add `docker-compose.yml` with PostgreSQL and the service; Dockerfile for the service.

1.5 Add `.env.example`: DATABASE_URL, ADMIN_SYNC_SECRET, PORT, etc.

---

## Phase 2: Database schema

2.1 Create migration/schema script with four tables:

- **accreditors**: id, name, abbreviation, source (e.g. CHEA), raw_scope_text, content_fingerprint, created_at, updated_at
- **cip_accreditor_mappings**: id, accreditor_id, cip_2_digit, degree_level, mapping_type (EXPLICIT/INFERRED), created_at
- **institution_accreditations**: id, unit_id, accreditor_id, agency_name, status, period_start, period_end, source, created_at, updated_at
- **sync_log**: id, source (CHEA/DAPIP), started_at, completed_at, status (SUCCESS/FAIL/NO_CHANGE), before_fingerprint, after_fingerprint, records_changed, error_message

2.2 Add indexes for: `cip_accreditor_mappings(cip_2_digit, degree_level)`, `institution_accreditations(unit_id)`, `sync_log(source, started_at)`.

2.3 Add script to run migrations (e.g. `npm run db:migrate`) and document in README.

---

## Phase 3: Core API

3.1 Add Express app and routes, no DB yet:

- `GET /health` — returns 200, service name, uptime.

3.2 Wire DB connection (e.g. pg pool) and add basic connection check in `/health`.

3.3 Implement:

- `GET /accreditors?cip=16.16&degree_level=bachelor` — query cip_accreditor_mappings (normalize CIP to 2-digit), join accreditors, return accreditors.
- `GET /accreditors/:id` — full accreditor row including raw_scope_text.
- `GET /institution/:unitid/accreditations` — query institution_accreditations by unit_id.
- `GET /health` — extend with last sync info from sync_log.

---

## Phase 4: Admin endpoint

4.1 Implement `POST /admin/sync`:

- Read `Authorization: Bearer <token>` or `X-Admin-Key` header.
- Check against ADMIN_SYNC_SECRET env var; return 401 if missing/invalid.
- Accept body or query: `source = chea`, `dapip`, or `all`.
- Create a sync_log row (status PENDING) and return 202 with sync ID.
- For now, handler can stub the actual sync work.

---

## Phase 5: CHEA scraper

5.1 Add Playwright scraper module:

- Navigate to CHEA page.
- Extract accreditor entries: name, abbreviation, scope text.
- Write JSON or in-memory structure; no DB yet.

5.2 Add fingerprint:

- Compute hash (e.g. SHA-256) of normalized scraped content.
- Store as content_fingerprint.

5.3 DB integration:

- Compare new fingerprint with latest CHEA sync_log.after_fingerprint.
- If same: create sync_log with status NO_CHANGE and exit.
- If different: scrape, diff against current accreditors, prepare changes (insert/update) and record them for review; do not auto-commit.

5.4 Add review flow:

- Store proposed changes in a table or file.
- Document how to inspect and approve before applying.

---

## Phase 6: DAPIP scraper

6.1 Add DAPIP fetcher:

- Download bulk CSV (or use documented URL).
- Parse and map columns to institution_accreditations.

6.2 Upsert logic:

- Upsert into institution_accreditations; update sync_log with status, record counts.
- Auto-commit allowed.

6.3 Schedule: add cron job for 1st of quarter, 03:00 UTC (via node-cron).

---

## Phase 7: Cron scheduling

7.1 Wire node-cron:

- CHEA: Monday 02:00 UTC, fingerprint check → scrape only if changed.
- DAPIP: 1st of quarter, 03:00 UTC, full pull + upsert.

7.2 Ensure cron calls the same sync logic as `POST /admin/sync` for consistency.

---

## Phase 8: Bootstrap script (one-time AI)

8.1 Create script:

- Reads accreditors with raw_scope_text.
- Calls Claude API to propose CIP mappings and confidence.
- Writes output to CSV or JSON for review.
- Does not touch DB directly.

8.2 Add second script:

- Reads approved mappings and inserts into cip_accreditor_mappings.
- Run once; not part of runtime.

---

## Phase 9: Docker & deployment

9.1 Finalize Dockerfile:

- Multi-stage build, copy dist and assets.
- Start with `node dist/main` or equivalent.

9.2 docker-compose.yml:

- PostgreSQL service.
- App service depending on DB.
- Env from .env or env_file.

9.3 Add docker-compose up instructions and health-check usage in README.

---

## Phase 10: Documentation

10.1 README sections:

- Purpose and constraints (no Canvas/student/user data).
- Data sources (CHEA, DAPIP) and update cadence.
- API endpoints and examples.
- How to run locally and with Docker.
- How to submit mapping corrections.
- One-time bootstrap and review flow.

---

## Implementation order

| Step | Task | Depends on |
|------|------|------------|
| 1 | Phase 1: Project scaffold | — |
| 2 | Phase 2: Database schema | 1 |
| 3 | Phase 3.1–3.2: Health + DB | 2 |
| 4 | Phase 3.3: Read endpoints | 3 |
| 5 | Phase 4: Admin sync endpoint | 4 |
| 6 | Phase 5: CHEA scraper (full flow) | 5 |
| 7 | Phase 6: DAPIP scraper | 5 |
| 8 | Phase 7: Cron jobs | 6, 7 |
| 9 | Phase 8: Bootstrap script | 6 |
| 10 | Phase 9–10: Docker + README | All |

**Recommended next step:** Phase 1 — scaffold the new project with no changes to the existing Canvas Bulk Editor codebase.
