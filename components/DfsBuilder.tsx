'use client';
import { useState } from 'react';

type Lineup = {
  players: { pos: string; name: string; team: string; salary: number }[];
  total_salary: number;
  projected_points: number;
  reasoning: string;
};

export function DfsBuilder() {
  const [site, setSite] = useState<'dk' | 'fd'>('dk');
  const [slate, setSlate] = useState('Main Sunday');
  const [busy, setBusy] = useState(false);
  const [lineups, setLineups] = useState<Lineup[]>([]);
  const [err, setErr] = useState<string | null>(null);

  async function build() {
    setBusy(true); setErr(null);
    const r = await fetch('/api/dfs/build', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ site, slate }),
    });
    const data = await r.json();
    setBusy(false);
    if (data.lineups) setLineups(data.lineups);
    else setErr(data.error ?? 'Builder unavailable');
  }

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-end gap-3">
        <label className="flex flex-col text-xs">Site
          <select value={site} onChange={e => setSite(e.target.value as any)} className="bg-ink border border-edge rounded-lg p-2 mt-1 text-sm">
            <option value="dk">DraftKings classic ($50k)</option>
            <option value="fd">FanDuel classic ($60k)</option>
          </select>
        </label>
        <label className="flex flex-col text-xs">Slate
          <input value={slate} onChange={e => setSlate(e.target.value)} className="bg-ink border border-edge rounded-lg p-2 mt-1 text-sm" />
        </label>
        <button onClick={build} disabled={busy} className="btn-primary disabled:opacity-50">
          {busy ? 'Building…' : 'Build 3 lineups'}
        </button>
      </div>
      {err && <p className="text-bad text-sm">{err}</p>}
      <div className="grid md:grid-cols-3 gap-3">
        {lineups.map((l, i) => (
          <div key={i} className="card text-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-bold">Lineup {i + 1}</h3>
              <span className="badge bg-accent/20 text-accent">{l.projected_points.toFixed(1)} pts</span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">Salary used: ${l.total_salary.toLocaleString()}</p>
            <ul className="mt-2 space-y-1">
              {l.players.map((p, j) => (
                <li key={j} className="flex justify-between">
                  <span><span className="text-zinc-500 w-10 inline-block">{p.pos}</span>{p.name} <span className="text-zinc-500">({p.team})</span></span>
                  <span className="text-zinc-400">${p.salary.toLocaleString()}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-zinc-300">{l.reasoning}</p>
            <a href={`/go/${site}`} className="btn-ghost text-xs mt-3 inline-block">
              Enter on {site === 'dk' ? 'DraftKings' : 'FanDuel'} →
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
