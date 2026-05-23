import { NextResponse } from 'next/server';
import { exec, q } from '@/lib/db';
import { env } from '@/lib/env';

export const runtime = 'edge';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const t = url.searchParams.get('t') ?? '';
  if (!t) return NextResponse.json({ error: 'missing token' }, { status: 400 });
  const row = (await q<any>('SELECT * FROM email_subscribers WHERE confirm_token = ?', [t])).results[0];
  const appUrl = env().APP_URL ?? 'https://premiumsportsai.pages.dev';
  if (!row) return NextResponse.redirect(`${appUrl}/?confirm=invalid`, 302);
  await exec('UPDATE email_subscribers SET confirmed = ?, confirmed_at = ? WHERE email = ?', [1, Date.now(), row.email]);
  return NextResponse.redirect(`${appUrl}/?confirm=ok`, 302);
}
