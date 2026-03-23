import 'dotenv/config';
import cron from 'node-cron';
import express from 'express';
import { getPool } from './db/pool';

async function runCheaSyncCron() {
  if (!process.env.ADMIN_SYNC_SECRET) return;
  try {
    const pool = getPool();
    const r = await pool.query('INSERT INTO sync_log (source, status) VALUES ($1, $2) RETURNING id', ['chea', 'PENDING']);
    const { runCheaSync } = await import('./sync/chea.sync');
    const result = await runCheaSync(r.rows[0].id);
    console.log('[Cron] CHEA sync:', result.status);
  } catch (e) {
    console.error('[Cron] CHEA sync failed:', e);
  }
}

async function runDapipSyncCron() {
  if (!process.env.ADMIN_SYNC_SECRET) return;
  try {
    const pool = getPool();
    const r = await pool.query('INSERT INTO sync_log (source, status) VALUES ($1, $2) RETURNING id', ['dapip', 'PENDING']);
    const { runDapipSync } = await import('./sync/dapip.sync');
    const result = await runDapipSync(r.rows[0].id);
    console.log('[Cron] DAPIP sync:', result.status, result.recordsChanged ?? '');
  } catch (e) {
    console.error('[Cron] DAPIP sync failed:', e);
  }
}

async function runStandardsSyncCron() {
  if (!process.env.ADMIN_SYNC_SECRET) return;
  try {
    const pool = getPool();
    const r = await pool.query("INSERT INTO sync_log (source, status) VALUES ('standards', 'PENDING') RETURNING id");
    const { runStandardsSync } = await import('./sync/standards.sync');
    const result = await runStandardsSync(r.rows[0].id);
    console.log('[Cron] Standards sync:', result.status, result.orgs?.join(',') ?? '');
  } catch (e) {
    console.error('[Cron] Standards sync failed:', e);
  }
}

const app = express();
app.use(express.json());
const port = Number(process.env.PORT) || 3001;
const startedAt = Date.now();

function requireAdminAuth(req: express.Request, res: express.Response): string | null {
  const secret = process.env.ADMIN_SYNC_SECRET;
  if (!secret || secret.trim() === '') {
    res.status(503).json({ error: 'Admin sync not configured (ADMIN_SYNC_SECRET)' });
    return null;
  }
  const bearer = req.headers.authorization?.replace(/^Bearer\s+/i, '').trim();
  const key = (req.headers['x-admin-key'] as string)?.trim();
  const token = bearer || key;
  if (!token || token !== secret) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
  return token;
}

function cipTo2Digit(cip: string | undefined): string | null {
  if (!cip || typeof cip !== 'string') return null;
  const trimmed = cip.trim();
  if (trimmed.includes('.')) {
    const parts = trimmed.split('.');
    return parts[0].replace(/\D/g, '').padStart(2, '0').slice(0, 2) || null;
  }
  const digits = trimmed.replace(/\D/g, '').padStart(2, '0');
  return digits.slice(0, 2) || null;
}

function cipToPrefix(cip: string | undefined): { prefix: string; is6digit: boolean } | null {
  if (!cip || typeof cip !== 'string') return null;
  const t = cip.trim().replace(/\s/g, '');
  const m = t.match(/^(\d{2})(?:\.(\d{2}))?(?:\.?(\d{2}))?/);
  if (!m) return null;
  const p1 = m[1];
  const p2 = m[2];
  const p3 = m[3];
  if (p3) return { prefix: `${p1}.${p2}${p3}`, is6digit: true };
  if (p2) return { prefix: `${p1}.${p2}`, is6digit: true };
  return { prefix: p1, is6digit: false };
}

app.get('/health', async (_, res) => {
  let dbOk = false;
  let lastSync: Record<string, { started_at: string; status: string } | null> = {};
  try {
    const pool = getPool();
    await pool.query('SELECT 1');
    dbOk = true;
    const r = await pool.query(
      `SELECT DISTINCT ON (source) source, started_at, status FROM sync_log ORDER BY source, started_at DESC`
    );
    for (const row of r.rows as { source: string; started_at: string; status: string }[]) {
      lastSync[row.source] = {
        started_at: row.started_at,
        status: row.status,
      };
    }
  } catch (e) {
  }
  res.json({
    service: 'accreditation-lookup-service',
    uptime: Math.floor((Date.now() - startedAt) / 1000),
    database: dbOk ? 'connected' : 'disconnected',
    lastSync: Object.keys(lastSync).length ? lastSync : undefined,
  });
});

app.get('/accreditors', async (req, res) => {
  const cipParam = (req.query.cip as string) || '';
  const cip2 = cipTo2Digit(cipParam);
  const degreeLevel = (req.query.degree_level as string) || null;
  if (!cip2) return res.status(400).json({ error: 'cip query parameter required' });
  try {
    const pool = getPool();
    const q = degreeLevel
      ? `SELECT DISTINCT a.id, a.name, a.abbreviation FROM accreditors a INNER JOIN cip_accreditor_mappings m ON m.accreditor_id = a.id WHERE (m.cip_2_digit = $1 OR m.cip_6_digit LIKE $1 || '.%') AND (m.degree_level IS NULL OR m.degree_level = $2)`
      : `SELECT DISTINCT a.id, a.name, a.abbreviation FROM accreditors a INNER JOIN cip_accreditor_mappings m ON m.accreditor_id = a.id WHERE m.cip_2_digit = $1 OR m.cip_6_digit LIKE $1 || '.%'`;
    const params = degreeLevel ? [cip2, degreeLevel] : [cip2];
    const r = await pool.query(q, params);
    res.json({ accreditors: r.rows.map((row) => ({ id: String(row.id), name: row.name, abbreviation: row.abbreviation })) });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Internal error' });
  }
});

app.get('/accreditors/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid accreditor id' });
  try {
    const pool = getPool();
    const r = await pool.query(
      'SELECT id, name, abbreviation, source, raw_scope_text, content_fingerprint, created_at, updated_at FROM accreditors WHERE id = $1',
      [id]
    );
    const row = r.rows[0];
    if (!row) return res.status(404).json({ error: 'Accreditor not found' });
    res.json(row);
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Internal error' });
  }
});

app.get('/standards', async (req, res) => {
  const orgRaw = ((req.query.org as string) || '').trim();
  const org = orgRaw.toUpperCase().replace(/[^A-Z0-9._-]/g, '');
  if (!org) return res.status(400).json({ error: 'org query parameter required' });
  try {
    const pool = getPool();
    const r = await pool.query(
      `SELECT public_id, parent_public_id, group_code, title, description, kind, sort_order
       FROM standard_node WHERE org_key = $1 ORDER BY sort_order ASC, public_id ASC`,
      [org],
    );
    const standards = r.rows.map((row: Record<string, unknown>) => ({
      id: row.public_id,
      parentId: row.parent_public_id ?? null,
      title: row.title,
      description: row.description ?? null,
      groupCode: row.group_code ?? null,
      kind: row.kind ?? 'leaf',
      sortOrder: row.sort_order ?? 0,
    }));
    res.json({ standards, org_key: org, source: 'database' });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Internal error' });
  }
});

app.get('/institution/:unitid/accreditations', async (req, res) => {
  const unitId = req.params.unitid;
  if (!unitId) return res.status(400).json({ error: 'unitid required' });
  try {
    const pool = getPool();
    const r = await pool.query(
      `SELECT ia.id, ia.unit_id, ia.accreditor_id, ia.agency_name, ia.status, ia.period_start, ia.period_end, ia.source, a.name AS accreditor_name
       FROM institution_accreditations ia
       LEFT JOIN accreditors a ON a.id = ia.accreditor_id
       WHERE ia.unit_id = $1
       ORDER BY ia.period_end DESC NULLS FIRST`,
      [unitId]
    );
    res.json({ accreditations: r.rows });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Internal error' });
  }
});

const VALID_SOURCES = ['chea', 'dapip', 'all', 'standards'];
app.post('/admin/sync', async (req, res) => {
  if (requireAdminAuth(req, res) === null) return;
  const source = (req.body?.source ?? req.query?.source ?? '').toString().toLowerCase();
  if (!VALID_SOURCES.includes(source)) {
    return res.status(400).json({ error: 'source must be chea, dapip, all, or standards' });
  }
  try {
    const pool = getPool();
    if (source === 'standards') {
      const r = await pool.query("INSERT INTO sync_log (source, status) VALUES ('standards', 'PENDING') RETURNING id");
      const syncId = r.rows[0]?.id;
      const { runStandardsSync } = await import('./sync/standards.sync');
      const result = await runStandardsSync(syncId);
      return res.status(202).json({ source: 'standards', ...result });
    }
    const r = await pool.query(
      'INSERT INTO sync_log (source, status) VALUES ($1, $2) RETURNING id',
      [source === 'all' ? 'chea' : source, 'PENDING']
    );
    const syncId = r.rows[0]?.id;
    if (source === 'chea' || source === 'all') {
      const { runCheaSync } = await import('./sync/chea.sync');
      const result = await runCheaSync(syncId);
      return res.status(202).json({ source: 'chea', ...result });
    }
    if (source === 'dapip') {
      const { runDapipSync } = await import('./sync/dapip.sync');
      const result = await runDapipSync(syncId);
      return res.status(202).json({ source: 'dapip', ...result });
    }
    res.status(202).json({ syncId, source, status: 'PENDING' });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Internal error' });
  }
});

const cronOpts = { scheduled: true, timezone: 'UTC' };
cron.schedule('0 2 * * 1', runCheaSyncCron, cronOpts);
cron.schedule('0 3 1 1,4,7,10 *', runDapipSyncCron, cronOpts);
cron.schedule('0 5 * * 1', runStandardsSyncCron, cronOpts);

app.listen(port, () => {
  console.log(`[Startup] Stage 3: Accreditation Lookup Service listening on port ${port}`);
});
