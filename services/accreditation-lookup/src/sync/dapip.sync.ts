import { getPool } from '../db/pool';
import { parse } from 'csv-parse/sync';

const DAPIP_CSV_URL = process.env.DAPIP_CSV_URL || 'https://ope.ed.gov/accreditation/GetDownLoadFile.aspx';

export interface DapipSyncResult {
  syncId: number;
  status: 'SUCCESS' | 'FAIL';
  recordsChanged?: number;
  error?: string;
}

function parseDate(s: string | undefined): string | null {
  if (!s || typeof s !== 'string') return null;
  const trimmed = s.trim();
  if (!trimmed) return null;
  const m = trimmed.match(/(\d{4})-(\d{2})-(\d{2})/) || trimmed.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) {
    if (m[1].length === 4) return `${m[1]}-${m[2]}-${m[3]}`;
    return `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`;
  }
  return null;
}

function mapRow(row: Record<string, string>): { unit_id: string; agency_name: string; status: string; period_start: string | null; period_end: string | null } | null {
  const unitId = row['IPEDSUnitId'] ?? row['IpedsUnitIds'] ?? row['UnitId'] ?? row['unitid'] ?? '';
  const agency = row['AgencyName'] ?? row['AccreditorName'] ?? row['agency_name'] ?? row['Accreditor'] ?? '';
  const status = (row['Status'] ?? row['status'] ?? row['AccreditationStatus'] ?? 'Active').trim();
  const start = parseDate(row['PeriodStart'] ?? row['period_start'] ?? row['StartDate'] ?? row['AccreditationDate']);
  const end = parseDate(row['PeriodEnd'] ?? row['period_end'] ?? row['EndDate'] ?? row['NextReviewDate']);

  const u = String(unitId).trim();
  const a = String(agency).trim();
  if (!u || !a) return null;
  return { unit_id: u, agency_name: a, status: status || 'Active', period_start: start, period_end: end };
}

export async function runDapipSync(syncId: number): Promise<DapipSyncResult> {
  const pool = getPool();
  const url = process.env.DAPIP_CSV_URL || DAPIP_CSV_URL;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`DAPIP fetch failed: ${res.status} ${res.statusText}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get('content-type') || '';
    let csvText: string;
    if (contentType.includes('zip') || buf[0] === 0x50 && buf[1] === 0x4b) {
      const AdmZip = (await import('adm-zip')).default;
      const zip = new AdmZip(buf);
      const entries = zip.getEntries();
      const csvEntry = entries.find((e: { isDirectory: boolean; name: string }) => !e.isDirectory && e.name.endsWith('.csv'));
      if (!csvEntry) throw new Error('No CSV found in DAPIP ZIP');
      csvText = csvEntry.getData().toString('utf-8');
    } else {
      csvText = buf.toString('utf-8');
    }

    const rows = parse(csvText, { columns: true, relax_column_count: true, skip_empty_lines: true });
    const records: { unit_id: string; agency_name: string; status: string; period_start: string | null; period_end: string | null }[] = [];
    for (const row of rows as Record<string, string>[]) {
      const r = mapRow(row);
      if (r) records.push(r);
    }

    const client = await pool.connect();
    let count = 0;
    try {
      await client.query('BEGIN');
      await client.query("DELETE FROM institution_accreditations WHERE source = 'DAPIP'");
      for (const r of records) {
        await client.query(
          `INSERT INTO institution_accreditations (unit_id, agency_name, status, period_start, period_end, source)
           VALUES ($1, $2, $3, $4::date, $5::date, 'DAPIP')`,
          [r.unit_id, r.agency_name, r.status, r.period_start, r.period_end]
        );
        count++;
      }
      await client.query(
        `UPDATE sync_log SET status = $1, completed_at = now(), records_changed = $2 WHERE id = $3`,
        ['SUCCESS', count, syncId]
      );
      await client.query('COMMIT');
      return { syncId, status: 'SUCCESS', recordsChanged: count };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    await pool.query(`UPDATE sync_log SET status = $1, completed_at = now(), error_message = $2 WHERE id = $3`, ['FAIL', err, syncId]);
    return { syncId, status: 'FAIL', error: err };
  }
}
