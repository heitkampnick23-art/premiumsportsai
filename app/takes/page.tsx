import { q } from '@/lib/db';
import { TakeForm } from '@/components/TakeForm';

export const runtime = 'edge';

export default async function TakesPage() {
  const recentR = await q<any>('SELECT * FROM takes ORDER BY created_at DESC LIMIT 30');
  const recent = recentR.results;
  // Leaderboard: aggregate clout per user (in-memory or D1)
  const board: Record<string, number> = {};
  recent.forEach(t => { board[t.user_email] = (board[t.user_email] ?? 0) + (t.clout ?? 0); });
  const leaders = Object.entries(board).sort((a, b) => b[1] - a[1]).slice(0, 10);

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-6">
        <header>
          <h1 className="text-3xl font-black">Hot Takes Arena</h1>
          <p className="text-zinc-400">Post your pre-game take. AI grades likelihood instantly. Bolder takes that hit = more clout.</p>
        </header>
        <section className="card">
          <h2 className="font-bold mb-3">Drop a take</h2>
          <TakeForm />
        </section>
        <section>
          <h2 className="font-bold mb-3">Recent takes</h2>
          <ul className="space-y-3">
            {recent.map(t => (
              <li key={t.id} className="card">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>{t.user_email.split('@')[0]}</span>
                  <span>{new Date(t.created_at).toLocaleString()}</span>
                </div>
                <p className="mt-2">{t.text}</p>
                <div className="mt-2 flex gap-4 text-sm">
                  <span>Grade: <strong className="text-accent2">{t.grade}/100</strong></span>
                  <span>Clout: <strong className="text-accent">{t.clout}</strong></span>
                </div>
                {t.rationale && <p className="text-zinc-500 text-xs mt-1 italic">{t.rationale}</p>}
              </li>
            ))}
            {recent.length === 0 && <p className="text-zinc-500">Be the first to drop a take.</p>}
          </ul>
        </section>
      </div>
      <aside className="space-y-3">
        <h2 className="font-bold">Clout Leaderboard</h2>
        <ol className="card divide-y divide-edge p-0">
          {leaders.map(([email, score], i) => (
            <li key={email} className="flex items-center justify-between px-4 py-3">
              <span className="text-sm"><span className="text-zinc-500 mr-2">{i + 1}.</span>{email.split('@')[0]}</span>
              <span className="text-accent font-bold">{score}</span>
            </li>
          ))}
          {leaders.length === 0 && <li className="px-4 py-3 text-zinc-500 text-sm">No one on the board yet.</li>}
        </ol>
      </aside>
    </div>
  );
}
