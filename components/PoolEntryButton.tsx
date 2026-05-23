'use client';
import { useState } from 'react';

export function PoolEntryButton({ poolId, fee }: { poolId: string; fee: number }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  async function go() {
    setBusy(true); setErr(null);
    try {
      const r = await fetch('/api/pools/checkout', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ poolId }),
      });
      const j = await r.json();
      if (!r.ok || !j.url) throw new Error(j.error ?? 'Could not start checkout');
      window.location.href = j.url;
    } catch (e: any) { setErr(e.message); setBusy(false); }
  }
  return (
    <div>
      <button onClick={go} disabled={busy} className="btn-primary w-full">
        {busy ? 'Loading…' : `Pay $${(fee / 100).toFixed(0)} & enter`}
      </button>
      {err && <p className="text-xs text-red-400 mt-1">{err}</p>}
    </div>
  );
}
