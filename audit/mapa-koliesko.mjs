/**
 * Koliesko nad mapou: kým sa cez ňu len prechádza, má sa posúvať STRÁNKA;
 * po kliknutí do mapy má približovať MAPA.
 *
 *   node audit/mapa-koliesko.mjs [URL]
 */
import { chromium } from 'playwright';

const BASE = process.argv[2] || 'http://localhost:3000';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(() => localStorage.setItem('cookie-consent', JSON.stringify({ v: 1, ts: Date.now(), analytics: false })));
const p = await ctx.newPage();
await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
await p.waitForSelector('.lmap-canvas', { timeout: 40000 });
await p.locator('.lmap-canvas').scrollIntoViewIfNeeded();
await p.waitForTimeout(6000);

const c = await p.locator('.lmap-canvas').boundingBox();
const stred = [c.x + c.width / 2, c.y + c.height / 2];
const posun = () => p.evaluate(() => Math.round(window.scrollY));

await p.mouse.move(...stred);
const s0 = await posun();
await p.mouse.wheel(0, 400);
await p.waitForTimeout(900);
const s1 = await posun();
console.log(s1 > s0 ? `✔ bez kliknutia sa posúva stránka (${s0} → ${s1})` : `✘ stránka sa neposunula (${s0} → ${s1})`);

/* Späť na mapu, kliknúť a skúsiť znova. */
await p.locator('.lmap-canvas').scrollIntoViewIfNeeded();
await p.waitForTimeout(700);
const c2 = await p.locator('.lmap-canvas').boundingBox();
const stred2 = [c2.x + c2.width / 2, c2.y + c2.height / 2];
await p.mouse.move(...stred2);
await p.mouse.down(); await p.mouse.up();
await p.waitForTimeout(500);
const s2 = await posun();
await p.mouse.wheel(0, -400);
await p.waitForTimeout(900);
const s3 = await posun();
console.log(s3 === s2 ? `✔ po kliknutí koliesko stránkou nehýbe (ostala na ${s3})` : `✘ stránka sa aj po kliknutí posunula (${s2} → ${s3})`);

await b.close();
process.exit((s1 > s0 && s3 === s2) ? 0 : 1);
