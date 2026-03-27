import 'dotenv/config';
import { getPool } from '../src/db/pool';
import {
  ANTHROPIC_TEXT_MODEL_DEFAULT,
  emptyUsageAgg,
  extractBatchMessageText,
  fetchBatchResultsJsonl,
  messagesCreateCached,
  pollMessageBatch,
  recordUsage,
  submitMessageBatch,
} from './anthropic-helpers';

const EXPLICIT_CIP_REGEX = /\b(\d{2})\.(\d{2})(?:\d{2})?(?!\d)/g;
const CIP_CODE_REGEX = /CIP\s*[:\s#]*(\d{2})/gi;
const UNAMBIGUOUS_PHRASES: [RegExp, string][] = [
  [/\bAmerican Sign Language\b/i, '16'],
  [/\bsign language interpreting\b/i, '16'],
  [/\binterpreters?\s+for\s+the\s+deaf\b/i, '16'],
  [/\bRegistry of Interpreters for the Deaf\b/i, '16'],
  [/\bforeign language[s]?\b/i, '16'],
  [/\blandscape architecture\b/i, '04'],
  [/\blandscape architectural\b/i, '04'],
  [/\binterior design\b/i, '04'],
  [/\bnursing\b/i, '51'],
  [/\bsocial work\b/i, '44'],
  [/\bphysical therapy\b/i, '51'],
  [/\boccupational therapy\b/i, '51'],
  [/\bpharmacy\b/i, '51'],
  [/\bmedicine\b.*\bprogram/i, '51'],
  [/\ballied health\b/i, '51'],
  [/\bhealth professions\b/i, '51'],
  [/\bradiography\b/i, '51'],
  [/\brespiratory (?:care|therapy)\b/i, '51'],
  [/\bathletic training\b/i, '51'],
  [/\boptometry\b/i, '51'],
  [/\bpodiatry\b/i, '51'],
  [/\bchiropractic\b/i, '51'],
  [/\bveterinary\b/i, '01'],
  [/\blaw\b.*\bprogram/i, '22'],
  [/\blegal\s+professions?\b/i, '22'],
  [/\bbusiness\b.*\badministration\b/i, '52'],
  [/\bbusiness administration\b/i, '52'],
  [/\bMBA\b/i, '52'],
  [/\bteacher\s+education\b/i, '13'],
  [/\bteacher preparation\b/i, '13'],
  [/\beducator\s+preparation\b/i, '13'],
  [/\bpublic administration\b/i, '44'],
  [/\bpublic affairs\b/i, '44'],
  [/\bpsychology\b/i, '42'],
  [/\bcounseling\b/i, '13'],
  [/\bmarriage and family therapy\b/i, '42'],
  [/\bclinical psychology\b/i, '42'],
  [/\bschool psychology\b/i, '13'],
  [/\bjournalism\b/i, '09'],
  [/\bmass communication\b/i, '09'],
  [/\blibrary (?:and information )?science\b/i, '25'],
  [/\barchitecture\b(?!\s+and)/i, '04'],
  [/\bconstruction\b/i, '15'],
  [/\bengineering\b/i, '14'],
  [/\bengineering technology\b/i, '15'],
  [/\baviation\b/i, '14'],
  [/\bculinary\b/i, '19'],
  [/\bfuneral service\b/i, '19'],
  [/\bmortuary science\b/i, '19'],
  [/\bforensic science\b/i, '26'],
];

function extractCip2FromText(text: string): Set<string> {
  const cip2Set = new Set<string>();
  if (!text || typeof text !== 'string') return cip2Set;
  const t = text.trim();
  if (!t) return cip2Set;

  let m: RegExpExecArray | null;
  EXPLICIT_CIP_REGEX.lastIndex = 0;
  while ((m = EXPLICIT_CIP_REGEX.exec(t)) !== null) {
    const cip2 = m[1].replace(/\D/g, '').padStart(2, '0').slice(0, 2);
    if (cip2) cip2Set.add(cip2);
  }

  CIP_CODE_REGEX.lastIndex = 0;
  while ((m = CIP_CODE_REGEX.exec(t)) !== null) {
    const cip2 = m[1].replace(/\D/g, '').padStart(2, '0').slice(0, 2);
    if (cip2) cip2Set.add(cip2);
  }

  for (const [re, cip2] of UNAMBIGUOUS_PHRASES) {
    if (re.test(t)) cip2Set.add(cip2);
  }

  return cip2Set;
}

async function step1ClearMappings(pool: Awaited<ReturnType<typeof getPool>>) {
  const r = await pool.query('DELETE FROM cip_accreditor_mappings');
  console.log(`[Step 1] Cleared ${r.rowCount ?? 0} rows from cip_accreditor_mappings`);
}

async function step2AlgorithmicMapping(
  pool: Awaited<ReturnType<typeof getPool>>
): Promise<Set<number>> {
  const r = await pool.query(
    "SELECT id, name, abbreviation, raw_scope_text FROM accreditors WHERE source = 'CHEA' AND name NOT IN ('Manage Consent Preferences', 'Cookie List', 'Committee on Recognition Meeting', 'CHEA Recognized Scope of Accreditation', 'CHEA-Recognized Scope of Accreditation') ORDER BY id"
  );
  const accreditors = r.rows as { id: number; name: string; abbreviation: string | null; raw_scope_text: string }[];
  const client = await pool.connect();
  let mapped = 0;
  const mappedIds = new Set<number>();

  try {
    for (const a of accreditors) {
      const scope = a.raw_scope_text || '';
      const combined = `${a.name} ${a.abbreviation || ''} ${scope}`;
      const cip2Set = extractCip2FromText(combined);
      if (cip2Set.size === 0) continue;

      for (const cip2 of cip2Set) {
        await client.query(
          'INSERT INTO cip_accreditor_mappings (accreditor_id, cip_2_digit, degree_level, mapping_type) VALUES ($1, $2, NULL, $3)',
          [a.id, cip2.padStart(2, '0').slice(0, 2), 'EXPLICIT']
        );
      }
      mapped++;
      mappedIds.add(a.id);
    }
  } finally {
    client.release();
  }

  console.log(`[Step 2] Algorithmically mapped ${mapped} accreditors (${accreditors.length - mapped} unmapped)`);
  return new Set(accreditors.filter((a) => !mappedIds.has(a.id)).map((a) => a.id));
}

const STEP3_STATIC = `Map this accreditor to CIP 2-digit codes. CIP 2-digit families: 01=Vet, 04=Architecture, 09=Communication, 11=Computer, 13=Education, 14=Engineering, 15=Engineering Tech, 16=Foreign Languages (incl. ASL/interpreting), 19=Family/Consumer, 22=Legal, 25=Library, 26=Biology, 31=Parks/Rec, 42=Psychology, 44=Public Admin, 51=Health Professions, 52=Business, 54=History.

Return JSON array only, no other text. Each object: { "cip_2_digit": "16", "mapping_type": "EXPLICIT" or "INFERRED" }.
EXPLICIT = clear direct match (e.g. scope explicitly says the field). INFERRED = reasonable inference.
If you cannot map with confidence, return empty array [].`;

function buildStep3Dynamic(a: { name: string; abbreviation: string | null; raw_scope_text: string }): string {
  return `Accreditor: ${a.name}${a.abbreviation ? ` (${a.abbreviation})` : ''}

Scope:
${a.raw_scope_text || '(none)'}`;
}

async function step3AiMapping(
  pool: Awaited<ReturnType<typeof getPool>>,
  unmappedIds: Set<number>
) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.log('[Step 3] ANTHROPIC_API_KEY not set, skipping AI mapping');
    return;
  }

  const useBatch = process.argv.includes('--batch') || process.env.ANTHROPIC_BATCH === '1';
  const model = (process.env.CLAUDE_MODEL || ANTHROPIC_TEXT_MODEL_DEFAULT).trim();
  const agg = emptyUsageAgg();

  const r = await pool.query(
    "SELECT id, name, abbreviation, raw_scope_text FROM accreditors WHERE source = 'CHEA' AND id = ANY($1) ORDER BY id",
    [Array.from(unmappedIds)]
  );
  const accreditors = r.rows as { id: number; name: string; abbreviation: string | null; raw_scope_text: string }[];
  const poolClient = await pool.connect();
  const manualReview: number[] = [];

  try {
    if (useBatch) {
      const requests = accreditors.map((a) => ({
        custom_id: `remap-${a.id}`,
        params: {
          model,
          max_tokens: 512,
          temperature: 0.1,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: STEP3_STATIC, cache_control: { type: 'ephemeral' } },
                { type: 'text', text: buildStep3Dynamic(a) },
              ],
            },
          ],
        },
      }));
      const { id: batchId } = await submitMessageBatch({
        apiKey,
        requests,
        logContext: 'accreditation_remap_cip_batch_submit',
      });
      console.log(`[Step 3] batch_id=${batchId}`);
      const { results_url: resultsUrl } = await pollMessageBatch(apiKey, batchId);
      if (!resultsUrl) throw new Error('Batch ended without results_url');
      const lines = await fetchBatchResultsJsonl(resultsUrl, apiKey);
      const byId = new Map<number, string>();
      for (const row of lines) {
        const idStr = row.custom_id?.replace(/^remap-/, '') || '';
        const accId = parseInt(idStr, 10);
        if (!Number.isFinite(accId)) continue;
        const text = extractBatchMessageText(row);
        byId.set(accId, text);
        const usage = (row.result as { message?: { usage?: unknown } } | undefined)?.message?.usage;
        if (usage)
          recordUsage(agg, usage, {
            model,
            context: 'accreditation_remap_cip_batch_result',
            accreditorId: accId,
          });
      }
      for (let i = 0; i < accreditors.length; i++) {
        const a = accreditors[i];
        const text = (byId.get(a.id) || '').trim();
        if (!text) {
          manualReview.push(a.id);
          continue;
        }
        const json = text.replace(/```json?\n?/g, '').replace(/```\n?$/g, '').trim();
        let arr: { cip_2_digit?: string; mapping_type?: string }[] = [];
        try {
          arr = JSON.parse(json);
        } catch {
          manualReview.push(a.id);
          continue;
        }
        if (!Array.isArray(arr)) {
          manualReview.push(a.id);
          continue;
        }
        const inserted = arr.filter((x) => x && typeof x.cip_2_digit === 'string');
        if (inserted.length === 0) {
          manualReview.push(a.id);
          continue;
        }
        for (const x of inserted) {
          const cip2 = String(x.cip_2_digit).padStart(2, '0').replace(/\D/g, '').slice(0, 2);
          const mappingType = (x.mapping_type || 'INFERRED').toUpperCase() === 'EXPLICIT' ? 'EXPLICIT' : 'INFERRED';
          if (cip2) {
            await poolClient.query(
              'INSERT INTO cip_accreditor_mappings (accreditor_id, cip_2_digit, degree_level, mapping_type) VALUES ($1, $2, NULL, $3)',
              [a.id, cip2, mappingType]
            );
          }
        }
        process.stdout.write(`[Step 3] Mapped ${a.abbreviation || a.name} (${i + 1}/${accreditors.length})\n`);
      }
    } else {
      for (let i = 0; i < accreditors.length; i++) {
        const a = accreditors[i];
        try {
          const { text } = await messagesCreateCached({
            apiKey,
            model,
            maxTokens: 512,
            temperature: 0.1,
            staticBlock: STEP3_STATIC,
            dynamicBlock: buildStep3Dynamic(a),
            agg,
            meta: { context: 'accreditation_remap_cip_sync', accreditorId: a.id },
          });
          const json = text.replace(/```json?\n?/g, '').replace(/```\n?$/g, '').trim();
          let arr: { cip_2_digit?: string; mapping_type?: string }[] = [];
          try {
            arr = JSON.parse(json);
          } catch {
            manualReview.push(a.id);
            continue;
          }
          if (!Array.isArray(arr)) {
            manualReview.push(a.id);
            continue;
          }
          const inserted = arr.filter((x) => x && typeof x.cip_2_digit === 'string');
          if (inserted.length === 0) {
            manualReview.push(a.id);
            continue;
          }
          for (const x of inserted) {
            const cip2 = String(x.cip_2_digit).padStart(2, '0').replace(/\D/g, '').slice(0, 2);
            const mappingType = (x.mapping_type || 'INFERRED').toUpperCase() === 'EXPLICIT' ? 'EXPLICIT' : 'INFERRED';
            if (cip2) {
              await poolClient.query(
                'INSERT INTO cip_accreditor_mappings (accreditor_id, cip_2_digit, degree_level, mapping_type) VALUES ($1, $2, NULL, $3)',
                [a.id, cip2, mappingType]
              );
            }
          }
          process.stdout.write(`[Step 3] Mapped ${a.abbreviation || a.name} (${i + 1}/${accreditors.length})\n`);
        } catch (e) {
          console.warn(`[Step 3] API error for ${a.abbreviation || a.name}:`, e instanceof Error ? e.message : e);
          manualReview.push(a.id);
        }
        if (i < accreditors.length - 1) await new Promise((r) => setTimeout(r, 500));
      }
    }
  } finally {
    poolClient.release();
  }

  console.log(
    `[Anthropic] ctx=accreditation_remap_cip_run_total in=${agg.input} out=${agg.output} cache_read=${agg.cacheRead} cache_write=${agg.cacheWrite} calls=${agg.calls}`,
  );

  if (manualReview.length) {
    const r2 = await pool.query('SELECT id, name, abbreviation FROM accreditors WHERE id = ANY($1)', [manualReview]);
    console.log(`[Step 3] Manual review needed (${manualReview.length}):`, (r2.rows as { id: number; name: string; abbreviation: string | null }[]).map((a) => `${a.abbreviation || a.name} (id=${a.id})`));
  }
}

async function main() {
  const pool = getPool();
  await step1ClearMappings(pool);
  const unmappedIds = await step2AlgorithmicMapping(pool);
  await step3AiMapping(pool, unmappedIds);
  console.log('[Done] Remap complete');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
