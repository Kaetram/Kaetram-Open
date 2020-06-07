importScripts('https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-sw.js');

workbox.setConfig({ debug: false });

workbox.core.setCacheNameDetails({
  prefix: 'kaetram',
  suffix: 'v1'
});

// Cache audio
workbox.routing.registerRoute(
  new RegExp('/audio/'),
  new workbox.strategies.CacheFirst({
    cacheName: 'audio',
    plugins: [
      new workbox.expiration.Plugin({
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
      }),
    ],
  })
);

// Cache images
workbox.routing.registerRoute(
  new RegExp('/img/'),
  new workbox.strategies.CacheFirst({
    cacheName: 'images',
    plugins: [
      new workbox.expiration.Plugin({
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
      }),
    ],
  })
);

workbox.routing.registerRoute(
  new RegExp('/data/'),
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'data',
  })
);

// Cache the underlying font files with a cache-first strategy for 1 year.
workbox.routing.registerRoute(
  new RegExp('/fonts/'),
  new workbox.strategies.CacheFirst({
    cacheName: 'fonts',
    plugins: [
      new workbox.cacheableResponse.Plugin({
        statuses: [0, 200],
      }),
      new workbox.expiration.Plugin({
        maxAgeSeconds: 60 * 60 * 24 * 365,
        maxEntries: 30,
      }),
    ],
  })
);

workbox.routing.registerRoute(
  /\.(?:js|css)$/,
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'static-resources',
  })
);

workbox.precaching.precacheAndRoute(self.__WB_MANIFEST);
