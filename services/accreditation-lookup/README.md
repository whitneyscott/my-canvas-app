# Accreditation Lookup Service

CIP-to-accreditor and institution-accreditation lookup. Standalone microservice inside Canvas Bulk Editor repo.

## Purpose and constraints

- Purpose: Map CIP codes to accreditors (CHEA), institutions to accreditations (DAPIP). Used by Standards Sync.
- Constraints: No Canvas/student/user data. Read-only lookups; sync is admin-triggered.

## Data sources

- CHEA: Programmatic accreditors. Cron: Monday 02:00 UTC; scrape only if fingerprint changed.
- DAPIP: Institution accreditations. Cron: 1st of quarter 03:00 UTC.

## API endpoints

- GET /health - Status, DB, last sync
- GET /accreditors?cip=16.16&degree_level=bachelor
- GET /accreditors/:id
- GET /institution/:unitid/accreditations
- POST /admin/sync (X-Admin-Key, source: chea|dapip|all)

## Run locally

See SETUP.md. Briefly: docker compose up -d db, npm run db:migrate, npm run dev.

## Run with Docker

docker compose up -d

## Bootstrap and review

See SETUP.md, CHEA_SYNC.md, DAPIP_SYNC.md, CIP_MAPPINGS.md.
