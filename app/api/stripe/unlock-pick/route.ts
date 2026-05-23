import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { readEmail } from '@/lib/auth';
import { env } from '@/lib/env';
import { q } from '@/lib/db';

export const runtime = 'edge';

export async function POST(req: Request) {
  const email = await readEmail();
  if (!email) return NextResponse.json({ error: 'sign in first' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const lockId = String(body.lock_id ?? '');
  if (!lockId) return NextResponse.json({ error: 'lock_id required' }, { status: 400 });
  const lock = (await q<any>('SELECT * FROM daily_locks WHERE id = ?', [lockId])).results[0];
  if (!lock) return NextResponse.json({ error: 'lock not found' }, { status: 404 });
  const e = env();
  const appUrl = e.APP_URL ?? 'https://premiumsportsai.pages.dev';
  try {
    const session = await stripe().checkout.sessions.create({
      mode: 'payment',
      customer_email: email,
      line_items: e.STRIPE_PRICE_PICK_UNLOCK
        ? [{ price: e.STRIPE_PRICE_PICK_UNLOCK, quantity: 1 }]
        : [{
            quantity: 1,
            price_data: {
              currency: 'usd',
              unit_amount: 299,
              product_data: {
                name: `Lock #${lock.slot}: ${lock.matchup}`,
                description: `${lock.market.toUpperCase()} · ${lock.confidence}% confidence`,
              },
            },
          }],
      success_url: `${appUrl}/locks?unlocked=${lockId}`,
      cancel_url: `${appUrl}/locks`,
      metadata: { email, kind: 'pick_unlock', lock_id: lockId },
    });
    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
