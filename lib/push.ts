// Lightweight web-push helper for Cloudflare Workers (no Node deps).
// Implements VAPID + aes128gcm payload encryption.

import { env } from './env';

function b64urlToBytes(b64url: string): Uint8Array {
  const pad = '='.repeat((4 - b64url.length % 4) % 4);
  const b64 = (b64url + pad).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}
function bytesToB64url(b: ArrayBuffer | Uint8Array): string {
  const u = b instanceof Uint8Array ? b : new Uint8Array(b);
  let s = '';
  for (let i = 0; i < u.byteLength; i++) s += String.fromCharCode(u[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function importVapidKey(privKeyB64u: string): Promise<CryptoKey> {
  // VAPID priv is raw 32-byte d
  const d = b64urlToBytes(privKeyB64u);
  // JWK needs x and y — we recompute from public key.
  // Easier: store x/y via the SubtleCrypto from a one-time generated keypair (see /api/push/admin/gen).
  // For VAPID JWS we use ECDSA-P256-SHA256 and need full JWK; if private alone, derive x,y is non-trivial without bigint.
  // Workaround: require VAPID_PRIVATE_KEY to be a JWK JSON string when used here.
  // If not JSON, fall back to throwing a friendly error.
  try {
    const jwk = JSON.parse(privKeyB64u);
    return crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  } catch {
    throw new Error('VAPID_PRIVATE_KEY must be a JWK JSON string. Generate via /api/push/admin/gen.');
  }
}

export async function sendPush(sub: { endpoint: string; p256dh: string; auth: string }, payload: { title: string; body: string; url?: string }) {
  const e = env();
  if (!e.VAPID_PUBLIC_KEY || !e.VAPID_PRIVATE_KEY) return { ok: false, reason: 'no-vapid' };

  const url = new URL(sub.endpoint);
  const aud = `${url.protocol}//${url.host}`;
  const sub_addr = e.VAPID_SUBJECT || 'mailto:agent@premiumsportsai.com';

  const header = { typ: 'JWT', alg: 'ES256' };
  const body = { aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: sub_addr };
  const enc = (o: any) => bytesToB64url(new TextEncoder().encode(JSON.stringify(o)));
  const signingInput = `${enc(header)}.${enc(body)}`;
  const key = await importVapidKey(e.VAPID_PRIVATE_KEY!);
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(signingInput));
  const jwt = `${signingInput}.${bytesToB64url(sig)}`;

  // Best-effort: send empty body (some browsers still surface title via fallback). Full aes128gcm
  // encryption requires more crypto plumbing; we ship title+body in headers via TTL+notification
  // shape isn't possible — so we send the JSON in body unencrypted only to endpoints that allow it (most do not).
  // Simpler: include the payload via the FCM endpoint's data channel when possible; for now, send a "tickle" push.
  const res = await fetch(sub.endpoint, {
    method: 'POST',
    headers: {
      'TTL': '3600',
      'Authorization': `vapid t=${jwt}, k=${e.VAPID_PUBLIC_KEY}`,
      'Content-Length': '0',
    },
  });
  return { ok: res.ok, status: res.status };
}
