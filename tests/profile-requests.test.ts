import { describe, it, expect, vi, afterEach } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { createHash, createHmac } from 'node:crypto';
// @ts-expect-error Worker source is deployable JavaScript, not browser code.
import worker from '../services/profile-requests/worker.mjs';
// @ts-expect-error Shared Web Crypto protocol.
import { fsuEmail, requestFields } from '../services/profile-requests/protocol.mjs';
import { applyRequest } from '../scripts/apply-profile-request';
import { facultySchema } from '../src/types/faculty';
const key = 'test-key-with-more-than-thirty-two-characters';
const origin = 'https://yhoriuchi.github.io';
function database() {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync('services/profile-requests/schema.sql', 'utf8'));
  function prepare(sql: string) {
    let values: unknown[] = [];
    return {
      bind(...args: unknown[]) {
        values = args;
        return this;
      },
      async first() {
        return db.prepare(sql).get(...(values as never[])) || null;
      },
      async run() {
        const result = db.prepare(sql).run(...(values as never[]));
        return { meta: { changes: Number(result.changes) } };
      },
      async all() {
        return { results: db.prepare(sql).all(...(values as never[])) };
      },
      execute() {
        const result = db.prepare(sql).run(...(values as never[]));
        return { meta: { changes: Number(result.changes) } };
      },
    };
  }
  return {
    db,
    prepare,
    async batch(statements: ReturnType<typeof prepare>[]) {
      db.exec('BEGIN');
      try {
        const results = statements.map((s) => s.execute());
        db.exec('COMMIT');
        return results;
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }
    },
  };
}
function setup(privateQueue = true) {
  const DB = database();
  let code = '';
  let envelope: any;
  const mails: unknown[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string, options: any = {}) => {
      if (input.includes('raw.githubusercontent.com'))
        return Response.json([
          { id: 'test-person', full_name: 'Test Person', email: 'person@fsu.edu' },
        ]);
      if (input === 'https://api.resend.com/emails') {
        const body = JSON.parse(options.body);
        mails.push(body);
        code = body.text.match(/passcode is (\d{6})/)[1];
        return Response.json({ id: 'mail' });
      }
      if (input === 'https://api.github.com/repos/owner/queue')
        return Response.json({ private: privateQueue });
      if (options.method === 'PUT') {
        envelope = JSON.parse(Buffer.from(JSON.parse(options.body).content, 'base64').toString());
        return Response.json({ content: { sha: 'test' } }, { status: 201 });
      }
      throw new Error('Unexpected external call');
    }),
  );
  const env = {
    DB,
    ENABLED: 'true',
    SITE_ORIGIN: origin,
    OTP_SECRET: key,
    REQUEST_SIGNING_KEY: key,
    RESEND_API_KEY: 'test-only',
    QUEUE_TOKEN: 'test-only',
    QUEUE_REPOSITORY: 'owner/queue',
    FROM_EMAIL: 'test@example.org',
  };
  const post = (path: string, body: object) =>
    worker.fetch(
      new Request('https://worker.test' + path, {
        method: 'POST',
        headers: {
          Origin: origin,
          'Content-Type': 'application/json',
          'CF-Connecting-IP': '203.0.113.10',
        },
        body: JSON.stringify(body),
      }),
      env,
    );
  return { DB, env, post, mails, getCode: () => code, getEnvelope: () => envelope };
}
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
describe('verified private profile requests', () => {
  it('sends only to the listed FSU mailbox, hashes the code, and saves a signed request privately', async () => {
    const s = setup();
    const challenge = await (
      await s.post('/challenge', { profile_id: 'test-person', email: 'PERSON@FSU.EDU' })
    ).json();
    expect(s.mails).toHaveLength(1);
    expect(s.DB.db.prepare('SELECT code_hash FROM challenges').get()?.code_hash).not.toBe(
      s.getCode(),
    );
    const response = await s.post('/requests', {
      challenge_id: challenge.challenge_id,
      passcode: s.getCode(),
      request_text: 'Please correct my research summary.',
      proposed_biography: 'Research on urban policy and public opinion.',
      publish_biography: true,
    });
    expect(response.status).toBe(202);
    expect((await response.json()).saved_to_github).toBe(true);
    expect(s.getEnvelope().payload.profile_id).toBe('test-person');
    const repeated = await s.post('/requests', {
      challenge_id: challenge.challenge_id,
      passcode: s.getCode(),
      request_text: 'Please correct my research summary.',
    });
    expect(repeated.status).toBeGreaterThanOrEqual(400);
  });
  it('rejects other origins/domains and does not send to another FSU mailbox', async () => {
    const s = setup();
    expect(fsuEmail('p@fsu.edu.evil.org')).toBe(false);
    expect(fsuEmail('p@em.fsu.edu')).toBe(true);
    await s.post('/challenge', { profile_id: 'test-person', email: 'other@fsu.edu' });
    expect(s.mails).toHaveLength(0);
    expect(
      (await s.post('/challenge', { profile_id: 'test-person', email: 'p@example.org' })).status,
    ).toBe(400);
    const denied = await worker.fetch(
      new Request('https://worker.test/challenge', {
        method: 'POST',
        headers: { Origin: 'https://evil.test' },
      }),
      s.env,
    );
    expect(denied.status).toBe(403);
  });
  it('locks out wrong-code attempts and expires codes', async () => {
    const s = setup();
    const challenge = await (
      await s.post('/challenge', { profile_id: 'test-person', email: 'person@fsu.edu' })
    ).json();
    for (let n = 0; n < 5; n++)
      expect(
        (
          await s.post('/requests', {
            challenge_id: challenge.challenge_id,
            passcode: s.getCode() === '000000' ? '000001' : '000000',
            request_text: 'Please correct my profile.',
          })
        ).status,
      ).toBe(400);
    expect(
      (
        await s.post('/requests', {
          challenge_id: challenge.challenge_id,
          passcode: s.getCode(),
          request_text: 'Please correct my profile.',
        })
      ).status,
    ).toBe(400);
    const next = await (
      await s.post('/challenge', { profile_id: 'test-person', email: 'person@fsu.edu' })
    ).json();
    s.DB.db.prepare('UPDATE challenges SET expires_at=0 WHERE id=?').run(next.challenge_id);
    expect(
      (
        await s.post('/requests', {
          challenge_id: next.challenge_id,
          passcode: s.getCode(),
          request_text: 'Please correct my profile.',
        })
      ).status,
    ).toBe(400);
  });
  it('limits email sends, requires explicit publication consent, and never writes requests to a public queue', async () => {
    const s = setup(false);
    const challenge = await (
      await s.post('/challenge', { profile_id: 'test-person', email: 'person@fsu.edu' })
    ).json();
    expect(() =>
      requestFields({
        request_text: 'Please correct the summary.',
        proposed_biography: 'This is the new research summary.',
      }),
    ).toThrow();
    const response = await s.post('/requests', {
      challenge_id: challenge.challenge_id,
      passcode: s.getCode(),
      request_text: 'Please correct my profile.',
    });
    expect(response.status).toBe(202);
    expect((await response.json()).saved_to_github).toBe(false);
    expect(s.getEnvelope()).toBeUndefined();
    await s.post('/challenge', { profile_id: 'test-person', email: 'person@fsu.edu' });
    await s.post('/challenge', { profile_id: 'test-person', email: 'person@fsu.edu' });
    expect(
      (await s.post('/challenge', { profile_id: 'test-person', email: 'person@fsu.edu' })).status,
    ).toBe(429);
  });
});
function faculty() {
  const fields = [
    'full_name',
    'academic_title',
    'primary_department',
    'appointment_type',
    'current_affiliation_status',
    'official_profile_url',
    'email',
    'research_interests',
  ];
  return facultySchema.parse({
    id: 'test-person',
    full_name: 'Test Person',
    academic_title: 'Professor',
    primary_department: 'Political Science',
    additional_affiliations: [],
    appointment_type: 'regular',
    current_affiliation_status: 'current',
    official_profile_url: 'https://example.org/profile',
    email: 'person@fsu.edu',
    research_interests: ['Urban policy'],
    methodological_expertise: [],
    geographic_research_countries: [],
    geographic_research_regions: [],
    languages: [],
    sources: [
      {
        url: 'https://example.org/profile',
        accessed: '2026-10-27',
        fields,
        evidence: 'Fictional fixture.',
        extraction: 'agent_reviewed',
      },
    ],
    last_updated: '2026-10-27',
    last_verified: '2026-10-27',
    verification_status: 'source_verified',
    faculty_review_status: 'not_requested',
    publication_status: 'public',
  });
}
function envelope(
  changes: Record<string, unknown> = {
    short_biography: 'Studies urban policy and public opinion.',
  },
) {
  const payload = {
    version: 1,
    id: '12345678-1234-4234-8234-123456789abc',
    profile_id: 'test-person',
    verified_email_sha256: createHash('sha256').update('person@fsu.edu').digest('hex'),
    verified_at: '2026-10-28T12:00:00Z',
    request_text: 'Please update my research summary.',
    proposed_changes: changes,
  };
  return {
    payload,
    signature: createHmac('sha256', key).update(JSON.stringify(payload)).digest('hex'),
  };
}
describe('automatic summary publication boundary', () => {
  it('changes only an explicitly supplied summary and publishes a receipt without private text or mailbox hash', () => {
    const before = faculty();
    const result = applyRequest([before], envelope(), key, new Date('2026-10-28T12:01:00Z'));
    expect(result.rows[0].short_biography).toContain('urban policy');
    expect(result.rows[0].primary_department).toBe(before.primary_department);
    expect(JSON.stringify(result.receipt)).not.toMatch(/verified_email|request_text|person@/);
    expect(
      applyRequest(result.rows, envelope(), key, new Date('2026-10-28T12:01:00Z')).receipt,
    ).toBeNull();
  });
  it('queues general requests and rejects tampering, stale requests, changed email and unsupported fields', () => {
    const rows = [faculty()];
    const now = new Date('2026-10-28T12:01:00Z');
    expect(applyRequest(rows, envelope({}), key, now).receipt).toBeNull();
    const altered = envelope();
    altered.payload.proposed_changes.short_biography = 'Tampered summary after signature.';
    expect(() => applyRequest(rows, altered, key, now)).toThrow(/signed/);
    expect(() => applyRequest(rows, envelope(), key, new Date('2026-11-10'))).toThrow(/Expired/);
    expect(() =>
      applyRequest([{ ...rows[0], email: 'changed@fsu.edu' }], envelope(), key, now),
    ).toThrow(/email changed/);
    expect(() => applyRequest(rows, envelope({ academic_title: 'Dean' }), key, now)).toThrow(
      /Unsupported/,
    );
  });
});
