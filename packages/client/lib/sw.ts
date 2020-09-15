/// <reference lib="webworker" />

import { clientsClaim, setCacheNameDetails, skipWaiting } from 'workbox-core';
import { precacheAndRoute } from 'workbox-precaching';

setCacheNameDetails({
    prefix: 'kaetram'
});

skipWaiting();
clientsClaim();

declare const self: Window & ServiceWorkerGlobalScope;

const precacheManifest = [].concat(self.__WB_MANIFEST || []);
precacheAndRoute(precacheManifest);
