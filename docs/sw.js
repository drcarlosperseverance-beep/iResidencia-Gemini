const CACHE_NAME = 'iresidencia-offline-v2';
const CORE_FILES = [
  './',
  './index.html',
  './data/meta.json',
  './data/gemini_sync.json'
];
const BANK_FILES = [
  './data/exams.json',
  './data/cat_1.json',
  './data/cat_2.json',
  './data/cat_3.json',
  './data/cat_4.json',
  './data/cat_5.json',
  './data/cat_6.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.allSettled(CORE_FILES.map(u => cache.add(u)))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  const isBank = /\/data\/(cat_\d|exams|meta)\.json/.test(url.pathname);
  if (isBank) {
    event.respondWith(
      caches.match(req, { ignoreSearch: true }).then(cached => {
        if (cached) return cached;
        return fetch(req).then(res => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(req, copy));
          }
          return res;
        });
      })
    );
    return;
  }

  event.respondWith(
    fetch(req).then(res => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(req.url.split('?')[0], copy));
      }
      return res;
    }).catch(() =>
      caches.match(req, { ignoreSearch: true }).then(c => c || caches.match('./index.html'))
    )
  );
});
