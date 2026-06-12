const CACHE_NAME = 'menstrual-tides-v4';
const ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/app.js',
  '/js/wave-engine.js',
  '/js/moon.js',
  '/js/cycle.js',
  '/js/audio.js',
  '/js/narratives.js',
  '/js/mark.js',
  '/js/body-poems.js',
  '/js/cycle-line.js',
  '/js/collective.js',
  '/js/spectrum-explorer.js',
  '/js/milestones.js',
  '/js/poster.js',
  '/data/narratives.json',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cached) => {
      return cached || fetch(e.request).then((res) => {
        if (res.ok && e.request.method === 'GET') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        }
        return res;
      });
    }).catch(() => caches.match('/'))
  );
});
