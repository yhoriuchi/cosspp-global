import { createHash } from 'node:crypto';
import { lookup } from 'node:dns/promises';
import { request } from 'node:https';
import { isIP } from 'node:net';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
export const UA = 'COSSPPGlobalMonitor/1.0';
export function publicAddress(ip: string) {
  if (isIP(ip) === 6) return /^[23][a-f0-9]{3}:/i.test(ip);
  if (isIP(ip) !== 4) return false;
  const [a, b, c] = ip.split('.').map(Number);
  return !(
    a === 0 ||
    a === 10 ||
    a === 127 ||
    a >= 224 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    // IANA: 192.0.0.0/24 (protocol assignments) and 192.0.2.0/24
    // (documentation), not all of 192.0.0.0/16. Keep protocol exceptions
    // conservatively excluded; ordinary 192.0.78.x destinations are eligible.
    (a === 192 && (b === 168 || (b === 0 && [0, 2].includes(c)))) ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 198 && [18, 19].includes(b))
  );
}
export function sourceUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new MonitorError('invalid_url');
  }
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    (url.port && url.port !== '443') ||
    url.hostname === 'localhost' ||
    (isIP(url.hostname.replace(/^\[|\]$/g, '')) &&
      !publicAddress(url.hostname.replace(/^\[|\]$/g, '')))
  )
    throw new MonitorError('invalid_url');
  url.hash = '';
  return url;
}
export function robotsAllowed(text: string, path: string) {
  const groups: { agents: string[]; rules: { allow: boolean; path: string }[] }[] = [];
  let group = { agents: [] as string[], rules: [] as { allow: boolean; path: string }[] };
  let hadRules = false;
  for (const line of (text + '\nUser-agent: END').split(/\r?\n/)) {
    const entry = line
      .replace(/#.*/, '')
      .trim()
      .match(/^([^:]+):\s*(.*)$/);
    if (!entry) continue;
    const key = entry[1].toLowerCase(),
      value = entry[2].trim();
    if (key === 'user-agent') {
      if (hadRules) {
        groups.push(group);
        group = { agents: [], rules: [] };
        hadRules = false;
      }
      group.agents.push(value.toLowerCase());
    } else if (key === 'allow' || key === 'disallow') {
      group.rules.push({ allow: key === 'allow', path: value });
      hadRules = true;
    }
  }
  const specificity = (g: typeof group) =>
    Math.max(
      -1,
      ...g.agents.map((a) => (a === '*' ? 0 : UA.toLowerCase().includes(a) ? a.length : -1)),
    );
  const best = Math.max(-1, ...groups.map(specificity));
  const rules = groups
    .filter((g) => specificity(g) === best)
    .flatMap((g) => g.rules)
    .filter((r) => r.path);
  const matches = rules.filter((r) => {
    const end = r.path.endsWith('$');
    const value = end ? r.path.slice(0, -1) : r.path;
    return new RegExp(
      '^' + value.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + (end ? '$' : ''),
    ).test(path);
  });
  matches.sort((a, b) => b.path.length - a.path.length || Number(b.allow) - Number(a.allow));
  return !matches.length || matches[0].allow;
}
type FailureCategory =
  | 'robots_disallowed'
  | 'robots_unavailable'
  | 'robots_unreadable'
  | 'http_access_restricted'
  | 'http_error'
  | 'dns_error'
  | 'tls_error'
  | 'timeout'
  | 'transport_error'
  | 'non_public_destination'
  | 'invalid_url'
  | 'redirect_limit'
  | 'size_limit'
  | 'unsupported_content'
  | 'unknown';
export type FailureDetails = {
  stage: 'robots' | 'source';
  category: FailureCategory;
  http_status?: number;
};
class MonitorError extends Error {
  constructor(
    readonly category: FailureCategory,
    readonly httpStatus?: number,
  ) {
    super(category);
  }
}
// Never serialize raw errors, URLs, response bodies, certificates or headers.
function failureDetails(error: unknown, stage: FailureDetails['stage']): FailureDetails {
  if (error instanceof MonitorError) {
    const status = error.httpStatus;
    return {
      stage,
      category: error.category,
      ...(Number.isInteger(status) && status! >= 100 && status! <= 599
        ? { http_status: status }
        : {}),
    };
  }
  const code = (error as { code?: unknown } | null)?.code;
  let category: FailureCategory = 'unknown';
  if (typeof code === 'string') {
    if (['ENOTFOUND', 'EAI_AGAIN', 'EAI_FAIL', 'ENODATA'].includes(code)) category = 'dns_error';
    else if (
      code.startsWith('ERR_TLS_') ||
      code.startsWith('ERR_SSL_') ||
      code.startsWith('CERT_') ||
      [
        'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
        'UNABLE_TO_GET_ISSUER_CERT',
        'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
        'DEPTH_ZERO_SELF_SIGNED_CERT',
        'SELF_SIGNED_CERT_IN_CHAIN',
      ].includes(code)
    )
      category = 'tls_error';
    else if (['ETIMEDOUT', 'ESOCKETTIMEDOUT'].includes(code)) category = 'timeout';
    else if (
      [
        'ECONNREFUSED',
        'ECONNRESET',
        'EHOSTUNREACH',
        'ENETUNREACH',
        'EPIPE',
        'ERR_STREAM_PREMATURE_CLOSE',
      ].includes(code)
    )
      category = 'transport_error';
  }
  return { stage, category };
}
export function summarizeFailures(failures: FailureDetails[]) {
  const counts = new Map<string, FailureDetails & { count: number }>();
  for (const failure of failures) {
    const key = `${failure.stage}:${failure.category}:${failure.http_status ?? ''}`;
    const entry = counts.get(key) || { ...failure, count: 0 };
    entry.count++;
    counts.set(key, entry);
  }
  return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, value]) => value);
}
export type Retrieval = {
  status: number;
  headers: Record<string, string | string[] | undefined>;
  body: Buffer;
};
type Retriever = (url: URL, maxBytes: number) => Promise<Retrieval>;
let last = 0;
async function retrieve(url: URL, maxBytes: number): Promise<Retrieval> {
  await new Promise((resolve) => setTimeout(resolve, Math.max(0, 1300 - (Date.now() - last))));
  last = Date.now();
  const addresses = await lookup(url.hostname, { all: true });
  if (!addresses.length || addresses.some((a) => !publicAddress(a.address)))
    throw new MonitorError('non_public_destination');
  return new Promise((resolve, reject) => {
    const first = addresses[0];
    const req = request(
      url,
      {
        headers: { 'User-Agent': UA, 'Accept-Encoding': 'identity' },
        lookup: (_host, options, callback) =>
          options.all
            ? callback(null, [first] as never)
            : callback(null, first.address, first.family),
      },
      (res) => {
        const chunks: Buffer[] = [];
        let size = 0;
        res.on('data', (chunk: Buffer) => {
          size += chunk.length;
          if (size > maxBytes) {
            req.destroy(new MonitorError('size_limit'));
            return;
          }
          chunks.push(chunk);
        });
        res.on('end', () =>
          resolve({
            status: res.statusCode || 0,
            headers: res.headers,
            body: Buffer.concat(chunks),
          }),
        );
        res.on('error', reject);
      },
    );
    req.setTimeout(15000, () => req.destroy(new MonitorError('timeout')));
    req.on('error', reject);
    req.end();
  });
}
type Policy = { allowed: (path: string) => boolean } | { failure: FailureDetails };
type CheckResult =
  | { ok: true; url: URL; body: Buffer; contentType: string }
  | { ok: false; failure: FailureDetails };
const isRedirect = (status: number) => [301, 302, 303, 307, 308].includes(status);
function httpFailure(status: number, stage: FailureDetails['stage']) {
  return new MonitorError(
    [401, 403, 429].includes(status)
      ? 'http_access_restricted'
      : stage === 'robots'
        ? 'robots_unavailable'
        : 'http_error',
    status,
  );
}
// A fresh factory is one run. Cache failures as well as valid policies, never
// turn a policy error into permission, and never carry the cache across runs.
// The retriever seam lets regression tests run without live requests.
export function createSourceChecker(fetchPage: Retriever = retrieve) {
  const policies = new Map<string, Promise<Policy>>();
  async function loadPolicy(origin: string): Promise<Policy> {
    try {
      let robots = new URL('/robots.txt', origin);
      for (let n = 0; n < 4; n++) {
        const result = await fetchPage(robots, 200000);
        if (isRedirect(result.status) && result.headers.location) {
          robots = sourceUrl(new URL(String(result.headers.location), robots).href);
          if (n === 3) throw new MonitorError('redirect_limit', result.status);
          continue;
        }
        if ([404, 410].includes(result.status)) return { allowed: () => true };
        if (result.status !== 200) throw httpFailure(result.status, 'robots');
        const text = result.body.toString('utf8');
        if (/<(?:!doctype|html)/i.test(text)) throw new MonitorError('robots_unreadable', 200);
        return { allowed: (path) => robotsAllowed(text, path) };
      }
      throw new MonitorError('robots_unavailable');
    } catch (error) {
      return { failure: failureDetails(error, 'robots') };
    }
  }
  return async (original: string): Promise<CheckResult> => {
    let stage: FailureDetails['stage'] = 'source';
    try {
      let url = sourceUrl(original);
      for (let n = 0; n < 5; n++) {
        stage = 'robots';
        if (!policies.has(url.origin)) policies.set(url.origin, loadPolicy(url.origin));
        const policy = await policies.get(url.origin)!;
        if ('failure' in policy) return { ok: false, failure: policy.failure };
        if (!policy.allowed(url.pathname + url.search)) throw new MonitorError('robots_disallowed');
        stage = 'source';
        const result = await fetchPage(url, 2500000);
        if (isRedirect(result.status) && result.headers.location) {
          url = sourceUrl(new URL(String(result.headers.location), url).href);
          if (n === 4) throw new MonitorError('redirect_limit', result.status);
          continue;
        }
        if (result.status !== 200) throw httpFailure(result.status, 'source');
        const contentType = String(result.headers['content-type'] || '');
        if (!/html|pdf|word|rtf|text/i.test(contentType))
          throw new MonitorError('unsupported_content', 200);
        return { ok: true, url, body: result.body, contentType };
      }
      throw new MonitorError('redirect_limit');
    } catch (error) {
      return { ok: false, failure: failureDetails(error, stage) };
    }
  };
}
export function fingerprint(body: Buffer, type: string) {
  const content = /html/i.test(type)
    ? body
        .toString('utf8')
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    : body;
  return createHash('sha256').update(content).digest('hex');
}
export function cvCandidates(html: string, base: string) {
  const result = new Set<string>();
  for (const match of html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    if (
      !/\b(?:cv|vita|curriculum vitae|résumé|resume)\b/i.test(
        match[1] + ' ' + match[2].replace(/<[^>]+>/g, ' '),
      )
    )
      continue;
    try {
      const url = sourceUrl(new URL(match[1].replaceAll('&amp;', '&'), base).href);
      if (!url.search) result.add(url.href);
    } catch {}
  }
  return [...result].slice(0, 20);
}
if (process.argv[1]?.endsWith('monthly-source-monitor.ts')) {
  const rows = JSON.parse(readFileSync('data/public/faculty.json', 'utf8'));
  const sources = new Map<string, { faculty_ids: string[]; kinds: string[] }>();
  for (const person of rows)
    for (const [key, kind] of [
      ['official_profile_url', 'profile'],
      ['personal_website_url', 'website'],
      ['cv_url', 'cv'],
    ])
      if (person[key]) {
        try {
          const url = sourceUrl(person[key]).href;
          const entry = sources.get(url) || { faculty_ids: [], kinds: [] };
          if (!entry.faculty_ids.includes(person.id)) entry.faculty_ids.push(person.id);
          if (!entry.kinds.includes(kind)) entry.kinds.push(kind);
          sources.set(url, entry);
        } catch {}
      }
  const path = 'data/monitor/source-state.json';
  const old = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : { sources: {} };
  const state = { ...old, checked_at: new Date().toISOString(), sources: { ...old.sources } };
  const report: { status: string }[] = [];
  const failures: FailureDetails[] = [];
  const checkSource = createSourceChecker();
  const limit = Number(process.env.MONITOR_MAX_SOURCES || 0);
  if (!Number.isInteger(limit) || limit < 0 || limit > 1000)
    throw new Error('Invalid source limit');
  const selected = [...sources.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(0, limit || sources.size);
  for (const [original, info] of selected) {
    const result = await checkSource(original);
    if (result.ok) {
      const hash = fingerprint(result.body, result.contentType);
      const previous = old.sources[original]?.sha256;
      const status = !previous ? 'baseline' : previous === hash ? 'unchanged' : 'changed';
      const candidates = /html/i.test(result.contentType)
        ? cvCandidates(result.body.toString('utf8'), result.url.href)
        : [];
      state.sources[original] = {
        ...info,
        sha256: hash,
        checked_at: state.checked_at,
        status,
        cv_candidates: candidates,
      };
      report.push({ status });
    } else {
      // Preserve the previous successful fingerprint and its checked_at date.
      // Only bounded aggregate diagnostics are newly persisted for failures.
      failures.push(result.failure);
      report.push({ status: 'unavailable_or_not_permitted' });
    }
    // No source bodies, extracted biographies, addresses or requests enter logs/artifacts.
  }
  const diagnostics = {
    attempted_sources: selected.length,
    eligible_sources: sources.size,
    successful_sources: selected.length - failures.length,
    failures: summarizeFailures(failures),
  };
  state.diagnostics = diagnostics;
  mkdirSync('data/monitor', { recursive: true });
  writeFileSync(path, JSON.stringify(state, null, 2) + '\n');
  const changed = report.filter((r) => r.status === 'changed');
  const unavailable = report.filter((r) => r.status === 'unavailable_or_not_permitted');
  const failureTable =
    '| Stage | Category | HTTP status | Count |\n| --- | --- | --- | ---: |\n' +
    diagnostics.failures
      .map((f) => `| ${f.stage} | ${f.category} | ${f.http_status ?? '—'} | ${f.count} |`)
      .join('\n');
  const summary = `# Monthly public-source check\n\nChecked ${selected.length} of ${sources.size} known public profile/website/CV URLs. ${diagnostics.successful_sources} retrieved; ${changed.length} changed; ${unavailable.length} unavailable/not permitted. First successful reads establish a baseline.\n\nThis is change detection, not AI interpretation or automatic factual revision. New CV links are review candidates, not verified assignments. Attempted counts include sources stopped before a content request. Cached robots failures count affected sources, not network requests.\n\n${failureTable}\n`;
  if (process.env.GITHUB_STEP_SUMMARY) writeFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
  console.log(
    `Checked ${selected.length}/${sources.size} sources; changed=${changed.length}, unavailable=${unavailable.length}. No faculty fields changed.`,
  );
}
