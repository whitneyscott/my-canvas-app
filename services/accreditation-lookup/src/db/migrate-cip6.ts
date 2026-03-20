import 'dotenv/config';
import { Client } from 'pg';

async function run() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('[Migration] DATABASE_URL is not set.');
    process.exit(1);
  }
  console.log('[Migration] Running CIP6 migration...');
  const client = new Client({ connectionString: databaseUrl });
  try {
    await client.connect();
    await client.query('ALTER TABLE cip_accreditor_mappings ADD COLUMN IF NOT EXISTS cip_6_digit TEXT');
    await client.query('CREATE INDEX IF NOT EXISTS idx_cip_accreditor_mappings_cip6 ON cip_accreditor_mappings(cip_6_digit)');
    console.log('[Migration] CIP6 migration complete.');
  } catch (e) {
    console.error('[Migration] CIP6 migration failed:', e);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
