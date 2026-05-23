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
      const email = (s.customer_email ?? s.metadata?.email ?? '').toLowerCase();
      if (!email) break;

      // Subscription: pro or sharp
      if (s.mode === 'subscription') {
        const plan = (s.metadata?.plan ?? 'pro') as 'pro' | 'sharp';
        const tier = plan === 'sharp' ? 'sharp' : 'pro';
        const periodEnd = Date.now() + 1000 * 60 * 60 * 24 * 31;
        const existing = await q<any>('SELECT * FROM subscriptions WHERE user_email = ?', [email]);
        if (existing.results.length) {
          await exec(
            'UPDATE subscriptions SET active = ?, stripe_id = ?, tier = ?, current_period_end = ? WHERE user_email = ?',
            [1, s.subscription, tier, periodEnd, email],
          );
        } else {
          await exec(
            'INSERT INTO subscriptions (id, user_email, stripe_id, active, tier, current_period_end, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [crypto.randomUUID(), email, s.subscription, 1, tier, periodEnd, Date.now()],
          );
        }
        // Referral fulfilment: if this user was referred, grant both 30d Pro extension
        try {
          const ref = await q<any>('SELECT * FROM referrals WHERE referee_email = ? AND status = ?', [email, 'pending']);
          if (ref.results.length) {
            const r = ref.results[0];
            const extend = 1000 * 60 * 60 * 24 * 30;
            await exec('UPDATE referrals SET status = ?, granted_at = ? WHERE id = ?', ['granted', Date.now(), r.id]);
            // referrer extension
            const rs = await q<any>('SELECT * FROM subscriptions WHERE user_email = ?', [r.referrer_email]);
            if (rs.results.length) {
              const cur = rs.results[0];
              const base = Math.max(Number(cur.current_period_end ?? 0), Date.now());
              await exec(
                'UPDATE subscriptions SET active = ?, tier = COALESCE(tier, ?), current_period_end = ? WHERE user_email = ?',
                [1, 'pro', base + extend, r.referrer_email],
              );
            } else {
              await exec(
                'INSERT INTO subscriptions (id, user_email, stripe_id, active, tier, current_period_end, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [crypto.randomUUID(), r.referrer_email, null, 1, 'pro', Date.now() + extend, Date.now()],
              );
            }
            // referee extra 30d on top of paid sub
            await exec('UPDATE subscriptions SET current_period_end = ? WHERE user_email = ?', [periodEnd + extend, email]);
          }
        } catch { /* non-fatal */ }
      }

      // One-time payments: tips OR pay-per-pick unlock
      if (s.mode === 'payment') {
        const kind = s.metadata?.kind ?? '';
        if (kind === 'pick_unlock') {
          const lockId = s.metadata?.lock_id;
          if (lockId) {
            try {
              await exec(
                'INSERT INTO pick_unlocks (id, user_email, lock_id, stripe_id, created_at) VALUES (?, ?, ?, ?, ?)',
                [crypto.randomUUID(), email, lockId, s.id, Date.now()],
              );
            } catch { /* unique constraint — already unlocked */ }
          }
        } else {
          const cents = Number(s.metadata?.amount_cents ?? s.amount_total ?? 0);
          await exec(
            'INSERT INTO tips (id, user_email, amount_cents, stripe_id, created_at) VALUES (?, ?, ?, ?, ?)',
            [crypto.randomUUID(), email, cents, s.id, Date.now()],
          );
        }
      }
      break;
    }
    case 'customer.subscription.updated': {
      const s = event.data.object as any;
      const periodEnd = s.current_period_end ? Number(s.current_period_end) * 1000 : null;
      const active = s.status === 'active' || s.status === 'trialing' ? 1 : 0;
      await exec(
        'UPDATE subscriptions SET active = ?, current_period_end = ? WHERE stripe_id = ?',
        [active, periodEnd, s.id],
      );
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
