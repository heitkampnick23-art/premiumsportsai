import Link from 'next/link';
import { readEmail } from '@/lib/auth';
import { feeLabel, getAgeAck, listOpenPools, payoutAfterRake } from '@/lib/pools';
import { q } from '@/lib/db';
import { PoolEntryButton } from '@/components/PoolEntryButton';

export const runtime = 'edge';

export default async function PoolsPage() {
  const email = await readEmail();
  const pools = await listOpenPools();
  const acked = email ? await getAgeAck(email) : false;

  const entriesByPool: Record<string, number> = {};
  for (const p of pools) {
    const c = await q<any>('SELECT COUNT(*) as n FROM pool_entries WHERE pool_id = ? AND paid = 1', [p.id]);
    entriesByPool[p.id] = Number(c.results[0]?.n ?? 0);
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-accent2 text-xs font-bold uppercase tracking-widest">Skill contest</p>
        <h1 className="text-4xl font-black">Sunday Slate Pools</h1>
        <p className="text-zinc-400 mt-2">Pick winners on every Sunday NFL game. Top score takes the prize pool. 85% paid out, 15% rake. 21+ only.</p>
      </header>

      {!email && (
        <div className="card border-accent2/40">
          <p>Sign in to enter a pool. <Link href="/account" className="underline">Sign in →</Link></p>
        </div>
      )}

      {email && !acked && (
        <div className="card border-accent/40 bg-gradient-to-br from-zinc-900 to-panel">
          <h2 className="font-bold">21+ Age & Responsible-Skill Acknowledgement</h2>
          <ul className="text-sm text-zinc-300 list-disc list-inside mt-2 space-y-1">
            <li>You confirm you are <strong>21 years or older</strong>.</li>
            <li>Sunday Slate is a <strong>skill contest</strong> based on NFL game predictions — not a wager on individual outcomes.</li>
            <li>Pools are <strong>not legal</strong> in every US jurisdiction. You are responsible for ensuring participation is permitted where you reside.</li>
            <li>Top scorer wins the prize pool less a 15% operations fee. Ties split. Entries are non-refundable once the slate locks.</li>
            <li>If you or someone you know has a problem with gambling, call <strong>1-800-GAMBLER</strong> or visit ncpgambling.org.</li>
          </ul>
          <form action="/api/pools/ack" method="post" className="mt-3">
            <button className="btn-primary" type="submit">I am 21+ and accept</button>
          </form>
        </div>
      )}

      <section className="grid md:grid-cols-3 gap-4">
        {pools.map((p) => {
          const entryN = entriesByPool[p.id] ?? 0;
          const projected = payoutAfterRake(entryN * Number(p.entry_fee_cents), Number(p.rake_bps));
          return (
            <div key={p.id} className="card">
              <h3 className="font-bold text-lg">{p.name}</h3>
              <p className="text-3xl font-black mt-1 text-accent">{feeLabel(Number(p.entry_fee_cents))}<span className="text-sm text-zinc-400 ml-1">entry</span></p>
              <div className="text-xs text-zinc-400 mt-2 space-y-1">
                <div>Entries paid: <strong className="text-white">{entryN}</strong></div>
                <div>Projected prize: <strong className="text-accent2">${(projected / 100).toFixed(0)}</strong></div>
                <div>Locks Sunday {p.week_start} @ 1:00pm ET</div>
              </div>
              <div className="mt-3">
                {email && acked ? (
                  <PoolEntryButton poolId={p.id} fee={Number(p.entry_fee_cents)} />
                ) : (
                  <button className="btn-ghost w-full opacity-60" disabled>{email ? 'Acknowledge 21+ first' : 'Sign in to enter'}</button>
                )}
              </div>
              <div className="mt-3 text-xs">
                <Link className="underline text-zinc-400" href={`/pools/${p.id}`}>View pool & make picks →</Link>
              </div>
            </div>
          );
        })}
        {pools.length === 0 && <p className="text-zinc-500">No pools open yet — check back soon.</p>}
      </section>

      <section className="text-xs text-zinc-500 border-t border-edge pt-4 space-y-2">
        <p><strong>Skill contest disclaimer.</strong> PremiumSportsAi Sunday Slate is a contest of skill in which entrants predict outcomes of professional football games. We do not accept wagers on individual game outcomes. Operator retains a 15% fee from the prize pool.</p>
        <p><strong>Age requirement: 21+.</strong> Void where prohibited. Pools are not available to residents of jurisdictions where skill contests with entry fees are not permitted.</p>
        <p><strong>Responsible play.</strong> Set limits. Take breaks. Gambling problem? 1-800-GAMBLER.</p>
      </section>
    </div>
  );
}
