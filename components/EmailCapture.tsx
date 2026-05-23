'use client';
import { useState } from 'react';

export function EmailCapture() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes('@')) return;
    setBusy(true); setMsg(null);
    const r = await fetch('/api/email/subscribe', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    setBusy(false);
    setMsg(r.ok ? 'Check your inbox to confirm. 1 free pick a day, opt out anytime.' : 'Something went wrong — try again.');
  }

  return (
    <form onSubmit={submit} className="card bg-gradient-to-br from-accent2/10 to-accent/10 border-accent2/30">
      <h2 className="font-bold">Get 1 free pick every morning</h2>
      <p className="text-zinc-300 text-sm mt-1">No spam. Confirm to start. Opt out in one click.</p>
      <div className="mt-3 flex flex-col sm:flex-row gap-2">
        <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="flex-1 bg-ink border border-edge rounded-lg p-3 focus:outline-none focus:border-accent text-sm" />
        <button disabled={busy} type="submit" className="btn-primary disabled:opacity-50">
          {busy ? 'Sending…' : 'Send me picks'}
        </button>
      </div>
      {msg && <p className="text-xs text-zinc-300 mt-2">{msg}</p>}
    </form>
  );
}
