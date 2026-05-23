import { NextResponse } from 'next/server';
import { env } from '@/lib/env';

export const runtime = 'edge';

// Helper: generates a VAPID keypair you can paste into Cloudflare Pages env vars.
// Protected by SESSION_SECRET to avoid being a public open key generator.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const expected = env().SESSION_SECRET;
  if (expected && url.searchParams.get('key') !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const pubJwk = await crypto.subtle.exportKey('jwk', pair.publicKey);
  const privJwk = await crypto.subtle.exportKey('jwk', pair.privateKey);
  const pubRaw = await crypto.subtle.exportKey('raw', pair.publicKey);
  const pubB64 = btoa(String.fromCharCode(...new Uint8Array(pubRaw))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return NextResponse.json({
    VAPID_PUBLIC_KEY: pubB64,
    VAPID_PRIVATE_KEY: JSON.stringify(privJwk),
    note: 'Save these as Cloudflare Pages env vars. VAPID_PRIVATE_KEY is the full JWK JSON string.',
    pubJwk,
  });
}
