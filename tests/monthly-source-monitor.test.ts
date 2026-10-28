import { describe, it, expect } from 'vitest';
import {
  robotsAllowed,
  fingerprint,
  publicAddress,
  sourceUrl,
  cvCandidates,
} from '../scripts/monthly-source-monitor';
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
