import { NextResponse } from 'next/server';
import { exec, q } from '@/lib/db';
import { env } from '@/lib/env';
import { sendEmail } from '@/lib/email';

export const runtime = 'edge';

function token(): string {
  const buf = new Uint8Array(16);
  crypto.getRandomValues(buf);
  return Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? '').trim().toLowerCase();
  if (!email || !email.includes('@')) return NextResponse.json({ error: 'invalid email' }, { status: 400 });

  const existing = (await q<any>('SELECT * FROM email_subscribers WHERE email = ?', [email])).results[0];
  let confirmToken: string;
  let unsubToken: string;
  if (existing) {
    confirmToken = existing.confirm_token ?? token();
    unsubToken = existing.unsub_token ?? token();
    if (!existing.confirm_token || !existing.unsub_token) {
      await exec('UPDATE email_subscribers SET confirm_token = ?, unsub_token = ? WHERE email = ?', [confirmToken, unsubToken, email]);
    }
  } else {
    confirmToken = token();
    unsubToken = token();
    await exec(
      'INSERT INTO email_subscribers (email, confirmed, confirm_token, unsub_token, created_at) VALUES (?, ?, ?, ?, ?)',
      [email, 0, confirmToken, unsubToken, Date.now()],
    );
  }
  const appUrl = env().APP_URL ?? 'https://premiumsportsai.pages.dev';
  const link = `${appUrl}/api/email/confirm?t=${confirmToken}`;
  await sendEmail({
    to: email,
    subject: 'Confirm your PremiumSportsAi daily pick',
    html: `<p>Tap to confirm and start receiving 1 free NFL pick a day.</p><p><a href="${link}">Confirm subscription →</a></p><p>If you didn't request this, ignore this email.</p>`,
  });
  return NextResponse.json({ ok: true, confirmed: !!existing?.confirmed });
}
