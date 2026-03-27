export const ANTHROPIC_TEXT_MODEL_DEFAULT = 'claude-haiku-4-5-20251001';
export const PROMPT_CACHE_BETA = 'prompt-caching-2024-07-31';
export const BATCH_BETA = 'message-batches-2024-09-24';

export type AnthropicUsageAgg = {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  calls: number;
};

export function emptyUsageAgg(): AnthropicUsageAgg {
  return { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, calls: 0 };
}

export function recordUsage(agg: AnthropicUsageAgg, usage: unknown, meta: { model: string; label?: string }): void {
  const u = usage as
    | {
        input_tokens?: number;
        output_tokens?: number;
        cache_read_input_tokens?: number;
        cache_creation_input_tokens?: number;
      }
    | undefined;
  const input = Number(u?.input_tokens ?? 0) || 0;
  const output = Number(u?.output_tokens ?? 0) || 0;
  const cr = Number(u?.cache_read_input_tokens ?? 0) || 0;
  const cw = Number(u?.cache_creation_input_tokens ?? 0) || 0;
  agg.input += input;
  agg.output += output;
  agg.cacheRead += cr;
  agg.cacheWrite += cw;
  agg.calls += 1;
  const bits = [
    '[Anthropic]',
    meta.label ? `label=${meta.label}` : '',
    `model=${meta.model}`,
    `in=${input}`,
    `out=${output}`,
    cr ? `cache_read=${cr}` : '',
    cw ? `cache_write=${cw}` : '',
    `run_in=${agg.input}`,
    `run_out=${agg.output}`,
    `run_calls=${agg.calls}`,
  ].filter(Boolean);
  console.log(bits.join(' '));
}

export function headersForMessages(apiKey: string): Record<string, string> {
  return {
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
    'content-type': 'application/json',
    'anthropic-beta': PROMPT_CACHE_BETA,
  };
}

export function headersForBatch(apiKey: string): Record<string, string> {
  return {
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
    'content-type': 'application/json',
    'anthropic-beta': `${BATCH_BETA},${PROMPT_CACHE_BETA}`,
  };
}

export async function messagesCreateCached(opts: {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature?: number;
  staticBlock: string;
  dynamicBlock: string;
  agg: AnthropicUsageAgg;
  label: string;
}): Promise<{ text: string }> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: headersForMessages(opts.apiKey),
    body: JSON.stringify({
      model: opts.model,
      max_tokens: opts.maxTokens,
      temperature: opts.temperature ?? 0.1,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: opts.staticBlock, cache_control: { type: 'ephemeral' } },
            { type: 'text', text: opts.dynamicBlock },
          ],
        },
      ],
    }),
  });
  const raw = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Claude API failed (${res.status}): ${JSON.stringify(raw).slice(0, 400)}`);
  }
  const payload = raw as { content?: Array<{ type?: string; text?: string }>; usage?: unknown };
  recordUsage(opts.agg, payload.usage, { model: opts.model, label: opts.label });
  const text = Array.isArray(payload?.content)
    ? payload.content.filter((c) => c?.type === 'text' && c?.text).map((c) => c.text || '').join('\n')
    : '';
  return { text };
}

export type BatchResultLine = {
  custom_id?: string;
  result?: {
    type?: string;
    message?: { content?: Array<{ type?: string; text?: string }> };
    error?: unknown;
  };
};

export async function submitMessageBatch(opts: {
  apiKey: string;
  requests: Array<{ custom_id: string; params: Record<string, unknown> }>;
}): Promise<{ id: string }> {
  const res = await fetch('https://api.anthropic.com/v1/messages/batches', {
    method: 'POST',
    headers: headersForBatch(opts.apiKey),
    body: JSON.stringify({ requests: opts.requests }),
  });
  const raw = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Batch create failed (${res.status}): ${JSON.stringify(raw).slice(0, 400)}`);
  const id = (raw as { id?: string }).id;
  if (!id) throw new Error('Batch create missing id');
  return { id };
}

export async function pollMessageBatch(apiKey: string, batchId: string, pollMs = 5000): Promise<{ results_url?: string }> {
  for (;;) {
    const res = await fetch(`https://api.anthropic.com/v1/messages/batches/${encodeURIComponent(batchId)}`, {
      headers: headersForBatch(apiKey),
    });
    const raw = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`Batch poll failed (${res.status}): ${JSON.stringify(raw).slice(0, 400)}`);
    const st = (raw as { processing_status?: string; results_url?: string }).processing_status;
    if (st === 'ended') {
      return { results_url: (raw as { results_url?: string }).results_url };
    }
    await new Promise((r) => setTimeout(r, pollMs));
  }
}

export async function fetchBatchResultsJsonl(url: string, apiKey: string): Promise<BatchResultLine[]> {
  let res = await fetch(url, { headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' } });
  if (!res.ok) {
    res = await fetch(url);
    if (!res.ok) throw new Error(`Batch results fetch failed (${res.status})`);
  }
  const t = await res.text();
  return parseJsonl(t);
}

function parseJsonl(t: string): BatchResultLine[] {
  const lines = t.split('\n').filter((l) => l.trim());
  return lines.map((l) => JSON.parse(l) as BatchResultLine);
}

export function extractBatchMessageText(row: BatchResultLine): string {
  const content = row.result?.message?.content;
  if (!Array.isArray(content)) return '';
  return content.filter((c) => c?.type === 'text' && c?.text).map((c) => c.text || '').join('\n');
}
