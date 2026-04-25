// 珍北平 打烊結算 PWA — Service Worker
// 改版必須改 CACHE_VERSION，否則手機上的舊 SW 不會自動更新
const CACHE_VERSION = 'closing-v1-2026-04-25';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './favicon.ico',
  './favicon-96x96.png',
  './apple-touch-icon.png',
  './web-app-manifest-192x192.png',
  './web-app-manifest-512x512.png'
];

// 安裝：預先快取 App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// 啟用：清掉所有舊版快取
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

// 取資料：Network First（優先網路、順便更新快取；失敗退回快取）
// 跨網域 / 非 GET 一律不攔截，讓 GAS API 直走網路
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req).then((cached) => cached || caches.match('./index.html')))
  );
});
