// Web-push helper for Cloudflare Workers — pure Web Crypto.
// Implements VAPID (RFC 8292) + aes128gcm payload encryption (RFC 8291).
// Sends real personalized JSON payloads to push_subscriptions endpoints.

import { env } from './env';

// ---------- base64url helpers ----------
function b64urlToBytes(b64url: string): Uint8Array {
  const pad = '='.repeat((4 - (b64url.length % 4)) % 4);
  const b64 = (b64url + pad).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}
function bytesToB64url(b: ArrayBuffer | Uint8Array): string {
  const u = b instanceof Uint8Array ? b : new Uint8Array(b);
  let s = '';
  for (let i = 0; i < u.byteLength; i++) s += String.fromCharCode(u[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function concat(...parts: Uint8Array[]): Uint8Array {
  const len = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(len);
  let off = 0;
  for (const p of parts) { out.set(p, off); off += p.length; }
  return out;
}

// ---------- VAPID JWT ----------
async function importVapidPrivateKey(privKeyEnv: string): Promise<CryptoKey> {
  // We support two shapes:
  //   1. Full JWK JSON string (preferred, has x/y/d) — generated via /api/push/admin/gen
  //   2. Raw base64url 32-byte `d` — only works for verifying tokens, not enough for ECDSA on its own
  try {
    const jwk = JSON.parse(privKeyEnv);
    if (jwk.kty === 'EC' && jwk.d) {
      return crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
    }
  } catch { /* fallthrough */ }
  throw new Error('VAPID_PRIVATE_KEY must be a JWK JSON string. Generate via /api/push/admin/gen?key=$SESSION_SECRET.');
}

async function vapidJwt(audience: string): Promise<string> {
  const e = env();
  const sub = e.VAPID_SUBJECT || 'mailto:agent@premiumsportsai.com';
  const header = { typ: 'JWT', alg: 'ES256' };
  const body = { aud: audience, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub };
  const enc = (o: any) => bytesToB64url(new TextEncoder().encode(JSON.stringify(o)));
  const signingInput = `${enc(header)}.${enc(body)}`;
  const key = await importVapidPrivateKey(e.VAPID_PRIVATE_KEY!);
  // ECDSA sign returns DER on some platforms — Web Crypto returns raw IEEE-P1363 r||s (64 bytes), which is what JWS ES256 wants.
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(signingInput));
  return `${signingInput}.${bytesToB64url(sig)}`;
}

// ---------- aes128gcm payload encryption (RFC 8291) ----------
// HKDF-extract then HKDF-expand using SubtleCrypto.
async function hkdfExtractExpand(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt, info },
    key,
    length * 8,
  );
  return new Uint8Array(bits);
}

// Encode a P-256 public key (raw 65-byte uncompressed) as a CryptoKey for ECDH
async function importPeerPublic(p256dhRaw: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    p256dhRaw,
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    [],
  );
}

// Generate an ephemeral ECDH P-256 keypair
async function genEphemeralEcdh(): Promise<{ pub: Uint8Array; key: CryptoKeyPair }> {
  const pair = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const raw = new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey));
  return { pub: raw, key: pair };
}

// RFC 8188 aes128gcm content-encoding header:
// salt (16) || rs (4, big-endian, 4096) || idlen (1, length of keyid) || keyid (idlen bytes)
function buildEncodingHeader(salt: Uint8Array, recordSize: number, keyid: Uint8Array): Uint8Array {
  const header = new Uint8Array(16 + 4 + 1 + keyid.length);
  header.set(salt, 0);
  const dv = new DataView(header.buffer);
  dv.setUint32(16, recordSize, false);
  header[20] = keyid.length;
  header.set(keyid, 21);
  return header;
}

export async function encryptPayload(
  payload: Uint8Array,
  recipientP256dhRaw: Uint8Array,
  recipientAuthSecret: Uint8Array,
): Promise<Uint8Array> {
  // 1. Ephemeral keypair
  const eph = await genEphemeralEcdh();

  // 2. ECDH shared secret
  const peer = await importPeerPublic(recipientP256dhRaw);
  const sharedBits = await crypto.subtle.deriveBits({ name: 'ECDH', public: peer }, eph.key.privateKey, 256);
  const ecdh = new Uint8Array(sharedBits);

  // 3. salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // 4. PRK_key = HKDF(auth, ECDH, "WebPush: info\0" || ua_public || as_public, 32)
  const keyInfo = concat(
    new TextEncoder().encode('WebPush: info\0'),
    recipientP256dhRaw,
    eph.pub,
  );
  const ikm = await hkdfExtractExpand(recipientAuthSecret, ecdh, keyInfo, 32);

  // 5. CEK and NONCE come from a second HKDF using the salt
  const cek = await hkdfExtractExpand(salt, ikm, new TextEncoder().encode('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdfExtractExpand(salt, ikm, new TextEncoder().encode('Content-Encoding: nonce\0'), 12);

  // 6. AES-GCM encrypt: plaintext || 0x02 (final-record padding delimiter)
  const cekKey = await crypto.subtle.importKey('raw', cek, { name: 'AES-GCM' }, false, ['encrypt']);
  const plaintext = concat(payload, new Uint8Array([0x02]));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, cekKey, plaintext));

  // 7. Prepend RFC 8188 header (salt, rs, idlen, keyid=ephemeral public)
  const header = buildEncodingHeader(salt, 4096, eph.pub);
  return concat(header, ct);
}

// ---------- Public API ----------
export type PushSub = { endpoint: string; p256dh: string; auth: string };
export type PushPayload = { title: string; body: string; url?: string; tag?: string };

export async function sendPush(sub: PushSub, payload: PushPayload): Promise<{ ok: boolean; status?: number; reason?: string }> {
  const e = env();
  if (!e.VAPID_PUBLIC_KEY || !e.VAPID_PRIVATE_KEY) return { ok: false, reason: 'no-vapid' };

  const url = new URL(sub.endpoint);
  const audience = `${url.protocol}//${url.host}`;

  let jwt: string;
  try {
    jwt = await vapidJwt(audience);
  } catch (err: any) {
    return { ok: false, reason: `vapid-error: ${err.message}` };
  }

  // Encrypt JSON payload
  const json = JSON.stringify(payload);
  const p256dh = b64urlToBytes(sub.p256dh);
  const auth = b64urlToBytes(sub.auth);

  let body: Uint8Array;
  try {
    body = await encryptPayload(new TextEncoder().encode(json), p256dh, auth);
  } catch (err: any) {
    return { ok: false, reason: `encrypt-error: ${err.message}` };
  }

  const headers: Record<string, string> = {
    'TTL': '3600',
    'Content-Type': 'application/octet-stream',
    'Content-Encoding': 'aes128gcm',
    'Content-Length': String(body.byteLength),
    'Authorization': `vapid t=${jwt}, k=${e.VAPID_PUBLIC_KEY}`,
    'Urgency': 'normal',
  };

  const res = await fetch(sub.endpoint, { method: 'POST', headers, body });
  return { ok: res.ok, status: res.status, reason: res.ok ? undefined : await res.text().catch(() => undefined) };
}

// Convenience: send to every push_subscription row for an email.
import { exec, q } from './db';
export async function sendPushToUser(email: string, payload: PushPayload): Promise<{ sent: number; failed: number }> {
  const subs = (await q<any>('SELECT * FROM push_subscriptions WHERE user_email = ?', [email])).results;
  let sent = 0, failed = 0;
  for (const s of subs) {
    const r = await sendPush({ endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth }, payload);
    if (r.ok) sent++; else failed++;
    try {
      await exec(
        'INSERT INTO push_log (id, user_email, endpoint_hash, title, status, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [crypto.randomUUID(), email, (s.endpoint || '').slice(-24), payload.title, r.status ?? 0, Date.now()],
      );
    } catch { /* table may not exist before migration */ }
    // If endpoint is 404/410 GONE, prune it
    if (r.status === 404 || r.status === 410) {
      try { await exec('DELETE FROM push_subscriptions WHERE id = ?', [s.id]); } catch {}
    }
  }
  return { sent, failed };
}
