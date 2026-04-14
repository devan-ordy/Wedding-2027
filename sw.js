// Service worker — minimal offline cache for the app shell.
const CACHE = 'wedding-2027-v1';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './store.js',
  './seeds.js',
  './firebase-config.js',
  './manifest.json',
  './icons/icon.svg',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  // Firestore / Storage / Fonts: network-first, fall back to cache if offline.
  if (url.origin !== location.origin) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }
  // App shell: cache-first.
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((resp) => {
    const copy = resp.clone();
    caches.open(CACHE).then((c) => c.put(e.request, copy));
    return resp;
  })));
});
