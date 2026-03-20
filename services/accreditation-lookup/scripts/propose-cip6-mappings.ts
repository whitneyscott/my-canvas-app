import 'dotenv/config';
import { getPool } from '../src/db/pool';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { CIP2_TO_CIP6, ABBREV_TO_CIP2, KEYWORD_TO_CIP2 } from './cip6-reference';

const OUTPUT_PATH = join(process.cwd(), 'proposed-cip6-mappings.json');

function abbrevToKey(abbrev: string | null): string | null {
  if (!abbrev || typeof abbrev !== 'string') return null;
  return abbrev.toUpperCase().replace(/[- ]/g, '_').replace(/[^A-Z0-9_]/g, '') || null;
}

function normCip6(s: string): string {
  const t = String(s || '').trim();
  if (/^\d{2}\.\d{4}$/.test(t)) return t;
  if (/^\d{2}\.\d{2}$/.test(t)) return t + '00';
  if (/^\d{2}\d{4}$/.test(t)) return t.slice(0, 2) + '.' + t.slice(2);
  return '';
}

async function main() {
  const pool = getPool();
  const r = await pool.query(
    "SELECT id, name, abbreviation FROM accreditors WHERE source = 'CHEA' AND name NOT IN ('Manage Consent Preferences', 'Cookie List', 'Committee on Recognition Meeting', 'CHEA Recognized Scope of Accreditation', 'CHEA-Recognized Scope of Accreditation') ORDER BY id"
  );
  const accreditors = r.rows as { id: number; name: string; abbreviation: string | null }[];
  const mappings: { accreditor_id: number; cip_6_digit: string; degree_level: string | null; confidence: number }[] = [];
  const rScope = await pool.query("SELECT id, raw_scope_text FROM accreditors WHERE source = 'CHEA'");
  const scopeMap = new Map<number, string>((rScope.rows as { id: number; raw_scope_text: string }[]).map(r => [r.id, r.raw_scope_text || '']));
  const seen = new Set<string>();
  for (const a of accreditors) {
    const key = abbrevToKey(a.abbreviation) || abbrevToKey(a.name.split(/[\n(]/)[0]);
    const scope = scopeMap.get(a.id) || '';
    const nameAndAbbrev = `${a.name} ${a.abbreviation || ''} ${scope}`;
    const cip2Set = new Set<string>();
    for (const [abbrev, cip2List] of Object.entries(ABBREV_TO_CIP2)) {
      if (key && (key === abbrev || (key.includes(abbrev) && !abbrev.includes(key)))) {
        cip2List.forEach(c => cip2Set.add(c));
        break;
      }
    }
    for (const [re, cip2List] of KEYWORD_TO_CIP2) {
      if (re.test(nameAndAbbrev)) {
        cip2List.forEach(c => cip2Set.add(c));
      }
    }
    const cip6Set = new Set<string>();
    for (const cip2 of cip2Set) {
      const codes = CIP2_TO_CIP6[cip2] || [];
      codes.forEach(c => { const c6 = normCip6(c); if (c6) cip6Set.add(c6); });
    }
    for (const c6 of cip6Set) {
      if (!c6) continue;
      const k = `${a.id}:${c6}`;
      if (seen.has(k)) continue;
      seen.add(k);
      mappings.push({ accreditor_id: a.id, cip_6_digit: c6, degree_level: null, confidence: 0.8 });
    }
  }
  const output = { generatedAt: new Date().toISOString(), method: 'static-phase2', mappings };
  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
  console.log(`Wrote ${OUTPUT_PATH} (${mappings.length} 6-digit mappings for ${accreditors.length} accreditors)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
