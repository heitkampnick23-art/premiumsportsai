import Link from 'next/link';
import { readEmail } from '@/lib/auth';
import { getTier, tierAtLeast } from '@/lib/tier';
import { getTodaysLocks, todayKey } from '@/lib/locks';
import { q } from '@/lib/db';
import { AdSlot } from '@/components/AdSlot';
import { UnlockPickButton } from '@/components/UnlockPickButton';

export const runtime = 'edge';
export const revalidate = 300;

export default async function LocksPage() {
  const email = await readEmail();
  const tier = await getTier(email);
  const locks = await getTodaysLocks();
  const unlocks = email
    ? (await q<any>('SELECT lock_id FROM pick_unlocks WHERE user_email = ?', [email])).results.map(r => r.lock_id)
    : [];

  const date = todayKey();
  const showSharp = tierAtLeast(tier, 'sharp');

  return (
    <div className="space-y-6">
      <header>
        <p className="text-accent2 text-xs font-bold uppercase tracking-widest">{date}</p>
        <h1 className="text-3xl font-black">Locks of the Day</h1>
        <p className="text-zinc-400">4 AI-graded NFL picks. 1 free, 3 for Pro, plus a daily Sharp Lock with deeper market analysis.</p>
      </header>

      <div className="grid md:grid-cols-2 gap-4">
        {locks.filter(l => l.slot <= 4).map(lock => {
          const locked =
            (lock.tier_required === 'pro' && !tierAtLeast(tier, 'pro') && !unlocks.includes(lock.id));
          return (
            <article key={lock.id} className={`card ${lock.tier_required === 'free' ? 'border-emerald-500/40' : ''}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-widest text-zinc-400">Lock #{lock.slot} · {lock.market.toUpperCase()}</span>
                <span className="badge bg-accent/20 text-accent">{lock.confidence}% conf</span>
              </div>
              <h2 className="mt-1 text-xl font-black">{lock.matchup}</h2>
              {locked ? (
                <div className="mt-3 relative">
                  <p className="select-none blur-sm text-lg font-bold">{lock.pick}</p>
                  <p className="select-none blur-sm text-sm text-zinc-400 mt-2">{lock.reasoning}</p>
                  <div className="mt-3 flex flex-col sm:flex-row gap-2">
                    <Link href="/pricing" className="btn-primary text-sm flex-1 text-center">Unlock all w/ Pro — $14.99/mo</Link>
                    {email && <UnlockPickButton lockId={lock.id} />}
                  </div>
                </div>
              ) : (
                <div className="mt-3">
                  <p className="text-lg font-bold text-accent">{lock.pick}</p>
                  <p className="text-sm text-zinc-300 mt-2">{lock.reasoning}</p>
                  {lock.tier_required === 'free' && <span className="badge bg-emerald-500/20 text-emerald-300 mt-3 inline-block">FREE PICK</span>}
                </div>
              )}
            </article>
          );
        })}
      </div>

      <AdSlot placement="inline" />

      <section className="card border-amber-500/40">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-widest text-amber-300">Sharp Lock · daily</span>
          {showSharp && <span className="badge bg-amber-500/20 text-amber-300">Sharp tier unlocked</span>}
        </div>
        {(() => {
          const sharp = locks.find(l => l.slot === 5);
          if (!sharp) return <p className="text-zinc-400 mt-2">Generating today's Sharp Lock…</p>;
          if (!showSharp) {
            return (
              <>
                <h2 className="mt-1 text-xl font-black">Today's Sharp edge — locked</h2>
                <p className="text-zinc-400 mt-2">Reverse-line movement signals, steam tracker, and extended market analysis. Sharp tier only.</p>
                <Link href="/pricing" className="btn-primary inline-block mt-3">Go Sharp · $29.99/mo</Link>
              </>
            );
          }
          return (
            <>
              <h2 className="mt-1 text-xl font-black">{sharp.matchup}</h2>
              <p className="text-lg font-bold text-amber-300 mt-2">{sharp.pick} <span className="text-xs text-zinc-400">({sharp.confidence}% conf)</span></p>
              <p className="text-sm text-zinc-300 mt-2">{sharp.reasoning}</p>
              {sharp.sharp_notes && (
                <div className="mt-3 bg-amber-500/5 border border-amber-500/30 rounded-lg p-3 text-sm text-zinc-200">
                  <p className="text-xs uppercase tracking-widest text-amber-300 mb-1">Sharp notes</p>
                  {sharp.sharp_notes}
                </div>
              )}
            </>
          );
        })()}
      </section>

      <section className="card text-xs text-zinc-500">
        <p>Informational picks based on Claude Opus + market data. Not investment or wagering advice. 21+, bet responsibly. 1-800-GAMBLER.</p>
      </section>
    </div>
  );
}
