/* =========================================================
   sw.js - Lis Noir CARD BATTLE Service Worker
   修正のたびに CACHE_NAME のバージョン番号を上げること（例: v1 → v2）
   ========================================================= */

const CACHE_NAME = 'lisnoir-cache-v17';

// オフラインでも表示できるようキャッシュする静的アセット一覧
const CACHE_ASSETS = [
  './',
  'index.html',
  'cg-game.js',
  'firebase-init.js',
  'manifest.json',
  'hero-bg.jpg',
  'card-fire-dragon.png',
  'card-water-slime.png',
  'card-rock-giant.png',
  'card-nature-wolf.png',
  'card-light-angel.png',
  'card-nature-treant.png',
  'battle-bg-forest.jpg',
  'battle-bg-snow.jpg',
  'battle-bg-cave.jpg',
  'battle-bg-volcano.jpg',
  'battle-bg-castle.jpg',
  'apple-touch-icon.png',
  'icon-192.png',
  'icon-512.png',
  'icon-1024.png',
  'favicon-32.png',
  'favicon-64.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => Promise.all(
      names
        .filter((name) => name !== CACHE_NAME)
        .map((name) => caches.delete(name))
    )).then(() => self.clients.claim())
  );
});

// キャッシュ優先（無ければネットワーク→取得できたらキャッシュに保存）
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          // 同一オリジンの正常なレスポンスのみキャッシュに追加
          if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          // オフラインでキャッシュにも無い場合、HTMLナビゲーションのみindex.htmlへフォールバック
          if (event.request.mode === 'navigate') {
            return caches.match('index.html');
          }
          return undefined;
        });
    })
  );
});
