import { NextResponse } from 'next/server';
import { setSessionCookie } from '@/lib/auth';
import { exec, q } from '@/lib/db';

export const runtime = 'edge';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? '').trim().toLowerCase();
  if (!email || !email.includes('@')) return NextResponse.json({ error: 'invalid email' }, { status: 400 });
  const existing = await q<any>('SELECT * FROM users WHERE email = ?', [email]);
  if (existing.results.length === 0) {
    await exec('INSERT INTO users (id, email, created_at) VALUES (?, ?, ?)', [crypto.randomUUID(), email, Date.now()]);
  }
  await setSessionCookie(email);
  return NextResponse.json({ ok: true });
}
