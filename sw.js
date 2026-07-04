// すたログ Service Worker — オフラインでも起動できるようにする
const CACHE = 'stalog-v7';
const ASSETS = [
  './',
  './index.html',
  './guide.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './icon-180.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return; // Google Fonts 等はブラウザにまかせる

  if (e.request.mode === 'navigate') {
    // アプリ本体はネット優先(更新をすぐ届ける)、オフライン時はキャッシュ
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
          return res;
        })
        .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
    );
  } else {
    // アイコン等はキャッシュ優先
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request))
    );
  }
});
