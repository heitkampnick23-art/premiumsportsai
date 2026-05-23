'use client';
import { useState } from 'react';

export function HandleEditor({ email, initialHandle }: { email: string; initialHandle: string }) {
  const [handle, setHandle] = useState(initialHandle);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    setBusy(true); setMsg(null);
    const r = await fetch('/api/profile/handle', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ handle }),
    });
    const data = await r.json();
    setBusy(false);
    if (data.ok) setMsg('Saved.');
    else setMsg(data.error || 'Error');
  }

  return (
    <div>
      <label className="text-xs text-zinc-400">Public handle (used in @yourhandle profile URL)</label>
      <div className="mt-1 flex gap-2">
        <span className="text-zinc-500 self-center">@</span>
        <input value={handle} onChange={e => setHandle(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase())}
          maxLength={24}
          className="flex-1 bg-ink border border-edge rounded-lg p-2 text-sm focus:outline-none focus:border-accent" />
        <button onClick={save} disabled={busy} className="btn-ghost text-sm">Save</button>
      </div>
      {msg && <p className="text-xs text-zinc-400 mt-1">{msg}</p>}
    </div>
  );
}
