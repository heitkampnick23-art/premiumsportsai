import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { readEmail } from '@/lib/auth';
import { env } from '@/lib/env';

export const runtime = 'edge';

export async function POST(req: Request) {
  const email = await readEmail();
  if (!email) return NextResponse.json({ error: 'sign in first' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const plan = (body.plan ?? 'pro') as 'pro' | 'sharp';
  const e = env();
  const priceId =
    plan === 'sharp' ? e.STRIPE_PRICE_SHARP :
    (e.STRIPE_PRICE_PRO ?? e.STRIPE_PRICE_PREMIUM);
  if (!priceId) {
    return NextResponse.json({
      error: plan === 'sharp'
        ? 'STRIPE_PRICE_SHARP not set in Cloudflare Pages env vars.'
        : 'STRIPE_PRICE_PRO (or STRIPE_PRICE_PREMIUM) not set in Cloudflare Pages env vars.',
    }, { status: 500 });
  }
  const appUrl = e.APP_URL ?? 'https://premiumsportsai.pages.dev';
  try {
    const session = await stripe().checkout.sessions.create({
      mode: 'subscription',
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/success?type=sub&plan=${plan}`,
      cancel_url: `${appUrl}/pricing`,
      allow_promotion_codes: true,
      metadata: { email, kind: `subscription_${plan}`, plan },
    });
    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
