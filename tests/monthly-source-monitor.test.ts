import { EventEmitter } from 'node:events';
import { afterEach, describe, it, expect, vi } from 'vitest';
import {
  robotsAllowed,
  fingerprint,
  publicAddress,
  sourceUrl,
  cvCandidates,
  createSourceChecker,
  summarizeFailures,
  type Retrieval,
  type FailureDetails,
} from '../scripts/monthly-source-monitor';
const { dnsLookup, httpsRequest } = vi.hoisted(() => ({
  dnsLookup: vi.fn(),
  httpsRequest: vi.fn(),
}));
vi.mock('node:dns/promises', () => ({ lookup: dnsLookup }));
vi.mock('node:https', () => ({ request: httpsRequest }));
afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});
describe('monthly source monitor boundaries', () => {
  it('honors the matching robots group and longest-path allow/disallow rule', () => {
    const policy =
      'User-agent: Twitterbot\nDisallow: /\nUser-agent: *\nDisallow: /private\nAllow: /private/public\n';
    expect(robotsAllowed(policy, '/faculty/cv.pdf')).toBe(true);
    expect(robotsAllowed(policy, '/private/cv.pdf')).toBe(false);
    expect(robotsAllowed(policy, '/private/public/cv.pdf')).toBe(true);
  });
  it('rejects private network sources, credentials and non-HTTPS redirects', () => {
    for (const ip of ['127.0.0.1', '10.1.2.3', '169.254.169.254', '192.168.1.1', '::1', 'fc00::1'])
      expect(publicAddress(ip)).toBe(false);
    expect(publicAddress('146.201.1.1')).toBe(true);
    for (const url of [
      'http://example.org',
      'https://localhost',
      'https://127.0.0.1',
      'https://[::1]/',
      'https://user:secret@example.org/',
    ])
      expect(() => sourceUrl(url)).toThrow();
  });
  it('ignores script/style churn but detects visible changes without storing source text', () => {
    expect(fingerprint(Buffer.from('<p>Research</p><script>1</script>'), 'text/html')).toBe(
      fingerprint(Buffer.from('<p>Research</p><script>2</script>'), 'text/html'),
    );
    expect(fingerprint(Buffer.from('<p>Updated research</p>'), 'text/html')).not.toBe(
      fingerprint(Buffer.from('<p>Research</p>'), 'text/html'),
    );
    expect(
      cvCandidates(
        '<a href="cv/new.pdf">CV</a><a href="https://example.org/file?token=secret">CV</a>',
        'https://example.org/profile/',
      ),
    ).toEqual(['https://example.org/profile/cv/new.pdf']);
  });
});

it('honors robots end anchors and wildcards', () => {
  const policy = 'User-agent: *\nDisallow: /*.pdf$\n';
  expect(robotsAllowed(policy, '/cv.pdf')).toBe(false);
  expect(robotsAllowed(policy, '/cv.pdf/details')).toBe(true);
});

const response = (
  status = 200,
  body = 'User-agent: *\nAllow: /',
  type = 'text/plain',
  location?: string,
): Retrieval => ({
  status,
  body: Buffer.from(body),
  headers: { 'content-type': type, ...(location ? { location } : {}) },
});
const errorWithCode = (code: string) =>
  Object.assign(new Error('private text https://example.org/?token=secret'), { code });

describe('monthly diagnostics and policy caching', () => {
  it('allows ordinary 192.0 addresses without opening special-purpose ranges', () => {
    // IANA IPv4 Special-Purpose registry: 192.0.0.0/24 and 192.0.2.0/24.
    for (const ip of ['192.0.78.12', '192.0.78.13', '192.0.1.255', '192.0.3.0', '192.0.255.255'])
      expect(publicAddress(ip), ip).toBe(true);
    for (const ip of [
      '192.0.0.0',
      '192.0.0.9',
      '192.0.0.255',
      '192.0.2.0',
      '192.0.2.255',
      '192.168.0.0',
      '192.168.255.255',
      '100.64.0.1',
      '172.31.255.255',
      '198.18.0.1',
      '224.0.0.1',
      '255.255.255.255',
      '::ffff:192.168.1.1',
    ])
      expect(publicAddress(ip), ip).toBe(false);
    expect(publicAddress('192.0.78.999')).toBe(false);
  });

  it('caches a failed robots fetch once per origin and run, including concurrent callers', async () => {
    const fetchPage = vi.fn().mockRejectedValue(errorWithCode('UNABLE_TO_VERIFY_LEAF_SIGNATURE'));
    const check = createSourceChecker(fetchPage);
    const results = await Promise.all([
      check('https://example.org/a'),
      check('https://example.org/b'),
    ]);
    expect(fetchPage).toHaveBeenCalledTimes(1);
    for (const result of results)
      expect(result).toEqual({ ok: false, failure: { stage: 'robots', category: 'tls_error' } });
    expect(JSON.stringify(results)).not.toMatch(/secret|private text|example\.org|UNABLE_TO/);
    await createSourceChecker(fetchPage)('https://example.org/a');
    expect(fetchPage).toHaveBeenCalledTimes(2);
  });

  it.each([
    [response(503), 'robots_unavailable', 503],
    [response(403), 'http_access_restricted', 403],
    [response(429), 'http_access_restricted', 429],
    [
      response(200, '<!doctype html><html>private content</html>', 'text/html'),
      'robots_unreadable',
      200,
    ],
  ])(
    'fails closed and caches unavailable/unreadable policy %#',
    async (reply, category, http_status) => {
      const fetchPage = vi.fn().mockResolvedValue(reply);
      const check = createSourceChecker(fetchPage);
      for (const path of ['a', 'b'])
        expect(await check(`https://example.org/${path}`)).toEqual({
          ok: false,
          failure: { stage: 'robots', category, http_status },
        });
      expect(fetchPage).toHaveBeenCalledTimes(1);
    },
  );

  it('keeps valid path-specific robots restrictions and independent host policies', async () => {
    const fetchPage = vi.fn(async (url: URL) => {
      if (url.hostname === 'blocked.example') return response(403);
      return url.pathname === '/robots.txt'
        ? response(200, 'User-agent: *\nDisallow: /private')
        : response(200, '<p>Public</p>', 'text/html');
    });
    const check = createSourceChecker(fetchPage);
    expect(await check('https://blocked.example/a')).toMatchObject({ ok: false });
    expect(await check('https://allowed.example/private')).toEqual({
      ok: false,
      failure: { stage: 'robots', category: 'robots_disallowed' },
    });
    expect(await check('https://allowed.example/public')).toMatchObject({ ok: true });
    expect(fetchPage.mock.calls.map(([url]) => url.href)).toEqual([
      'https://blocked.example/robots.txt',
      'https://allowed.example/robots.txt',
      'https://allowed.example/public',
    ]);
  });

  it.each([404, 410])(
    'retains the existing missing-robots behavior for HTTP %i',
    async (status) => {
      const fetchPage = vi.fn(async (url: URL, _maxBytes: number) =>
        url.pathname === '/robots.txt' ? response(status) : response(200, 'CV', 'application/pdf'),
      );
      expect(await createSourceChecker(fetchPage)('https://example.org/cv.pdf')).toMatchObject({
        ok: true,
      });
      expect(fetchPage.mock.calls.map(([, limit]) => limit)).toEqual([200000, 2500000]);
    },
  );

  it.each([
    ['ENOTFOUND', 'dns_error'],
    ['EAI_AGAIN', 'dns_error'],
    ['CERT_HAS_EXPIRED', 'tls_error'],
    ['ERR_TLS_CERT_ALTNAME_INVALID', 'tls_error'],
    ['ETIMEDOUT', 'timeout'],
    ['ECONNRESET', 'transport_error'],
    ['sensitive-value', 'unknown'],
  ])('records a bounded category for %s without raw error details', async (code, category) => {
    const fetchPage = vi.fn().mockRejectedValue(errorWithCode(code));
    expect(await createSourceChecker(fetchPage)('https://example.org/a')).toEqual({
      ok: false,
      failure: { stage: 'robots', category },
    });
  });

  it('separates source HTTP failures from policy failures and does not cache source failures', async () => {
    const fetchPage = vi.fn(async (url: URL) =>
      url.pathname === '/robots.txt' ? response() : response(403, 'secret source text'),
    );
    const check = createSourceChecker(fetchPage);
    for (const path of ['a', 'b'])
      expect(await check(`https://example.org/${path}`)).toEqual({
        ok: false,
        failure: { stage: 'source', category: 'http_access_restricted', http_status: 403 },
      });
    expect(fetchPage).toHaveBeenCalledTimes(3);
  });

  it('rechecks policy at a redirected source origin before requesting its body', async () => {
    const fetchPage = vi.fn(async (url: URL) => {
      if (url.hostname === 'other.example') return response(200, 'User-agent: *\nDisallow: /');
      return url.pathname === '/robots.txt'
        ? response()
        : response(302, '', '', 'https://other.example/cv.pdf');
    });
    expect(await createSourceChecker(fetchPage)('https://example.org/cv')).toEqual({
      ok: false,
      failure: { stage: 'robots', category: 'robots_disallowed' },
    });
    expect(fetchPage.mock.calls.map(([url]) => url.href)).toEqual([
      'https://example.org/robots.txt',
      'https://example.org/cv',
      'https://other.example/robots.txt',
    ]);
  });

  it('rejects an unsafe robots redirect and caches the rejection', async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValue(response(302, '', '', 'https://127.0.0.1/robots.txt'));
    const check = createSourceChecker(fetchPage);
    for (const path of ['a', 'b'])
      expect(await check(`https://example.org/${path}`)).toEqual({
        ok: false,
        failure: { stage: 'robots', category: 'invalid_url' },
      });
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  it('bounds robots redirect loops and records a bounded status', async () => {
    const fetchPage = vi.fn().mockResolvedValue(response(302, '', '', '/robots.txt'));
    expect(await createSourceChecker(fetchPage)('https://example.org/a')).toEqual({
      ok: false,
      failure: { stage: 'robots', category: 'redirect_limit', http_status: 302 },
    });
    expect(fetchPage).toHaveBeenCalledTimes(4);
  });

  it('classifies unsupported source content without exposing it', async () => {
    const fetchPage = vi.fn(async (url: URL) =>
      url.pathname === '/robots.txt'
        ? response()
        : response(200, '{"secret":"body"}', 'application/json'),
    );
    expect(await createSourceChecker(fetchPage)('https://example.org/a')).toEqual({
      ok: false,
      failure: { stage: 'source', category: 'unsupported_content', http_status: 200 },
    });
  });

  it('aggregates failures by stage/category/status for persistence and summaries', () => {
    const entries: FailureDetails[] = [
      { stage: 'robots', category: 'tls_error' },
      { stage: 'robots', category: 'tls_error' },
      { stage: 'source', category: 'http_error', http_status: 404 },
    ];
    expect(summarizeFailures(entries)).toEqual([
      { stage: 'robots', category: 'tls_error', count: 2 },
      { stage: 'source', category: 'http_error', http_status: 404, count: 1 },
    ]);
  });

  it('still rejects mixed public/private DNS answers before opening HTTPS', async () => {
    vi.useFakeTimers();
    dnsLookup.mockResolvedValue([
      { address: '192.0.78.12', family: 4 },
      { address: '10.0.0.1', family: 4 },
    ]);
    const pending = createSourceChecker()('https://example.org/a');
    await vi.runAllTimersAsync();
    expect(await pending).toEqual({
      ok: false,
      failure: { stage: 'robots', category: 'non_public_destination' },
    });
    expect(httpsRequest).not.toHaveBeenCalled();
  });

  it('pins the checked DNS destination and leaves TLS validation enabled', async () => {
    vi.useFakeTimers();
    dnsLookup.mockResolvedValue([{ address: '192.0.78.12', family: 4 }]);
    const req = Object.assign(new EventEmitter(), {
      setTimeout: vi.fn(),
      end: vi.fn(),
      destroy: vi.fn(),
    });
    req.end.mockImplementation(() =>
      req.emit('error', errorWithCode('UNABLE_TO_VERIFY_LEAF_SIGNATURE')),
    );
    httpsRequest.mockReturnValue(req);
    const pending = createSourceChecker()('https://example.org/a');
    await vi.runAllTimersAsync();
    expect(await pending).toEqual({
      ok: false,
      failure: { stage: 'robots', category: 'tls_error' },
    });
    const options = httpsRequest.mock.calls[0][1];
    expect(options.rejectUnauthorized).not.toBe(false);
    expect(options.headers).toEqual({
      'User-Agent': 'COSSPPGlobalMonitor/1.0',
      'Accept-Encoding': 'identity',
    });
    const callback = vi.fn();
    options.lookup('ignored.example', { all: true }, callback);
    expect(callback).toHaveBeenCalledWith(null, [{ address: '192.0.78.12', family: 4 }]);
    expect(req.setTimeout).toHaveBeenCalledWith(15000, expect.any(Function));
  });

  it.each(['robots', 'source'] as const)(
    'keeps the %s response byte cap and records size_limit',
    async (stage) => {
      vi.useFakeTimers();
      dnsLookup.mockResolvedValue([{ address: '192.0.78.12', family: 4 }]);
      httpsRequest.mockImplementation((url: URL, _options, respond) => {
        const robots = url.pathname === '/robots.txt';
        const req = Object.assign(new EventEmitter(), {
          setTimeout: vi.fn(),
          end: vi.fn(),
          destroy: vi.fn(),
        });
        req.destroy.mockImplementation((error) => {
          req.emit('error', error);
          return req;
        });
        req.end.mockImplementation(() => {
          const res = Object.assign(new EventEmitter(), {
            statusCode: robots && stage === 'source' ? 404 : 200,
            headers: { 'content-type': 'text/plain' },
          });
          respond(res);
          res.emit('data', Buffer.alloc(robots ? (stage === 'robots' ? 200001 : 0) : 2500001));
          res.emit('end');
        });
        return req;
      });
      const pending = createSourceChecker()('https://example.org/a');
      await vi.runAllTimersAsync();
      expect(await pending).toEqual({ ok: false, failure: { stage, category: 'size_limit' } });
    },
  );

  it('retains request spacing when different origins fail TLS', async () => {
    vi.useFakeTimers();
    dnsLookup.mockResolvedValue([{ address: '192.0.78.12', family: 4 }]);
    const times: number[] = [];
    httpsRequest.mockImplementation(() => {
      times.push(Date.now());
      const req = Object.assign(new EventEmitter(), { setTimeout: vi.fn(), end: vi.fn() });
      req.end.mockImplementation(() => req.emit('error', errorWithCode('CERT_HAS_EXPIRED')));
      return req;
    });
    const check = createSourceChecker();
    const first = check('https://one.example/a');
    await vi.runAllTimersAsync();
    await first;
    const second = check('https://two.example/a');
    await vi.runAllTimersAsync();
    await second;
    expect(times).toHaveLength(2);
    expect(times[1] - times[0]).toBeGreaterThanOrEqual(1300);
  });
});
