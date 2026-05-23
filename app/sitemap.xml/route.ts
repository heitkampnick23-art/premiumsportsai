import { env } from '@/lib/env';
import { q } from '@/lib/db';

export const runtime = 'edge';

export async function GET() {
  const appUrl = env().APP_URL ?? 'https://premiumsportsai.pages.dev';
  const staticPaths = ['', '/pricing', '/locks', '/games', '/bets', '/dfs', '/contest', '/chat', '/takes', '/leaderboard', '/news', '/legal'];
  const users = (await q<any>('SELECT handle FROM users WHERE handle IS NOT NULL LIMIT 500', [])).results;
  const urls = [
    ...staticPaths.map(p => `${appUrl}${p}`),
    ...users.map(u => `${appUrl}/u/${u.handle}`),
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${u}</loc></url>`).join('\n')}
</urlset>`;
  return new Response(body, { headers: { 'content-type': 'application/xml' } });
}
