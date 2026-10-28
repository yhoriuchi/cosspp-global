export const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
export const fsuEmail = (value) =>
  typeof value === 'string' && /^[^\s@]+@(?:[a-z0-9-]+\.)*fsu\.edu$/i.test(value);
export const normalizeEmail = (value) =>
  String(value || '')
    .trim()
    .toLowerCase();
export async function sha256(text) {
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)))]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
export async function sign(text, secret) {
  if (!secret || secret.length < 32) throw new Error('Signing key is not configured');
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return [...new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(text)))]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
export function equal(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}
export function requestFields(body) {
  const text = typeof body.request_text === 'string' ? body.request_text.trim() : '';
  if (text.length < 10 || text.length > 4000)
    throw new Error('Describe the requested change in 10–4,000 characters.');
  const biography =
    typeof body.proposed_biography === 'string' ? body.proposed_biography.trim() : '';
  if (
    biography &&
    (biography.length < 20 || biography.length > 1200 || body.publish_biography !== true)
  )
    throw new Error('Confirm publication of a research summary of 20–1,200 characters.');
  return { request_text: text, proposed_changes: biography ? { short_biography: biography } : {} };
}
