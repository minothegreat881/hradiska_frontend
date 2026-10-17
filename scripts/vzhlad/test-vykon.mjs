/**
 * TEST VÝKONU (plán, časť 10.6).
 *
 *   1. Hlavný verejný balík (vstupný chunk z `dist/index.html`) po gzip:
 *      nový smie byť najviac o 15 kB väčší než dnešný.
 *   2. LCP domovskej (Largest Contentful Paint) — Lighthouse tu nie je, meria
 *      sa cez Performance API v Chromiu (Playwright): 5 behov na web a šírku,
 *      striedavo dnešný / nový, medián. Nový nesmie byť horší; meranie má
 *      šum, preto sa toleruje max(50 ms, 5 %).
 *
 *   node scripts/vzhlad/test-vykon.mjs [--behy 5]
 */
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join, resolve } from 'node:path';
import { spustiServer } from './server.mjs';
import { KOREN, SIRKY, spustiPrehliadac, novyKontext, zapis } from './spolocne.mjs';

const a = process.argv.slice(2);
const BEHY = Number((a.includes('--behy') ? a[a.indexOf('--behy') + 1] : null) || 5);
const DIST_DNES = resolve(KOREN, '..', 'hradiska-web-zaklad', 'dist');
const DIST_NOVY = resolve(KOREN, 'dist');
const STROP_KB = 15;

function hlavnyBalik(dist) {
  const html = readFileSync(join(dist, 'index.html'), 'utf8');
  const m = html.match(/<script type="module"[^>]*src="(\/assets\/[^"]+\.js)"/);
  if (!m) throw new Error(`v ${dist}/index.html nie je vstupný skript`);
  const kod = readFileSync(join(dist, m[1]));
  return { subor: m[1], bajtov: kod.length, gzip: gzipSync(kod).length };
}

const balikDnes = hlavnyBalik(DIST_DNES);
const balikNovy = hlavnyBalik(DIST_NOVY);
const narast = (balikNovy.gzip - balikDnes.gzip) / 1024;
const balikOk = narast <= STROP_KB;
console.log(`[výkon] hlavný balík gzip: dnes ${(balikDnes.gzip / 1024).toFixed(2)} kB (${balikDnes.subor}), nový ${(balikNovy.gzip / 1024).toFixed(2)} kB (${balikNovy.subor}) → ${narast >= 0 ? '+' : ''}${narast.toFixed(2)} kB (strop +${STROP_KB} kB) ${balikOk ? 'OK' : 'PREKROČENÉ'}`);

const servery = [await spustiServer({ dist: DIST_DNES, port: 4301 }), await spustiServer({ dist: DIST_NOVY, port: 4302 })];
const prehliadac = await spustiPrehliadac();

async function lcp(port, sirka) {
  const ctx = await novyKontext(prehliadac, sirka);
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    window.__lcp = 0;
    window.__lcpPrvok = '';
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) {
        if (e.startTime >= window.__lcp) {
          window.__lcp = e.startTime;
          window.__lcpPrvok = e.element ? `${e.element.tagName.toLowerCase()}.${String(e.element.className || '').split(' ')[0]}` : '';
        }
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  });
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'load' });
  try { await page.waitForLoadState('networkidle', { timeout: 20000 }); } catch { /* ide sa ďalej */ }
  await page.waitForTimeout(1500);
  const v = await page.evaluate(() => ({ lcp: window.__lcp, prvok: window.__lcpPrvok }));
  await ctx.close();
  return v;
}

const median = (x) => { const s = [...x].sort((p, q) => p - q); return s[Math.floor(s.length / 2)]; };
const lcpVysledky = {};
let lcpOk = true;
try {
  /* Zahriatie: prvé načítanie servera a Strapi býva pomalšie pre oba weby. */
  await lcp(4301, SIRKY[0]); await lcp(4302, SIRKY[0]);
  for (const sirka of SIRKY) {
    const dnes = []; const novy = []; const prvky = new Set();
    for (let i = 0; i < BEHY; i++) {
      const d = await lcp(4301, sirka); dnes.push(d.lcp); prvky.add(`dnes: ${d.prvok}`);
      const n = await lcp(4302, sirka); novy.push(n.lcp); prvky.add(`nový: ${n.prvok}`);
    }
    const md = median(dnes); const mn = median(novy);
    const tolerancia = Math.max(50, md * 0.05);
    const ok = mn <= md + tolerancia;
    lcpOk &&= ok;
    lcpVysledky[sirka.meno] = { dnes: dnes.map(Math.round), novy: novy.map(Math.round), medianDnes: Math.round(md), medianNovy: Math.round(mn), tolerancia: Math.round(tolerancia), ok, prvky: [...prvky] };
    console.log(`[výkon] LCP domovskej ${sirka.meno}: dnes ${dnes.map(Math.round).join('/')} ms (medián ${Math.round(md)}), nový ${novy.map(Math.round).join('/')} ms (medián ${Math.round(mn)}) ${ok ? 'OK' : 'HORŠÍ'}`);
  }
} finally {
  await prehliadac.close();
  servery.forEach((s) => s.close());
}

zapis('vykon-vysledok.json', {
  kedy: new Date().toISOString(),
  balik: { dnes: balikDnes, novy: balikNovy, narastKb: Number(narast.toFixed(2)), stropKb: STROP_KB, ok: balikOk },
  lcp: lcpVysledky,
});
process.exit(balikOk && lcpOk ? 0 : 1);
