/**
 * Overuje, že okraj karty článku sa pri nabehnutí myšou naozaj rozsvieti.
 *
 * Meria sa vypočítaná farba rámika pred a po nabehnutí — nie prítomnosť
 * pravidla v CSS. Rámik karty už raz prehral s inline štýlom a v kóde to
 * vyzeralo správne.
 *
 *   node audit/karta-nabehnutie.mjs [URL] [cesta]
 */
import { chromium } from 'playwright';

const BASE = process.argv[2] || 'http://localhost:4188';
const CESTA = process.argv[3] || '/blog/arkona-retra-a-ine-pohanske-svatyne-zapadnych-slovanov';

const ZDROJ = 'https://webdesignforhradiskask.vercel.app';

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
/* Náhľad z `dist` nemá proxy na Strapi — bez článkov by sa súvisiace ani
   nenačítali. Ťahá sa preto z nasadenia. */
if (BASE.includes('localhost')) {
  await p.route('**/strapi/**', async (r) => {
    const u = new URL(r.request().url());
    try {
      const res = await fetch(ZDROJ + u.pathname + u.search, { headers: { accept: 'application/json' } });
      r.fulfill({ status: res.status, body: Buffer.from(await res.arrayBuffer()),
                  headers: { 'content-type': res.headers.get('content-type') || 'application/json' } });
    } catch { r.abort(); }
  });
}
await p.goto(BASE + CESTA, { waitUntil: 'domcontentloaded' });

for (let i = 0; i < 12; i++) {
  const x = p.locator('.ck-btn-primary').first();
  if (await x.count() && await x.isVisible()) { await x.click({ force: true }); await p.waitForTimeout(350); }
  if (!(await p.locator('.ck-root').count())) break;
  await p.waitForTimeout(400);
}

/* Súvisiace články sú až na konci — treba sa k nim doscrollovať, inak sa
   karty ani nevykreslia. */
await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await p.waitForTimeout(2500);

const karta = p.locator('.lart-more .article-card').first();
if (!(await karta.count())) { console.log('✘ v súvisiacich článkoch nie je karta'); await b.close(); process.exit(1); }
await karta.scrollIntoViewIfNeeded();
await p.waitForTimeout(600);

const stav = () => karta.evaluate((el) => {
  const cs = getComputedStyle(el);
  return { okraj: cs.borderTopColor, tien: cs.boxShadow };
});

const pokoj = await stav();
await karta.hover();
await p.waitForTimeout(500);
const nabehnute = await stav();

console.log(`  v pokoji:   ${pokoj.okraj}`);
console.log(`  nabehnuté:  ${nabehnute.okraj}`);

const zmenil = pokoj.okraj !== nabehnute.okraj;
const prstenec = nabehnute.tien !== pokoj.tien;
await p.screenshot({ path: 'audit/snimky/karta-nabehnutie.png', clip: await karta.boundingBox() });

console.log(zmenil ? '✔ okraj sa pri nabehnutí mení' : '✘ okraj ostáva rovnaký');
console.log(prstenec ? '✔ prstenec okolo karty pribudol' : '✘ prstenec nepribudol');

await b.close();
process.exit(zmenil && prstenec ? 0 : 1);
