import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { readEmail } from '@/lib/auth';
import { env } from '@/lib/env';

export const runtime = 'edge';

export async function POST(req: Request) {
  const email = await readEmail();
  if (!email) return NextResponse.json({ error: 'sign in first' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const amount = Math.max(1, Math.min(500, Number(body.amount ?? 5)));
  const appUrl = env().APP_URL ?? 'https://premiumsportsai.pages.dev';
  try {
    const session = await stripe().checkout.sessions.create({
      mode: 'payment',
      customer_email: email,
      line_items: [{
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: amount * 100,
          product_data: { name: 'PremiumSportsAi tip' },
        },
      }],
      success_url: `${appUrl}/success?type=tip`,
      cancel_url: `${appUrl}/account`,
      metadata: { email, kind: 'tip', amount_cents: String(amount * 100) },
    });
    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
