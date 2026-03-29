import { getVapidPublicKey } from '@/config/pushPublic';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) output[i] = rawData.charCodeAt(i);
  return output;
}

export async function subscribeWebPush(): Promise<PushSubscription> {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service workers are not supported');
  }
  const reg = await navigator.serviceWorker.ready;
  const key = getVapidPublicKey();
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(key),
  });
  return sub;
}

export async function unsubscribeWebPush(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return false;
  return sub.unsubscribe();
}

export async function postPushSubscription(baseUrl: string, subscription: PushSubscription): Promise<void> {
  const root = baseUrl.replace(/\/$/, '');
  const res = await fetch(`${root}/push/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    mode: 'cors',
    body: JSON.stringify({ subscription: subscription.toJSON() }),
  });
  if (!res.ok) throw new Error(`subscribe HTTP ${res.status}`);
}
