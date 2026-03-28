const DEFAULT_LINK_CHECK_HOSTS = ['httpstat.us'];

export function getLinkCheckAllowlistHosts(): string[] {
  const raw = process.env.ACCESSIBILITY_LINK_CHECK_HOSTS?.trim();
  const fromEnv = raw
    ? raw
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
    : [];
  return [
    ...new Set([
      ...DEFAULT_LINK_CHECK_HOSTS.map((h) => h.toLowerCase()),
      ...fromEnv,
    ]),
  ];
}

export type LinkProbeOutcome = 'broken' | 'ok' | 'inconclusive';

export async function probeHttpUrlBroken(url: string): Promise<LinkProbeOutcome> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10_000);
  try {
    let res = await fetch(url, {
      method: 'HEAD',
      redirect: 'manual',
      signal: ctrl.signal,
    });
    if (res.status === 405 || res.status === 501) {
      res = await fetch(url, {
        method: 'GET',
        redirect: 'manual',
        signal: ctrl.signal,
        headers: { Range: 'bytes=0-0' },
      });
    }
    if (res.status === 404 || res.status === 410) return 'broken';
    if (res.status >= 200 && res.status < 400) return 'ok';
    if (res.status >= 400 && res.status < 500) {
      if (res.status === 401 || res.status === 403) return 'ok';
      return 'broken';
    }
    return 'inconclusive';
  } catch {
    return 'inconclusive';
  } finally {
    clearTimeout(timer);
  }
}
