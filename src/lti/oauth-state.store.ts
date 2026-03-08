const store = new Map<string, string>();
const TTL_MS = 600000;

export function setOAuthState(state: string, returnUrl: string): void {
  store.set(state, returnUrl);
  setTimeout(() => store.delete(state), TTL_MS);
}

export function getOAuthState(state: string): string | null {
  const v = store.get(state);
  if (v) store.delete(state);
  return v ?? null;
}
