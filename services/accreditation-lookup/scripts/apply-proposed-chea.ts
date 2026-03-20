import 'dotenv/config';
import { createHash } from 'crypto';
import { getPool } from '../src/db/pool';
import { readFileSync } from 'fs';
import { join } from 'path';

const PROPOSED_PATH = join(process.cwd(), 'proposed-chea-changes.json');

function fingerprint(text: string): string {
  return createHash('sha256').update(text.trim().replace(/\s+/g, ' ')).digest('hex');
}

async function main() {
  const raw = readFileSync(PROPOSED_PATH, 'utf-8');
  const data = JSON.parse(raw) as {
    insert: Array<{ name: string; abbreviation: string | null; raw_scope_text: string }>;
    update: Array<{ id: number; name: string; abbreviation: string | null; raw_scope_text: string }>;
    delete: number[];
  };
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const row of data.insert) {
      await client.query(
        'INSERT INTO accreditors (name, abbreviation, source, raw_scope_text) VALUES ($1, $2, $3, $4)',
        [row.name, row.abbreviation, 'CHEA', row.raw_scope_text]
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
    console.log(`Applied: ${data.insert.length} insert, ${data.update.length} update, ${data.delete.length} delete`);
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
