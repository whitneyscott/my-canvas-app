import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import { getPool } from '../src/db/pool';
import { writeFileSync } from 'fs';
import { join } from 'path';

const OUTPUT_PATH = join(process.cwd(), 'proposed-cip-mappings.json');

const CIP_CONTEXT = `CIP 2-digit codes (examples): 04=Architecture, 09=Communication, 10=Communications Technologies, 11=Computer/Info Sciences, 13=Education, 14=Engineering, 16=Foreign Languages, 19=Family/Consumer Sciences, 22=Legal Professions, 23=English, 24=Liberal Arts, 26=Biology, 27=Mathematics, 42=Psychology, 44=Public Admin, 51=Health Professions, 52=Business, 54=History.`;

async function proposeForAccreditor(
  client: Anthropic,
  a: { id: number; name: string; abbreviation: string | null; raw_scope_text: string }
): Promise<{ accreditor_id: number; cip_2_digit: string; degree_level: string | null; confidence: number }[]> {
  const prompt = `Accreditor: ${a.name}${a.abbreviation ? ` (${a.abbreviation})` : ''}
Scope: ${a.raw_scope_text || '(none)'}

${CIP_CONTEXT}

Return a JSON array of CIP mappings. Each object: { "cip_2_digit": "11", "degree_level": null or "associate"|"bachelor"|"master"|"doctorate", "confidence": 0.0-1.0 }. Only include CIP codes that clearly apply. Confidence 0.9+ = direct match, 0.7-0.9 = likely, 0.5-0.7 = possible. Return only the JSON array, no other text.`;

  const msg = await client.messages.create({
    model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });
  const text = (msg.content[0] as { type: string; text: string }).text.trim();
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
      accreditor_id: a.id,
      cip_2_digit: String(x.cip_2_digit).padStart(2, '0').slice(0, 2),
      degree_level: x.degree_level && ['associate','bachelor','master','doctorate'].includes(String(x.degree_level).toLowerCase()) ? String(x.degree_level).toLowerCase() : null,
      confidence: typeof x.confidence === 'number' ? x.confidence : 0.5,
    }));
}

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY is not set.');
    process.exit(1);
  }
  const client = new Anthropic({ apiKey });
  const pool = getPool();
  const r = await pool.query('SELECT id, name, abbreviation, raw_scope_text FROM accreditors WHERE source = $1 ORDER BY id', ['CHEA']);
  const accreditors = r.rows as { id: number; name: string; abbreviation: string | null; raw_scope_text: string }[];
  const mappings: { accreditor_id: number; cip_2_digit: string; degree_level: string | null; confidence: number }[] = [];
  for (let i = 0; i < accreditors.length; i++) {
    const a = accreditors[i];
    process.stdout.write(`Proposing for ${a.abbreviation || a.name} (${i + 1}/${accreditors.length})... `);
    try {
      const proposed = await proposeForAccreditor(client, a);
      mappings.push(...proposed);
      console.log(proposed.length);
    } catch (e) {
      console.log('error:', e instanceof Error ? e.message : e);
    }
    if (i < accreditors.length - 1) await new Promise((r) => setTimeout(r, 1000));
  }
  const output = { generatedAt: new Date().toISOString(), mappings };
  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
  console.log(`Wrote ${OUTPUT_PATH} (${mappings.length} mappings)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
