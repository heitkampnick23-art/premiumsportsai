import { exec, q } from './db';

export type PoolFee = 500 | 2500 | 10000;
export type Pool = {
  id: string;
  week_start: string;
  name: string;
  entry_fee_cents: PoolFee;
  rake_bps: number;
  status: 'open' | 'locked' | 'settled';
  prize_pool_cents: number;
  winner_email: string | null;
  settled_at: number | null;
  created_at: number;
};

const FEE_LABEL: Record<number, string> = { 500: '$5', 2500: '$25', 10000: '$100' };
export function feeLabel(c: number): string { return FEE_LABEL[c] ?? `$${(c / 100).toFixed(0)}`; }

export function nextSundayKey(d = new Date()): string {
  const day = d.getUTCDay();
  const offset = (7 - day) % 7;
  const sun = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + offset));
  return sun.toISOString().slice(0, 10);
}

export async function listOpenPools(): Promise<Pool[]> {
  const week = nextSundayKey();
  const r = await q<Pool>('SELECT * FROM pools WHERE status = ? ORDER BY entry_fee_cents ASC', ['open']);
  // Ensure 3 buckets exist for the upcoming Sunday
  const existingFees = new Set(r.results.map((p) => p.entry_fee_cents));
  const need: PoolFee[] = [500, 2500, 10000];
  for (const f of need) {
    if (![...existingFees].some((e) => Number(e) === f && r.results.find((p) => p.week_start === week && p.entry_fee_cents === f))) {
      const exists = (await q<any>('SELECT id FROM pools WHERE week_start = ? AND entry_fee_cents = ?', [week, f])).results[0];
      if (!exists) {
        await exec(
          'INSERT INTO pools (id, week_start, name, entry_fee_cents, rake_bps, status, prize_pool_cents, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [crypto.randomUUID(), week, `Sunday Slate ${feeLabel(f)}`, f, 1500, 'open', 0, Date.now()],
        );
      }
    }
  }
  const refreshed = await q<Pool>('SELECT * FROM pools WHERE status = ? ORDER BY entry_fee_cents ASC', ['open']);
  return refreshed.results;
}

export async function getPool(id: string): Promise<Pool | null> {
  const r = await q<Pool>('SELECT * FROM pools WHERE id = ?', [id]);
  return r.results[0] ?? null;
}

export async function entryFor(poolId: string, email: string) {
  const r = await q<any>('SELECT * FROM pool_entries WHERE pool_id = ? AND user_email = ?', [poolId, email]);
  return r.results[0] ?? null;
}

export async function getOrCreateEntry(poolId: string, email: string) {
  const ex = await entryFor(poolId, email);
  if (ex) return ex;
  const id = crypto.randomUUID();
  await exec(
    'INSERT INTO pool_entries (id, pool_id, user_email, stripe_id, paid, score, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, poolId, email, null, 0, 0, Date.now()],
  );
  return (await entryFor(poolId, email))!;
}

export async function markEntryPaid(poolId: string, email: string, stripeId: string) {
  await exec(
    'UPDATE pool_entries SET paid = 1, stripe_id = ? WHERE pool_id = ? AND user_email = ?',
    [stripeId, poolId, email],
  );
  // Bump prize pool
  const pool = await getPool(poolId);
  if (pool) {
    const newPrize = (Number(pool.prize_pool_cents) || 0) + Number(pool.entry_fee_cents);
    await exec('UPDATE pools SET prize_pool_cents = ? WHERE id = ?', [newPrize, poolId]);
  }
}

export async function getAgeAck(email: string): Promise<boolean> {
  const r = await q<any>('SELECT * FROM pool_age_acks WHERE user_email = ?', [email]);
  return Boolean(r.results[0]);
}
export async function setAgeAck(email: string) {
  const ex = await getAgeAck(email);
  if (ex) return;
  await exec(
    'INSERT INTO pool_age_acks (user_email, acknowledged_at) VALUES (?, ?)',
    [email, Date.now()],
  );
}

export function payoutAfterRake(prizeCents: number, rakeBps: number): number {
  return Math.floor((prizeCents * (10000 - rakeBps)) / 10000);
}
