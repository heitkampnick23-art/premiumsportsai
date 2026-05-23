'use client';
import { useState } from 'react';

type Game = { id: string; home: { name: string; abbr: string }; away: { name: string; abbr: string } };

export function PoolPicksForm({ poolId, games, existing }: { poolId: string; games: Game[]; existing: Record<string, 'home' | 'away'> }) {
  const [picks, setPicks] = useState<Record<string, 'home' | 'away'>>(existing);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    setSaving(true); setMsg(null);
    try {
      const r = await fetch('/api/pools/picks', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ poolId, picks }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? 'Failed to save');
      setMsg(`Saved ${j.saved} picks.`);
    } catch (e: any) { setMsg(e.message); } finally { setSaving(false); }
  }

  return (
    <section className="card space-y-3">
      <h2 className="font-bold">Your picks</h2>
      <ul className="space-y-2">
        {games.map((g) => {
          const cur = picks[g.id];
          return (
            <li key={g.id} className="flex items-center justify-between gap-3">
              <span className="text-sm flex-1">{g.away.name} @ {g.home.name}</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPicks({ ...picks, [g.id]: 'away' })}
                  className={`px-3 py-1 rounded text-xs font-bold ${cur === 'away' ? 'bg-accent text-black' : 'bg-zinc-800'}`}
                >{g.away.abbr}</button>
                <button
                  type="button"
                  onClick={() => setPicks({ ...picks, [g.id]: 'home' })}
                  className={`px-3 py-1 rounded text-xs font-bold ${cur === 'home' ? 'bg-accent text-black' : 'bg-zinc-800'}`}
                >{g.home.abbr}</button>
              </div>
            </li>
          );
        })}
      </ul>
      <button onClick={save} disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save picks'}</button>
      {msg && <p className="text-xs text-zinc-400">{msg}</p>}
    </section>
  );
}
