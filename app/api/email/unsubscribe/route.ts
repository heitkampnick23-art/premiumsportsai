import { NextResponse } from 'next/server';
import { exec, q } from '@/lib/db';
import { env } from '@/lib/env';

export const runtime = 'edge';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const t = url.searchParams.get('t') ?? '';
  const appUrl = env().APP_URL ?? 'https://premiumsportsai.pages.dev';
  if (!t) return NextResponse.redirect(`${appUrl}/?unsub=invalid`, 302);
  const row = (await q<any>('SELECT * FROM email_subscribers WHERE unsub_token = ?', [t])).results[0];
  if (!row) return NextResponse.redirect(`${appUrl}/?unsub=invalid`, 302);
  await exec('UPDATE email_subscribers SET confirmed = ? WHERE email = ?', [0, row.email]);
  return NextResponse.redirect(`${appUrl}/?unsub=ok`, 302);
}
