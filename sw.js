// 御守POS：オフライン用 Service Worker
// 画面や機能を更新したあと、確実に入れ替えたいときは CACHE の数字を上げてください（v1 → v2）
const CACHE = 'omamori-pos-v1';
const ASSETS = [
  './', './index.html', './manual.html', './manifest.json',
  './icon-180.png', './icon-192.png', './icon-512.png', './icon-maskable-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.all(ASSETS.map(a => c.add(a).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 保存済みの内容をすぐ表示し、裏で最新版を取得して次回に反映する
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;
  e.respondWith((async () => {
    const cached = await caches.match(req, { ignoreSearch: true });
    const network = fetch(req).then(res => {
      if (res && res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() => null);
    return cached || (await network) || (await caches.match('./index.html')) || Response.error();
  })());
});
