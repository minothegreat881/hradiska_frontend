/**
 * SNÍMKY ADMINISTRÁCIE NA MOBILE A TABLETE — každá obrazovka pri 390×844 a 768×1024
 * (isMobile, hasTouch) a meranie: vodorovné pretečenie, malé ciele dotyku, polia
 * s písmom pod 16 px. Nič neukladá okrem konceptu vzhľadu, keď ešte nie je založený
 * (bez neho by sa plátno nenakreslilo) — ten na konci zmaže a overí, že DB je ako pred
 * snímkami.
 *
 *   node scripts/vzhlad/snimky-mobil.mjs --faza pred|po [--sirky 390,768] [--len regex]
 *
 * Výstup: `vystup/snimky-mobil/<faza>/<sirka>/<nn-obrazovka>.png` a `vystup/snimky-mobil/<faza>-meranie.json`.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { VYSTUP } from './spolocne.mjs';
import {
  arg, WEB, Database, DB_CESTA, dbr, token, novyKontext, sleduj, zmeraj, spi, cakaj, odtlacokDb, rozdielneTabulky,
} from './mobil-spolocne.mjs';

const FAZA = arg('--faza', 'pred');
const SIRKY = arg('--sirky', '390,768').split(',');
const LEN = arg('--len', null);
const DIR = join(VYSTUP, 'snimky-mobil', FAZA);
mkdirSync(DIR, { recursive: true });

const clanok = dbr.prepare("select document_id d from blog_posts where slug = 'devin' and locale = 'sk' and published_at is null").get()?.d
  ?? dbr.prepare("select document_id d from blog_posts where locale = 'sk' and published_at is null order by id limit 1").get().d;
const TOK = token();
const PRED = odtlacokDb();
const PRED_VZHLAD = dbr.prepare('select id from vzhlad_webu').all().map((r) => r.id);
const PRED_SEKV = dbr.prepare('select name, seq from sqlite_sequence').all();

const RAMEC = 'iframe[title="Plátno vzhľadu webu"]';
async function cakajNaPlatno(page) {
  await page.waitForSelector(RAMEC, { timeout: 60000 });
  return cakaj(async () => {
    const f = await (await page.$(RAMEC))?.contentFrame();
    return f && f.evaluate(() => document.querySelectorAll('[data-vw]').length > 20);
  }, { max: 60000 });
}
async function ustal(page, ms = 700) {
  try { await page.waitForLoadState('networkidle', { timeout: 15000 }); } catch { /* ďalej */ }
  await spi(ms);
}
/** V DB sú skutočné e-maily ľudí — na snímke sa prepíšu (len v prehliadači testu, po meraní). */
async function skryEmaily(page) {
  await page.evaluate(() => {
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      if (/@/.test(n.data)) n.data = n.data.replace(/[^\s@]+@[^\s@]+\.[a-z]{2,}/gi, '•••@•••');
    }
    document.querySelectorAll('input').forEach((i) => { if (/@/.test(i.value)) i.value = '•••@•••'; });
  }).catch(() => {});
}
/** Otvorí ponuku administrácie, ak je schovaná za tlačidlom (mobil). */
async function zatvorPonuku(page) {
  if (await page.locator('[data-adm-m-zavriet]').isVisible().catch(() => false)) await page.locator('[data-adm-m-zavriet]').click();
}

const OBRAZOVKY = [
  { meno: 'prihlasenie', hash: '#/articles', bezTokenu: true, caka: 'input[type="password"]' },
  { meno: 'clanky', hash: '#/articles', caka: 'button[title="Upraviť"]' },
  {
    meno: 'ponuka', hash: '#/articles', caka: 'button[title="Upraviť"]',
    krok: async (page) => {
      const t = page.locator('[data-adm-m-ponuka]');
      if (await t.isVisible().catch(() => false)) { await t.click(); await spi(500); return true; }
      return false;
    },
  },
  { meno: 'koncepty', hash: '#/drafts' },
  { meno: 'editor-novy', hash: '#/editor', caka: 'iframe[title="Náhľad článku"]' },
  { meno: 'editor-clanok', hash: `#/editor/${clanok}`, caka: 'iframe[title="Náhľad článku"]', ms: 2500 },
  {
    meno: 'editor-clanok-text', hash: `#/editor/${clanok}`, caka: 'iframe[title="Náhľad článku"]', ms: 2500,
    krok: async (page) => {
      const f = await (await page.$('iframe[title="Náhľad článku"]'))?.contentFrame();
      const p = f && f.locator('[data-block-type="content.rich-text"] p').first();
      if (!p) return false;
      await p.scrollIntoViewIfNeeded().catch(() => {});
      await p.tap().catch(() => p.click());
      await spi(900);
      return true;
    },
  },
  { meno: 'vzhlad-domov', hash: '#/vzhlad/domov', platno: true },
  {
    meno: 'vzhlad-vyber', hash: '#/vzhlad/domov', platno: true,
    krok: async (page) => {
      const el = page.frameLocator(RAMEC).locator('[data-vw="dlazdica:typy:refugia"]:visible').first();
      await el.scrollIntoViewIfNeeded().catch(() => {});
      await el.tap({ position: { x: 8, y: 8 } }).catch(() => el.click({ position: { x: 8, y: 8 } }));
      await spi(800);
      return true;
    },
  },
  {
    meno: 'vzhlad-zverejnit', hash: '#/vzhlad/domov', platno: true,
    krok: async (page) => {
      const t = page.locator('[data-vw-zverejnit]').first();
      if (!(await t.isVisible().catch(() => false))) {
        const m = page.locator('[data-adm-m-viac]');
        if (await m.isVisible().catch(() => false)) await m.click();
      }
      await page.locator('[data-vw-zverejnit]:visible').first().click({ timeout: 5000 }).catch(() => {});
      await page.waitForSelector('[data-vw-zoznam-zmien]', { timeout: 20000 }).catch(() => {});
      await spi(500);
      return true;
    },
  },
  {
    meno: 'vzhlad-historia', hash: '#/vzhlad/domov', platno: true,
    krok: async (page) => {
      await page.locator('[data-vw-menu]:visible').first().click({ timeout: 5000 }).catch(() => {});
      await page.locator('[data-vw-menu-historia]:visible').first().click({ timeout: 5000 }).catch(() => {});
      await page.waitForSelector('[data-vw-historia]', { timeout: 15000 }).catch(() => {});
      await spi(500);
      return true;
    },
  },
  { meno: 'vzhlad-kategoria', hash: '#/vzhlad/kategoria/povesti', platno: true },
  { meno: 'vzhlad-menu', hash: '#/vzhlad/menu', platno: true },
  { meno: 'vzhlad-formular', hash: '#/vzhlad/formular', caka: '[data-vw-formular]' },
  {
    meno: 'vzhlad-formular-panel', hash: '#/vzhlad/formular', caka: '[data-vw-formular]',
    krok: async (page) => { await page.click('.apanel-head:has-text("Dlaždice kategórií")').catch(() => {}); await spi(600); return true; },
  },
  { meno: 'media', hash: '#/media' },
  { meno: 'kategorie', hash: '#/categories', caka: '[data-cat-row]' },
  { meno: 'stitky', hash: '#/tags' },
  { meno: 'komentare', hash: '#/comments' },
  { meno: 'pripomienky', hash: '#/pripomienky' },
  { meno: 'nahlasenia', hash: '#/nahlasenia' },
  { meno: 'pouzivatelia', hash: '#/users' },
  { meno: 'analytika', hash: '#/analytics' },
  { meno: 'profil', hash: '#/profile' },
];

const prehliadac = await chromium.launch({ args: ['--disable-gpu', '--font-render-hinting=none'] });
const meranie = {};
const konzola = [];
try {
  for (const sirka of SIRKY) {
    mkdirSync(join(DIR, sirka), { recursive: true });
    meranie[sirka] = {};
    let i = 0;
    for (const o of OBRAZOVKY) {
      i++;
      if (LEN && !new RegExp(LEN).test(o.meno)) continue;
      const ctx = await novyKontext(prehliadac, sirka, o.bezTokenu ? null : TOK);
      const page = await ctx.newPage();
      sleduj(page, `${sirka} ${o.meno}`, konzola);
      page.on('dialog', (d) => d.dismiss().catch(() => {}));
      const subor = `${String(i).padStart(2, '0')}-${o.meno}`;
      try {
        await page.goto(`${WEB}/admin${o.hash}`, { waitUntil: 'load', timeout: 60000 });
        if (o.platno) {
          /* Vzhľad ešte nie je založený → založiť (koncept sa na konci zmaže). */
          const prazdny = await cakaj(async () => (await page.locator('[data-vw-prazdny]').count()) > 0 || (await page.locator(RAMEC).count()) > 0, { max: 60000 });
          if (prazdny && (await page.locator('[data-vw-prazdny]').count()) > 0) {
            await page.click('[data-vw-zalozit]');
          }
          await cakajNaPlatno(page);
        } else if (o.caka) {
          await page.waitForSelector(o.caka, { timeout: 60000 }).catch(() => {});
        }
        await ustal(page, o.ms ?? 900);
        await zatvorPonuku(page);
        if (o.krok) await o.krok(page);
        const m = await zmeraj(page);
        meranie[sirka][o.meno] = m;
        await skryEmaily(page);
        await page.screenshot({ path: join(DIR, sirka, `${subor}.png`) });
        console.log(`[${FAZA} ${sirka}] ${subor}: pretečenie ${m.pretecenie} px, malých cieľov ${m.malychCielov}/${m.cielov}, polí < 16 px ${m.malePismoPoli}`);
      } catch (e) {
        meranie[sirka][o.meno] = { chyba: String(e.message).split('\n')[0] };
        console.log(`[${FAZA} ${sirka}] ${subor}: CHYBA ${String(e.message).split('\n')[0]}`);
        await page.screenshot({ path: join(DIR, sirka, `${subor}-chyba.png`) }).catch(() => {});
      } finally {
        await ctx.close();
      }
    }
  }
} finally {
  await prehliadac.close();
}

/* Koncept vzhľadu založený kvôli snímkam → preč (aj počítadlo id). */
{
  const dbw = new Database(DB_CESTA, { fileMustExist: true });
  dbw.pragma('busy_timeout = 5000');
  dbw.transaction(() => {
    const povodne = new Set(PRED_VZHLAD);
    for (const { id } of dbw.prepare('select id from vzhlad_webu').all()) if (!povodne.has(id)) dbw.prepare('delete from vzhlad_webu where id = ?').run(id);
    for (const { name, seq } of PRED_SEKV) {
      const mx = dbw.prepare(`select max(rowid) m from "${name}"`).get().m;
      if (mx === null || mx <= seq) dbw.prepare('update sqlite_sequence set seq = ? where name = ?').run(seq, name);
    }
    const znamych = new Set(PRED_SEKV.map((x) => x.name));
    for (const { name } of dbw.prepare('select name from sqlite_sequence').all()) {
      if (!znamych.has(name) && dbw.prepare(`select count(*) n from "${name}"`).get().n === 0) dbw.prepare('delete from sqlite_sequence where name = ?').run(name);
    }
  })();
  dbw.close();
}
const rozdielne = rozdielneTabulky(PRED, odtlacokDb());
writeFileSync(join(VYSTUP, 'snimky-mobil', `${FAZA}-meranie.json`), JSON.stringify({ kedy: new Date().toISOString(), meranie, konzola, dbRozdielne: rozdielne }, null, 1));
console.log(`\nKonzola: ${konzola.length ? konzola.slice(0, 10).join('\n  ') : 'bez chýb'}`);
console.log(`DB po snímkach: ${rozdielne.length ? `INÉ TABUĽKY: ${rozdielne.join(', ')}` : 'obsah všetkých tabuliek ako pred snímkami'}`);
console.log(`Snímky: ${DIR}`);
dbr.close();
process.exit(rozdielne.length ? 1 : 0);
