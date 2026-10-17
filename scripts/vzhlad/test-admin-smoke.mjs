/**
 * SMOKE TEST ADMINISTRÁCIE — po prepise komponentov sa administrácia stále
 * načíta a editor článkov otvorí článok. NIČ SA NEUKLADÁ.
 *
 * Referenčné Strapi smie dostať len GET, preto sa neprihlasuje (prihlásenie
 * je POST). Relácia redaktora sa podstrčí v prehliadači:
 *   • v localStorage je skúšobný token,
 *   • `/api/users/me` vráti skúšobného redaktora,
 *   • ostatné GET idú do Strapi BEZ tokenu (verejné čítanie); čo by bez
 *     prihlásenia vrátilo 401/403 (komentáre, používatelia…), dostane prázdny
 *     zoznam, aby administrácia reláciu nezhodila,
 *   • akákoľvek iná metóda než GET sa ZAHODÍ a test ju ohlási ako chybu.
 *
 *   node scripts/vzhlad/test-admin-smoke.mjs
 */
import { resolve } from 'node:path';
import { spustiServer } from './server.mjs';
import { KOREN, BACKEND, SIRKY, spustiPrehliadac, novyKontext, ustal, zapis } from './spolocne.mjs';

const PORT = 4302;
const server = await spustiServer({ dist: resolve(KOREN, 'dist'), port: PORT });
const prehliadac = await spustiPrehliadac();
const zapisy = [];
const chyby = [];
let ok = false;
let detail = {};

const POUZIVATEL = { id: 999999, username: 'smoke-test', email: 'smoke@example.invalid', confirmed: true, blocked: false, role: { id: 1, name: 'Authenticated', type: 'authenticated' } };

try {
  const ctx = await novyKontext(prehliadac, SIRKY[0], {
    route: async (c) => {
      await c.route('**/strapi/**', async (r) => {
        const q = r.request();
        if (q.method() !== 'GET' && q.method() !== 'HEAD' && q.method() !== 'OPTIONS') {
          zapisy.push(`${q.method()} ${new URL(q.url()).pathname}`);
          return r.abort('blockedbyclient');
        }
        const u = new URL(q.url());
        if (u.pathname.endsWith('/api/users/me')) return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(POUZIVATEL) });
        const hlavicky = { ...q.headers() };
        delete hlavicky.authorization;
        const o = await r.fetch({ url: `${BACKEND}${u.pathname.replace(/^\/strapi/, '')}${u.search}`, headers: hlavicky });
        if (o.status() === 401 || o.status() === 403) {
          const prazdne = u.pathname.includes('/upload/files') ? '[]' : JSON.stringify({ data: [], meta: { pagination: { page: 1, pageSize: 25, pageCount: 0, total: 0 } } });
          return r.fulfill({ status: 200, contentType: 'application/json', body: prazdne });
        }
        return r.fulfill({ response: o });
      });
      await c.addInitScript(() => { try { localStorage.setItem('hradiska.admin.jwt', 'skusobny-token-smoke'); } catch { /* nič */ } });
    },
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => chyby.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' && !/^Failed to load resource/.test(m.text())) chyby.push(m.text()); });

  await page.goto(`http://127.0.0.1:${PORT}/admin`, { waitUntil: 'load', timeout: 60000 });
  await page.waitForSelector('button[title="Upraviť"]', { timeout: 60000 });
  const riadkov = await page.locator('button[title="Upraviť"]').count();
  const nazov = (await page.locator('button[title="Upraviť"]').first().locator('xpath=ancestor::tr[1]').innerText().catch(() => '')).split('\n')[0];
  await page.locator('button[title="Upraviť"]').first().click();
  /* Editor článku: plátno s nadpisom článku. */
  await page.waitForFunction(() => /Uložiť|Zverejniť|Publikovať/.test(document.body.innerText) && document.querySelectorAll('iframe, [contenteditable="true"], textarea, input').length > 0, null, { timeout: 60000 });
  await ustal(page, { max: 20000 });
  const editor = await page.evaluate(() => ({
    tlacidla: [...document.querySelectorAll('button')].map((b) => b.innerText.trim()).filter((t) => /Uložiť|Zverejniť|Publikovať/.test(t)).slice(0, 4),
    upravitelne: document.querySelectorAll('[contenteditable="true"], iframe').length,
  }));
  zapis('admin-smoke.png', await page.screenshot());
  detail = { riadkovVZozname: riadkov, otvorenyClanok: nazov, editor };
  ok = riadkov > 0 && editor.tlacidla.length > 0 && !zapisy.length && !chyby.length;
  await ctx.close();
} catch (e) {
  chyby.push(`výnimka: ${e.message.split('\n')[0]}`);
} finally {
  await prehliadac.close();
  server.close();
}

zapis('admin-smoke-vysledok.json', { kedy: new Date().toISOString(), ok, ...detail, zahodeneZapisy: zapisy, chyby });
console.log(`[admin] ${ok ? 'OK' : 'ZLYHAL'} — zoznam článkov: ${detail.riadkovVZozname ?? '?'} riadkov, otvorený „${detail.otvorenyClanok ?? '?'}", editor: ${JSON.stringify(detail.editor ?? {})}, zahodené zápisy: ${zapisy.length}${chyby.length ? `, chyby: ${chyby.join(' | ')}` : ''}`);
process.exit(ok ? 0 : 1);
