import { renderBadgeSvg } from '@/lib/badges';

export const runtime = 'edge';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const svg = renderBadgeSvg(params.id, 512);
  return new Response(svg, {
    headers: {
      'content-type': 'image/svg+xml',
      'cache-control': 'public, max-age=86400, immutable',
    },
  });
}
