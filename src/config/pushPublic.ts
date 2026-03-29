/**
 * Web Push applicationServerKey (VAPID public key only).
 * Set VITE_VAPID_PUBLIC_KEY in .env / CI — no key is embedded in production builds.
 */
export function getVapidPublicKey(): string {
  return (import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined)?.trim() ?? '';
}

export function isWebPushConfigured(): boolean {
  return getVapidPublicKey().length > 0;
}
