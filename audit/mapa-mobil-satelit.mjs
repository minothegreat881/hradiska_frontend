/**
 * Prepínač podkladu na telefóne, priamo z domovskej stránky.
 *
 * Ťuknutie na „Satelit" v bočnom paneli predtým iba otvorilo mapu na celú
 * obrazovku a podklad ostal na reliéfe — poslucháč, ktorý otvára mapu, sedí
 * na koreni sekcie a ťuknutie pohltil skôr, než sa dostalo k tlačidlu.
 *
 *   node audit/mapa-mobil-satelit.mjs [URL]
 */
import { chromium, devices } from 'playwright';

const BASE = process.argv[2] || 'http://localhost:3000';
const b = await chromium.launch();
const ctx = await b.newContext({ ...devices['iPhone 13'], hasTouch: true, isMobile: true });
await ctx.addInitScript(() => localStorage.setItem('cookie-consent', JSON.stringify({ v: 1, ts: Date.now(), analytics: false })));
const p = await ctx.newPage();
await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
await p.waitForSelector('.lmap', { timeout: 40000 });
await p.locator('.lmap').scrollIntoViewIfNeeded();
await p.waitForTimeout(6000);

const stav = () => p.evaluate(() => ({
  sat: document.querySelector('.lmap')?.classList.contains('is-satelit') ?? false,
  full: document.querySelector('.lmap')?.classList.contains('is-full') ?? false,
}));

let zle = 0;
const pred = await stav();
console.log(`pred ťuknutím: podklad ${pred.sat ? 'satelit' : 'reliéf'}, ${pred.full ? 'na celej obrazovke' : 'v stránke'}`);

await p.locator('.lmap-podklad button', { hasText: 'Satelit' }).first().tap();
await p.waitForTimeout(1600);
const po = await stav();
console.log(`po ťuknutí na „Satelit": podklad ${po.sat ? 'satelit' : 'reliéf'}, ${po.full ? 'na celej obrazovke' : 'v stránke'}`);
if (!po.sat) { console.log('✘ podklad sa neprepol'); zle++; } else console.log('✔ podklad sa prepol');
if (po.full) { console.log('✘ ťuknutie navyše otvorilo mapu na celú obrazovku'); zle++; } else console.log('✔ mapa ostala v stránke');

/* A naopak: ťuknutie do samotnej mapy má naďalej otvárať celú obrazovku. */
const c = await p.locator('.lmap-canvas').boundingBox();
await p.touchscreen.tap(c.x + c.width / 2, c.y + c.height / 2);
await p.waitForTimeout(1600);
const potom = await stav();
console.log(potom.full ? '✔ ťuknutie do mapy stále otvára celú obrazovku' : '✘ ťuknutie do mapy už neotvára celú obrazovku');
if (!potom.full) zle++;

await b.close();
process.exit(zle ? 1 : 0);
