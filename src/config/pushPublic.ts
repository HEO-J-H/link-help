/**
 * Demo VAPID public key (pair generated for Link-Help samples).
 * Override with VITE_VAPID_PUBLIC_KEY in production.
 */
const FALLBACK_VAPID_PUBLIC_KEY =
  'BEPApx4g9C_4YKc5MrSKSDP6oLYwYXVXJO6zUE7YDgUcBgowX14QgdwjgMvGKrdLpJUUDyOdsFFUoY_Oi4Dq3t0';

export function getVapidPublicKey(): string {
  const k = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
  return k?.trim() || FALLBACK_VAPID_PUBLIC_KEY;
}
