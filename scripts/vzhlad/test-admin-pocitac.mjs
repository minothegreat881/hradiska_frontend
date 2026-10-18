/**
 * ADMINISTRÁCIA NA POČÍTAČI SA NEZMENILA — pixely každej obrazovky na dvoch vývojových
 * serveroch s tým istým lokálnym backendom: A = pôvodný kód (napr. worktree `main`),
 * B = vetva. Šírky 1440 × 900 a 1024 × 768 (najužší počítač — tesne nad prahom tabletu),
 * myš, bez dotyku. Porovnáva sa snímka okna a pri obrazovkách bez plátna aj celá stránka.
 * Plátno editora vzhľadu (zmenšené fotky v okne s mierkou) sa ani pri tom istom kóde nekreslí
 * dvakrát pixel po pixeli rovnako — pri ňom sa porovná snímka so zakrytým plátnom a zvlášť
 * celý DOM okna plátna (stránka webu aj vrstva s lištou a rámikmi).
 *
 *   node scripts/vzhlad/test-admin-pocitac.mjs --web-a http://127.0.0.1:5191 --web-b http://127.0.0.1:5190 [--sirky 1440,1024] [--len regex]
 *
 * `--web-b` = `--web-a` porovná pôvodný kód so sebou (stálosť merania).
 *
 * Nič neukladá okrem konceptu vzhľadu, keď ešte nie je založený (plátno bez neho nie je);
 * ten na konci zmaže a overí, že DB je ako pred testom. Rozdielne snímky:
 * `vystup/admin-pocitac/<sirka>-<obrazovka>-{a,b}.png`.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { VYSTUP, porovnajPng } from './spolocne.mjs';
import { arg, Database, DB_CESTA, dbr, token, spi, cakaj, odtlacokDb, rozdielneTabulky } from './mobil-spolocne.mjs';

const WEB_A = arg('--web-a', 'http://127.0.0.1:5191').replace(/\/$/, '');
const WEB_B = arg('--web-b', 'http://127.0.0.1:5190').replace(/\/$/, '');
for (const u of [WEB_A, WEB_B]) if (!/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(u)) { console.error(`Len lokálne (dostal som ${u}).`); process.exit(2); }
const DIR = join(VYSTUP, 'admin-pocitac');
mkdirSync(DIR, { recursive: true });
const SIRKY = [{ meno: '1440', width: 1440, height: 900 }, { meno: '1024', width: 1024, height: 768 }].filter((x) => arg('--sirky', '1440,1024').split(',').includes(x.meno));
const LEN = arg('--len', null);

const clanok = dbr.prepare("select document_id d from blog_posts where slug = 'lipt-stiavnica-lucny-hrib' and locale = 'sk' and published_at is null").get()?.d
  ?? dbr.prepare("select document_id d from blog_posts where locale = 'sk' and published_at is null order by id limit 1").get().d;
const TOK = token();
const PRED = odtlacokDb();
const PRED_VZHLAD = dbr.prepare('select id from vzhlad_webu').all().map((r) => r.id);
const PRED_SEKV = dbr.prepare('select name, seq from sqlite_sequence').all();
const RAMEC = 'iframe[title="Plátno vzhľadu webu"]';

const OBRAZOVKY = [
  { meno: 'prihlasenie', hash: '#/articles', bezTokenu: true, caka: 'input[type="password"]' },
  { meno: 'clanky', hash: '#/articles', caka: 'button[title="Upraviť"]', ms: 1800 },
  { meno: 'koncepty', hash: '#/drafts' },
  { meno: 'editor-novy', hash: '#/editor', caka: 'iframe[title="Náhľad článku"]', okno: true },
  { meno: 'editor-clanok', hash: `#/editor/${clanok}`, caka: 'iframe[title="Náhľad článku"]', okno: true, ms: 2500 },
  {
    meno: 'editor-clanok-text', hash: `#/editor/${clanok}`, caka: 'iframe[title="Náhľad článku"]', okno: true, ms: 2500,
    krok: async (page) => {
      const f = await (await page.$('iframe[title="Náhľad článku"]')).contentFrame();
      const p = f.locator('[data-block-type="content.rich-text"] p').nth(1);
      await p.scrollIntoViewIfNeeded();
      await p.click();
      await spi(1200);
    },
  },
  { meno: 'vzhlad-domov', hash: '#/vzhlad/domov', platno: true },
  {
    meno: 'vzhlad-vyber', hash: '#/vzhlad/domov', platno: true,
    krok: async (page) => {
      const el = page.frameLocator(RAMEC).locator('[data-vw="dlazdica:typy:refugia"]:visible').first();
      await el.click({ position: { x: 8, y: 8 } });
      await spi(900);
    },
  },
  {
    meno: 'vzhlad-zverejnit', hash: '#/vzhlad/domov', platno: true,
    krok: async (page) => { await page.click('[data-vw-zverejnit]'); await page.waitForSelector('[data-vw-zoznam-zmien]', { timeout: 20000 }); await spi(600); },
  },
  {
    meno: 'vzhlad-menu-dalsie', hash: '#/vzhlad/domov', platno: true,
    krok: async (page) => { await page.click('[data-vw-menu]'); await spi(500); },
  },
  { meno: 'vzhlad-kategoria', hash: '#/vzhlad/kategoria/povesti', platno: true },
  { meno: 'vzhlad-menu', hash: '#/vzhlad/menu', platno: true },
  { meno: 'vzhlad-mobil', hash: '#/vzhlad/domov', platno: true, krok: async (page) => { await page.click('[data-vw-zariadenie="mobil"]'); await spi(2500); } },
  { meno: 'vzhlad-formular', hash: '#/vzhlad/formular', caka: '[data-vw-formular]' },
  {
    meno: 'vzhlad-formular-panel', hash: '#/vzhlad/formular', caka: '[data-vw-formular]',
    krok: async (page) => { await page.click('.apanel-head:has-text("Dlaždice kategórií")'); await spi(700); },
  },
  { meno: 'media', hash: '#/media' },
  { meno: 'kategorie', hash: '#/categories', caka: '[data-cat-row]' },
  { meno: 'kategorie-detail', hash: '#/categories', caka: '[data-cat-row]', krok: async (page) => { await page.locator('[data-cat-row]').nth(2).click(); await spi(700); } },
  { meno: 'stitky', hash: '#/tags' },
  { meno: 'komentare', hash: '#/comments' },
  { meno: 'pripomienky', hash: '#/pripomienky' },
  { meno: 'nahlasenia', hash: '#/nahlasenia' },
  { meno: 'pouzivatelia', hash: '#/users' },
  { meno: 'analytika', hash: '#/analytics' },
  { meno: 'profil', hash: '#/profile' },
];

async function zachyt(prehliadac, web, sirka, o) {
  const ctx = await prehliadac.newContext({
    viewport: { width: sirka.width, height: sirka.height }, deviceScaleFactor: 1, isMobile: false, hasTouch: false,
    reducedMotion: 'reduce', serviceWorkers: 'block', locale: 'sk-SK', timezoneId: 'Europe/Bratislava',
  });
  if (!o.bezTokenu) await ctx.addInitScript((t) => { try { localStorage.setItem('hradiska.admin.jwt', t); } catch { /* nič */ } }, TOK);
  const page = await ctx.newPage();
  page.on('dialog', (d) => d.dismiss().catch(() => {}));
  try {
    await page.goto(`${web}/admin${o.hash}`, { waitUntil: 'load', timeout: 60000 });
    if (o.platno) {
      const kto = await cakaj(async () => ((await page.locator('[data-vw-prazdny]').count()) ? 'prazdny' : (await page.locator(RAMEC).count()) ? 'platno' : null), { max: 60000 });
      if (kto === 'prazdny') await page.click('[data-vw-zalozit]');
      await page.waitForSelector(RAMEC, { timeout: 60000 });
      await cakaj(async () => { const f = await (await page.$(RAMEC))?.contentFrame(); return f && f.evaluate(() => document.querySelectorAll('[data-vw]').length > 20); }, { max: 60000 });
      /* Obrázky plátna: odložené (lazy) stiahnuť hneď, inak by `complete` nikdy nebolo. */
      const f = await (await page.$(RAMEC)).contentFrame();
      await f.evaluate(async () => {
        document.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = 'eager'; });
        const koniec = Date.now() + 20000;
        while (Date.now() < koniec && ![...document.images].every((i) => i.complete)) await new Promise((r) => setTimeout(r, 150));
      });
    } else if (o.caka) await page.waitForSelector(o.caka, { timeout: 60000 });
    try { await page.waitForLoadState('networkidle', { timeout: 15000 }); } catch { /* ďalej */ }
    /* Počty v ponuke sa dopĺňajú zvlášť — počkať, kým sú. */
    await cakaj(() => page.evaluate(() => !document.querySelector('.ad-nav') || document.querySelectorAll('.ad-nav .ad-badge').length >= 3), { max: 15000 });
    await spi(o.ms ?? 1000);
    if (o.krok) await o.krok(page);
    await page.evaluate(async () => {
      document.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = 'eager'; });
      const koniec = Date.now() + 15000;
      while (Date.now() < koniec && ![...document.images].every((i) => i.complete)) await new Promise((r) => setTimeout(r, 150));
      await document.fonts.ready;
    });
    await page.addStyleTag({ content: '*, *::before, *::after { caret-color: transparent !important; }' });
    /* Obrázky (aj v okne plátna) dekódovať; potom snímať, kým dve snímky po sebe nie sú rovnaké
       (zmenšené fotky sa dokresľujú postupne — tak by sa merala rýchlosť stroja, nie kód). */
    for (const fr of page.frames()) {
      await fr.evaluate(() => Promise.all([...document.images].map((i) => (i.naturalWidth ? i.decode().catch(() => {}) : null)))).catch(() => {});
    }
    await spi(500);
    const stala = async (fn) => {
      let pred = await fn();
      for (let i = 0; i < 5; i++) { await spi(400); const d = await fn(); if (d.equals(pred)) return d; pred = d; }
      return pred;
    };
    const maska = o.platno ? [page.locator(RAMEC)] : [];
    const okno = await stala(() => page.screenshot({ animations: 'disabled', caret: 'hide', mask: maska, maskColor: '#ff00ff' }));
    const cela = o.platno || o.okno ? null : await stala(() => page.screenshot({ fullPage: true, animations: 'disabled', caret: 'hide' }));
    const domPlatna = o.platno ? await (await page.$(RAMEC)).contentFrame().then((f) => f.evaluate(() => document.body.innerHTML)) : null;
    return { okno, cela, domPlatna };
  } finally {
    await ctx.close();
  }
}

const prehliadac = await chromium.launch({ args: ['--disable-gpu', '--font-render-hinting=none', '--disable-lcd-text'] });
let spolu = 0, rovnakych = 0;
const rozdiely = [];
try {
  for (const sirka of SIRKY) {
    for (const o of OBRAZOVKY) {
      if (LEN && !new RegExp(LEN).test(o.meno)) continue;
      let a, b, vysl;
      for (let pokus = 1; pokus <= 2; pokus++) {
        a = await zachyt(prehliadac, WEB_A, sirka, o);
        b = await zachyt(prehliadac, WEB_B, sirka, o);
        const po = await porovnajPng(a.okno, b.okno);
        const pc = a.cela ? await porovnajPng(a.cela, b.cela) : a.domPlatna !== null
          ? { rozdiel: a.domPlatna === b.domPlatna ? 0 : 1, dovod: a.domPlatna === b.domPlatna ? undefined : 'DOM plátna sa líši' }
          : { rozdiel: 0 };
        vysl = { okno: po, cela: pc };
        if (po.rozdiel === 0 && pc.rozdiel === 0) break;
      }
      spolu++;
      const ok = vysl.okno.rozdiel === 0 && vysl.cela.rozdiel === 0;
      if (ok) rovnakych++;
      else {
        rozdiely.push(`${sirka.meno} ${o.meno}: okno ${vysl.okno.rozdiel}${vysl.okno.dovod ? ` (${vysl.okno.dovod})` : ''}, celá ${vysl.cela.rozdiel}${vysl.cela.dovod ? ` (${vysl.cela.dovod})` : ''}`);
        const ktora = vysl.okno.rozdiel !== 0 ? 'okno' : a.domPlatna !== null ? 'domPlatna' : 'cela';
        const pripona = ktora === 'domPlatna' ? 'html' : 'png';
        writeFileSync(join(DIR, `${sirka.meno}-${o.meno}-${ktora}-a.${pripona}`), a[ktora]);
        writeFileSync(join(DIR, `${sirka.meno}-${o.meno}-${ktora}-b.${pripona}`), b[ktora]);
      }
      console.log(`[${sirka.meno}] ${ok ? 'ROVNAKÉ ' : 'ROZDIEL'} ${o.meno}${o.platno ? ' (plátno: DOM)' : ''}${ok ? '' : ` — okno ${vysl.okno.rozdiel} px, ${o.platno ? 'DOM plátna' : 'celá'} ${vysl.cela.rozdiel}${vysl.cela.dovod ? ` (${vysl.cela.dovod})` : ''}`}`);
    }
  }
} finally {
  await prehliadac.close();
  const dbw = new Database(DB_CESTA, { fileMustExist: true });
  dbw.pragma('busy_timeout = 5000');
  dbw.transaction(() => {
    const povodne = new Set(PRED_VZHLAD);
    for (const { id } of dbw.prepare('select id from vzhlad_webu').all()) if (!povodne.has(id)) dbw.prepare('delete from vzhlad_webu where id = ?').run(id);
    for (const { name, seq } of PRED_SEKV) dbw.prepare('update sqlite_sequence set seq = ? where name = ?').run(seq, name);
  })();
  dbw.close();
}
const db = rozdielneTabulky(PRED, odtlacokDb());
console.log(`\nVýsledok: rovnaké ${rovnakych} z ${spolu}${rozdiely.length ? `\n  ${rozdiely.join('\n  ')}` : ''}`);
console.log(`DB: ${db.length ? `INÉ TABUĽKY ${db.join(', ')}` : 'obsah všetkých tabuliek ako pred testom'}`);
writeFileSync(join(VYSTUP, 'admin-pocitac-vysledok.json'), JSON.stringify({ kedy: new Date().toISOString(), webA: WEB_A, webB: WEB_B, rovnakych, spolu, rozdiely, db }, null, 1));
dbr.close();
process.exit(rovnakych === spolu && !db.length ? 0 : 1);
