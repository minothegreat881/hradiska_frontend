/**
 * Spoločné pre snímky a test administrácie na mobile (`snimky-mobil.mjs`, `test-mobil.mjs`).
 *
 * Prostredie ako pri `test-editor.mjs`: lokálny backend (`http://127.0.0.1:1337`,
 * `hradiska-strapi` s ENV_PATH=.env.lokalne-vzhlad — bez mailov a pushov) a vývojový server
 * webu (`http://127.0.0.1:5190`, `VITE_STRAPI_URL=http://localhost:1337`). Ostrý server nikdy.
 *
 * Token redaktora sa vyrobí ako `users-permissions` `jwt.issue({ id })` (JWT_SECRET z env
 * súboru backendu) a nikam sa nevypisuje.
 */
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { KOREN } from './spolocne.mjs';

const a = process.argv.slice(2);
export const arg = (k, d) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : d; };
export const prepinac = (k) => a.includes(k);

export const BE = resolve(arg('--be', resolve(KOREN, '..', 'hradiska-strapi')));
export const WEB = arg('--web', process.env.VZHLAD_WEB || 'http://127.0.0.1:5190').replace(/\/$/, '');
export const API = arg('--api', process.env.VZHLAD_API || 'http://127.0.0.1:1337').replace(/\/$/, '');
for (const u of [WEB, API]) {
  if (!/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(u)) { console.error(`Smie bežať len lokálne (dostal som ${u}).`); process.exit(2); }
}

const reqBE = createRequire(join(BE, 'package.json'));
export const Database = reqBE('better-sqlite3');
const jwt = reqBE('jsonwebtoken');
const ENV = reqBE('dotenv').parse(readFileSync(join(BE, '.env.lokalne-vzhlad')));
export const DB_CESTA = resolve(BE, ENV.DATABASE_FILENAME || '.tmp/data.db');

export const dbr = new Database(DB_CESTA, { readonly: true, fileMustExist: true });
dbr.pragma('busy_timeout = 5000');

export const ucty = dbr.prepare(`select u.id, u.username from up_users u join up_users_role_lnk l on l.user_id = u.id join up_roles r on r.id = l.role_id
  where coalesce(u.blocked, 0) = 0 and coalesce(u.confirmed, 0) = 1 and r.type = 'authenticated' order by u.id`).all();
if (!ucty.length) { console.error('V DB chýba redaktor (rola authenticated).'); process.exit(2); }
export const token = (id = ucty[0].id) => jwt.sign({ id }, ENV.JWT_SECRET, { expiresIn: '2h' });

export const ZARIADENIA = {
  '390': { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  '768': { width: 768, height: 1024, isMobile: true, hasTouch: true, deviceScaleFactor: 1 },
  '1440': { width: 1440, height: 900, isMobile: false, hasTouch: false, deviceScaleFactor: 1 },
};

export const spi = (ms) => new Promise((r) => setTimeout(r, ms));
export async function cakaj(fn, { max = 20000, krok = 200 } = {}) {
  const koniec = Date.now() + max;
  let v;
  while (Date.now() < koniec) {
    try { v = await fn(); if (v) return v; } catch { v = undefined; }
    await spi(krok);
  }
  return v;
}
export const stabilne = (x) => JSON.stringify(x, (k, v) => (v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort(([p], [q]) => p.localeCompare(q))) : v));

/** Nový kontext prehliadača pre zariadenie; s tokenom je redaktor prihlásený (localStorage, raz za kartu). */
export async function novyKontext(prehliadac, zariadenie, tok) {
  const z = ZARIADENIA[zariadenie];
  const ctx = await prehliadac.newContext({
    viewport: { width: z.width, height: z.height }, deviceScaleFactor: z.deviceScaleFactor, isMobile: z.isMobile, hasTouch: z.hasTouch,
    reducedMotion: 'reduce', serviceWorkers: 'block', locale: 'sk-SK', timezoneId: 'Europe/Bratislava',
  });
  if (tok) await ctx.addInitScript((t) => { try { if (!sessionStorage.getItem('__mobil_tok')) { localStorage.setItem('hradiska.admin.jwt', t); sessionStorage.setItem('__mobil_tok', '1'); } } catch { /* nič */ } }, tok);
  return ctx;
}

/**
 * Konzola stránky: chyby a varovania okrem chýbajúcich súborov lokálnej kópie médií
 * (`Failed to load resource`) a hlásení vývojového servera.
 */
export function sleduj(page, meno, zoznam) {
  page.on('console', (m) => {
    if (m.type() !== 'error' && m.type() !== 'warning') return;
    const t = m.text();
    if (/^Failed to load resource|Download the React DevTools|\[vite\]/.test(t)) return;
    zoznam.push(`${meno} ${m.type()}: ${t.slice(0, 300)}`);
  });
  page.on('pageerror', (e) => zoznam.push(`${meno} pageerror: ${e.message}`));
  page.on('response', (r) => { if (r.status() >= 500) zoznam.push(`${meno} HTTP ${r.status()} ${r.url()}`); });
}

/**
 * Meranie obrazovky administrácie: vodorovné pretečenie stránky (a prvky, ktoré ho robia),
 * malé ciele dotyku, polia s písmom pod 16 px (iOS pri nich zväčšuje stránku).
 * Prvky vo vlastnej posuvnej schránke (overflow-x auto/scroll/hidden) sa neratajú.
 */
export async function zmeraj(page) {
  return page.evaluate(() => {
    const sirka = window.innerWidth;
    const viditelny = (el) => {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return false;
      const s = getComputedStyle(el);
      return s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0.05;
    };
    const vSchranke = (el) => {
      for (let p = el.parentElement; p && p !== document.body && p !== document.documentElement; p = p.parentElement) {
        const o = getComputedStyle(p).overflowX;
        if (o === 'auto' || o === 'scroll' || o === 'hidden' || o === 'clip') return true;
      }
      return false;
    };
    const opis = (el) => {
      const t = (el.getAttribute('aria-label') || el.getAttribute('title') || el.innerText || el.getAttribute('placeholder') || '').trim().replace(/\s+/g, ' ').slice(0, 40);
      const c = typeof el.className === 'string' ? el.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
      return `${el.tagName.toLowerCase()}${c ? '.' + c : ''}${t ? ` „${t}"` : ''}`;
    };
    const pretekajuce = [];
    for (const el of document.body.querySelectorAll('*')) {
      if (el.closest('iframe')) continue;
      const r = el.getBoundingClientRect();
      if (r.right <= sirka + 1 || !viditelny(el) || vSchranke(el)) continue;
      if (getComputedStyle(el).position === 'fixed' && r.left >= sirka) continue;
      const rodic = el.parentElement;
      const rr = rodic?.getBoundingClientRect();
      if (rodic && rr && rr.right > sirka + 1 && !vSchranke(rodic) && rodic !== document.body) continue;
      pretekajuce.push(`${opis(el)} (pravý okraj ${Math.round(r.right)})`);
    }
    const ciele = [...document.querySelectorAll('button, a[href], input:not([type="hidden"]), select, textarea, [role="button"], summary, label:has(> input[type="checkbox"])')]
      .filter((el) => viditelny(el) && !el.closest('[aria-hidden="true"]'));
    const male = ciele.filter((el) => {
      if (el.matches('input[type="checkbox"], input[type="radio"]') && el.closest('label')) return false;
      const r = el.getBoundingClientRect();
      return r.height < 44 || (r.width < 44 && !el.matches('a, label'));
    });
    const polia = [...document.querySelectorAll('input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="range"]):not([type="color"]), textarea, select, [contenteditable="true"], [contenteditable="plaintext-only"]')]
      .filter(viditelny).filter((el) => parseFloat(getComputedStyle(el).fontSize) < 16);
    return {
      sirka,
      scrollWidth: document.documentElement.scrollWidth,
      pretecenie: Math.max(0, document.documentElement.scrollWidth - sirka, document.body.scrollWidth - sirka),
      pretekajuce: pretekajuce.slice(0, 12),
      cielov: ciele.length,
      malychCielov: male.length,
      maleCiele: male.slice(0, 12).map((el) => { const r = el.getBoundingClientRect(); return `${opis(el)} ${Math.round(r.width)}×${Math.round(r.height)}`; }),
      malePismoPoli: polia.length,
      polia: polia.slice(0, 8).map((el) => `${opis(el)} ${getComputedStyle(el).fontSize}`),
    };
  });
}

/* ───────────── DB: odtlačok a návrat vzhľadu ───────────── */

/** Obsah všetkých tabuliek (počet a odtlačok). */
export function odtlacokDb() {
  const t = dbr.prepare("select name from sqlite_master where type='table' and name not like 'sqlite_%' order by name").all().map((r) => r.name);
  const von = {};
  for (const n of t) {
    const h = createHash('sha1');
    let c = 0;
    for (const r of dbr.prepare(`select * from "${n}" order by rowid`).iterate()) { h.update(JSON.stringify(r, (k, v) => (Buffer.isBuffer(v) ? v.toString('base64') : v))); c++; }
    von[n] = { n: c, h: h.digest('hex').slice(0, 16) };
  }
  return von;
}
export function rozdielneTabulky(a, b) {
  return Object.keys({ ...a, ...b }).filter((t) => stabilne(a[t]) !== stabilne(b[t]));
}
