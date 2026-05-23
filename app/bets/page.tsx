import { listGames } from '@/lib/sports';
import { betLabFor } from '@/lib/ai';

export const runtime = 'edge';
export const revalidate = 120;

const DK_URL = 'https://sportsbook.draftkings.com/leagues/football/nfl';
const FD_URL = 'https://sportsbook.fanduel.com/navigation/nfl';

export default async function BetsPage() {
  const games = await listGames();
  const lab = await betLabFor(games);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-black">AI Bet Lab</h1>
        <p className="text-zinc-400">Model fair prices vs. consensus lines with EV% and Kelly sizing. Information only — we do not accept wagers.</p>
        <p className="text-xs text-zinc-500 mt-1">Tracked record updates after final scores. Bet within your means. 21+. 1-800-GAMBLER.</p>
      </header>

      <div className="grid md:grid-cols-2 gap-3">
        {(lab as any[]).map((row, i) => {
          const g = games.find(x => x.id === row.game_id) ?? games[i];
          if (!g) return null;
          return (
            <article key={row.game_id ?? i} className="card">
              <header className="flex items-center justify-between">
                <h2 className="font-bold">{g.away.abbr} @ {g.home.abbr}</h2>
                <span className="text-xs text-zinc-400">{new Date(g.starts_at).toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' })}</span>
              </header>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div className="bg-edge/40 rounded p-2">
                  <p className="text-zinc-400 text-xs">Market spread</p>
                  <p className="font-mono">{g.spread ?? '—'}</p>
                </div>
                <div className="bg-edge/40 rounded p-2">
                  <p className="text-zinc-400 text-xs">Model spread</p>
                  <p className="font-mono">{row.model_spread_home ?? '—'}</p>
                </div>
                <div className="bg-edge/40 rounded p-2">
                  <p className="text-zinc-400 text-xs">Market total</p>
                  <p className="font-mono">{g.total ?? '—'}</p>
                </div>
                <div className="bg-edge/40 rounded p-2">
                  <p className="text-zinc-400 text-xs">Model total</p>
                  <p className="font-mono">{row.model_total ?? '—'}</p>
                </div>
              </div>
              {row.edges?.length > 0 ? (
                <ul className="mt-3 space-y-1 text-sm">
                  {row.edges.map((e: any, k: number) => (
                    <li key={k} className="flex items-center justify-between bg-good/10 border border-good/30 rounded p-2">
                      <span><strong>{e.side}</strong> <span className="text-zinc-400 text-xs">({e.market})</span></span>
                      <span className="text-good font-mono">+{Number(e.edge_pct).toFixed(1)}% EV · Kelly {Number(e.kelly_pct).toFixed(1)}%</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-xs text-zinc-500">No clear edge.</p>
              )}
              <p className="mt-3 text-zinc-400 text-sm">{row.summary}</p>
              <div className="mt-3 flex gap-2">
                <a href={DK_URL} target="_blank" rel="noopener nofollow sponsored" className="btn-ghost text-xs">DraftKings →</a>
                <a href={FD_URL} target="_blank" rel="noopener nofollow sponsored" className="btn-ghost text-xs">FanDuel →</a>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
