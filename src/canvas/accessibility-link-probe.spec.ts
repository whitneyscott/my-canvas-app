import {
  getLinkCheckAllowlistHosts,
  probeHttpUrlBroken,
} from './accessibility-link-probe';

describe('accessibility-link-probe', () => {
  const prev = process.env.ACCESSIBILITY_LINK_CHECK_HOSTS;

  afterEach(() => {
    if (prev === undefined) delete process.env.ACCESSIBILITY_LINK_CHECK_HOSTS;
    else process.env.ACCESSIBILITY_LINK_CHECK_HOSTS = prev;
  });

  it('includes httpstat.us and merges env hosts', () => {
    process.env.ACCESSIBILITY_LINK_CHECK_HOSTS = 'Example.COM, foo.test';
    const h = getLinkCheckAllowlistHosts();
    expect(h).toContain('httpstat.us');
    expect(h).toContain('example.com');
    expect(h).toContain('foo.test');
  });

  it('probeHttpUrlBroken returns broken for 404', async () => {
    global.fetch = jest.fn().mockResolvedValue({ status: 404 }) as any;
    await expect(probeHttpUrlBroken('https://httpstat.us/404')).resolves.toBe(
      'broken',
    );
  });

  it('probeHttpUrlBroken returns ok for 200', async () => {
    global.fetch = jest.fn().mockResolvedValue({ status: 200 }) as any;
    await expect(probeHttpUrlBroken('https://example.com/')).resolves.toBe(
      'ok',
    );
  });

  it('probeHttpUrlBroken returns inconclusive for 503', async () => {
    global.fetch = jest.fn().mockResolvedValue({ status: 503 }) as any;
    await expect(probeHttpUrlBroken('https://httpstat.us/404')).resolves.toBe(
      'inconclusive',
    );
  });
});
