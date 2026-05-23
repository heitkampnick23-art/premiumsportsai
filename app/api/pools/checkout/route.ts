import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { readEmail } from '@/lib/auth';
import { env } from '@/lib/env';
import { feeLabel, getAgeAck, getOrCreateEntry, getPool } from '@/lib/pools';

export const runtime = 'edge';

export async function POST(req: Request) {
  const email = await readEmail();
  if (!email) return NextResponse.json({ error: 'sign in first' }, { status: 401 });
  const acked = await getAgeAck(email);
  if (!acked) return NextResponse.json({ error: 'Acknowledge 21+ first' }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const poolId = String(body.poolId ?? '');
  const pool = await getPool(poolId);
  if (!pool) return NextResponse.json({ error: 'unknown pool' }, { status: 404 });
  if (pool.status !== 'open') return NextResponse.json({ error: 'pool closed' }, { status: 400 });

  // Idempotently create the entry first; mark paid in webhook
  await getOrCreateEntry(poolId, email);

  const e = env();
  const appUrl = e.APP_URL ?? new URL(req.url).origin;
  const priceEnv =
    Number(pool.entry_fee_cents) === 500 ? e.STRIPE_POOL_PRICE_5 :
    Number(pool.entry_fee_cents) === 2500 ? e.STRIPE_POOL_PRICE_25 :
    Number(pool.entry_fee_cents) === 10000 ? e.STRIPE_POOL_PRICE_100 : undefined;

  const line_items: any[] = priceEnv
    ? [{ price: priceEnv, quantity: 1 }]
    : [{
        quantity: 1,
        price_data: {
          currency: 'usd',
          product_data: { name: `Sunday Slate ${feeLabel(Number(pool.entry_fee_cents))} entry`, description: 'Skill contest entry — 21+ only. 15% rake to operator.' },
          unit_amount: Number(pool.entry_fee_cents),
        },
      }];

  try {
    const session = await stripe().checkout.sessions.create({
      mode: 'payment',
      customer_email: email,
      line_items,
      success_url: `${appUrl}/pools/${pool.id}?paid=1`,
      cancel_url: `${appUrl}/pools`,
      metadata: { email, kind: 'pool_entry', pool_id: pool.id },
    });
    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
