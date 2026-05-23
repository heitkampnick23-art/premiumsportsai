import { getGame } from '@/lib/sports';
import { pulseFor } from '@/lib/ai';
import { notFound } from 'next/navigation';
import { TakeForm } from '@/components/TakeForm';

export const runtime = 'edge';
export const revalidate = 60;

export default async function GameDetail({ params }: { params: { id: string } }) {
  const game = await getGame(params.id);
  if (!game) notFound();
  const pulse = await pulseFor(game);

  const wp = Math.round(pulse.win_probability_home ?? 50);
  const conf = pulse.prediction?.confidence ?? 'medium';
  const confColor = conf === 'high' ? 'text-good' : conf === 'low' ? 'text-bad' : 'text-accent2';

  return (
    <div className="space-y-6">
      <header className="card">
        <p className="text-xs text-zinc-400">{new Date(game.starts_at).toLocaleString()}</p>
        <h1 className="text-2xl font-black mt-1">{game.away.name} @ {game.home.name}</h1>
        {game.status === 'live' && <span className="badge bg-red-500/20 text-red-300 mt-2">LIVE · {game.quarter}</span>}
      </header>

      <section className="card">
        <h2 className="font-bold mb-3">Win Probability</h2>
        <div className="flex items-center gap-4">
          <div className="flex-1 h-4 bg-edge rounded-full overflow-hidden">
            <div className="h-full bg-accent" style={{ width: `${wp}%` }} />
          </div>
          <span className="font-mono text-sm w-24 text-right">{game.home.abbr} {wp}%</span>
        </div>
        <p className="text-xs text-zinc-400 mt-2">{game.away.abbr} {100 - wp}%</p>
      </section>

      <section className="card">
        <h2 className="font-bold mb-2">Prediction <span className={`badge ml-2 bg-edge ${confColor}`}>{conf} confidence</span></h2>
        <p className="text-xl font-mono">{game.away.abbr} {pulse.prediction?.score_away} — {pulse.prediction?.score_home} {game.home.abbr}</p>
        <p className="text-zinc-400 mt-2">{pulse.prediction?.reasoning}</p>
      </section>

      <section className="card">
        <h2 className="font-bold mb-2">Key Matchups</h2>
        <ul className="list-disc list-inside text-zinc-300 space-y-1">
          {(pulse.key_matchups ?? []).map((m: string, i: number) => <li key={i}>{m}</li>)}
        </ul>
      </section>

      <section className="card">
        <h2 className="font-bold mb-2">Injury Impact</h2>
        <p className="text-zinc-300">{pulse.injury_impact}</p>
        {game.injuries && game.injuries.length > 0 && (
          <ul className="mt-2 text-sm text-zinc-400">
            {game.injuries.map((i, k) => <li key={k}>· {i.team} {i.name} ({i.pos}) — {i.status}</li>)}
          </ul>
        )}
      </section>

      <section className="card">
        <h2 className="font-bold mb-2">Narrative</h2>
        <p className="text-zinc-300">{pulse.narrative}</p>
      </section>

      <section className="card">
        <h2 className="font-bold mb-2">Drop your take on this game</h2>
        <TakeForm gameId={game.id} />
      </section>
    </div>
  );
}
