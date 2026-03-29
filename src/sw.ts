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
