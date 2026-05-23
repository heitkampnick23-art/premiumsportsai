import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { env } from '@/lib/env';
import { exec, q } from '@/lib/db';

export const runtime = 'edge';

export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature');
  const secret = env().STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) return NextResponse.json({ error: 'webhook not configured' }, { status: 400 });
  const raw = await req.text();
  let event;
  try {
    event = await stripe().webhooks.constructEventAsync(raw, sig, secret);
  } catch (e: any) {
    return NextResponse.json({ error: `bad signature: ${e.message}` }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const s = event.data.object as any;
      const email = s.customer_email ?? s.metadata?.email;
      if (s.mode === 'subscription' && email) {
        const existing = await q<any>('SELECT * FROM subscriptions WHERE user_email = ?', [email]);
        if (existing.results.length) {
          await exec('UPDATE subscriptions SET active = ?, stripe_id = ? WHERE user_email = ?', [1, s.subscription, email]);
        } else {
          await exec('INSERT INTO subscriptions (id, user_email, stripe_id, active, created_at) VALUES (?, ?, ?, ?, ?)',
            [crypto.randomUUID(), email, s.subscription, 1, Date.now()]);
        }
      }
      if (s.mode === 'payment' && email) {
        const cents = Number(s.metadata?.amount_cents ?? s.amount_total ?? 0);
        await exec('INSERT INTO tips (id, user_email, amount_cents, stripe_id, created_at) VALUES (?, ?, ?, ?, ?)',
          [crypto.randomUUID(), email, cents, s.id, Date.now()]);
      }
      break;
    }
    case 'customer.subscription.deleted': {
      const s = event.data.object as any;
      await exec('UPDATE subscriptions SET active = ? WHERE stripe_id = ?', [0, s.id]);
      break;
    }
  }
  return NextResponse.json({ received: true });
}
