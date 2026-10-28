import { uuid, fsuEmail, normalizeEmail, sha256, sign, equal, requestFields } from './protocol.mjs';
const DATA =
  'https://raw.githubusercontent.com/yhoriuchi/cosspp-global/main/data/public/faculty.json';
const json = (body, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers },
  });
const ghHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2026-03-10',
  'User-Agent': 'COSSPP-Global-Requests',
});
async function limited(env, key, limit, now, window = 900) {
  const row = await env.DB.prepare(
    `INSERT INTO rate_limits(key,count,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN expires_at<=? THEN 1 ELSE count+1 END,expires_at=CASE WHEN expires_at<=? THEN excluded.expires_at ELSE expires_at END RETURNING count`,
  )
    .bind(key, now + window, now, now)
    .first();
  return row.count > limit;
}
async function readBody(request) {
  const reader = request.body?.getReader();
  if (!reader) return '';
  const chunks = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > 12000) {
      await reader.cancel();
      const error = new Error('Request too large');
      error.status = 413;
      throw error;
    }
    chunks.push(value);
  }
  const joined = new Uint8Array(total);
  let offset = 0;
  for (const value of chunks) {
    joined.set(value, offset);
    offset += value.length;
  }
  return new TextDecoder().decode(joined);
}
async function saveToGitHub(env, row) {
  if (!/^[\w.-]+\/[\w.-]+$/.test(env.QUEUE_REPOSITORY || ''))
    throw new Error('Private queue not configured');
  const base = `https://api.github.com/repos/${env.QUEUE_REPOSITORY}`;
  const metadata = await fetch(base, { headers: ghHeaders(env.QUEUE_TOKEN) });
  if (!metadata.ok || (await metadata.json()).private !== true)
    throw new Error('Queue must be private');
  const path = `${base}/contents/requests/${row.id}.json`;
  const bytes = new TextEncoder().encode(row.envelope);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  const response = await fetch(path, {
    method: 'PUT',
    headers: ghHeaders(env.QUEUE_TOKEN),
    body: JSON.stringify({
      message: `Save verified profile request ${row.id}`,
      content: btoa(binary),
    }),
  });
  if (!response.ok) {
    // A deterministic path makes retries idempotent; verify the existing bytes.
    const existing = await fetch(path, { headers: ghHeaders(env.QUEUE_TOKEN) });
    if (!existing.ok) throw new Error('Queue write failed');
    const file = await existing.json();
    const decoded = new TextDecoder().decode(
      Uint8Array.from(atob(file.content.replace(/\s/g, '')), (c) => c.charCodeAt(0)),
    );
    if (decoded !== row.envelope) throw new Error('Queue collision');
  }
  if (env.DISPATCH_TOKEN) {
    const dispatch = await fetch(
      'https://api.github.com/repos/yhoriuchi/cosspp-global/actions/workflows/profile-requests.yml/dispatches',
      {
        method: 'POST',
        headers: ghHeaders(env.DISPATCH_TOKEN),
        body: JSON.stringify({ ref: 'main', inputs: { request_id: row.id } }),
      },
    );
    if (!dispatch.ok) throw new Error('Dispatch failed; queued for retry');
  }
  await env.DB.prepare('UPDATE requests SET saved=1 WHERE id=?').bind(row.id).run();
}
export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    const headers = {
      'Access-Control-Allow-Origin': env.SITE_ORIGIN || 'https://yhoriuchi.github.io',
      Vary: 'Origin',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    if (origin !== env.SITE_ORIGIN) return json({ error: 'Origin not allowed' }, 403);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405, headers);
    if (
      env.ENABLED !== 'true' ||
      !env.DB ||
      !env.OTP_SECRET ||
      !env.REQUEST_SIGNING_KEY ||
      !env.RESEND_API_KEY ||
      !env.QUEUE_TOKEN
    )
      return json({ error: 'Profile requests are not enabled yet.' }, 503, headers);
    const now = Math.floor(Date.now() / 1000);
    try {
      if (!request.headers.get('Content-Type')?.startsWith('application/json'))
        return json({ error: 'JSON required' }, 415, headers);
      const raw = await readBody(request);
      const body = JSON.parse(raw);
      const path = new URL(request.url).pathname;
      const ip = await sign(request.headers.get('CF-Connecting-IP') || 'unknown', env.OTP_SECRET);
      if (await limited(env, `ip:${ip}:${Math.floor(now / 900)}`, 30, now))
        return json({ error: 'Please try again later.' }, 429, headers);
      if (path === '/challenge') {
        const email = normalizeEmail(body.email);
        const id = crypto.randomUUID();
        if (!fsuEmail(email) || typeof body.profile_id !== 'string')
          return json({ error: 'Use the FSU email listed for this profile.' }, 400, headers);
        if (await limited(env, `email:${await sign(email, env.OTP_SECRET)}`, 3, now))
          return json({ error: 'Please try again later.' }, 429, headers);
        const source = await fetch(DATA, { headers: { 'Cache-Control': 'no-cache' } });
        if (!source.ok) throw new Error('Source unavailable');
        const person = (await source.json()).find((p) => p.id === body.profile_id);
        if (!person || normalizeEmail(person.email) !== email)
          return json(
            {
              challenge_id: id,
              message: 'If this is the FSU email on this profile, a passcode will be sent.',
            },
            200,
            headers,
          );
        if (await limited(env, `mail-day:${Math.floor(now / 86400)}`, 90, now, 86400))
          return json({ error: 'Daily mail limit reached. Please try tomorrow.' }, 429, headers);
        const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1000000).padStart(
          6,
          '0',
        );
        await env.DB.prepare(
          'INSERT INTO challenges(id,profile_id,email,code_hash,expires_at) VALUES (?,?,?,?,?)',
        )
          .bind(id, person.id, email, await sign(`${id}:${code}`, env.OTP_SECRET), now + 600)
          .run();
        const sent = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: env.FROM_EMAIL,
            to: [email],
            subject: 'COSSPP Global profile request passcode',
            text: `Your passcode is ${code}. It expires in 10 minutes.\n\nThis verifies a change request for ${person.full_name} on the independent COSSPP Global directory. No change is made until you submit step 2. Do not share this code. If you did not request it, ignore this email.`,
          }),
        });
        if (!sent.ok) {
          await env.DB.prepare('DELETE FROM challenges WHERE id=?').bind(id).run();
          throw new Error('Mail unavailable');
        }
        return json(
          {
            challenge_id: id,
            message: 'If this is the FSU email on this profile, a passcode will be sent.',
          },
          200,
          headers,
        );
      }
      if (path === '/requests') {
        if (!uuid.test(body.challenge_id || '') || !/^\d{6}$/.test(body.passcode || ''))
          return json({ error: 'Enter a valid passcode.' }, 400, headers);
        let fields;
        try {
          fields = requestFields(body);
        } catch (error) {
          return json({ error: error.message }, 400, headers);
        }
        // Count every attempt atomically. At most one competing request can claim a code.
        const row = await env.DB.prepare(
          'UPDATE challenges SET attempts=attempts+1 WHERE id=? AND consumed=0 AND expires_at>? AND attempts<5 RETURNING *',
        )
          .bind(body.challenge_id, now)
          .first();
        if (
          !row ||
          !equal(row.code_hash, await sign(`${body.challenge_id}:${body.passcode}`, env.OTP_SECRET))
        )
          return json({ error: 'Passcode invalid or expired. Request a new code.' }, 400, headers);
        const payload = {
          version: 1,
          id: crypto.randomUUID(),
          profile_id: row.profile_id,
          verified_email_sha256: await sha256(row.email),
          verified_at: new Date(now * 1000).toISOString(),
          ...fields,
        };
        const envelope =
          JSON.stringify(
            { payload, signature: await sign(JSON.stringify(payload), env.REQUEST_SIGNING_KEY) },
            null,
            2,
          ) + '\n';
        const results = await env.DB.batch([
          env.DB.prepare(
            'INSERT INTO requests(id,envelope,created_at) SELECT ?,?,? FROM challenges WHERE id=? AND consumed=0',
          ).bind(payload.id, envelope, now, row.id),
          env.DB.prepare('UPDATE challenges SET consumed=1 WHERE id=? AND consumed=0').bind(row.id),
        ]);
        if (!results[0].meta.changes)
          return json({ error: 'Passcode has already been used.' }, 409, headers);
        let saved = false;
        try {
          await saveToGitHub(env, { id: payload.id, envelope });
          saved = true;
        } catch {
          /* Private D1 outbox is retried; never log request text or codes. */
        }
        return json(
          {
            request_id: payload.id,
            saved_to_github: saved,
            message: saved
              ? 'Your verified request has been saved privately on GitHub. General requests are queued; an explicitly supplied research summary can be applied automatically after validation.'
              : 'Your verified request is securely queued for delivery to GitHub. Please do not submit it again.',
          },
          202,
          headers,
        );
      }
      return json({ error: 'Not found' }, 404, headers);
    } catch (error) {
      return json(
        { error: 'The service could not complete this request. Please try again later.' },
        error.status === 413 ? 413 : 503,
        headers,
      );
    }
  },
  async scheduled(_event, env) {
    if (env.ENABLED !== 'true') return;
    const now = Math.floor(Date.now() / 1000);
    await env.DB.batch([
      env.DB.prepare('DELETE FROM challenges WHERE expires_at<?').bind(now - 86400),
      env.DB.prepare('DELETE FROM rate_limits WHERE expires_at<?').bind(now),
      env.DB.prepare('DELETE FROM requests WHERE saved=1 AND created_at<?').bind(now - 604800),
    ]);
    const { results } = await env.DB.prepare(
      'SELECT id,envelope FROM requests WHERE saved=0 ORDER BY created_at LIMIT 20',
    ).all();
    for (const row of results) {
      try {
        await saveToGitHub(env, row);
      } catch {
        /* Keep private outbox for the next retry. */
      }
    }
  },
};
