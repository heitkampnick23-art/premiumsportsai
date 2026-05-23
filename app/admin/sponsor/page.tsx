import { env } from '@/lib/env';
import { listSponsoredTakes } from '@/lib/sponsor';

export const runtime = 'edge';

export default async function SponsorAdmin({ searchParams }: { searchParams: { key?: string } }) {
  const expected = env().SESSION_SECRET;
  if (!expected || searchParams.key !== expected) {
    return <div className="card"><h1 className="font-bold">Forbidden</h1><p className="text-sm text-zinc-400 mt-1">Pass <code>?key=$SESSION_SECRET</code>.</p></div>;
  }
  const items = await listSponsoredTakes();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-black">Sponsored Take Manager</h1>
        <p className="text-zinc-400 text-sm">Bronze $500/wk · Silver $1,500/wk · Gold $5,000/wk</p>
      </header>

      <form action={`/api/admin/sponsor?key=${expected}`} method="post" className="card space-y-3">
        <div className="grid md:grid-cols-2 gap-3">
          <label className="text-xs space-y-1">
            <span className="text-zinc-400">Sponsor name</span>
            <input name="sponsor_name" required className="w-full bg-ink border border-edge rounded px-2 py-2" />
          </label>
          <label className="text-xs space-y-1">
            <span className="text-zinc-400">Sponsor link</span>
            <input name="sponsor_link" required type="url" className="w-full bg-ink border border-edge rounded px-2 py-2" />
          </label>
          <label className="text-xs space-y-1">
            <span className="text-zinc-400">Tier</span>
            <select name="tier" className="w-full bg-ink border border-edge rounded px-2 py-2">
              <option value="bronze">Bronze ($500/wk)</option>
              <option value="silver">Silver ($1,500/wk)</option>
              <option value="gold">Gold ($5,000/wk)</option>
            </select>
          </label>
          <label className="text-xs space-y-1">
            <span className="text-zinc-400">Days active</span>
            <input name="days" type="number" defaultValue={7} className="w-full bg-ink border border-edge rounded px-2 py-2" />
          </label>
        </div>
        <label className="text-xs block space-y-1">
          <span className="text-zinc-400">Sponsored take text</span>
          <textarea name="text" required rows={3} className="w-full bg-ink border border-edge rounded px-2 py-2" />
        </label>
        <button className="btn-primary" type="submit">Create sponsored take</button>
      </form>

      <section>
        <h2 className="font-bold mb-2">All sponsored takes</h2>
        <ul className="space-y-2">
          {items.map((s) => (
            <li key={s.id} className="card text-sm">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="font-bold text-accent uppercase">{s.tier}</span>
                <span>{new Date(s.starts_at).toLocaleDateString()} → {new Date(s.ends_at).toLocaleDateString()}</span>
              </div>
              <p className="mt-1">{s.text}</p>
              <p className="text-xs text-zinc-500 mt-1">Sponsored by <strong>{s.sponsor_name}</strong> — <a className="underline" href={s.sponsor_link}>{s.sponsor_link}</a></p>
            </li>
          ))}
          {items.length === 0 && <li className="text-zinc-500 text-sm">No sponsored takes yet.</li>}
        </ul>
      </section>
    </div>
  );
}
