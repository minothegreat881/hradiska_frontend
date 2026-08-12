/*
 * Service worker pre Hradiská.sk PWA.
 * Cieľ: inštalovateľnosť (fetch handler) + rýchle otváranie a offline shell.
 * Stratégia:
 *   - navigácie: network-first → pri výpadku cache '/' → offline.html
 *   - statické (fonty, obrázky, ikony): cache-first (stale-while-revalidate)
 *   - Vite dev moduly/HMR, cross-origin a API: NEZASAHUJEME (pass-through)
 * Verziu CACHE zvýš pri zmene shellu, nech sa starý cache vyčistí.
 */
/* v5: zmena farby lišty (`theme-color`) a manifestu. Zvýšenie verzie zmaže
   na telefónoch celý starý cache — inak by si appka ešte dlho niesla starý
   shell aj s hnedou lištou. */
const CACHE = 'hradiska-v5';
const PRECACHE = [
  '/',
  '/offline.html',
  '/logo_slovanske_hradiska_256.webp',
  '/favicon-192.png',
  '/apple-touch-icon.png',
  '/fonts/cinzel-400-latin.woff2',
  '/fonts/cormorant-400-latin.woff2',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE).catch(() => {})).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Ktoré requesty nechať tak (nech nezasahujeme do dev servera/HMR a cudzích domén).
function bypass(url, req) {
  if (req.method !== 'GET') return true;
  if (url.origin !== self.location.origin) return true; // cross-origin (API, CDN…)
  const p = url.pathname;
  return (
    p.startsWith('/@') ||          // /@vite, /@react-refresh
    p.startsWith('/src/') ||       // dev zdroje
    p.startsWith('/node_modules/') ||
    p.includes('/.vite/') ||
    url.search.includes('t=') ||   // HMR timestampy
    url.search.includes('import')
  );
}

const isAsset = (p) => /\.(woff2?|ttf|otf|png|jpe?g|webp|svg|gif|ico|css|js)$/i.test(p);

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (bypass(url, req)) return; // pass-through na sieť

  // Navigácie (otvorenie stránky) — network-first, offline fallback.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('/', copy)).catch(() => {});
          return res;
        })
        .catch(async () => (await caches.match(req)) || (await caches.match('/')) || (await caches.match('/offline.html')))
    );
    return;
  }

  // Statické súbory — cache-first + tichý update na pozadí.
  if (isAsset(url.pathname)) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const network = fetch(req)
          .then((res) => {
            if (res && res.status === 200) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
            }
            return res;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
  }
});

/* ── Web Push ──────────────────────────────────────────────────────────────
 * Backend (push-subscription service) posiela JSON { title, body, url, notifId }.
 * Klik na notifikáciu otvorí/zaostrí appku na danej URL (default /profil).
 */
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { body: event.data && event.data.text() }; }
  const title = data.title || 'Hradiská.sk';
  const options = {
    body: data.body || '',
    icon: '/favicon-192.png',
    badge: '/favicon-192.png',
    tag: data.notifId || 'hradiska-notif',
    data: { url: data.url || '/profil' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || '/profil';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) {
          client.postMessage({ type: 'notification-click', url: target });
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(target);
    })
  );
});
