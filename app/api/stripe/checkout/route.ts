import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { readEmail } from '@/lib/auth';
import { env } from '@/lib/env';

export const runtime = 'edge';

export async function POST() {
  const email = await readEmail();
  if (!email) return NextResponse.json({ error: 'sign in first' }, { status: 401 });
  const price = env().STRIPE_PRICE_PREMIUM;
  if (!price) return NextResponse.json({ error: 'STRIPE_PRICE_PREMIUM not set' }, { status: 500 });
  const appUrl = env().APP_URL ?? 'https://premiumsportsai.pages.dev';
  try {
    const session = await stripe().checkout.sessions.create({
      mode: 'subscription',
      customer_email: email,
      line_items: [{ price, quantity: 1 }],
      success_url: `${appUrl}/success?type=sub`,
      cancel_url: `${appUrl}/account`,
      allow_promotion_codes: true,
      metadata: { email, kind: 'premium_monthly' },
    });
    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
