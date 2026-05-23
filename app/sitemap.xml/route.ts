import { env } from '@/lib/env';
import { q } from '@/lib/db';
import { NFL_TEAMS } from '@/lib/nfl-teams';

export const runtime = 'edge';

export async function GET() {
  const appUrl = env().APP_URL ?? 'https://premiumsportsai.pages.dev';
  const staticPaths = ['', '/pricing', '/locks', '/games', '/bets', '/dfs', '/contest', '/chat', '/takes', '/leaderboard', '/news', '/legal', '/pools', '/teams'];
  let users: any[] = [];
  try { users = (await q<any>('SELECT handle FROM users WHERE handle IS NOT NULL LIMIT 500', [])).results; } catch {}
  const urls = [
    ...staticPaths.map(p => `${appUrl}${p}`),
    ...NFL_TEAMS.map(t => `${appUrl}/teams/${t.slug}`),
    ...users.map(u => `${appUrl}/u/${u.handle}`),
    ...users.map(u => `${appUrl}/collection/${u.handle}`),
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${u}</loc></url>`).join('\n')}
</urlset>`;
  return new Response(body, { headers: { 'content-type': 'application/xml' } });
}
