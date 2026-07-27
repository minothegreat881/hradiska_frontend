/**
 * Web Push odber pre prihláseného člena. Nadväzuje na service worker z pwa.ts
 * (`/sw.js`), ktorý má `push` + `notificationclick` handlery.
 *
 * Tok: getVapidKey → Notification.requestPermission → pushManager.subscribe →
 * POST /api/push/subscribe (s JWT). Odhlásenie zruší odber aj na serveri.
 */
const STRAPI_URL = import.meta.env.PROD ? (typeof window !== 'undefined' ? window.location.origin + '/strapi' : '/strapi') : (import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337');

export function pushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export function pushPermission(): NotificationPermission {
  return typeof Notification !== 'undefined' ? Notification.permission : 'denied';
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function getVapidKey(): Promise<string> {
  const res = await fetch(`${STRAPI_URL}/api/push/vapid-public-key`);
  const json = await res.json();
  return json?.key || '';
}

/** Zapne push notifikácie: vyžiada povolenie, zaregistruje odber, uloží na server. */
export async function enablePush(token: string): Promise<{ ok: boolean; reason?: string }> {
  if (!pushSupported()) return { ok: false, reason: 'unsupported' };
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return { ok: false, reason: 'denied' };

  const key = await getVapidKey();
  if (!key) return { ok: false, reason: 'no-vapid' };

  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key),
    });
  }
  const res = await fetch(`${STRAPI_URL}/api/push/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ data: { subscription: sub.toJSON(), userAgent: navigator.userAgent } }),
  });
  return { ok: res.ok };
}

/** Vypne push: zruší odber v prehliadači aj na serveri. */
export async function disablePush(token: string): Promise<void> {
  if (!pushSupported()) return;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;
  const endpoint = sub.endpoint;
  try { await sub.unsubscribe(); } catch { /* ignore */ }
  await fetch(`${STRAPI_URL}/api/push/unsubscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ data: { endpoint } }),
  }).catch(() => { /* best-effort */ });
}

/** Je toto zariadenie práve prihlásené na push? */
export async function isPushEnabled(): Promise<boolean> {
  if (!pushSupported() || pushPermission() !== 'granted') return false;
  const reg = await navigator.serviceWorker.ready;
  return !!(await reg.pushManager.getSubscription());
}
