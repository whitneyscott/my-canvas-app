import 'dotenv/config';
import { getPool } from '../src/db/pool';
import { readFileSync } from 'fs';
import { join } from 'path';

const INPUT_PATH = join(process.cwd(), 'proposed-cip6-mappings.json');

function normCip6(s: string): string {
  const t = String(s || '').trim();
  if (/^\d{2}\.\d{4}$/.test(t)) return t;
  if (/^\d{2}\.\d{2}$/.test(t)) return t + '00';
  if (/^\d{2}\d{4}$/.test(t)) return t.slice(0, 2) + '.' + t.slice(2);
  return '';
}

async function main() {
  const raw = readFileSync(INPUT_PATH, 'utf-8');
  const data = JSON.parse(raw) as { mappings?: Array<{ accreditor_id: number; cip_6_digit: string }> };
  const mappings = Array.isArray(data?.mappings) ? data.mappings : [];
  const pool = getPool();
  const client = await pool.connect();
  let insert = 0;
  try {
    await client.query('BEGIN');
    for (const m of mappings) {
      if (!m.accreditor_id || !m.cip_6_digit) continue;
      const c6 = normCip6(m.cip_6_digit);
      if (!c6) continue;
      const exists = await client.query(
        'SELECT 1 FROM cip_accreditor_mappings WHERE accreditor_id = $1 AND cip_6_digit = $2',
        [m.accreditor_id, c6]
      );
      if (exists.rowCount === 0) {
        const cip2 = c6.slice(0, 2);
        await client.query(
          'INSERT INTO cip_accreditor_mappings (accreditor_id, cip_2_digit, cip_6_digit, degree_level, mapping_type) VALUES ($1, $2, $3, $4, $5)',
          [m.accreditor_id, cip2, c6, null, 'EXPLICIT']
        );
        insert++;
      }
    }
    await client.query('COMMIT');
    console.log(`Inserted ${insert} 6-digit CIP mappings.`);
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
