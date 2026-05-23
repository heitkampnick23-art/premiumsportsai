import { NextResponse } from 'next/server';
import { readEmail } from '@/lib/auth';
import { getOrCreateReferralCode, referralStats } from '@/lib/referral';
import { env } from '@/lib/env';

export const runtime = 'edge';

export async function GET() {
  const email = await readEmail();
  if (!email) return NextResponse.json({ error: 'sign in first' }, { status: 401 });
  const code = await getOrCreateReferralCode(email);
  const stats = await referralStats(email);
  const appUrl = env().APP_URL ?? 'https://premiumsportsai.pages.dev';
  return NextResponse.json({ code, url: `${appUrl}/r/${code}`, stats });
}
