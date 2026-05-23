import { emailForHandle, profileForEmail } from '@/lib/profile';

export const runtime = 'edge';

// Dynamic OG image: pure SVG (no extra deps) so it works on Cloudflare Pages.
export async function GET(_req: Request, ctx: { params: { handle: string } }) {
  const handle = ctx.params.handle;
  const email = await emailForHandle(handle);
  const stats = email ? await profileForEmail(email) : null;

  const clout = stats?.takes.clout ?? 0;
  const streak = stats?.streak.current ?? 0;
  const hitRate = stats?.takes.total ? Math.round((stats.takes.hits / stats.takes.total) * 100) : null;

  const svg = `<?xml version="1.0"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0a0a0b"/>
      <stop offset="100%" stop-color="#16161a"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <text x="80" y="120" fill="#22d3ee" font-family="Helvetica,Arial,sans-serif" font-weight="700" font-size="28" letter-spacing="6">PREMIUMSPORTSAI</text>
  <text x="80" y="240" fill="#ffffff" font-family="Helvetica,Arial,sans-serif" font-weight="900" font-size="100">@${escapeXml(handle)}</text>
  <text x="80" y="310" fill="#a1a1aa" font-family="Helvetica,Arial,sans-serif" font-weight="500" font-size="34">NFL takes · AI graded · live clout</text>
  <g transform="translate(80,400)">
    <rect width="320" height="160" rx="20" fill="#1f1f23"/>
    <text x="30" y="60" fill="#22d3ee" font-size="22" font-family="Helvetica,Arial,sans-serif" font-weight="700">CLOUT</text>
    <text x="30" y="130" fill="#fff" font-size="64" font-family="Helvetica,Arial,sans-serif" font-weight="900">${clout}</text>
  </g>
  <g transform="translate(440,400)">
    <rect width="320" height="160" rx="20" fill="#1f1f23"/>
    <text x="30" y="60" fill="#fb923c" font-size="22" font-family="Helvetica,Arial,sans-serif" font-weight="700">STREAK</text>
    <text x="30" y="130" fill="#fff" font-size="64" font-family="Helvetica,Arial,sans-serif" font-weight="900">${streak}d</text>
  </g>
  <g transform="translate(800,400)">
    <rect width="320" height="160" rx="20" fill="#1f1f23"/>
    <text x="30" y="60" fill="#34d399" font-size="22" font-family="Helvetica,Arial,sans-serif" font-weight="700">HIT RATE</text>
    <text x="30" y="130" fill="#fff" font-size="64" font-family="Helvetica,Arial,sans-serif" font-weight="900">${hitRate !== null ? hitRate + '%' : '—'}</text>
  </g>
</svg>`;

  return new Response(svg, {
    headers: {
      'content-type': 'image/svg+xml; charset=utf-8',
      'cache-control': 'public, s-maxage=300',
    },
  });
}

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]!));
}
