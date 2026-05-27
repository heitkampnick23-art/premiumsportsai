'use client';
import { useEffect } from 'react';

// Must match COOKIE in lib/ab.ts — do NOT import from lib/ab (uses next/headers).
const COOKIE = 'psa_ab';

/**
 * Persists the A/B bucket cookie client-side.
 * Rendered by /pricing when the server couldn't find an existing bucket cookie.
 * Next.js 15 forbids cookies().set() in RSC render, so we handle it here.
 */
export function AbBucketInit({
  bucketId,
  variant,
}: {
  bucketId: string;
  variant: string;
}) {
  useEffect(() => {
    const maxAge = 60 * 60 * 24 * 90; // 90 days
    const secure = location.protocol === 'https:' ? '; secure' : '';
    document.cookie = `${COOKIE}=${bucketId}.${variant}; path=/; max-age=${maxAge}; samesite=lax${secure}`;
  }, [bucketId, variant]);
  return null;
}
