import Link from 'next/link';
import { getTodaysLocks } from '@/lib/locks';
import { q } from '@/lib/db';
import { handleForEmail } from '@/lib/profile';
import { EmailCapture } from '@/components/EmailCapture';
import { AdSlot } from '@/components/AdSlot';

export const runtime = 'edge';
export const revalidate = 300;

const tiles = [
  { href: '/locks', title: 'Locks of the Day', blurb: '4 NFL picks each day. 1 free. Pro unlocks all. Sharp gets a 5th market-signal lock.' },
  { href: '/games', title: 'AI Game Pulse', blurb: 'Win probabilities, key matchups, injury impact for every game.' },
  { href: '/bets', title: 'AI Bet Lab', blurb: 'Model spreads vs. consensus. Kelly-sized edges. Tracked record.' },
  { href: '/dfs', title: 'DFS Optimizer', blurb: 'Auto-build cash + GPP lineups for DraftKings and FanDuel. Pro+.' },
  { href: '/contest', title: 'AI vs You', blurb: 'Free weekly contest. Beat the AI, win Pro.' },
  { href: '/chat', title: 'AI Team Chat', blurb: 'Ask anything NFL — injuries, scheme, line value. 5/day free.' },
  { href: '/takes', title: 'Hot Takes Arena', blurb: 'Post takes, get AI-graded, climb the clout leaderboard.' },
  { href: '/agent', title: 'Personal Fan Agent', blurb: 'Daily briefings + push for your favorite teams.' },
];

export default async function Home() {
  const locks = await getTodaysLocks();
  const freeLock = locks.find(l => l.tier_required === 'free') ?? locks[0];
  const topTakes = (await q<any>('SELECT * FROM takes ORDER BY clout DESC LIMIT 3', [])).results;
  const enrichedTakes = await Promise.all(topTakes.map(async t => ({ ...t, handle: await handleForEmail(t.user_email) })));

  return (
    <div className="space-y-10">
      <section className="card bg-gradient-to-br from-panel to-zinc-900 border-edge">
        <p className="text-accent2 text-xs font-bold uppercase tracking-widest">NFL · Powered by Claude</p>
        <h1 className="text-4xl md:text-5xl font-black mt-2">Smarter than your group chat. Faster than your bookie.</h1>
        <p className="mt-3 text-zinc-300 max-w-2xl">Daily AI locks, live game pulse, edge-graded bet lab, DFS optimizer, and a weekly contest where you can beat the model for a free month of Pro.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/locks" className="btn-primary">Today's Locks</Link>
          <Link href="/pricing" className="btn-ghost">See Pro · Sharp →</Link>
        </div>
      </section>

      {freeLock && (
        <section className="card border-emerald-500/40">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest text-emerald-300">Today's free lock</span>
            <span className="badge bg-accent/20 text-accent">{freeLock.confidence}% conf</span>
          </div>
          <h2 className="mt-1 text-2xl font-black">{freeLock.matchup}</h2>
          <p className="text-lg font-bold text-accent mt-2">{freeLock.pick}</p>
          <p className="text-sm text-zinc-300 mt-2">{freeLock.reasoning}</p>
          <Link href="/locks" className="inline-block mt-3 text-accent2 text-sm font-semibold">Unlock the other 3 →</Link>
        </section>
      )}

      <EmailCapture />

      <section className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { name: 'Free', price: '$0', features: ['1 free lock/day', 'Hot takes', 'Public profile'], cta: 'Sign up', href: '/account' },
          { name: 'Pro', price: '$14.99/mo', features: ['All 4 locks', 'DFS optimizer', 'Unlimited chat', 'No ads'], cta: 'Start Pro', href: '/pricing', highlight: true },
          { name: 'Sharp', price: '$29.99/mo', features: ['+Daily Sharp Lock', 'Steam tracker', 'Reverse-line alerts'], cta: 'Go Sharp', href: '/pricing' },
        ].map(t => (
          <Link key={t.name} href={t.href} className={`card hover:border-accent transition ${t.highlight ? 'border-accent ring-1 ring-accent/30' : ''}`}>
            <p className="text-xs uppercase tracking-widest text-zinc-400">{t.name}</p>
            <p className="text-2xl font-black mt-1">{t.price}</p>
            <ul className="mt-2 text-sm text-zinc-300 space-y-1">{t.features.map(f => <li key={f}>· {f}</li>)}</ul>
            <p className="mt-3 text-accent2 text-sm font-semibold">{t.cta} →</p>
          </Link>
        ))}
      </section>

      <AdSlot />

      <section>
        <h2 className="text-2xl font-black mb-3">Hottest takes right now</h2>
        {enrichedTakes.length === 0 && <p className="text-zinc-500 text-sm">Be the first take on the board.</p>}
        <div className="grid md:grid-cols-3 gap-3">
          {enrichedTakes.map(t => (
            <article key={t.id} className="card">
              <Link href={`/u/${t.handle}`} className="text-xs text-accent2 hover:underline">@{t.handle}</Link>
              <p className="mt-2 font-medium text-zinc-100">{t.text}</p>
              <p className="mt-2 text-xs text-zinc-400">AI grade {t.grade}/100 · clout {t.clout}</p>
            </article>
          ))}
        </div>
        <Link href="/leaderboard" className="inline-block mt-3 text-accent2 text-sm font-semibold">Full leaderboard →</Link>
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        {tiles.map(t => (
          <Link key={t.href} href={t.href} className="card hover:border-accent transition group">
            <h3 className="text-xl font-bold group-hover:text-accent">{t.title}</h3>
            <p className="text-zinc-400 mt-2">{t.blurb}</p>
            <span className="inline-block mt-3 text-accent2 text-sm font-semibold">Open →</span>
          </Link>
        ))}
      </section>

      <section className="card text-xs text-zinc-500">
        <p><strong>Responsible gambling:</strong> PremiumSportsAi provides analytical information only — we are not a sportsbook and do not accept wagers. 21+, must be in a permitted jurisdiction. If you or someone you know has a gambling problem, call 1-800-GAMBLER.</p>
      </section>
    </div>
  );
}
