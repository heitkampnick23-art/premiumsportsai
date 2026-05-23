import { NextResponse } from 'next/server';
import { exec } from '@/lib/db';
import { readEmail } from '@/lib/auth';
import { affiliateUrl, isValidBook } from '@/lib/affiliates';

export const runtime = 'edge';

export async function GET(req: Request, ctx: { params: { book: string } }) {
  return handle(req, ctx);
}
export async function POST(req: Request, ctx: { params: { book: string } }) {
  return handle(req, ctx);
}

async function handle(req: Request, ctx: { params: { book: string } }) {
  const book = ctx.params.book.toLowerCase();
  if (!isValidBook(book)) return NextResponse.json({ error: 'unknown book' }, { status: 404 });
  const email = await readEmail();
  const country = (req.headers.get('cf-ipcountry') || 'XX').toUpperCase();
  const ua = req.headers.get('user-agent') || '';
  try {
    await exec(
      'INSERT INTO affiliate_clicks (id, user_email, book, ip_country, ua, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [crypto.randomUUID(), email, book, country, ua.slice(0, 240), Date.now()],
    );
  } catch { /* non-fatal */ }
  const dest = affiliateUrl(book);
  return NextResponse.redirect(dest, 302);
}
