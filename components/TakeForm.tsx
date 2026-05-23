'use client';
import { useState } from 'react';

export function TakeForm({ gameId }: { gameId?: string }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ grade: number; rationale: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true); setErr(null);
    try {
      const r = await fetch('/api/takes', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text, game_id: gameId }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? 'failed');
      setResult({ grade: data.grade, rationale: data.rationale });
      setText('');
    } catch (e: any) {
      setErr(e.message);
    } finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="e.g. Mahomes goes for 350 yards and 4 TDs. Chiefs win by double digits."
        className="w-full bg-ink border border-edge rounded-lg p-3 text-sm min-h-[80px] focus:outline-none focus:border-accent"
        maxLength={400}
      />
      <div className="flex items-center gap-3">
        <button type="submit" disabled={busy || !text.trim()} className="btn-primary disabled:opacity-50">
          {busy ? 'Grading…' : 'Submit take'}
        </button>
        <span className="text-xs text-zinc-500">{text.length}/400</span>
      </div>
      {err && <p className="text-bad text-sm">{err}</p>}
      {result && (
        <div className="card bg-edge/40">
          <p className="text-sm">AI grade: <span className="font-bold text-accent2">{result.grade}/100</span></p>
          <p className="text-zinc-300 text-sm mt-1">{result.rationale}</p>
        </div>
      )}
    </form>
  );
}
