// Minimal cookie-based identity. The user enters an email on /account
// and gets a signed cookie. Email magic-link delivery is a follow-up
// (Resend wired in lib/email.ts) but the agent and tip-tracking work
// today via the signed cookie. No skeleton — every button does something.

import { cookies } from 'next/headers';
import { env } from './env';

const COOKIE = 'psa_session';

async function hmac(secret: string, msg: string): Promise<string> {
  const enc = new TextEncoder();
  const k = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', k, enc.encode(msg));
  return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g, '');
}

export async function signEmail(email: string): Promise<string> {
  const secret = env().SESSION_SECRET ?? 'dev-secret-do-not-use-in-prod';
  const sig = await hmac(secret, email);
  return btoa(email).replace(/=/g, '') + '.' + sig;
}

export async function readEmail(): Promise<string | null> {
  const c = cookies().get(COOKIE)?.value;
  if (!c) return null;
  const [b64, sig] = c.split('.');
  if (!b64 || !sig) return null;
  try {
    const email = atob(b64.replace(/-/g, '+').replace(/_/g, '/') + '==');
    const expect = await hmac(env().SESSION_SECRET ?? 'dev-secret-do-not-use-in-prod', email);
    if (expect !== sig) return null;
    return email;
  } catch { return null; }
}

export async function setSessionCookie(email: string) {
  const token = await signEmail(email);
  cookies().set(COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: true, path: '/', maxAge: 60 * 60 * 24 * 90 });
}

export function clearSessionCookie() {
  cookies().delete(COOKIE);
}
