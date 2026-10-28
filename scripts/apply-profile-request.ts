import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { datasetSchema, type Faculty } from '../src/types/faculty';
import { validateUnitMembership } from '../src/utils/units';
type Payload = {
  version: number;
  id: string;
  profile_id: string;
  verified_email_sha256: string;
  verified_at: string;
  request_text: string;
  proposed_changes: Record<string, unknown>;
};
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
export function applyRequest(
  rows: Faculty[],
  envelope: { payload: Payload; signature: string },
  key: string,
  now: Date,
) {
  if (!key || key.length < 32) throw new Error('Signing key not configured');
  const expected = createHmac('sha256', key).update(JSON.stringify(envelope.payload)).digest('hex');
  if (
    !/^[a-f0-9]{64}$/.test(envelope.signature) ||
    !timingSafeEqual(Buffer.from(expected), Buffer.from(envelope.signature))
  )
    throw new Error('Invalid signed request');
  const p = envelope.payload;
  const date = new Date(p.verified_at);
  if (
    p.version !== 1 ||
    !uuid.test(p.id) ||
    !Number.isFinite(date.getTime()) ||
    now.getTime() - date.getTime() > 7 * 86400000 ||
    date.getTime() - now.getTime() > 300000
  )
    throw new Error('Expired or invalid request');
  const person = rows.find((r) => r.id === p.profile_id);
  if (!person?.email) throw new Error('Profile unavailable');
  const emailHash = createHash('sha256').update(person.email.trim().toLowerCase()).digest('hex');
  if (emailHash !== p.verified_email_sha256) throw new Error('Listed email changed; verify again');
  if (
    !p.proposed_changes ||
    typeof p.proposed_changes !== 'object' ||
    Object.keys(p.proposed_changes).some((k) => k !== 'short_biography')
  )
    throw new Error('Unsupported automatic field');
  if (!Object.keys(p.proposed_changes).length) return { rows, receipt: null };
  const value = p.proposed_changes.short_biography;
  if (typeof value !== 'string' || value.trim().length < 20 || value.length > 1200)
    throw new Error('Invalid summary');
  const source = `https://yhoriuchi.github.io/cosspp-global/receipts/${p.id}.json`;
  if (person.sources.some((s) => s.url === source)) return { rows, receipt: null };
  const today = now.toISOString().slice(0, 10);
  const next = structuredClone(rows);
  const target = next.find((r) => r.id === p.profile_id)!;
  target.short_biography = value.trim();
  target.last_updated = today;
  target.last_verified = today;
  target.sources.push({
    url: source,
    accessed: today,
    fields: ['short_biography'],
    evidence:
      'The profile owner verified the FSU email listed in the directory and explicitly requested publication of this research summary.',
    extraction: 'human_reviewed',
    reviewed_by: 'human',
    retrieval: 'direct',
  });
  datasetSchema.parse(next);
  validateUnitMembership(next);
  return {
    rows: next,
    receipt: {
      request_id: p.id,
      faculty_id: p.profile_id,
      field: 'short_biography',
      value: value.trim(),
      confirmed_on: today,
      verification: 'FSU email verified',
    },
  };
}
if (process.argv[1]?.endsWith('apply-profile-request.ts')) {
  const id = process.env.REQUEST_ID || '';
  if (!uuid.test(id)) throw new Error('Invalid request ID');
  if (!/^[\w.-]+\/[\w.-]+$/.test(process.env.QUEUE_REPOSITORY || ''))
    throw new Error('Private queue not configured');
  const headers = {
    Authorization: `Bearer ${process.env.QUEUE_READ_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2026-03-10',
  };
  const base = `https://api.github.com/repos/${process.env.QUEUE_REPOSITORY}`;
  const meta = await fetch(base, { headers });
  if (!meta.ok || (await meta.json()).private !== true) throw new Error('Queue must be private');
  const response = await fetch(`${base}/contents/requests/${id}.json`, { headers });
  if (!response.ok) throw new Error('Request unavailable');
  const file = await response.json();
  const raw = Buffer.from(file.content, 'base64').toString('utf8');
  if (raw.length > 20000) throw new Error('Invalid request');
  const envelope = JSON.parse(raw);
  if (envelope.payload.id !== id) throw new Error('Request mismatch');
  const rows = datasetSchema.parse(JSON.parse(readFileSync('data/public/faculty.json', 'utf8')));
  const { rows: next, receipt } = applyRequest(
    rows,
    envelope,
    process.env.PROFILE_REQUEST_SIGNING_KEY || '',
    new Date(),
  );
  if (!receipt) {
    console.log('Request retained privately; no automatic data change.');
    process.exit(0);
  }
  const path = `public/receipts/${id}.json`;
  if (existsSync(path)) throw new Error('Receipt collision');
  mkdirSync('public/receipts', { recursive: true });
  writeFileSync(path, JSON.stringify(receipt, null, 2) + '\n');
  writeFileSync('data/public/faculty.json', JSON.stringify(next, null, 2) + '\n');
  const inventory = JSON.parse(readFileSync('data/sources/inventory.json', 'utf8'));
  inventory.push({
    url: `https://yhoriuchi.github.io/cosspp-global/receipts/${id}.json`,
    access_dates: [receipt.confirmed_on],
    retrieval_methods: ['direct'],
    faculty_ids: [receipt.faculty_id],
  });
  writeFileSync('data/sources/inventory.json', JSON.stringify(inventory, null, 2) + '\n');
  console.log(
    'One explicitly requested research summary prepared; private request text was not published.',
  );
}
