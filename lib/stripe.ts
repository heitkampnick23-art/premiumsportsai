import Stripe from 'stripe';
import { env } from './env';

export function stripe(): Stripe {
  const key = env().STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY missing. Set it in Cloudflare Pages env vars (LIVE mode key starting with sk_live_). See SETUP.md.');
  }
  if (!key.startsWith('sk_live_') && !key.startsWith('sk_test_')) {
    throw new Error('STRIPE_SECRET_KEY does not look valid.');
  }
  return new Stripe(key, { apiVersion: '2024-09-30.acacia' as any, httpClient: Stripe.createFetchHttpClient() });
}
