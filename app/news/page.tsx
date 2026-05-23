import { fixtureNews } from '@/data/fixtures';
import { clusterNews } from '@/lib/ai';

export const runtime = 'edge';
export const revalidate = 600;

export default async function NewsPage() {
  // Real fetch (ESPN/SportsDataIO) would go here. For v1 we use the fixture stream + AI cluster.
  const items = fixtureNews.map(n => ({ title: n.title, source: n.source, url: n.url }));
  const clustered = await clusterNews(items);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-black">News Firehose</h1>
        <p className="text-zinc-400">Deduped sports + AI-in-sports headlines, grouped by storyline.</p>
      </header>
      <ul className="space-y-3">
        {clustered.clusters.map((c: any, i: number) => (
          <li key={i} className="card">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">{c.headline}</h2>
              <span className="badge bg-edge text-zinc-300">{c.tag}</span>
            </div>
            <ul className="mt-2 text-sm text-zinc-400 space-y-1">
              {c.items.map((it: any, k: number) => (
                <li key={k}>· <a href={it.url} className="hover:text-accent2" target="_blank" rel="noopener">{it.source}</a> — {it.title}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
