import { NextResponse } from 'next/server';
import { readEmail } from '@/lib/auth';
import { setHandle } from '@/lib/profile';

export const runtime = 'edge';

export async function POST(req: Request) {
  const email = await readEmail();
  if (!email) return NextResponse.json({ error: 'sign in first' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const result = await setHandle(email, String(body.handle ?? ''));
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
