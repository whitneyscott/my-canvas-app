#!/bin/sh
set -e

echo "[Startup] Stage 1: Running migrations..."
if ! node dist/db/migrate.js; then
  echo "[Startup] ERROR: Migrations failed. Service will not start."
  exit 1
fi

if ! node dist/db/migrate-cip6.js; then
  echo "[Startup] ERROR: CIP6 migration failed. Service will not start."
  exit 1
fi

echo "[Startup] Stage 2: Migrations complete. Starting API..."
exec node dist/main.js
