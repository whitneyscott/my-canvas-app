import 'dotenv/config';
import { Client } from 'pg';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS standards_organization (
  org_key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  display_name TEXT,
  accreditor_id INT REFERENCES accreditors(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS standard_node (
  id SERIAL PRIMARY KEY,
  org_key TEXT NOT NULL REFERENCES standards_organization(org_key) ON DELETE CASCADE,
  public_id TEXT NOT NULL,
  parent_public_id TEXT,
  group_code TEXT,
  title TEXT NOT NULL,
  description TEXT,
  kind TEXT NOT NULL DEFAULT 'leaf',
  sort_order INT NOT NULL DEFAULT 0,
  source_uri TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (org_key, public_id)
);

CREATE INDEX IF NOT EXISTS idx_standard_node_org ON standard_node(org_key);
CREATE INDEX IF NOT EXISTS idx_standard_node_org_parent ON standard_node(org_key, parent_public_id);
CREATE INDEX IF NOT EXISTS idx_standard_node_org_kind ON standard_node(org_key, kind);

CREATE TABLE IF NOT EXISTS standards_sync_state (
  org_key TEXT PRIMARY KEY REFERENCES standards_organization(org_key) ON DELETE CASCADE,
  last_attempt_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  status TEXT,
  error_message TEXT,
  content_fingerprint TEXT,
  next_run_after TIMESTAMPTZ
);
`;

async function run() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('[Migration standards] DATABASE_URL is not set');
    process.exit(1);
  }
  const client = new Client({ connectionString: databaseUrl });
  try {
    await client.connect();
    await client.query(SCHEMA);
    console.log('[Migration standards] Complete.');
  } catch (e) {
    console.error('[Migration standards] Failed:', e);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
