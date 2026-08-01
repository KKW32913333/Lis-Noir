/* =========================================================
   sw.js - Lis Noir CARD BATTLE Service Worker
   修正のたびに CACHE_NAME のバージョン番号を上げること（例: v1 → v2）
   ========================================================= */

const CACHE_NAME = 'lisnoir-cache-v207';

// オフラインでも表示できるようキャッシュする静的アセット一覧
const CACHE_ASSETS = [
  './',
  'index.html',
  'cg-game.js',
  'firebase-init.js',
  'manifest.json',
  'hero-bg.jpg',
  'bgm-main.mp3',
  'leader-lisnoir-f-full.png',
  'leader-lisnoir-f-icon.png',
  'leader-lisnoir-m-full.png',
  'leader-lisnoir-m-icon.png',
  'leader-lisblanc-f-full.png',
  'leader-lisblanc-f-icon.png',
  'leader-luxblanc-m-full.png',
  'leader-luxblanc-m-icon.png',
  'leader-liramaline-full.png',
  'leader-liramaline-icon.png',
  'leader-kaien-full.png',
  'leader-kaien-icon.png',
  'leader-mornabane-full.png',
  'leader-mornabane-icon.png',
  'splash-art.jpg',
  'card-water-aquaslime.png',
  'card-dark-shadowassassin.png',
  'card-light-luminous.png',
  'card-nature-sylph2.png',
  'card-nature-swiftrabbit.png',
  'card-spell-meteorshower.png',
  'card-spell-soulstrike.png',
  'card-water-spiritmaiden.png',
  'card-dark-vampirelord2.png',
  'card-dark-chaosdemon.png',
  'card-dark-voidreaper.png',
  'card-dark-nocturnaldragon.png',
  'card-dark-lunaelf.png',
  'card-dark-nightmarecavalier.png',
  'card-dark-shadowslime.png',
  'card-dark-orbitalgrimoire.png',
  'card-light-shirayuki.png',
  'card-light-lucius.png',
  'card-light-starlightunicorn.png',
  'card-light-stardustwhale.png',
  'card-light-sunblazenoble.png',
  'card-light-whitegriffon.png',
  'card-fire-flarelion.png',
  'card-nature-venomscorpion.png',
  'card-light-lightguardian.png',
  'card-fire-crimson2.png',
  'dragon-egg.png',
  'dragon-baby.png',
  'dragon-young.png',
  'dragon-adult.png',
  'dragon-ancient.png',
  'card-light-arcknight.png',
  'card-equip-aqualance.png',
  'card-field-sanctuary.png',
  'card-field-abyss.png',
  'gacha-icon-nightlegends.png',
  'gacha-icon-lightblessing.png',
  'card-fire-flameslime.png',
  'card-water-leviathan.png',
  'card-water-seiren.png',
  'card-nature-dryad.png',
  'card-nature-emeraldgaia.png',
  'card-light-holyangel.png',
  'card-dark-shadowbat.png',
  'card-fire-phoenixemperor.png',
  'card-fire-bahamut.png',
  'card-dark-nocturia.png',
  'card-spell-healing.png',
  'card-equip-shield.png',
  'card-equip-dragonmail.png',
  'card-spell-iceshard.png',
  'card-field-flamecore.png',
  'card-field-aquadeep.png',
  'card-field-evergrove.png',
  'card-spell-fireball.png',
  'card-equip-ironsword.png',
  'card-spell-mindsurge.png',
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
  'rank-bronze.jpg',
  'rank-silver.jpg',
  'rank-gold.jpg',
  'rank-platinum.jpg',
  'rank-diamond.jpg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // cache.addAll()は既定でブラウザのHTTPキャッシュを経由してしまうことがあり、
        // 修正版を配布したはずなのに古いファイルのままキャッシュされてしまう原因になる。
        // そのため、1件ずつ「必ずネットワークから最新を取得する」形で明示的にキャッシュする。
        return Promise.all(
          CACHE_ASSETS.map((url) =>
            fetch(url, { cache: 'reload' })
              .then((response) => {
                if (response && response.ok) return cache.put(url, response);
              })
              .catch(() => {}) // 1件の取得失敗でインストール全体が失敗しないようにする
          )
        );
      })
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
