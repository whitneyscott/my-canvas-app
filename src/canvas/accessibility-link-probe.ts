const DEFAULT_LINK_CHECK_HOSTS = [
  'httpstat.us',
  'www.httpstat.us',
  'httpbin.org',
];

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
  const timer = setTimeout(() => ctrl.abort(), 15_000);
  const drain = async (res: Response) => {
    try {
      await res.arrayBuffer();
    } catch {
      /* ignore */
    }
  };
  try {
    let res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: ctrl.signal,
      headers: { Range: 'bytes=0-0', Accept: '*/*' },
    });
    await drain(res);
    if (res.status === 405 || res.status === 501) {
      res = await fetch(url, {
        method: 'HEAD',
        redirect: 'follow',
        signal: ctrl.signal,
        headers: { Accept: '*/*' },
      });
      await drain(res);
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
