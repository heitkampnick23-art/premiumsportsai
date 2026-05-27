// Cookie-bucket A/B test harness for pricing experiment.
// NOTE: Next.js 15 forbids cookies().set() in RSC render.
// getOrAssignBucket() is READ-ONLY on the server; new buckets are persisted
// client-side by <AbBucketInit> in components/AbBucketInit.tsx.
import { cookies } from 'next/headers';
import { exec, q } from './db';

export const COOKIE = 'psa_ab';
export type Variant = 'A' | 'B';

export function getOrAssignBucket(): { bucketId: string; variant: Variant; isNew: boolean } {
  try {
    // In Next.js 15, cookies() may be async; cast to any to safely call .get()
    // without triggering a type error on the Promise branch.
    const jar = cookies() as any;
    const ex: string | undefined =
      typeof jar.get === 'function' ? jar.get(COOKIE)?.value : undefined;
    if (ex) {
      const [bucketId, variant] = ex.split('.');
      if (bucketId && (variant === 'A' || variant === 'B'))
        return { bucketId, variant: variant as Variant, isNew: false };
    }
  } catch {}
  // New visitor — generate bucket but do NOT write cookie here (RSC read-only).
  // <AbBucketInit> will persist it via document.cookie on the client.
  const bucketId = crypto.randomUUID();
  const variant: Variant = Math.random() < 0.5 ? 'A' : 'B';
  return { bucketId, variant, isNew: true };
}

export function readBucket(): { bucketId: string; variant: Variant } | null {
  try {
    const jar = cookies() as any;
    const ex: string | undefined =
      typeof jar.get === 'function' ? jar.get(COOKIE)?.value : undefined;
    if (!ex) return null;
    const [bucketId, variant] = ex.split('.');
    if (!bucketId || (variant !== 'A' && variant !== 'B')) return null;
    return { bucketId, variant: variant as Variant };
  } catch { return null; }
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
