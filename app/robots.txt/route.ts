import { env } from '@/lib/env';

export const runtime = 'edge';

export async function GET() {
  const appUrl = env().APP_URL ?? 'https://premiumsportsai.pages.dev';
  const body = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /account
Disallow: /agent

Sitemap: ${appUrl}/sitemap.xml
`;
  return new Response(body, { headers: { 'content-type': 'text/plain' } });
}
