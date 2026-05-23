import { NextResponse } from 'next/server';
import { exec, q } from '@/lib/db';

export const runtime = 'edge';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const row = (await q<any>('SELECT * FROM sponsored_takes WHERE id = ?', [params.id])).results[0];
  if (!row) return NextResponse.redirect(new URL('/takes', req.url).toString(), 302);
  // Log click in affiliate_clicks table (book column = sponsor name)
  try {
    await exec(
      'INSERT INTO affiliate_clicks (id, user_email, book, ip_country, ua, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [crypto.randomUUID(), null, `sponsor:${row.sponsor_name}`, req.headers.get('cf-ipcountry'), (req.headers.get('user-agent') || '').slice(0, 200), Date.now()],
    );
  } catch {}
  return NextResponse.redirect(row.sponsor_link, 302);
}
