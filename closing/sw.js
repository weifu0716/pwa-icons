// 珍北平 打烊結算 PWA — Service Worker
// 設計原則：每次改 index.html 都把 SW_VERSION 升一級
// 新 SW 安裝後會：1) 清舊快取  2) 立刻接管  3) 強制所有開著的 PWA 視窗 reload
// 員工最多打開一次就會自動更新到新版，不用清快取、不用重灌
const SW_VERSION = 'closing-v3-2026-04-26-auto-update';

self.addEventListener('install', (event) => {
  // 安裝完立刻準備接管，不等舊 SW 自己離開
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // 1. 砍掉所有舊 Cache Storage
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));

    // 2. 立刻接管所有 client
    await self.clients.claim();

    // 3. 強制所有開啟中的 PWA 視窗 reload（拿到新 HTML）
    const clientList = await self.clients.matchAll({ type: 'window' });
    for (const client of clientList) {
      client.navigate(client.url);
    }
  })());
});

// 導航請求一律走 network-first，永遠拿最新 HTML（避免卡舊頁）
// 跨網域（GAS API）不攔截，直接走網路
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req, { cache: 'no-store' }).catch(() => caches.match(req))
    );
  }
});
