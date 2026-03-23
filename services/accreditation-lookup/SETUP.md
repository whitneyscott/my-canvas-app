# Accreditation Lookup Service — One-Time Setup

The first-time setup creates the PostgreSQL database and schema. **It may take 2–5 minutes** while Docker pulls the image and initializes the data directory.

## Run with Docker Compose

From `services/accreditation-lookup`:

```bash
docker compose up -d
```

This starts PostgreSQL and the API. The API depends on the DB healthcheck. Verify with:

```bash
curl http://localhost:3001/health
```

## Run locally (no Docker for app)

### 1. Start PostgreSQL

From `services/accreditation-lookup`:

```bash
docker compose up -d db
```

- First run: pulls `postgres:16-alpine`, creates the `accreditation` database and `pgdata` volume.
- Subsequent runs: container starts quickly from the existing volume.

## 2. Run migrations

```bash
npm run db:migrate
npm run db:migrate-standards
npm run db:seed-standards
```

- Creates tables: `accreditors`, `cip_accreditor_mappings`, `institution_accreditations`, `sync_log`, plus `standards_organization`, `standard_node`, `standards_sync_state`.
- Seeds **ASLTA** and **BEI** hierarchies from `data/standards/*.json`.
- Idempotent: safe to run multiple times.

## 3. Configure .env

Ensure `services/accreditation-lookup/.env` has:

```
DATABASE_URL=postgresql://accred:accred@localhost:5433/accreditation
ADMIN_SYNC_SECRET=<your-secret>
```

Done. Start the API with `npm run dev` or `npm start`.

### Health check

`GET http://localhost:3001/health` returns `{"service":"accreditation-lookup-service","uptime":...,"database":"connected"|"disconnected","lastSync":{...}}`.

**DAPIP sync:** Set `DAPIP_CSV_URL` to a direct CSV or ZIP URL (e.g. from https://ope.ed.gov/accreditation/). If unset, the default URL is used but may require a direct download link. Run via `POST /admin/sync` with `source=dapip` or on cron (1st of quarter, 03:00 UTC).
