import 'dotenv/config';
import { getPool } from '../src/db/pool';
import { writeFileSync } from 'fs';
import { join } from 'path';
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

const OUTPUT_PATH = join(process.cwd(), 'proposed-cip-mappings.json');

const CIP_CONTEXT = `CIP 2-digit codes (examples): 04=Architecture, 09=Communication, 10=Communications Technologies, 11=Computer/Info Sciences, 13=Education, 14=Engineering, 16=Foreign Languages, 19=Family/Consumer Sciences, 22=Legal Professions, 23=English, 24=Liberal Arts, 26=Biology, 27=Mathematics, 42=Psychology, 44=Public Admin, 51=Health Professions, 52=Business, 54=History.`;

const STATIC_BLOCK = `Return a JSON array of CIP mappings. Each object: { "cip_2_digit": "11", "degree_level": null or "associate"|"bachelor"|"master"|"doctorate", "confidence": 0.0-1.0 }. Only include CIP codes that clearly apply. Confidence 0.9+ = direct match, 0.7-0.9 = likely, 0.5-0.7 = possible. Return only the JSON array, no other text.

${CIP_CONTEXT}`;

function parseMappingJson(text: string): { cip_2_digit: string; degree_level: string | null; confidence: number }[] {
  const json = text.replace(/```json?\n?/g, '').replace(/```\n?$/g, '').trim();
  let arr: { cip_2_digit?: string; degree_level?: string | null; confidence?: number }[];
  try {
    arr = JSON.parse(json);
  } catch {
    return [];
  }
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((x) => x && typeof x.cip_2_digit === 'string')
    .map((x) => ({
      cip_2_digit: String(x.cip_2_digit).padStart(2, '0').slice(0, 2),
      degree_level:
        x.degree_level && ['associate', 'bachelor', 'master', 'doctorate'].includes(String(x.degree_level).toLowerCase())
          ? String(x.degree_level).toLowerCase()
          : null,
      confidence: typeof x.confidence === 'number' ? x.confidence : 0.5,
    }));
}

function buildDynamicBlock(a: { id: number; name: string; abbreviation: string | null; raw_scope_text: string }): string {
  return `Accreditor: ${a.name}${a.abbreviation ? ` (${a.abbreviation})` : ''}
Scope: ${a.raw_scope_text || '(none)'}`;
}

async function proposeForAccreditorSync(
  apiKey: string,
  model: string,
  a: { id: number; name: string; abbreviation: string | null; raw_scope_text: string },
  agg: ReturnType<typeof emptyUsageAgg>,
): Promise<{ accreditor_id: number; cip_2_digit: string; degree_level: string | null; confidence: number }[]> {
  const { text } = await messagesCreateCached({
    apiKey,
    model,
    maxTokens: 1024,
    temperature: 0.1,
    staticBlock: STATIC_BLOCK,
    dynamicBlock: buildDynamicBlock(a),
    agg,
    label: `propose-cip acc=${a.id}`,
  });
  const rows = parseMappingJson(text.trim());
  return rows.map((x) => ({ accreditor_id: a.id, ...x }));
}

async function runBatchMode(
  apiKey: string,
  model: string,
  accreditors: { id: number; name: string; abbreviation: string | null; raw_scope_text: string }[],
  agg: ReturnType<typeof emptyUsageAgg>,
): Promise<Map<number, { accreditor_id: number; cip_2_digit: string; degree_level: string | null; confidence: number }[]>> {
  const requests = accreditors.map((a) => ({
    custom_id: `acc-${a.id}`,
    params: {
      model,
      max_tokens: 1024,
      temperature: 0.1,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: STATIC_BLOCK, cache_control: { type: 'ephemeral' } },
            { type: 'text', text: buildDynamicBlock(a) },
          ],
        },
      ],
    },
  }));
  const { id: batchId } = await submitMessageBatch({ apiKey, requests });
  console.log(`[batch] submitted batch_id=${batchId}`);
  const { results_url: resultsUrl } = await pollMessageBatch(apiKey, batchId);
  if (!resultsUrl) throw new Error('Batch ended without results_url');
  const lines = await fetchBatchResultsJsonl(resultsUrl, apiKey);
  const out = new Map<number, { accreditor_id: number; cip_2_digit: string; degree_level: string | null; confidence: number }[]>();
  for (const row of lines) {
    const idStr = row.custom_id?.replace(/^acc-/, '') || '';
    const accId = parseInt(idStr, 10);
    if (!Number.isFinite(accId)) continue;
    const err = (row.result as { error?: unknown } | undefined)?.error;
    if (err) {
      console.warn(`[batch] error custom_id=${row.custom_id}`, err);
      out.set(accId, []);
      continue;
    }
    const text = extractBatchMessageText(row);
    const parsed = parseMappingJson(text.trim());
    out.set(
      accId,
      parsed.map((x) => ({ accreditor_id: accId, ...x })),
    );
    const usage = (row.result as { message?: { usage?: unknown } } | undefined)?.message?.usage;
    if (usage) recordUsage(agg, usage, { model, label: `batch acc=${accId}` });
  }
  for (const a of accreditors) {
    if (!out.has(a.id)) out.set(a.id, []);
  }
  return out;
}

async function main() {
  const useBatch = process.argv.includes('--batch') || process.env.ANTHROPIC_BATCH === '1';
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY is not set.');
    process.exit(1);
  }
  const model = (process.env.CLAUDE_MODEL || ANTHROPIC_TEXT_MODEL_DEFAULT).trim();
  const agg = emptyUsageAgg();
  const pool = getPool();
  const r = await pool.query('SELECT id, name, abbreviation, raw_scope_text FROM accreditors WHERE source = $1 ORDER BY id', ['CHEA']);
  const accreditors = r.rows as { id: number; name: string; abbreviation: string | null; raw_scope_text: string }[];
  const mappings: { accreditor_id: number; cip_2_digit: string; degree_level: string | null; confidence: number }[] = [];

  if (useBatch) {
    const batchMap = await runBatchMode(apiKey, model, accreditors, agg);
    for (const a of accreditors) {
      const proposed = batchMap.get(a.id) ?? [];
      mappings.push(...proposed);
      console.log(`${a.abbreviation || a.name}: ${proposed.length}`);
    }
  } else {
    for (let i = 0; i < accreditors.length; i++) {
      const a = accreditors[i];
      process.stdout.write(`Proposing for ${a.abbreviation || a.name} (${i + 1}/${accreditors.length})... `);
      try {
        const proposed = await proposeForAccreditorSync(apiKey, model, a, agg);
        mappings.push(...proposed);
        console.log(proposed.length);
      } catch (e) {
        console.log('error:', e instanceof Error ? e.message : e);
      }
      if (i < accreditors.length - 1) await new Promise((r) => setTimeout(r, 1000));
    }
  }

  const output = { generatedAt: new Date().toISOString(), mappings };
  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
  console.log(`Wrote ${OUTPUT_PATH} (${mappings.length} mappings)`);
  console.log(
    `[Anthropic] run_total in=${agg.input} out=${agg.output} cache_read=${agg.cacheRead} cache_write=${agg.cacheWrite} calls=${agg.calls}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
