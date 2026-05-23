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
  ODDS_API_KEY?: string;
  SPORTSDATAIO_KEY?: string;
  RESEND_API_KEY?: string;
  APP_URL?: string;
  SESSION_SECRET?: string;
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
