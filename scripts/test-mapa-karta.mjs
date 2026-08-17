/**
 * Overuje, že sa z karty lokality dá dostať na článok.
 *
 * Karta sa otvára prejdením po bode a leží MIMO plátna mapy. Presun kurzora
 * z bodu na kartu tak plátno vidí ako „odchod myši" — a keď sa na to karta
 * zavrie, na odkaz „Čítať článok" sa nedá kliknúť.
 *
 *   node scripts/test-mapa-karta.mjs [URL]
 */
import { chromium } from 'playwright';

const URL = process.argv[2] || 'http://localhost:4188/';

const plynule = async (p, zx, zy, kx, ky, krokov = 18) => {
  await p.mouse.move(zx, zy);
  for (let i = 1; i <= krokov; i++) {
    await p.mouse.move(zx + (kx - zx) * i / krokov, zy + (ky - zy) * i / krokov);
    await p.waitForTimeout(28);
  }
};

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
await p.goto(URL, { waitUntil: 'domcontentloaded' });
for (let i = 0; i < 3; i++) {
  const x = p.locator('.ck-btn-primary').first();
  if (await x.count() && await x.isVisible()) { await x.click({ force: true }); await p.waitForTimeout(300); }
  else break;
}
await p.waitForSelector('.lmap-pin', { timeout: 40000 });
await p.locator('.lmap-canvas').scrollIntoViewIfNeeded();
await p.waitForTimeout(4000);

/* Bod, ktorý naozaj leží na plátne — po prípadnom posune časť z nich vyjde
   mimo, pod bočný panel, a tam by ho myš nikdy nenašla. */
const cb = await p.locator('.lmap-canvas').boundingBox();
let pin = null;
const body = p.locator('.lmap-pin');
for (let i = 0, n = await body.count(); i < n && !pin; i++) {
  const r = await body.nth(i).boundingBox();
  if (!r) continue;
  const x = r.x + r.width / 2, y = r.y + r.height / 2;
  if (x > cb.x + 60 && x < cb.x + cb.width - 60 && y > cb.y + 60 && y < cb.y + cb.height - 60) pin = r;
}
if (!pin) { console.log('✘ na plátne nie je použiteľný bod'); await b.close(); process.exit(1); }

const px = pin.x + pin.width / 2, py = pin.y + pin.height / 2;
await plynule(p, px - 130, py - 130, px, py);
await p.waitForTimeout(700);
if (!(await p.locator('.lmap-card').count())) { console.log('✘ karta sa neotvorila'); await b.close(); process.exit(1); }
console.log('✔ karta sa otvorila');

const cta = p.locator('.lmap-card-cta').first();
const cr = await cta.boundingBox();
if (!cr) { console.log('✘ odkaz „Čítať článok" nemá polohu'); await b.close(); process.exit(1); }
await plynule(p, px, py, cr.x + cr.width / 2, cr.y + cr.height / 2);
await p.waitForTimeout(500);

const zostala = await p.locator('.lmap-card').count();
console.log(zostala ? '✔ karta ostala otvorená pri prechode na odkaz' : '✘ karta zmizla skôr, než sa dalo kliknúť');
if (!zostala) { await b.close(); process.exit(1); }

await p.mouse.down(); await p.mouse.up();
await p.waitForTimeout(3500);
const url = p.url();
console.log(url.includes('/blog/') ? `✔ otvoril sa článok: ${url.replace(/^https?:\/\/[^/]+/, '')}` : `✘ článok sa neotvoril (${url})`);
await b.close();
process.exit(url.includes('/blog/') ? 0 : 1);
