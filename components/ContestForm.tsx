'use client';
import { useState } from 'react';

type Slate = { id: string; matchup: string; ai_pick: 'home' | 'away' };

export function ContestForm({ contestId, slate, myPicks }: { contestId: string; slate: Slate[]; myPicks: Record<string, 'home' | 'away'> }) {
  const [picks, setPicks] = useState<Record<string, 'home' | 'away'>>(myPicks);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit() {
    setBusy(true); setMsg(null);
    const r = await fetch('/api/contest/enter', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ contest_id: contestId, picks }),
    });
    const data = await r.json();
    setBusy(false);
    setMsg(r.ok ? 'Picks locked in. Good luck.' : (data.error || 'Error'));
  }

  return (
    <section className="card">
      <h2 className="font-bold">Make your 5 picks</h2>
      <div className="mt-3 space-y-2">
        {slate.map(g => {
          const [away, home] = g.matchup.split(' @ ');
          return (
            <div key={g.id} className="flex items-center gap-2 text-sm">
              <span className="text-zinc-400 w-28 shrink-0">{g.matchup}</span>
              <button onClick={() => setPicks({ ...picks, [g.id]: 'away' })}
                className={`flex-1 rounded-lg px-3 py-2 border ${picks[g.id] === 'away' ? 'border-accent bg-accent/10 text-accent' : 'border-edge text-zinc-300'}`}>
                {away}
              </button>
              <button onClick={() => setPicks({ ...picks, [g.id]: 'home' })}
                className={`flex-1 rounded-lg px-3 py-2 border ${picks[g.id] === 'home' ? 'border-accent bg-accent/10 text-accent' : 'border-edge text-zinc-300'}`}>
                {home}
              </button>
              <span className="text-xs text-zinc-500 w-20 text-right">AI: {g.ai_pick === 'home' ? home : away}</span>
            </div>
          );
        })}
      </div>
      <button onClick={submit} disabled={busy || Object.keys(picks).length !== slate.length} className="btn-primary mt-4 disabled:opacity-50">
        {Object.keys(picks).length === slate.length ? 'Lock in picks' : `Pick all ${slate.length} games`}
      </button>
      {msg && <p className="text-sm text-zinc-300 mt-2">{msg}</p>}
    </section>
  );
}
