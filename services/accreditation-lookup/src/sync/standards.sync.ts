import { getPool } from '../db/pool';
import { getDefaultStandardsDataDir, seedStandardsFromDataDir } from '../db/seed-standards';

export async function runStandardsSync(syncLogId?: number): Promise<{
  status: string;
  syncId: number;
  orgs: string[];
  combinedFingerprint: string;
}> {
  const pool = getPool();
  let id = syncLogId;
  if (id == null) {
    const r = await pool.query("INSERT INTO sync_log (source, status) VALUES ('standards', 'PENDING') RETURNING id");
    const newId = r.rows[0]?.id as number | undefined;
    if (newId == null) throw new Error('standards sync: failed to create sync_log row');
    id = newId;
  }
  const dataDir = getDefaultStandardsDataDir();
  try {
    const { orgs, fingerprints } = await seedStandardsFromDataDir(dataDir);
    const combinedFingerprint = Object.keys(fingerprints)
      .sort()
      .map((k) => `${k}:${fingerprints[k]}`)
      .join('|');
    await pool.query(
      `UPDATE sync_log SET completed_at = now(), status = $1, records_changed = $2, after_fingerprint = $3, error_message = NULL WHERE id = $4`,
      ['SUCCESS', orgs.length, combinedFingerprint, id],
    );
    return { status: 'SUCCESS', syncId: id, orgs, combinedFingerprint };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    await pool.query(`UPDATE sync_log SET completed_at = now(), status = $1, error_message = $2 WHERE id = $3`, ['FAILED', msg, id]);
    throw e;
  }
}
