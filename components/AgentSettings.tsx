'use client';
import { useState } from 'react';

export function AgentSettings({ email, initialTeams, initialTone, allTeams }: {
  email: string; initialTeams: string[]; initialTone: string; allTeams: string[];
}) {
  const [teams, setTeams] = useState<string[]>(initialTeams);
  const [tone, setTone] = useState(initialTone || 'analyst');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function toggle(t: string) {
    setTeams(s => s.includes(t) ? s.filter(x => x !== t) : [...s, t]);
  }

  async function save() {
    setBusy(true); setMsg(null);
    const r = await fetch('/api/agent', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'save', teams, tone }),
    });
    setBusy(false);
    setMsg(r.ok ? 'Saved.' : 'Save failed.');
  }

  async function send(kind: 'pregame' | 'recap') {
    setBusy(true); setMsg(null);
    const r = await fetch('/api/agent', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'send', kind, teams, tone }),
    });
    setBusy(false);
    setMsg(r.ok ? `${kind === 'pregame' ? 'Briefing' : 'Recap'} delivered to your inbox below.` : 'Send failed.');
    if (r.ok) setTimeout(() => location.reload(), 600);
  }

  return (
    <section className="card space-y-4">
      <div>
        <p className="text-xs text-zinc-400 mb-2">Favorite teams</p>
        <div className="flex flex-wrap gap-2">
          {allTeams.map(t => (
            <button key={t} type="button" onClick={() => toggle(t)}
              className={`px-3 py-1 rounded-full text-xs font-bold border ${teams.includes(t) ? 'bg-accent text-black border-accent' : 'bg-edge text-zinc-300 border-edge hover:border-zinc-500'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs text-zinc-400 mb-2">Tone</p>
        <div className="flex gap-2">
          {(['analyst','hype','salty'] as const).map(t => (
            <button key={t} type="button" onClick={() => setTone(t)}
              className={`px-3 py-1 rounded-lg text-sm capitalize ${tone === t ? 'bg-accent2 text-black' : 'bg-edge text-zinc-300'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button onClick={save} disabled={busy} className="btn-primary disabled:opacity-50">Save</button>
        <button onClick={() => send('pregame')} disabled={busy || teams.length === 0} className="btn-ghost disabled:opacity-50">Send pre-game briefing now</button>
        <button onClick={() => send('recap')} disabled={busy || teams.length === 0} className="btn-ghost disabled:opacity-50">Send recap now</button>
      </div>
      {msg && <p className="text-sm text-zinc-300">{msg}</p>}
    </section>
  );
}
