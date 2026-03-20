import 'dotenv/config';
import { Client } from 'pg';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS accreditors (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  abbreviation TEXT,
  source TEXT,
  raw_scope_text TEXT,
  content_fingerprint TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cip_accreditor_mappings (
  id SERIAL PRIMARY KEY,
  accreditor_id INT NOT NULL REFERENCES accreditors(id) ON DELETE CASCADE,
  cip_2_digit TEXT NOT NULL,
  cip_6_digit TEXT,
  degree_level TEXT,
  mapping_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS institution_accreditations (
  id SERIAL PRIMARY KEY,
  unit_id TEXT NOT NULL,
  accreditor_id INT REFERENCES accreditors(id) ON DELETE SET NULL,
  agency_name TEXT,
  status TEXT,
  period_start DATE,
  period_end DATE,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sync_log (
  id SERIAL PRIMARY KEY,
  source TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  status TEXT,
  before_fingerprint TEXT,
  after_fingerprint TEXT,
  records_changed INT,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_cip_accreditor_mappings_cip_degree
  ON cip_accreditor_mappings(cip_2_digit, degree_level);
CREATE INDEX IF NOT EXISTS idx_cip_accreditor_mappings_cip6
  ON cip_accreditor_mappings(cip_6_digit);

CREATE INDEX IF NOT EXISTS idx_institution_accreditations_unit_id
  ON institution_accreditations(unit_id);

CREATE INDEX IF NOT EXISTS idx_sync_log_source_started
  ON sync_log(source, started_at);
`;

async function run() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('[Migration] DATABASE_URL is not set');
    process.exit(1);
  }
  console.log('[Migration] Connecting to database...');
  const client = new Client({ connectionString: databaseUrl });
  try {
    await client.connect();
    await client.query(SCHEMA);
    console.log('[Migration] Schema migration complete.');
  } catch (e) {
    console.error('[Migration] Schema migration failed:', e);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
