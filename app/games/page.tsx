import Link from 'next/link';
import { listGames } from '@/lib/sports';

export const runtime = 'edge';
export const revalidate = 60;

function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' });
}

export default async function GamesPage() {
  const games = await listGames();
  const live = games.filter(g => g.status === 'live');
  const upcoming = games.filter(g => g.status === 'scheduled');
  const finals = games.filter(g => g.status === 'final');

  const Card = ({ g }: { g: typeof games[number] }) => (
    <Link href={`/games/${g.id}`} className="card hover:border-accent2 block">
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-400">{fmtTime(g.starts_at)}</span>
        {g.status === 'live' && <span className="badge bg-red-500/20 text-red-300">LIVE · {g.quarter ?? ''}</span>}
        {g.status === 'final' && <span className="badge bg-zinc-700 text-zinc-300">FINAL</span>}
      </div>
      <div className="mt-3 space-y-1">
        <div className="flex items-center justify-between">
          <span className="font-bold">{g.away.abbr} <span className="text-zinc-400 font-normal">{g.away.name}</span></span>
          <span className="font-mono">{g.away_score ?? ''}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-bold">{g.home.abbr} <span className="text-zinc-400 font-normal">{g.home.name}</span></span>
          <span className="font-mono">{g.home_score ?? ''}</span>
        </div>
      </div>
      {g.spread != null && (
        <div className="mt-3 text-xs text-zinc-400 flex gap-3">
          <span>Spread: <span className="text-white">{g.spread > 0 ? '+' : ''}{g.spread}</span></span>
          <span>Total: <span className="text-white">{g.total ?? '—'}</span></span>
        </div>
      )}
    </Link>
  );

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-black">AI Game Pulse</h1>
        <p className="text-zinc-400">Tap any game for win probability, key matchups, injury impact, and a confidence-graded prediction.</p>
      </header>

      {live.length > 0 && (
        <section>
          <h2 className="text-lg font-bold mb-3 text-red-300">Live</h2>
          <div className="grid md:grid-cols-2 gap-3">{live.map(g => <Card key={g.id} g={g} />)}</div>
        </section>
      )}

      <section>
        <h2 className="text-lg font-bold mb-3">Upcoming</h2>
        <div className="grid md:grid-cols-2 gap-3">{upcoming.map(g => <Card key={g.id} g={g} />)}</div>
      </section>

      {finals.length > 0 && (
        <section>
          <h2 className="text-lg font-bold mb-3 text-zinc-400">Final</h2>
          <div className="grid md:grid-cols-2 gap-3">{finals.map(g => <Card key={g.id} g={g} />)}</div>
        </section>
      )}
    </div>
  );
}
