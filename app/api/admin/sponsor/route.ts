import { NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { createSponsoredTake } from '@/lib/sponsor';
import { exec } from '@/lib/db';

export const runtime = 'edge';

const DAY = 86_400_000;

export async function POST(req: Request) {
  const url = new URL(req.url);
  const expected = env().SESSION_SECRET;
  if (!expected || url.searchParams.get('key') !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const form = await req.formData();
  const sponsor_name = String(form.get('sponsor_name') ?? '').trim();
  const sponsor_link = String(form.get('sponsor_link') ?? '').trim();
  const tier = String(form.get('tier') ?? 'bronze') as 'bronze' | 'silver' | 'gold';
  const text = String(form.get('text') ?? '').trim();
  const days = Math.max(1, Math.min(60, Number(form.get('days') ?? 7)));
  if (!sponsor_name || !sponsor_link || !text) {
    return NextResponse.json({ error: 'missing fields' }, { status: 400 });
  }
  const now = Date.now();
  await createSponsoredTake({
    sponsor_name, sponsor_link, tier, text,
    starts_at: now, ends_at: now + days * DAY,
  });
  const appUrl = env().APP_URL ?? new URL(req.url).origin;
  return NextResponse.redirect(`${appUrl}/admin/sponsor?key=${expected}`, 303);
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const expected = env().SESSION_SECRET;
  if (!expected || url.searchParams.get('key') !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const id = url.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await exec('DELETE FROM sponsored_takes WHERE id = ?', [id]);
  return NextResponse.json({ ok: true });
}
