import { NextResponse } from 'next/server';
import { readEmail } from '@/lib/auth';
import { setAgeAck } from '@/lib/pools';
import { env } from '@/lib/env';

export const runtime = 'edge';

export async function POST(req: Request) {
  const email = await readEmail();
  const appUrl = env().APP_URL ?? new URL(req.url).origin;
  if (!email) return NextResponse.redirect(`${appUrl}/account`, 303);
  await setAgeAck(email);
  return NextResponse.redirect(`${appUrl}/pools`, 303);
}
