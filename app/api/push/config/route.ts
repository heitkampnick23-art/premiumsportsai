import { NextResponse } from 'next/server';
import { env } from '@/lib/env';

export const runtime = 'edge';

export async function GET() {
  return NextResponse.json({ vapidPublic: env().VAPID_PUBLIC_KEY ?? null });
}
