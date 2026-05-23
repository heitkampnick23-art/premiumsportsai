'use client';
import { useState } from 'react';

export function UnlockPickButton({ lockId }: { lockId: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  async function go() {
    setBusy(true); setErr(null);
    const r = await fetch('/api/stripe/unlock-pick', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ lock_id: lockId }),
    });
    const data = await r.json();
    if (data.url) location.href = data.url;
    else { setErr(data.error ?? 'Checkout error'); setBusy(false); }
  }
  return (
    <>
      <button onClick={go} disabled={busy} className="btn-ghost text-sm flex-1 disabled:opacity-50">
        {busy ? '…' : 'Unlock this pick · $2.99'}
      </button>
      {err && <p className="text-bad text-xs mt-1">{err}</p>}
    </>
  );
}
