import { NextResponse } from 'next/server';
import { readEmail } from '@/lib/auth';
import { entryFor, getPool } from '@/lib/pools';
import { exec } from '@/lib/db';

export const runtime = 'edge';

export async function POST(req: Request) {
  const email = await readEmail();
  if (!email) return NextResponse.json({ error: 'sign in first' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const poolId = String(body.poolId ?? '');
  const pool = await getPool(poolId);
  if (!pool) return NextResponse.json({ error: 'unknown pool' }, { status: 404 });
  if (pool.status !== 'open') return NextResponse.json({ error: 'pool locked' }, { status: 400 });
  const entry = await entryFor(poolId, email);
  if (!entry || !entry.paid) return NextResponse.json({ error: 'pay entry first' }, { status: 402 });

  const picks: Record<string, string> = body.picks ?? {};
  // Replace prior picks
  await exec('DELETE FROM pool_picks WHERE entry_id = ?', [entry.id]);
  let saved = 0;
  for (const [gameId, p] of Object.entries(picks)) {
    if (p !== 'home' && p !== 'away') continue;
    await exec(
      'INSERT INTO pool_picks (id, entry_id, game_id, pick, created_at) VALUES (?, ?, ?, ?, ?)',
      [crypto.randomUUID(), entry.id, gameId, p, Date.now()],
    );
    saved++;
  }
  return NextResponse.json({ ok: true, saved });
}
