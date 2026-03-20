import { getPool } from '../db/pool';
import { scrapeChea, CheaAccreditor } from '../scrapers/chea.scraper';
import { writeFileSync } from 'fs';
import { join } from 'path';

const PROPOSED_CHANGES_PATH = join(process.cwd(), 'proposed-chea-changes.json');

export interface SyncResult {
  syncId: number;
  status: 'NO_CHANGE' | 'PENDING_REVIEW' | 'FAIL';
  fingerprint?: string;
  recordsChanged?: number;
  proposedPath?: string;
  error?: string;
}

export async function runCheaSync(syncId: number): Promise<SyncResult> {
  const pool = getPool();
  try {
    const { accreditors, content_fingerprint } = await scrapeChea();
    const prev = await pool.query(
      `SELECT after_fingerprint FROM sync_log WHERE source = 'chea' AND id != $1 AND after_fingerprint IS NOT NULL ORDER BY started_at DESC LIMIT 1`,
      [syncId]
    );
    const prevFingerprint = (prev.rows[0] as { after_fingerprint: string } | undefined)?.after_fingerprint;
    if (prevFingerprint === content_fingerprint) {
      await pool.query(
        `UPDATE sync_log SET status = $1, completed_at = now(), after_fingerprint = $2 WHERE id = $3`,
        ['NO_CHANGE', content_fingerprint, syncId]
      );
      return { syncId, status: 'NO_CHANGE', fingerprint: content_fingerprint };
    }
    const current = await pool.query('SELECT id, name, abbreviation, raw_scope_text, content_fingerprint FROM accreditors WHERE source = $1', ['CHEA']);
    const currentMap = new Map<number, { name: string; abbreviation: string | null; raw_scope_text: string; content_fingerprint: string }>();
    for (const row of current.rows as { id: number; name: string; abbreviation: string | null; raw_scope_text: string; content_fingerprint: string }[]) {
      currentMap.set(row.id, { name: row.name, abbreviation: row.abbreviation, raw_scope_text: row.raw_scope_text, content_fingerprint: row.content_fingerprint });
    }
    const scrapedByKey = new Map<string, CheaAccreditor>();
    for (const a of accreditors) {
      const key = (a.abbreviation || a.name).toLowerCase().replace(/\s+/g, ' ');
      scrapedByKey.set(key, a);
    }
    const toInsert: CheaAccreditor[] = [];
    const toUpdate: { id: number; name: string; abbreviation: string | null; raw_scope_text: string }[] = [];
    for (const a of accreditors) {
      const key = (a.abbreviation || a.name).toLowerCase().replace(/\s+/g, ' ');
      let found = false;
      for (const [id, row] of currentMap) {
        const rowKey = (row.abbreviation || row.name).toLowerCase().replace(/\s+/g, ' ');
        if (rowKey === key) {
          found = true;
          if (row.raw_scope_text !== a.raw_scope_text) {
            toUpdate.push({ id, name: a.name, abbreviation: a.abbreviation, raw_scope_text: a.raw_scope_text });
          }
          currentMap.delete(id);
          break;
        }
      }
      if (!found) toInsert.push(a);
    }
    const toDelete = Array.from(currentMap.keys());
    const proposed = {
      fingerprint: content_fingerprint,
      scrapedAt: new Date().toISOString(),
      insert: toInsert,
      update: toUpdate,
      delete: toDelete,
    };
    writeFileSync(PROPOSED_CHANGES_PATH, JSON.stringify(proposed, null, 2));
    await pool.query(
      `UPDATE sync_log SET status = $1, completed_at = now(), after_fingerprint = $2, records_changed = $3 WHERE id = $4`,
      ['PENDING_REVIEW', content_fingerprint, toInsert.length + toUpdate.length + toDelete.length, syncId]
    );
    return { syncId, status: 'PENDING_REVIEW', fingerprint: content_fingerprint, recordsChanged: proposed.insert.length + proposed.update.length + proposed.delete.length, proposedPath: PROPOSED_CHANGES_PATH };
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    await pool.query(`UPDATE sync_log SET status = $1, completed_at = now(), error_message = $2 WHERE id = $3`, ['FAIL', err, syncId]);
    return { syncId, status: 'FAIL', error: err };
  }
}
