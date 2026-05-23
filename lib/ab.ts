// Cookie-bucket A/B test harness for pricing experiment.
import { cookies } from 'next/headers';
import { exec, q } from './db';

const COOKIE = 'psa_ab';
export type Variant = 'A' | 'B';

export function getOrAssignBucket(): { bucketId: string; variant: Variant } {
  const jar = cookies();
  const ex = jar.get(COOKIE)?.value;
  if (ex) {
    const [bucketId, variant] = ex.split('.');
    if (bucketId && (variant === 'A' || variant === 'B')) return { bucketId, variant };
  }
  const bucketId = crypto.randomUUID();
  const variant: Variant = Math.random() < 0.5 ? 'A' : 'B';
  jar.set(COOKIE, `${bucketId}.${variant}`, {
    httpOnly: false, sameSite: 'lax', secure: true, path: '/', maxAge: 60 * 60 * 24 * 90,
  });
  return { bucketId, variant };
}

export function readBucket(): { bucketId: string; variant: Variant } | null {
  const ex = cookies().get(COOKIE)?.value;
  if (!ex) return null;
  const [bucketId, variant] = ex.split('.');
  if (!bucketId || (variant !== 'A' && variant !== 'B')) return null;
  return { bucketId, variant: variant as Variant };
}

export async function logAbEvent(event: 'view' | 'checkout_start' | 'checkout_complete', email?: string, meta?: any) {
  const b = readBucket();
  if (!b) return;
  await exec(
    'INSERT INTO ab_events (id, bucket_id, variant, event, user_email, meta, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [crypto.randomUUID(), b.bucketId, b.variant, event, email ?? null, meta ? JSON.stringify(meta) : null, Date.now()],
  );
}

export type AbSummary = {
  variant: Variant;
  views: number;
  starts: number;
  completes: number;
  startRate: number;
  completeRate: number;
};

export async function summarize(): Promise<AbSummary[]> {
  const out: AbSummary[] = [];
  for (const v of ['A', 'B'] as Variant[]) {
    const get = async (e: string) => Number((await q<any>(
      'SELECT COUNT(DISTINCT bucket_id) as n FROM ab_events WHERE variant = ? AND event = ?',
      [v, e],
    )).results[0]?.n ?? 0);
    const views = await get('view');
    const starts = await get('checkout_start');
    const completes = await get('checkout_complete');
    out.push({
      variant: v,
      views, starts, completes,
      startRate: views ? starts / views : 0,
      completeRate: views ? completes / views : 0,
    });
  }
  return out;
}
