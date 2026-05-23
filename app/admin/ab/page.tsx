import { env } from '@/lib/env';
import { summarize } from '@/lib/ab';
import { q } from '@/lib/db';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default async function AbAdmin({ searchParams }: { searchParams: { key?: string } }) {
  const expected = env().SESSION_SECRET;
  if (!expected || searchParams.key !== expected) {
    return <div className="card"><h1 className="font-bold">Forbidden</h1></div>;
  }
  const rows = await summarize();
  const a = rows.find(r => r.variant === 'A');
  const b = rows.find(r => r.variant === 'B');
  let winner: string = 'Inconclusive';
  if (a && b && (a.views >= 20 && b.views >= 20)) {
    winner = b.completeRate > a.completeRate ? 'B (Sharp-first + Annual)' : a.completeRate > b.completeRate ? 'A (current)' : 'Tied';
  }
  // Last 7 days raw events
  let recent: any[] = [];
  try {
    recent = (await q<any>('SELECT variant, event, COUNT(*) as n FROM ab_events WHERE created_at > ? GROUP BY variant, event', [Date.now() - 7*86400_000])).results;
  } catch {}

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black">A/B Pricing — Detail</h1>
      <p className="text-sm text-zinc-400">Variant A = current order. Variant B = Sharp-first + Annual $149/yr.</p>
      <div className="card">
        <h2 className="font-bold mb-2">Current winner: <span className="text-accent">{winner}</span></h2>
        <table className="text-sm w-full">
          <thead><tr><th className="text-left">Variant</th><th>Views</th><th>Started</th><th>Completed</th><th>Start %</th><th>Convert %</th></tr></thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.variant} className="border-t border-edge">
                <td className="py-2 font-bold">{r.variant}</td>
                <td className="text-center">{r.views}</td>
                <td className="text-center">{r.starts}</td>
                <td className="text-center">{r.completes}</td>
                <td className="text-center">{(r.startRate*100).toFixed(1)}%</td>
                <td className="text-center text-accent">{(r.completeRate*100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card">
        <h2 className="font-bold mb-2">Last 7 days raw event counts</h2>
        <ul className="text-sm">
          {recent.map((r,i) => <li key={i}>{r.variant} · {r.event} · {r.n}</li>)}
          {recent.length === 0 && <li className="text-zinc-500">No events yet.</li>}
        </ul>
      </div>
    </div>
  );
}
