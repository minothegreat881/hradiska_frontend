/**
 * Malý server pre testy vzhľadu — robí to isté, čo `vercel.json`:
 *   • `/strapi/*` → backend (predvolene referenčné Strapi `http://localhost:1338`),
 *   • súbor z `dist`, ak existuje; priečinok s `index.html` (prerender ukladá
 *     stránky ako `dist/blog/<slug>/index.html`) sa servíruje na svojej ceste,
 *   • inak `dist/index.html` (prepis `/(.*)` → `/index.html`).
 *
 * Voliteľne podstrčí vzhľad: `vzhlad` = cesta k JSON súboru, ktorý server vráti
 * na `/api/vzhlad-webu` aj `/strapi/api/vzhlad-webu` (s ETagom `"v<verzia>"`
 * a 304 pri zhode). Tak sa dá vyskúšať aj vloženie do HTML pri builde
 * (`PRERENDER_STRAPI_URL` na tento server) bez backendu, ktorý endpoint má.
 *
 * Do backendu ide len to, čo príde od prehliadača; server nič nezapisuje.
 *
 *   node scripts/vzhlad/server.mjs --dist dist --port 4302 [--backend http://localhost:1338] [--vzhlad subor.json]
 */
import http from 'node:http';
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const TYPY = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml', '.pbf': 'application/x-protobuf', '.geojson': 'application/geo+json', '.mp4': 'video/mp4',
};

export function spustiServer({ dist, port, backend = 'http://localhost:1338', vzhlad = null, ticho = true }) {
  const koren = dist ? resolve(dist) : null;
  const ciel = new URL(backend);

  const vratVzhlad = (req, res) => {
    const telo = readFileSync(vzhlad, 'utf8');
    let verzia = 0;
    try { verzia = JSON.parse(telo).verzia ?? 0; } catch { /* zlý súbor je tiež test */ }
    const etag = `"v${verzia}"`;
    if (req.headers['if-none-match'] === etag) { res.writeHead(304, { ETag: etag }); res.end(); return; }
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', ETag: etag, 'Cache-Control': 'no-store' });
    res.end(telo);
  };

  const proxy = (req, res, cesta) => {
    const p = http.request({
      hostname: ciel.hostname, port: ciel.port || 80, path: cesta, method: req.method,
      headers: { ...req.headers, host: ciel.host },
    }, (o) => { res.writeHead(o.statusCode || 502, o.headers); o.pipe(res); });
    p.on('error', () => { if (!res.headersSent) res.writeHead(502); res.end(); });
    req.pipe(p);
  };

  const subor = (res, f) => {
    res.writeHead(200, { 'Content-Type': TYPY[extname(f).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    createReadStream(f).pipe(res);
  };

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    const cesta = decodeURIComponent(url.pathname);
    if (vzhlad && (cesta === '/api/vzhlad-webu' || cesta === '/strapi/api/vzhlad-webu')) return vratVzhlad(req, res);
    if (cesta.startsWith('/strapi/')) return proxy(req, res, req.url.slice('/strapi'.length));
    if (!koren) return proxy(req, res, req.url);   // čistý backend (napr. pre prerender)
    const f = normalize(join(koren, cesta));
    if (!f.startsWith(koren + sep) && f !== koren) { res.writeHead(403); res.end(); return; }
    try {
      if (existsSync(f) && statSync(f).isFile()) return subor(res, f);
      const idx = join(f, 'index.html');
      if (existsSync(idx)) return subor(res, idx);
    } catch { /* ďalej na index.html */ }
    return subor(res, join(koren, 'index.html'));
  });
  return new Promise((ok) => server.listen(port, '127.0.0.1', () => {
    if (!ticho) console.log(`[server] http://127.0.0.1:${port}  dist=${koren ?? '—'}  backend=${backend}${vzhlad ? `  vzhlad=${vzhlad}` : ''}`);
    ok(server);
  }));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const a = process.argv.slice(2);
  const arg = (k, d = null) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : d; };
  await spustiServer({
    dist: arg('--dist'), port: Number(arg('--port', '4302')), backend: arg('--backend', 'http://localhost:1338'),
    vzhlad: arg('--vzhlad'), ticho: false,
  });
}
