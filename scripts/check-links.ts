import { writeFileSync, mkdirSync } from 'node:fs';
import { loadData } from './validate';
const agent = 'COSSPPGlobalResearch/0.1';
const pause = () => new Promise((resolve) => setTimeout(resolve, 1250));
const cache = new Map<string, { blocked: boolean; rules: string[]; status: number | null }>();
async function policy(origin: string) {
  if (cache.has(origin)) return cache.get(origin)!;
  await pause();
  let result: { blocked: boolean; rules: string[]; status: number | null };
  try {
    const res = await fetch(`${origin}/robots.txt`, {
      headers: { 'User-Agent': agent },
      signal: AbortSignal.timeout(12000),
    });
    if (res.status === 404) result = { blocked: false, rules: [], status: 404 };
    else if (!res.ok) result = { blocked: true, rules: [], status: res.status };
    else {
      const body = await res.text();
      result = {
        blocked: false,
        status: res.status,
        rules: [...body.matchAll(/^\s*Disallow:\s*([^#\r\n]+)/gim)]
          .map((m) => m[1].trim())
          .filter(Boolean),
      };
    }
  } catch {
    result = { blocked: true, rules: [], status: null };
  }
  cache.set(origin, result);
  return result;
}
function disallows(path: string, rules: string[]) {
  return rules.some((rule) => {
    const end = rule.endsWith('$');
    const clean = end ? rule.slice(0, -1) : rule;
    const pattern = clean
      .split('*')
      .map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('.*');
    return new RegExp('^' + pattern + (end ? '$' : '')).test(path);
  });
}
const rows = loadData();
const urls = [
  ...new Set(
    rows
      .flatMap((r) =>
        [
          r.official_profile_url,
          r.cv_url,
          r.personal_website_url,
          ...r.sources.map((s) => s.url),
        ].filter((u): u is string => !!u),
      )
      .map((u) => {
        const url = new URL(u);
        url.hash = '';
        return url.href;
      }),
  ),
];
const limit = Number(process.argv[2] || urls.length);
const report: { url: string; status: string; http_status?: number; checked_at: string }[] = [];
for (const url of urls.slice(0, limit)) {
  const parsed = new URL(url);
  let status: string;
  let http_status: number | undefined;
  if (/\.(pdf|docx?)(?:$|\?)/i.test(parsed.pathname)) status = 'not_requested_document_restriction';
  else {
    const p = await policy(parsed.origin);
    if (p.blocked) status = 'not_checked_robots_unavailable';
    else if (disallows(parsed.pathname + parsed.search, p.rules))
      status = 'not_requested_robots_disallow';
    else {
      await pause();
      try {
        const response = await fetch(url, {
          method: 'HEAD',
          redirect: 'manual',
          headers: { 'User-Agent': agent },
          signal: AbortSignal.timeout(12000),
        });
        http_status = response.status;
        status = response.ok
          ? 'reachable'
          : response.status >= 300 && response.status < 400
            ? 'redirect_requires_review'
            : response.status === 404 || response.status === 410
              ? 'broken'
              : 'inaccessible_or_head_unsupported';
      } catch {
        status = 'network_unavailable';
      }
    }
  }
  report.push({ url, status, http_status, checked_at: new Date().toISOString() });
  if (report.length % 20 === 0)
    console.log(`Checked or classified ${report.length}/${Math.min(limit, urls.length)}`);
}
mkdirSync('data/review', { recursive: true });
writeFileSync(
  'data/review/link-report.json',
  JSON.stringify(
    {
      generated: new Date().toISOString(),
      total_urls: urls.length,
      processed: report.length,
      method:
        'Rate-limited HEAD; union of all robots Disallow groups is deliberately conservative; no restricted document requests; redirects require separate review.',
      robots: [...cache.entries()].map(([origin, p]) => ({ origin, status: p.status })),
      results: report,
    },
    null,
    2,
  ) + '\n',
);
console.log(
  `Finished ${report.length}/${urls.length} URLs; results saved privately. Non-200 is not automatically a broken page.`,
);
