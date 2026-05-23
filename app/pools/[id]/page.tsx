import Link from 'next/link';
import { notFound } from 'next/navigation';
import { readEmail } from '@/lib/auth';
import { entryFor, feeLabel, getPool, payoutAfterRake } from '@/lib/pools';
import { listGames } from '@/lib/sports';
import { q } from '@/lib/db';
import { PoolPicksForm } from '@/components/PoolPicksForm';

export const runtime = 'edge';

export default async function PoolDetail({ params }: { params: { id: string } }) {
  const pool = await getPool(params.id);
  if (!pool) notFound();
  const email = await readEmail();
  const entry = email ? await entryFor(pool.id, email) : null;
  const games = (await listGames()).filter((g) => g.status !== 'final').slice(0, 14);
  const picks = entry ? (await q<any>('SELECT * FROM pool_picks WHERE entry_id = ?', [entry.id])).results : [];
  const pickMap: Record<string, 'home' | 'away'> = {};
  for (const p of picks) pickMap[p.game_id] = p.pick;

  const entryN = Number((await q<any>('SELECT COUNT(*) as n FROM pool_entries WHERE pool_id = ? AND paid = 1', [pool.id])).results[0]?.n ?? 0);
  const projected = payoutAfterRake(entryN * Number(pool.entry_fee_cents), Number(pool.rake_bps));

  return (
    <div className="space-y-6">
      <header>
        <Link href="/pools" className="text-xs underline text-zinc-400">← All pools</Link>
        <h1 className="text-3xl font-black mt-1">{pool.name}</h1>
        <p className="text-zinc-400 text-sm">Entry {feeLabel(Number(pool.entry_fee_cents))} · Projected prize ${(projected / 100).toFixed(0)} · {entryN} entries paid</p>
      </header>

      {!email && <div className="card"><Link className="underline" href="/account">Sign in</Link> to enter and make picks.</div>}

      {email && !entry?.paid && (
        <div className="card border-accent/40">
          <p>Pay your {feeLabel(Number(pool.entry_fee_cents))} entry on the <Link className="underline" href="/pools">main pools page</Link>, then come back to set your picks.</p>
        </div>
      )}

      {email && entry?.paid && (
        <PoolPicksForm poolId={pool.id} games={games as any} existing={pickMap} />
      )}

      {!email || !entry?.paid ? (
        <section>
          <h2 className="font-bold">Slate preview</h2>
          <ul className="grid md:grid-cols-2 gap-2 mt-2">
            {games.map((g) => (
              <li key={g.id} className="card text-sm">{g.away.name} @ {g.home.name}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
