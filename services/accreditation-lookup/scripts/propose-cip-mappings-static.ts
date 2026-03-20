import 'dotenv/config';
import { getPool } from '../src/db/pool';
import { writeFileSync } from 'fs';
import { join } from 'path';

const OUTPUT_PATH = join(process.cwd(), 'proposed-cip-mappings.json');

const ABBREV_TO_CIP: Record<string, string[]> = {
  ACAE: ['51'],
  ACEN: ['51'],
  ACPHA: ['19'],
  ACBSP: ['52'],
  ACPE: ['51'],
  ARC_PA: ['51'],
  ACEJMC: ['09'],
  ABFSE: ['19'],
  ACCE: ['15'],
  ACFEF: ['19'],
  ALA: ['25'],
  AOTA: ['51'],
  ACOTE: ['51'],
  APTA: ['51'],
  CAPTE: ['51'],
  APMA: ['51'],
  CPME: ['51'],
  APA: ['42'],
  AVMA: ['01'],
  AAQEP: ['13'],
  ABAI: ['42'],
  AERAC: ['31'],
  ATMAE: ['15'],
  AABI: ['14'],
  CAHIIM: ['51'],
  COAMFTE: ['42'],
  AAMFT: ['42'],
  CoARC: ['51'],
  CAAHEP: ['51'],
  CAATE: ['51'],
  CAHME: ['51'],
  CAMPEP: ['51'],
  COA: ['44'],
  COSMA: ['31'],
  CACREP: ['13'],
  CIDA: ['04'],
  CSHSE: ['44'],
  CAEP: ['13'],
  CAA: ['51'],
  ASHA: ['51'],
  COA_NAEP: ['13'],
  COAPRT: ['31'],
  CCE: ['51'],
  CORE: ['51'],
  CSWE: ['44'],
  IACBE: ['52'],
  JRCERT: ['51'],
  JRCNMT: ['51'],
  LAAB: ['04'],
  ASLA: ['04'],
  MPCAC: ['13'],
  NAACLS: ['51'],
  NAEYC: ['13'],
  NASP: ['13'],
  NASPAA: ['44'],
  COPRA: ['44'],
  PAB: ['04'],
  PCSAS: ['42'],
};

const KEYWORD_TO_CIP: [RegExp, string[]][] = [
  [/audiology|speech.language|hearing/i, ['51']],
  [/nursing/i, ['51']],
  [/hospitality|culinary|food/i, ['19']],
  [/business|management.*admin/i, ['52']],
  [/pharmacy/i, ['51']],
  [/optometr|optic/i, ['51']],
  [/physician assistant|pa program/i, ['51']],
  [/journalism|mass.?comm/i, ['09']],
  [/forensic science|fepac/i, ['26']],
  [/funeral service|mortuary/i, ['19']],
  [/construction|construction education/i, ['15']],
  [/library|library science/i, ['25']],
  [/occupational therapy|acote/i, ['51']],
  [/physical therapy|pt program|capte/i, ['51']],
  [/podiatr|podiatric/i, ['51']],
  [/psycholog|psychology/i, ['42']],
  [/veterinary|avma/i, ['01']],
  [/education|teacher|educator|aaqep|caep/i, ['13']],
  [/behavior.?analys|abai/i, ['42']],
  [/recreation|leisure|aerac/i, ['31']],
  [/technology|engineering tech|atmae/i, ['15']],
  [/health information|health informatics|med informatics|cahiim/i, ['51']],
  [/marriage|family therapy|mft|coamfte/i, ['42']],
  [/respiratory care|respiratory care/i, ['51']],
  [/allied health|caahep/i, ['51']],
  [/athletic training|caate/i, ['51']],
  [/health admin|health management|health services admin|cahme/i, ['51']],
  [/medical physics|campep/i, ['51']],
  [/council.*social work|board.*accreditation.*social work/i, ['44']],
  [/counseling|cacrep|mpcac/i, ['13']],
  [/interior design|cida/i, ['04']],
  [/human services|cshse/i, ['44']],
  [/speech.language|audiology|asha|caa/i, ['51']],
  [/parks|recreation|therapeutic rec|coaprt/i, ['31']],
  [/chiropract|chiropractic/i, ['51']],
  [/rehabilitation|counsel|core/i, ['51']],
  [/social work|cswe|boa/i, ['44']],
  [/business|iacbe/i, ['52']],
  [/radiography|radiologic|jrcert/i, ['51']],
  [/nuclear medicine|jrcnmt/i, ['51']],
  [/landscape|laab/i, ['04']],
  [/lab science|clinical lab|naacls/i, ['51']],
  [/early childhood|naeyc|child care/i, ['13']],
  [/school psych|nasp/i, ['13']],
  [/public admin|public affairs|naspaa/i, ['44']],
  [/architecture|pab|planning/i, ['04']],
];

function getCipsForAccreditor(abbrev: string | null, name: string, rawScope: string): string[] {
  const seen = new Set<string>();
  const abbrevNorm = (abbrev || '').toUpperCase().replace(/[- ]/g, '_').replace(/[^A-Z0-9_]/g, '');
  for (const [key, cips] of Object.entries(ABBREV_TO_CIP)) {
    if (abbrevNorm.includes(key) || key.replace(/_/g, '').includes(abbrevNorm)) {
      cips.forEach(c => seen.add(c));
    }
  }
  const combined = `${name} ${rawScope || ''}`;
  for (const [re, cips] of KEYWORD_TO_CIP) {
    if (re.test(combined)) {
      cips.forEach(c => seen.add(c));
    }
  }
  return Array.from(seen);
}

async function main() {
  const pool = getPool();
  const r = await pool.query('SELECT id, name, abbreviation, raw_scope_text FROM accreditors WHERE source = $1 ORDER BY id', ['CHEA']);
  const accreditors = r.rows as { id: number; name: string; abbreviation: string | null; raw_scope_text: string }[];
  const mappings: { accreditor_id: number; cip_2_digit: string; degree_level: string | null; confidence: number }[] = [];
  for (const a of accreditors) {
    const cips = getCipsForAccreditor(a.abbreviation, a.name, a.raw_scope_text || '');
    for (const cip of cips) {
      const cip2 = String(cip).padStart(2, '0').slice(0, 2);
      mappings.push({ accreditor_id: a.id, cip_2_digit: cip2, degree_level: null, confidence: 0.7 });
    }
  }
  const output = { generatedAt: new Date().toISOString(), method: 'static', mappings };
  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
  console.log(`Wrote ${OUTPUT_PATH} (${mappings.length} mappings for ${accreditors.length} accreditors)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
