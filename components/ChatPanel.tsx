'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

const TEAMS = ['Chiefs','Bills','Eagles','49ers','Ravens','Cowboys','Lions','Packers','Bengals','Dolphins','Giants','Jets','Vikings','Browns','Steelers','Bears','Texans','Jaguars','Colts','Titans','Broncos','Chargers','Raiders','Patriots','Commanders','Saints','Buccaneers','Falcons','Panthers','Cardinals','Rams','Seahawks'];

type Msg = { role: 'user' | 'assistant'; text: string };

export function ChatPanel({ signedIn, tier }: { signedIn: boolean; tier: 'free' | 'pro' | 'sharp' }) {
  const [team, setTeam] = useState('Chiefs');
  const [input, setInput] = useState('');
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [usage, setUsage] = useState<{ count: number; limit: number | null }>({ count: 0, limit: tier === 'free' ? 5 : null });
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { scrollRef.current?.scrollTo({ top: 999_999 }); }, [msgs]);

  async function send() {
    if (!input.trim()) return;
    if (!signedIn) { setErr('Sign in to chat.'); return; }
    setErr(null); setBusy(true);
    const next = [...msgs, { role: 'user' as const, text: input }];
    setMsgs(next);
    setInput('');
    const r = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ team, messages: next }),
    });
    const data = await r.json();
    setBusy(false);
    if (!r.ok) { setErr(data.error || 'Chat error'); return; }
    setMsgs(m => [...m, { role: 'assistant', text: data.reply }]);
    if (typeof data.count === 'number') setUsage(u => ({ ...u, count: data.count }));
  }

  return (
    <div className="space-y-3">
      <div className="card flex flex-wrap items-center gap-3">
        <label className="text-xs flex flex-col">Team focus
          <select value={team} onChange={e => setTeam(e.target.value)} className="bg-ink border border-edge rounded-lg p-2 mt-1 text-sm">
            {TEAMS.map(t => <option key={t}>{t}</option>)}
          </select>
        </label>
        {tier === 'free' && (
          <span className="text-xs text-zinc-400 ml-auto">
            {usage.count}/{usage.limit} today · <Link href="/pricing" className="underline text-accent">Pro = unlimited</Link>
          </span>
        )}
      </div>
      <div ref={scrollRef} className="card min-h-[300px] max-h-[60vh] overflow-y-auto space-y-3">
        {msgs.length === 0 && <p className="text-sm text-zinc-500">Ask: "Should I worry about the {team} pass-rush this week?"</p>}
        {msgs.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'text-right' : ''}>
            <span className={`inline-block px-3 py-2 rounded-2xl text-sm ${m.role === 'user' ? 'bg-accent/20 text-white' : 'bg-zinc-800 text-zinc-100'}`}>{m.text}</span>
          </div>
        ))}
        {busy && <p className="text-xs text-zinc-500">Thinking…</p>}
      </div>
      {err && <p className="text-bad text-sm">{err}</p>}
      <div className="flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
          placeholder={signedIn ? `Ask about the ${team}…` : 'Sign in first'}
          className="flex-1 bg-ink border border-edge rounded-lg p-3 text-sm focus:outline-none focus:border-accent" />
        <button onClick={send} disabled={busy || !signedIn} className="btn-primary disabled:opacity-50">Send</button>
      </div>
    </div>
  );
}
