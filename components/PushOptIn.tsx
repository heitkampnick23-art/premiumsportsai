'use client';
import { useEffect, useState } from 'react';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

export function PushOptIn() {
  const [status, setStatus] = useState<'idle' | 'subscribed' | 'unsupported' | 'denied' | 'no-key'>('idle');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) setStatus('unsupported');
    else if (Notification.permission === 'denied') setStatus('denied');
  }, []);

  async function subscribe() {
    setBusy(true);
    try {
      const cfgR = await fetch('/api/push/config');
      const cfg = await cfgR.json();
      if (!cfg.vapidPublic) { setStatus('no-key'); return; }
      const reg = await navigator.serviceWorker.register('/sw.js');
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') { setStatus('denied'); return; }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(cfg.vapidPublic),
      });
      const json = sub.toJSON();
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          endpoint: json.endpoint,
          p256dh: json.keys?.p256dh,
          auth: json.keys?.auth,
          topics: ['pregame', 'injury', 'grade'],
        }),
      });
      setStatus('subscribed');
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  if (status === 'unsupported') return <p className="text-xs text-zinc-500">Push isn't supported in this browser.</p>;
  if (status === 'denied') return <p className="text-xs text-zinc-500">Notifications blocked — enable in browser settings.</p>;
  if (status === 'no-key') return <p className="text-xs text-zinc-500">Push not configured (VAPID_PUBLIC_KEY missing).</p>;
  if (status === 'subscribed') return <p className="text-sm text-emerald-300">Push notifications enabled.</p>;

  return (
    <button onClick={subscribe} disabled={busy} className="btn-ghost disabled:opacity-50">
      {busy ? '…' : 'Enable push: pre-game · injury · take-grade'}
    </button>
  );
}
