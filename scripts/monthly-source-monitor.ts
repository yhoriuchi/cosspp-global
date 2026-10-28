import { createHash } from 'node:crypto';
import { lookup } from 'node:dns/promises';
import { request } from 'node:https';
import { isIP } from 'node:net';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
export const UA = 'COSSPPGlobalMonitor/1.0';
export function publicAddress(ip: string) {
  if (isIP(ip) === 6) return /^[23][a-f0-9]{3}:/i.test(ip);
  if (isIP(ip) !== 4) return false;
  const [a, b] = ip.split('.').map(Number);
  return !(
    a === 0 ||
    a === 10 ||
    a === 127 ||
    a >= 224 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && [0, 168].includes(b)) ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 198 && [18, 19].includes(b))
  );
}
export function sourceUrl(value: string) {
  const url = new URL(value);
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    (url.port && url.port !== '443') ||
    url.hostname === 'localhost' ||
    (isIP(url.hostname.replace(/^\[|\]$/g, '')) &&
      !publicAddress(url.hostname.replace(/^\[|\]$/g, '')))
  )
    throw new Error('Not a public HTTPS source');
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
let last = 0;
async function retrieve(
  url: URL,
  maxBytes: number,
): Promise<{
  status: number;
  headers: Record<string, string | string[] | undefined>;
  body: Buffer;
}> {
  await new Promise((resolve) => setTimeout(resolve, Math.max(0, 1300 - (Date.now() - last))));
  last = Date.now();
  const addresses = await lookup(url.hostname, { all: true });
  if (!addresses.length || addresses.some((a) => !publicAddress(a.address)))
    throw new Error('Non-public destination');
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
            req.destroy(new Error('Source exceeds size limit'));
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
    req.setTimeout(15000, () => req.destroy(new Error('Source timed out')));
    req.on('error', reject);
    req.end();
  });
}
const policies = new Map<string, { allowed: (path: string) => boolean; status: string }>();
async function permitted(url: URL) {
  if (!policies.has(url.origin)) {
    let robots = new URL('/robots.txt', url);
    let result;
    for (let n = 0; n < 4; n++) {
      result = await retrieve(robots, 200000);
      if ([301, 302, 303, 307, 308].includes(result.status) && result.headers.location) {
        robots = sourceUrl(new URL(String(result.headers.location), robots).href);
        continue;
      }
      break;
    }
    if (!result) throw new Error('Robots unavailable');
    if ([404, 410].includes(result.status))
      policies.set(url.origin, { allowed: () => true, status: 'not_present' });
    else if (result.status === 200 && !/<(?:!doctype|html)/i.test(result.body.toString('utf8'))) {
      const text = result.body.toString('utf8');
      policies.set(url.origin, {
        allowed: (path) => robotsAllowed(text, path),
        status: 'reviewed',
      });
    } else throw new Error('Robots policy unavailable; source not fetched');
  }
  return policies.get(url.origin)!.allowed(url.pathname + url.search);
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
  const report: { url: string; status: string; faculty_ids: string[]; cv_candidates?: string[] }[] =
    [];
  const limit = Number(process.env.MONITOR_MAX_SOURCES || 0);
  if (!Number.isInteger(limit) || limit < 0 || limit > 1000)
    throw new Error('Invalid source limit');
  const selected = [...sources.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(0, limit || sources.size);
  for (const [original, info] of selected) {
    try {
      let url = sourceUrl(original);
      let result;
      for (let n = 0; n < 5; n++) {
        if (!(await permitted(url))) throw new Error('Robots disallows source');
        result = await retrieve(url, 2500000);
        if ([301, 302, 303, 307, 308].includes(result.status) && result.headers.location) {
          url = sourceUrl(new URL(String(result.headers.location), url).href);
          continue;
        }
        break;
      }
      if (!result || result.status !== 200) throw new Error('Source unavailable');
      const type = String(result.headers['content-type'] || '');
      if (!/html|pdf|word|rtf|text/i.test(type)) throw new Error('Unsupported source type');
      const hash = fingerprint(result.body, type);
      const previous = old.sources[original]?.sha256;
      const status = !previous ? 'baseline' : previous === hash ? 'unchanged' : 'changed';
      const candidates = /html/i.test(type)
        ? cvCandidates(result.body.toString('utf8'), url.href)
        : [];
      state.sources[original] = {
        ...info,
        sha256: hash,
        checked_at: state.checked_at,
        status,
        cv_candidates: candidates,
      };
      report.push({
        url: original,
        status,
        faculty_ids: info.faculty_ids,
        cv_candidates: candidates,
      });
    } catch {
      report.push({
        url: original,
        status: 'unavailable_or_not_permitted',
        faculty_ids: info.faculty_ids,
      });
    }
    // No source bodies, extracted biographies, addresses or requests enter logs/artifacts.
  }
  mkdirSync('data/monitor', { recursive: true });
  writeFileSync(path, JSON.stringify(state, null, 2) + '\n');
  const changed = report.filter((r) => r.status === 'changed');
  const unavailable = report.filter((r) => r.status === 'unavailable_or_not_permitted');
  const summary = `# Monthly public-source check\n\nChecked ${selected.length} of ${sources.size} known public profile/website/CV URLs. ${changed.length} changed; ${unavailable.length} unavailable/not permitted. First successful reads establish a baseline.\n\nThis is change detection, not AI interpretation or automatic factual revision. New CV links are review candidates, not verified assignments.\n\n${changed.map((r) => '- ' + r.url).join('\n')}\n`;
  if (process.env.GITHUB_STEP_SUMMARY) writeFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
  console.log(
    `Checked ${selected.length}/${sources.size} sources; changed=${changed.length}, unavailable=${unavailable.length}. No faculty fields changed.`,
  );
}
