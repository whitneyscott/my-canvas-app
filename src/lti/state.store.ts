const store = new Map<string, { target: string; nonce: string }>();
const TTL_MS = 600000;

export function setState(state: string, target: string, nonce: string): void {
  store.set(state, { target, nonce });
  setTimeout(() => store.delete(state), TTL_MS);
}

export function getState(state: string): { target: string; nonce: string } | null {
  const v = store.get(state);
  if (v) store.delete(state);
  return v ?? null;
}
