// Edge-safe env access. On Cloudflare Pages, env vars come from
// process.env (build-time) AND from getRequestContext().env at runtime.
// We expose a single env() helper that reads from both.

import { getRequestContext } from '@cloudflare/next-on-pages';

export type AppBindings = {
  DB?: D1Database;
  CACHE?: KVNamespace;
  AVATARS?: R2Bucket;
  ANTHROPIC_API_KEY?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_PRICE_PREMIUM?: string;
  STRIPE_PRICE_PRO?: string;
  STRIPE_PRICE_SHARP?: string;
  STRIPE_PRICE_PICK_UNLOCK?: string;
  ODDS_API_KEY?: string;
  SPORTSDATAIO_KEY?: string;
  RESEND_API_KEY?: string;
  RESEND_FROM?: string;
  APP_URL?: string;
  SESSION_SECRET?: string;
  AFFILIATE_DK_URL?: string;
  AFFILIATE_FD_URL?: string;
  AFFILIATE_BETMGM_URL?: string;
  AFFILIATE_CAESARS_URL?: string;
  VAPID_PUBLIC_KEY?: string;
  VAPID_PRIVATE_KEY?: string;
  VAPID_SUBJECT?: string;
  CRON_SECRET?: string;
  STRIPE_POOL_PRICE_5?: string;
  STRIPE_POOL_PRICE_25?: string;
  STRIPE_POOL_PRICE_100?: string;
  STRIPE_PRICE_ANNUAL?: string;
};

export function env(): AppBindings {
  try {
    const ctx = getRequestContext();
    return { ...(process.env as any), ...(ctx?.env as any) };
  } catch {
    return { ...(process.env as any) } as AppBindings;
  }
}

export function need<K extends keyof AppBindings>(k: K): NonNullable<AppBindings[K]> {
  const v = env()[k];
  if (!v) throw new Error(`Missing required env var: ${String(k)}. See SETUP.md.`);
  return v as NonNullable<AppBindings[K]>;
}

export function has<K extends keyof AppBindings>(k: K): boolean {
  return Boolean(env()[k]);
}
