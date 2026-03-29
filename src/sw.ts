/// <reference lib="webworker" />
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate } from 'workbox-strategies';

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: (string | { url: string; revision: string | null })[];
};

const BASE = import.meta.env.BASE_URL || '/';

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

const navigationHandler = createHandlerBoundToURL(`${BASE}index.html`);
registerRoute(new NavigationRoute(navigationHandler));

registerRoute(
  ({ url }) => url.pathname.includes('/welfare-db/'),
  new StaleWhileRevalidate({
    cacheName: 'welfare-db',
    plugins: [],
  })
);

self.addEventListener('push', (event: PushEvent) => {
  let title = 'Link-Help';
  let body = '';
  try {
    const j = event.data?.json() as { title?: string; body?: string } | null;
    if (j?.title) title = j.title;
    if (j?.body != null) body = String(j.body);
  } catch {
    body = event.data?.text() ?? '';
  }
  const iconUrl = `${BASE}icons/icon.svg`;
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: iconUrl,
      badge: iconUrl,
      data: { url: BASE },
    })
  );
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  const url = (event.notification.data as { url?: string } | undefined)?.url ?? BASE;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const c of clientList) {
        if (c.url && 'focus' in c) return (c as WindowClient).focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
