import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth';

export const runtime = 'edge';

export async function POST() {
  clearSessionCookie();
  return NextResponse.json({ ok: true });
}
