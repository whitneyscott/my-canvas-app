import 'dotenv/config';
import { getPool } from '../src/db/pool';
import { readFileSync } from 'fs';
import { join } from 'path';

const INPUT_PATH = join(process.cwd(), 'proposed-cip-mappings.json');

async function main() {
  const raw = readFileSync(INPUT_PATH, 'utf-8');
  const data = JSON.parse(raw) as { mappings?: Array<{ accreditor_id: number; cip_2_digit: string; degree_level?: string | null; confidence?: number }> };
  const mappings = Array.isArray(data?.mappings) ? data.mappings : [];
  const pool = getPool();
  const client = await pool.connect();
  let insert = 0;
  try {
    await client.query('BEGIN');
    for (const m of mappings) {
      if (!m.accreditor_id || !m.cip_2_digit) continue;
      const cip = String(m.cip_2_digit).padStart(2, '0').slice(0, 2);
      const deg = m.degree_level && ['associate','bachelor','master','doctorate'].includes(String(m.degree_level)) ? m.degree_level : null;
      const exists = await client.query(
        'SELECT 1 FROM cip_accreditor_mappings WHERE accreditor_id = $1 AND cip_2_digit = $2 AND (degree_level IS NOT DISTINCT FROM $3)',
        [m.accreditor_id, cip, deg]
      );
      if (exists.rowCount === 0) {
        await client.query(
          'INSERT INTO cip_accreditor_mappings (accreditor_id, cip_2_digit, degree_level, mapping_type) VALUES ($1, $2, $3, $4)',
          [m.accreditor_id, cip, deg, 'EXPLICIT']
        );
        insert++;
      }
    }
    await client.query('COMMIT');
    console.log(`Inserted ${insert} CIP mappings.`);
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
