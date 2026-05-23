import { q } from './db';
import { readEmail } from './auth';

export type Tier = 'free' | 'pro' | 'sharp';

export async function getTier(email: string | null | undefined): Promise<Tier> {
  if (!email) return 'free';
  const r = await q<any>('SELECT * FROM subscriptions WHERE user_email = ?', [email]);
  const sub = r.results[0];
  if (!sub || !sub.active) return 'free';
  // current_period_end is unix-ms; if past, treat as free
  if (sub.current_period_end && Number(sub.current_period_end) < Date.now()) return 'free';
  if (sub.tier === 'sharp') return 'sharp';
  return 'pro';
}

export async function getMyTier(): Promise<Tier> {
  const email = await readEmail();
  return getTier(email);
}

export function tierAtLeast(t: Tier, min: Tier): boolean {
  const rank = { free: 0, pro: 1, sharp: 2 };
  return rank[t] >= rank[min];
}

export function tierLabel(t: Tier): string {
  return t === 'sharp' ? 'Sharp' : t === 'pro' ? 'Pro' : 'Free';
}
