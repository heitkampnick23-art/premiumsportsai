import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { setSessionCookie } from '@/lib/auth';
import { exec, q } from '@/lib/db';
import { attachReferral, referrerEmailForCode } from '@/lib/referral';
import { recordDailyLogin } from '@/lib/streaks';
import { enqueueWelcomeDrip, recordActivity } from '@/lib/drip';
import { evaluateBadges } from '@/lib/badges';

export const runtime = 'edge';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? '').trim().toLowerCase();
  if (!email || !email.includes('@')) return NextResponse.json({ error: 'invalid email' }, { status: 400 });
  const existing = await q<any>('SELECT * FROM users WHERE email = ?', [email]);
  const isNew = existing.results.length === 0;
  if (isNew) {
    await exec('INSERT INTO users (id, email, created_at) VALUES (?, ?, ?)', [crypto.randomUUID(), email, Date.now()]);
  }
  await setSessionCookie(email);

  // Consume referral cookie (only for brand-new accounts)
  if (isNew) {
    const code = cookies().get('psa_ref')?.value;
    if (code) {
      const referrer = await referrerEmailForCode(code);
      if (referrer && referrer !== email) await attachReferral(email, referrer);
      cookies().delete('psa_ref');
    }
  }
  try { await recordDailyLogin(email); } catch { /* non-fatal */ }
  try { await recordActivity(email); } catch {}
  if (isNew) { try { await enqueueWelcomeDrip(email); } catch {} }
  try { await evaluateBadges(email); } catch {}
  return NextResponse.json({ ok: true });
}
