import 'dotenv/config';
import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';
import { getPool } from './pool';

export type StandardsOrgFile = {
  org_key: string;
  name: string;
  display_name?: string;
  source_note?: string;
  nodes: Array<{
    public_id: string;
    parent_public_id?: string | null;
    group_code?: string | null;
    title: string;
    description?: string | null;
    kind?: string;
    sort_order?: number;
  }>;
};

export function getDefaultStandardsDataDir(): string {
  return path.join(__dirname, '../../data/standards');
}

export async function seedStandardsFromDataDir(dataDir: string): Promise<{ orgs: string[]; fingerprints: Record<string, string> }> {
  const pool = getPool();
  if (!fs.existsSync(dataDir)) {
    throw new Error(`Standards data directory not found: ${dataDir}`);
  }
  const files = fs.readdirSync(dataDir).filter((f) => f.endsWith('.json'));
  const fingerprints: Record<string, string> = {};
  const orgs: string[] = [];
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const file of files) {
      const full = path.join(dataDir, file);
      const raw = fs.readFileSync(full, 'utf8');
      const fp = createHash('sha256').update(raw).digest('hex');
      const data = JSON.parse(raw) as StandardsOrgFile;
      const orgKey = data.org_key?.trim();
      if (!orgKey || !data.name || !Array.isArray(data.nodes)) continue;
      await client.query(
        `INSERT INTO standards_organization (org_key, name, display_name, updated_at)
         VALUES ($1, $2, $3, now())
         ON CONFLICT (org_key) DO UPDATE SET name = EXCLUDED.name, display_name = EXCLUDED.display_name, updated_at = now()`,
        [orgKey, data.name, data.display_name ?? orgKey],
      );
      await client.query('DELETE FROM standard_node WHERE org_key = $1', [orgKey]);
      for (const n of data.nodes) {
        const kind = n.kind === 'group' || n.kind === 'leaf' ? n.kind : 'leaf';
        await client.query(
          `INSERT INTO standard_node (org_key, public_id, parent_public_id, group_code, title, description, kind, sort_order, source_uri)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [
            orgKey,
            n.public_id,
            n.parent_public_id ?? null,
            n.group_code ?? null,
            n.title,
            n.description ?? null,
            kind,
            n.sort_order ?? 0,
            null,
          ],
        );
      }
      fingerprints[orgKey] = fp;
      orgs.push(orgKey);
      await client.query(
        `INSERT INTO standards_sync_state (org_key, last_attempt_at, last_success_at, status, content_fingerprint, error_message)
         VALUES ($1, now(), now(), 'OK', $2, NULL)
         ON CONFLICT (org_key) DO UPDATE SET last_attempt_at = now(), last_success_at = now(), status = 'OK', content_fingerprint = $2, error_message = NULL`,
        [orgKey, fp],
      );
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
  return { orgs, fingerprints };
}

async function cli() {
  const dir = process.argv[2] || getDefaultStandardsDataDir();
  const { orgs } = await seedStandardsFromDataDir(dir);
  console.log('[seed-standards] OK:', orgs.join(', '));
}

if (require.main === module) {
  cli().catch((e) => {
    console.error('[seed-standards]', e);
    process.exit(1);
  });
}
