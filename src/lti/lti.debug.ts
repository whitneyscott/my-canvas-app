const MAX = 30;
const entries: Array<{ ts: string; step: string; data: Record<string, unknown> }> = [];

export function log(step: string, data: Record<string, unknown>) {
  entries.unshift({
    ts: new Date().toISOString(),
    step,
    data,
  });
  if (entries.length > MAX) entries.pop();
}

export function getLog() {
  return [...entries];
}
