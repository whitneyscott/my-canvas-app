const MAX = 30;
const entries: Array<{ ts: string; step: string; data: Record<string, unknown> }> = [];

export function log(step: string, data: Record<string, unknown>) {
  const entry = {
    ts: new Date().toISOString(),
    step,
    data,
  };
  entries.unshift(entry);
  if (entries.length > MAX) entries.pop();
  console.log('[lti]', step, JSON.stringify(data));
}

export function getLog() {
  return [...entries];
}
