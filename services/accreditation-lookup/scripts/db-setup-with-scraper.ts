import 'dotenv/config';
import { Client } from 'pg';
import { getPool } from '../src/db/pool';
import { runCheaSync } from '../src/sync/chea.sync';
import { readFileSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';

const PROPOSED_PATH = join(process.cwd(), 'proposed-chea-changes.json');
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
CREATE INDEX IF NOT EXISTS idx_cip_accreditor_mappings_cip_degree ON cip_accreditor_mappings(cip_2_digit, degree_level);
CREATE INDEX IF NOT EXISTS idx_institution_accreditations_unit_id ON institution_accreditations(unit_id);
CREATE INDEX IF NOT EXISTS idx_sync_log_source_started ON sync_log(source, started_at);
`;

function fingerprint(text: string): string {
  return createHash('sha256').update(text.trim().replace(/\s+/g, ' ')).digest('hex');
}

async function migrate(client: Client) {
  await client.query(SCHEMA);
}

async function applyProposed(pool: ReturnType<typeof getPool>) {
  const raw = readFileSync(PROPOSED_PATH, 'utf-8');
  const data = JSON.parse(raw) as {
    insert: Array<{ name: string; abbreviation: string | null; raw_scope_text: string }>;
    update: Array<{ id: number; name: string; abbreviation: string | null; raw_scope_text: string }>;
    delete: number[];
  };
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const row of data.insert) {
      const fp = fingerprint(row.name + '|' + (row.raw_scope_text || ''));
      await client.query(
        'INSERT INTO accreditors (name, abbreviation, source, raw_scope_text, content_fingerprint) VALUES ($1, $2, $3, $4, $5)',
        [row.name, row.abbreviation, 'CHEA', row.raw_scope_text, fp]
      );
    }
    for (const row of data.update) {
      const fp = fingerprint(row.name + '|' + (row.raw_scope_text || ''));
      await client.query(
        'UPDATE accreditors SET name = $1, abbreviation = $2, raw_scope_text = $3, content_fingerprint = $4, updated_at = now() WHERE id = $5',
        [row.name, row.abbreviation, row.raw_scope_text, fp, row.id]
      );
    }
    for (const id of data.delete) {
      await client.query('DELETE FROM accreditors WHERE id = $1 AND source = $2', [id, 'CHEA']);
    }
    await client.query('COMMIT');
    return { insert: data.insert.length, update: data.update.length, delete: data.delete.length };
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is not set. Copy .env.example to .env and set it.');
    process.exit(1);
  }
  console.log('1. Running migration...');
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    await migrate(client);
    console.log('   Migration complete.');
  } finally {
    await client.end();
  }

  console.log('2. Scraping CHEA (may take 15–30s)...');
  const pool = getPool();
  const r = await pool.query('INSERT INTO sync_log (source, status) VALUES ($1, $2) RETURNING id', ['chea', 'PENDING']);
  const syncId = r.rows[0].id;
  const result = await runCheaSync(syncId);
  if (result.status === 'FAIL') {
    console.error('   Scrape failed:', result.error);
    process.exit(1);
  }
  if (result.status === 'NO_CHANGE' && result.recordsChanged === undefined) {
    const count = (await pool.query('SELECT COUNT(*) FROM accreditors WHERE source = $1', ['CHEA'])).rows[0].count;
    if (Number(count) > 0) {
      console.log('   No changes detected. Accreditors table already populated.');
      return;
    }
  }
  console.log(`   Scrape complete. Status: ${result.status}, records: ${result.recordsChanged ?? 0}`);

  console.log('3. Applying proposed changes...');
  const applied = await applyProposed(pool);
  console.log(`   Applied: ${applied.insert} insert, ${applied.update} update, ${applied.delete} delete`);
  console.log('Done. Database is populated with CHEA accreditors.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
