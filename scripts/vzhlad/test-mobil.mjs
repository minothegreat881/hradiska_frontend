/**
 * TEST ADMINISTRÁCIE NA TELEFÓNE — Playwright 390×844 (isMobile, hasTouch) proti lokálnemu
 * backendu (`http://127.0.0.1:1337`, `hradiska-strapi` s ENV_PATH=.env.lokalne-vzhlad — bez
 * mailov a pushov) a vývojovému serveru webu (`http://127.0.0.1:5190`). Ostrý server nikdy.
 *
 *   1. každá obrazovka administrácie: stránka sa nedá posunúť do strán, v konzole nie je chyba,
 *   2. ponuka v zásuvke: tlačidlo, výber obrazovky, clona, Esc, krížik,
 *   3. editor vzhľadu: náhľad Mobil predvolene, spodný list (klepnutie aj ťahanie), výber dlaždice
 *      klepnutím, popisok SK priamo v stránke, posun tlačidlom v lište, ťahanie prstom za úchyt,
 *      potiahnutie prstom po stránke ju posúva (nič neťahá), uloženie, zverejnenie, verejná stránka,
 *      história → obnovenie → zverejnenie → verejná stránka ako na začiatku; jazyk, obrázok, mazanie
 *      a skrytie sú dosiahnuteľné prstom,
 *   4. klasická úprava (#/vzhlad/formular): jedna zmena, zverejnenie, návrat, zverejnenie,
 *   5. editor článku: otvoriť, upraviť odsek, vymeniť titulnú fotku, uložiť koncept — v DB sa
 *      zmení len upravený odsek a titulná fotka, ostatný obsah ostane bajt po bajte,
 *   6. na konci je obsah všetkých tabuliek DB ako pred testom (porovnanie ako `test-editor.mjs`).
 *
 * Test mení lokálnu DB (koncept a verzie vzhľadu, poradie kategórií pri zverejnení, koncept
 * článku). Pred testom si odloží obsah tabuliek, ktorých sa to týka, a na konci ich vráti
 * riadok po riadku; potom porovná odtlačok VŠETKÝCH tabuliek s odtlačkom pred testom.
 *
 *   node scripts/vzhlad/test-mobil.mjs [--be C:/…/hradiska-strapi] [--web http://127.0.0.1:5190]
 *                                      [--api http://127.0.0.1:1337] [--bez-snimok]
 *
 * Výsledok: `vystup/test-mobil-vysledok.txt`, snímky `vystup/snimky-mobil/test/`.
 */
import { appendFileSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { VYSTUP } from './spolocne.mjs';
import {
  WEB, API, BE, Database, DB_CESTA, dbr, ucty, token, novyKontext, spi, cakaj, stabilne, odtlacokDb, rozdielneTabulky, prepinac,
} from './mobil-spolocne.mjs';

const SNIMKY = !prepinac('--bez-snimok');
const SNIMKY_DIR = join(VYSTUP, 'snimky-mobil', 'test');
mkdirSync(SNIMKY_DIR, { recursive: true });
const VYSLEDOK = join(VYSTUP, 'test-mobil-vysledok.txt');
writeFileSync(VYSLEDOK, `Test administrácie na telefóne — ${new Date().toISOString()} — web ${WEB}, api ${API}\n`);
const log = (s) => { console.log(s); appendFileSync(VYSLEDOK, s + '\n'); };

let pocet = 0, preslo = 0;
const zlyhane = [];
function over(nazov, ok, detail = '') {
  pocet++;
  if (ok) { preslo++; log(`  ok    ${nazov}`); } else { zlyhane.push(nazov); log(`  CHYBA ${nazov}${detail ? ` — ${String(detail).slice(0, 500)}` : ''}`); }
  return !!ok;
}
const sekcia = (s) => log(`\n## ${s}`);
const TOK = token(ucty[0].id);

/* ───────────── Odloženie a návrat tabuliek ───────────── */

/** Tabuľky, ktoré test môže zmeniť: vzhľad a jeho história, poradie kategórií a galéria
    (zverejnenie), koncept článku (bloky, komponenty, väzby, súbory). */
const DOTKNUTE = /^(vzhlad_webu|vzhlad_webu_verzie|blog_categories|domovska_galeria|files|files_related_mph|files_folder_lnk|blog_posts|blog_posts_.+|components_.+|strapi_history_versions|upload_folders.*)$/;
function odlozTabulky() {
  const t = dbr.prepare("select name from sqlite_master where type='table' and name not like 'sqlite_%' order by name").all().map((r) => r.name).filter((n) => DOTKNUTE.test(n));
  const von = {};
  for (const n of t) {
    const stlpce = dbr.prepare(`pragma table_info("${n}")`).all().map((c) => c.name);
    if (!stlpce.includes('id')) throw new Error(`Tabuľka ${n} nemá stĺpec id — test ju nevie vrátiť.`);
    von[n] = { stlpce, riadky: new Map(dbr.prepare(`select * from "${n}" order by id`).all().map((r) => [r.id, r])) };
  }
  return von;
}
/** Vráti odložené tabuľky: riadky navyše zmaže, zmenené a chýbajúce vloží v pôvodnom tvare (s pôvodným id). */
function vratTabulky(odlozene, sekvencie) {
  const dbw = new Database(DB_CESTA, { fileMustExist: true });
  dbw.pragma('busy_timeout = 10000');
  const zmenene = [];
  dbw.transaction(() => {
    for (const [n, { stlpce, riadky }] of Object.entries(odlozene)) {
      let zm = 0;
      const teraz = dbw.prepare(`select * from "${n}" order by id`).all();
      const zmaz = dbw.prepare(`delete from "${n}" where id = ?`);
      const vloz = dbw.prepare(`insert or replace into "${n}" (${stlpce.map((c) => `"${c}"`).join(', ')}) values (${stlpce.map((c) => `@${c}`).join(', ')})`);
      const videne = new Set();
      for (const r of teraz) {
        videne.add(r.id);
        const pred = riadky.get(r.id);
        if (!pred) { zmaz.run(r.id); zm++; } else if (JSON.stringify(pred) !== JSON.stringify(r)) { vloz.run(pred); zm++; }
      }
      for (const [id, r] of riadky) if (!videne.has(id)) { vloz.run(r); zm++; }
      if (zm) zmenene.push(`${n} (${zm})`);
    }
    for (const { name, seq } of sekvencie) dbw.prepare('update sqlite_sequence set seq = ? where name = ?').run(seq, name);
    const znamych = new Set(sekvencie.map((x) => x.name));
    for (const { name } of dbw.prepare('select name from sqlite_sequence').all()) if (!znamych.has(name)) dbw.prepare('delete from sqlite_sequence where name = ?').run(name);
  })();
  dbw.close();
  return zmenene;
}

async function api(metoda, cesta, { tok = TOK, telo } = {}) {
  const h = {};
  if (tok) h.Authorization = `Bearer ${tok}`;
  if (telo !== undefined) h['Content-Type'] = 'application/json';
  const r = await fetch(API + cesta, { method: metoda, headers: h, body: telo === undefined ? undefined : JSON.stringify(telo) });
  const text = await r.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = null; }
  return { status: r.status, json };
}
const koncept = async () => (await api('GET', '/api/vzhlad-webu/koncept')).json;
const verejny = async () => (await api('GET', '/api/vzhlad-webu', { tok: null })).json;

/* ───────────── Prehliadač ───────────── */

const prehliadac = await chromium.launch({ args: ['--disable-gpu', '--font-render-hinting=none'] });
const chyby = [];
const varovania = [];
function sleduj(page, meno) {
  page.on('console', (m) => {
    const t = m.text();
    if (/^Failed to load resource|Download the React DevTools|\[vite\]/.test(t)) return;
    if (m.type() === 'error') chyby.push(`${meno}: ${t.slice(0, 300)}`);
    else if (m.type() === 'warning') varovania.push(`${meno}: ${t.slice(0, 200)}`);
  });
  page.on('pageerror', (e) => chyby.push(`${meno} pageerror: ${e.message}`));
  page.on('response', (r) => { if (r.status() >= 500) chyby.push(`${meno} HTTP ${r.status()} ${r.url()}`); });
}
async function otvor(hash, { meno = hash, tok = TOK, zariadenie = '390' } = {}) {
  const ctx = await novyKontext(prehliadac, zariadenie, tok);
  const page = await ctx.newPage();
  sleduj(page, meno);
  const s = { ctx, page, dialogy: [], odpoved: 'prijat' };
  page.on('dialog', (d) => { s.dialogy.push(d.type()); (s.odpoved === 'zrusit' ? d.dismiss() : d.accept()).catch(() => {}); });
  await page.goto(`${WEB}/admin${hash}`, { waitUntil: 'load', timeout: 60000 });
  return s;
}
async function snimka(page, meno) {
  if (!SNIMKY) return;
  await spi(250);
  /* V DB sú skutočné e-maily ľudí — na snímke sa prepíšu (len v prehliadači testu). */
  await page.evaluate(() => {
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) if (/@/.test(n.data)) n.data = n.data.replace(/[^\s@]+@[^\s@]+\.[a-z]{2,}/gi, '•••@•••');
    document.querySelectorAll('input').forEach((i) => { if (/@/.test(i.value)) i.value = '•••@•••'; });
  }).catch(() => {});
  await page.screenshot({ path: join(SNIMKY_DIR, `${meno}.png`) }).catch(() => {});
}
/** Dá sa stránka posunúť do strán? (pokus o posun + šírka dokumentu) */
async function pretecenie(page) {
  return page.evaluate(() => {
    window.scrollTo(4000, window.scrollY);
    const x = window.scrollX;
    window.scrollTo(0, window.scrollY);
    return { x, sirka: window.innerWidth, doc: document.documentElement.scrollWidth, telo: document.body.scrollWidth };
  });
}
const bezPretecenia = (p) => p.x === 0 && p.doc <= p.sirka && p.telo <= p.sirka;

/* Dotyk cez CDP (Playwright má len `tap`): touchStart → touchMove → touchEnd. */
async function dotykTah(page, z, na, { krokov = 14, cakat = 40 } = {}) {
  const cdp = await page.context().newCDPSession(page);
  const bod = (b) => [{ x: Math.round(b.x), y: Math.round(b.y), id: 1 }];
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: bod(z) });
  for (let i = 1; i <= krokov; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: bod({ x: z.x + ((na.x - z.x) * i) / krokov, y: z.y + ((na.y - z.y) * i) / krokov }) });
    await spi(cakat);
  }
  await spi(200);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await cdp.detach().catch(() => {});
  await spi(500);
}

const RAMEC = 'iframe[title="Plátno vzhľadu webu"]';
const fr = (page) => page.frameLocator(RAMEC);
async function okno(page) { const h = await page.$(RAMEC); return h ? h.contentFrame() : null; }
const prvok = (page, nazov) => fr(page).locator(`[data-vw="${nazov}"]:visible`).first();
async function cakajNaPlatno(page, { stranka = 'domov' } = {}) {
  await page.waitForSelector(RAMEC, { state: 'attached', timeout: 60000 });
  return cakaj(async () => {
    const f = await okno(page);
    if (!f) return false;
    return f.evaluate((s) => {
      const k = document.querySelector('[data-vw-platno]');
      if (!k || k.getAttribute('data-vw-platno') !== s) return false;
      if (s === 'domov') return document.querySelectorAll('[data-vw^="riadok:"]').length >= 3 && document.querySelectorAll('.lakv-card').length > 4 && document.querySelectorAll('.lkat-dlazdica').length > 5;
      if (s === 'kategoria') return !!document.querySelector('[data-vw="kategoria:nazov"]');
      return !!document.querySelector('[data-vw^="pata:stlpec:"]');
    }, stranka);
  }, { max: 60000 });
}
async function zalozAkTreba(page) {
  const kto = await cakaj(async () => ((await page.locator('[data-vw-prazdny]').count()) > 0 ? 'prazdny' : (await page.locator(RAMEC).count()) > 0 ? 'platno' : (await page.locator('[data-vw-formular]').count()) > 0 ? 'formular' : null), { max: 60000 });
  if (kto === 'prazdny') await page.locator('[data-vw-zalozit]').tap();
  return kto;
}
/** Prvok plátna do stredu obrazovky (vrch zakrývajú prilepené hlavičky, spodok list). */
const naStred = (loc) => loc.evaluate((el) => el.scrollIntoView({ block: 'center', inline: 'nearest' })).then(() => spi(300));
const poradieDlazdic = (page, skupina) => fr(page).locator(`.lkat-rad--${skupina} a.lkat-dlazdica`).evaluateAll((x) => x.map((e) => e.getAttribute('data-vw').split(':')[2]));
const stav = async (page) => (await page.locator('[data-vw-stav]').first().innerText()).trim();
const viditelne = (page, sel) => page.locator(`${sel}:visible`).first();

async function zverejnit(page, poznamka) {
  await viditelne(page, '[data-vw-zverejnit]').tap();
  await page.waitForSelector('[data-vw-zoznam-zmien]', { timeout: 20000 });
  const zmeny = await page.locator('[data-vw-zoznam-zmien] li').allInnerTexts();
  const okno = await page.locator('.vw-dialog').first().boundingBox();
  if (poznamka) await page.locator('[data-vw-poznamka]').fill(poznamka);
  await page.locator('[data-vw-potvrdit-zverejnenie]').tap();
  await cakaj(async () => (await page.locator('[data-vw-zoznam-zmien]').count()) === 0, { max: 30000 });
  await cakaj(async () => /Zverejnené/.test(await page.locator('[data-vw-sprava]').innerText().catch(() => '')), { max: 15000 });
  return { zmeny, okno };
}

/** Podpis verejnej domovskej (1440): dlaždice, sekcie, menu, päta, riadky — ako `test-editor.mjs`. */
async function podpisWebu(cesta = '/', zariadenie = '1440') {
  const ctx = await novyKontext(prehliadac, zariadenie, null);
  const page = await ctx.newPage();
  sleduj(page, `web${cesta}@${zariadenie}`);
  const vzhladPrisiel = page.waitForResponse((r) => /\/api\/vzhlad-webu(\?|$)/.test(r.url()), { timeout: 60000 }).catch(() => null);
  await page.goto(WEB + cesta, { waitUntil: 'load' });
  await cakaj(() => page.evaluate(() => document.querySelectorAll('.lkat-dlazdica').length > 5 && document.querySelectorAll('.lfoot-col').length > 0), { max: 60000 });
  await vzhladPrisiel;
  try { await page.waitForLoadState('networkidle', { timeout: 15000 }); } catch { /* ďalej */ }
  await spi(1500);
  const citaj = () => page.evaluate(() => ({
    dlazdice: [...document.querySelectorAll('.lkat-rad')].map((r) => [...r.querySelectorAll('a.lkat-dlazdica')].map((x) => `${x.getAttribute('href')}|${x.querySelector('.lkat-nazov')?.textContent}`)),
    sekcie: [...document.querySelectorAll('section.lhome-mapa, section.dob, section.lhome-cinnost, section.lakv, section.ljoin')].map((s) => s.className.split(' ').filter((c) => /^(lhome|dob|lakv|ljoin)/.test(c)).join('.')),
    menu: [...document.querySelectorAll('.lnav-cats-row .lnav-cat-btn')].map((b) => b.childNodes[0]?.textContent ?? ''),
    pata: [...document.querySelectorAll('.lfoot-col')].map((c) => [...c.querySelectorAll('a')].map((x) => x.textContent).join(',')),
    riadky: [...document.querySelectorAll('.dob-kategoria')].map((r) => [...r.querySelectorAll('a.dob-clanok')].map((x) => x.getAttribute('href')).join(',')),
    dataVw: document.querySelectorAll('[data-vw]').length,
  }));
  let p = await citaj();
  for (const koniec = Date.now() + 45000; Date.now() < koniec;) {
    await spi(1500);
    const q = await citaj();
    if (JSON.stringify(q) === JSON.stringify(p)) break;
    p = q;
  }
  await ctx.close();
  return p;
}

/* ───────────── Článok: obsah konceptu v DB ───────────── */

const TABULKY_KOMP = {};
for (const kat of readdirSync(join(BE, 'src', 'components'))) {
  for (const f of readdirSync(join(BE, 'src', 'components', kat))) {
    const s = JSON.parse(readFileSync(join(BE, 'src', 'components', kat, f), 'utf8'));
    TABULKY_KOMP[`${kat}.${f.replace(/\.json$/, '')}`] = s.collectionName;
  }
}
const bez = (r, ...k) => { const o = { ...r }; for (const x of ['id', 'created_at', 'updated_at', 'created_by_id', 'updated_by_id', 'published_at', ...k]) delete o[x]; return o; };
const existuje = (t) => !!dbr.prepare("select 1 from sqlite_master where type='table' and name=?").get(t);
function komponent(typ, id) {
  const t = TABULKY_KOMP[typ];
  const riadok = t ? dbr.prepare(`select * from "${t}" where id = ?`).get(id) : null;
  const subory = dbr.prepare('select file_id, field from files_related_mph where related_type = ? and related_id = ? order by field, "order"').all(typ, id);
  const vnorene = t && existuje(`${t}_cmps`)
    ? dbr.prepare(`select cmp_id, component_type, field, "order" from "${t}_cmps" where entity_id = ? order by field, "order"`).all(id).map((c) => ({ field: c.field, typ: c.component_type, obsah: komponent(c.component_type, c.cmp_id) }))
    : [];
  return { typ, riadok: riadok ? bez(riadok) : null, subory, vnorene };
}
/** Obsah konceptu článku (sk): polia, komponenty v poradí, súbory, kategória, štítky. */
function obsahClanku(dokument) {
  const p = dbr.prepare("select * from blog_posts where document_id = ? and locale = 'sk' and published_at is null").get(dokument);
  if (!p) return null;
  return {
    clanok: bez(p),
    komponenty: dbr.prepare('select cmp_id, component_type, field, "order" from blog_posts_cmps where entity_id = ? order by field, "order"').all(p.id)
      .map((c) => ({ field: c.field, ...komponent(c.component_type, c.cmp_id) })),
    subory: dbr.prepare("select file_id, field from files_related_mph where related_type = 'api::blog-post.blog-post' and related_id = ? order by field, \"order\"").all(p.id),
    kategoria: dbr.prepare('select c.document_id from blog_posts_category_lnk l join blog_categories c on c.id = l.blog_category_id where l.blog_post_id = ?').all(p.id),
    stitky: dbr.prepare('select t.document_id from blog_posts_tags_lnk l join blog_tags t on t.id = l.blog_tag_id where l.blog_post_id = ? order by l.blog_tag_ord, l.id').all(p.id),
  };
}

/* ───────────── Príprava ───────────── */

const PRED = odtlacokDb();
const PRED_SEKVENCIE = dbr.prepare('select name, seq from sqlite_sequence').all();
const ODLOZENE = odlozTabulky();
log(`Odložené tabuľky na návrat: ${Object.keys(ODLOZENE).length}`);

const OBRAZOVKY = [
  { meno: 'Články', hash: '#/articles', caka: 'button[title="Upraviť"]' },
  { meno: 'Koncepty', hash: '#/drafts' },
  { meno: 'Editor (nový článok)', hash: '#/editor', caka: 'iframe[title="Náhľad článku"]' },
  { meno: 'Vzhľad webu · domovská', hash: '#/vzhlad/domov', platno: 'domov' },
  { meno: 'Vzhľad webu · kategória', hash: '#/vzhlad/kategoria/povesti', platno: 'kategoria' },
  { meno: 'Vzhľad webu · hlavička a päta', hash: '#/vzhlad/menu', platno: 'menu' },
  { meno: 'Vzhľad webu · klasická úprava', hash: '#/vzhlad/formular', caka: '[data-vw-formular]' },
  { meno: 'Médiá', hash: '#/media' },
  { meno: 'Kategórie', hash: '#/categories', caka: '[data-cat-row]' },
  { meno: 'Štítky', hash: '#/tags' },
  { meno: 'Komentáre', hash: '#/comments' },
  { meno: 'Pripomienky', hash: '#/pripomienky' },
  { meno: 'Nahlásenia', hash: '#/nahlasenia' },
  { meno: 'Používatelia', hash: '#/users' },
  { meno: 'Analytika', hash: '#/analytics' },
  { meno: 'Môj profil', hash: '#/profile' },
  { meno: 'Prihlásenie', hash: '#/articles', bezTokenu: true, caka: 'input[type="password"]' },
];

let webNaZaciatku = null;
let v1 = null;

async function hlavnyTest() {
  sekcia('Príprava');
  const k0 = await koncept();
  if (!over('na začiatku nie je koncept ani zverejnený vzhľad', k0 && k0.koncept === null && k0.zverejnene === null, JSON.stringify(k0)?.slice(0, 200))) {
    throw new Error('Test potrebuje DB bez vzhľadu (napr. kópiu data.db.pred-mobilom).');
  }
  webNaZaciatku = await podpisWebu('/');
  over('verejný web na začiatku: dlaždice, bez značiek data-vw', webNaZaciatku.dlazdice.flat().length === 9 && webNaZaciatku.dataVw === 0);

  /* ───────────── 1. Každá obrazovka ───────────── */
  sekcia('Každá obrazovka pri 390 × 844: bez posunu do strán, bez chýb v konzole');
  for (const o of OBRAZOVKY) {
    const chybPred = chyby.length;
    const s = await otvor(o.hash, { meno: o.meno, tok: o.bezTokenu ? null : TOK });
    const p = s.page;
    try {
      if (o.platno) {
        await zalozAkTreba(p);
        await cakajNaPlatno(p, { stranka: o.platno });
      } else if (o.caka) await p.waitForSelector(o.caka, { state: 'attached', timeout: 60000 });
      try { await p.waitForLoadState('networkidle', { timeout: 15000 }); } catch { /* ďalej */ }
      await spi(700);
      const pr = await pretecenie(p);
      const nove = chyby.slice(chybPred);
      over(`${o.meno}: bez posunu do strán${nove.length ? '' : ', bez chýb v konzole'}`, bezPretecenia(pr) && !nove.length, `${JSON.stringify(pr)} ${nove.slice(0, 3).join(' | ')}`);
      await snimka(p, `obrazovka-${o.hash.replace(/[#/]+/g, '-').replace(/^-|-$/g, '')}${o.bezTokenu ? '-prihlasenie' : ''}`);
    } finally {
      await s.ctx.close();
    }
  }

  /* ───────────── 2. Ponuka v zásuvke ───────────── */
  sekcia('Ponuka v zásuvke');
  {
    const s = await otvor('#/articles', { meno: 'ponuka' });
    const p = s.page;
    await p.waitForSelector('button[title="Upraviť"]', { timeout: 60000 });
    const bocny = p.locator('#adm-bocny');
    const jeVidno = async () => p.evaluate(() => {
      const a = document.getElementById('adm-bocny');
      const r = a.getBoundingClientRect();
      return getComputedStyle(a).visibility === 'visible' && r.left >= -1 && r.right <= window.innerWidth + 1 && r.width > 200;
    });
    over('ponuka je na začiatku schovaná a tlačidlo ponuky je vidieť', !(await jeVidno()) && (await p.locator('[data-adm-m-ponuka]').isVisible()));
    const t = await p.locator('[data-adm-m-ponuka]').boundingBox();
    over('tlačidlo ponuky má aspoň 44 × 44 px', t && t.width >= 44 && t.height >= 44, JSON.stringify(t));
    await p.locator('[data-adm-m-ponuka]').tap();
    await spi(450);
    over('klepnutie otvorí zásuvku (celá na obrazovke, aria-expanded)', (await jeVidno()) && (await p.locator('[data-adm-m-ponuka]').getAttribute('aria-expanded')) === 'true');
    await snimka(p, 'ponuka-otvorena');
    const polozky = await bocny.locator('button.ad-nav').evaluateAll((x) => x.map((b) => b.getBoundingClientRect().height));
    over('položky ponuky majú aspoň 44 px', polozky.length >= 10 && polozky.every((h) => h >= 44), polozky.join(','));
    await bocny.locator('button.ad-nav', { hasText: 'Médiá' }).tap();
    await cakaj(async () => /#\/media/.test(p.url()), { max: 5000 });
    await spi(450);
    over('výber obrazovky v ponuke ju otvorí a zásuvka sa zavrie', /#\/media/.test(p.url()) && !(await jeVidno()));
    await p.locator('[data-adm-m-ponuka]').tap();
    await spi(450);
    await p.touchscreen.tap(375, 500);
    await spi(450);
    over('klepnutie na clonu vedľa zásuvky ju zavrie', !(await jeVidno()));
    await p.locator('[data-adm-m-ponuka]').tap();
    await spi(450);
    await p.keyboard.press('Escape');
    await spi(450);
    over('Esc zásuvku zavrie', !(await jeVidno()));
    await p.locator('[data-adm-m-ponuka]').tap();
    await spi(450);
    await p.locator('[data-adm-m-zavriet]').tap();
    await spi(450);
    over('krížik v zásuvke ju zavrie', !(await jeVidno()));
    await s.ctx.close();
  }

  /* ───────────── 3. Editor vzhľadu ───────────── */
  sekcia('Editor vzhľadu na telefóne');
  const s = await otvor('#/vzhlad/domov', { meno: 'vzhlad' });
  const p = s.page;
  await zalozAkTreba(p);
  over('plátno domovskej sa nakreslí', await cakajNaPlatno(p));
  const ram = await p.locator(RAMEC).boundingBox();
  const sirkaOkna = await (await okno(p)).evaluate(() => window.innerWidth);
  over('predvolený je náhľad Mobil a plátno je na celú šírku obrazovky (390 px, mierka 1)', sirkaOkna === 390 && ram && Math.round(ram.width) === 390 && Math.round(ram.x) === 0, `okno ${sirkaOkna}, rám ${JSON.stringify(ram)}`);
  over('prepínač Počítač / Mobil ostal', (await p.locator('[data-vw-zariadenie="pocitac"]').isVisible()) && (await p.locator('[data-vw-zariadenie="mobil"]').isVisible()));
  await snimka(p, 'vzhlad-01-platno');

  /* Spodný list: klepnutie prepína polohy, ťahanie úchytu prichytí. */
  const list = p.locator('[data-vw-list]');
  const vyskaListu = async () => Math.round((await list.boundingBox()).height);
  over('pravý panel je spodný list, na začiatku zbalený', (await list.getAttribute('data-vw-list')) === 'zbalene' && (await vyskaListu()) < 120);
  await p.locator('[data-vw-list-uchyt]').tap();
  await spi(400);
  const hPolovica = await vyskaListu();
  over('klepnutie na úchyt: polovica obrazovky', (await list.getAttribute('data-vw-list')) === 'polovica' && Math.abs(hPolovica - 422) < 30, String(hPolovica));
  await snimka(p, 'vzhlad-02-list-polovica');
  await p.locator('[data-vw-list-uchyt]').tap();
  await spi(400);
  over('ďalšie klepnutie: celá obrazovka (pod hlavičkou editora)', (await list.getAttribute('data-vw-list')) === 'cele' && (await vyskaListu()) > 650, String(await vyskaListu()));
  await p.locator('[data-vw-list-uchyt]').tap();
  await spi(400);
  over('ďalšie klepnutie: zbalený', (await list.getAttribute('data-vw-list')) === 'zbalene');
  {
    const u = await p.locator('[data-vw-list-uchyt]').boundingBox();
    await dotykTah(p, { x: u.x + u.width / 2, y: u.y + u.height / 2 }, { x: u.x + u.width / 2, y: 430 });
    over('potiahnutie úchytu prstom nahor a pustenie prichytí list na polovicu', (await list.getAttribute('data-vw-list')) === 'polovica', await list.getAttribute('data-vw-list'));
    const u2 = await p.locator('[data-vw-list-uchyt]').boundingBox();
    await dotykTah(p, { x: u2.x + u2.width / 2, y: u2.y + u2.height / 2 }, { x: u2.x + u2.width / 2, y: 830 });
    over('potiahnutie nadol ho zbalí', (await list.getAttribute('data-vw-list')) === 'zbalene', await list.getAttribute('data-vw-list'));
  }

  /* Prvé zverejnenie = dnešný web (východzí stav pre návrat cez históriu). */
  const z1 = await zverejnit(p, 'Vzhľad z dnešného webu (test mobil)');
  over('dialóg zverejnenia je na celú obrazovku', z1.okno && Math.round(z1.okno.width) === 390 && Math.round(z1.okno.height) >= 840, JSON.stringify(z1.okno));
  v1 = await verejny();
  over('prvé zverejnenie: verzia 1', v1?.verzia === 1);
  const webV1 = await podpisWebu('/');
  over('verejný web s verziou 1 kreslí to isté ako bez vzhľadu', stabilne(webV1) === stabilne(webNaZaciatku), JSON.stringify({ a: webNaZaciatku.dlazdice, b: webV1.dlazdice }));

  /* Výber klepnutím. */
  const dlazdica = 'dlazdica:typy:refugia';
  await naStred(prvok(p, dlazdica));
  await prvok(p, dlazdica).tap({ position: { x: 20, y: 20 } });
  over('klepnutie vyberie dlaždicu', await cakaj(async () => (await fr(p).locator(`[data-vw-vybrane="${dlazdica}"]`).count()) === 1, { max: 5000 }));
  over('zbalený list ukazuje vybraný prvok', /Dlaždica · Refúgiá/.test(await p.locator('[data-vw-panel-nadpis]').innerText()));
  const lista = fr(p).locator('.vw-lista');
  await lista.waitFor({ timeout: 5000 });
  const lb = await lista.boundingBox();
  const tlacidla = await lista.locator('button').evaluateAll((x) => x.map((b) => { const r = b.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; }));
  const mierka = ram.width / 390;
  over('lišta prvku je celá v šírke obrazovky a jej tlačidlá majú aspoň 44 px', lb && lb.x >= 0 && lb.x + lb.width <= 391 && tlacidla.every(([w, h]) => w * mierka >= 43.5 && h * mierka >= 43.5), `${JSON.stringify(lb)} ${JSON.stringify(tlacidla)}`);
  {
    /* Dlaždica tesne pod prilepenými hlavičkami: lišta nad ňou by bola zakrytá — musí ísť pod ňu. */
    const hl = await p.evaluate(() => Math.max(...[...document.querySelectorAll('.adm-m-hlavicka, .vw-m-hlava')].map((e) => e.getBoundingClientRect().bottom)));
    const t0 = (await prvok(p, dlazdica).boundingBox()).y;
    await p.evaluate((d) => window.scrollBy(0, d), t0 - hl - 10);
    await spi(700);
    const l2 = await lista.boundingBox();
    const t1 = (await prvok(p, dlazdica).boundingBox()).y;
    over('dlaždica tesne pod hlavičkami: lišta je pod ňou, nie pod hlavičkami', l2 && l2.y >= hl && l2.y > t1, `hlavičky ${Math.round(hl)}, dlaždica ${Math.round(t1)}, lišta ${Math.round(l2?.y)}`);
    await naStred(prvok(p, dlazdica));
  }
  for (const [akcia, popis] of [['text', 'upraviť text'], ['obrazok', 'obrázok'], ['odstranit', 'odstrániť']]) {
    over(`v lište je tlačidlo „${popis}"`, (await lista.locator(`[data-vw-akcia="${akcia}"]`).count()) === 1);
  }
  over('v lište sú šípky ← → a úchyt na ťahanie', (await lista.locator('button[aria-label="Posunúť dopredu"]').count()) === 1 && (await lista.locator('button[aria-label="Posunúť dozadu"]').count()) === 1 && (await lista.locator('.vw-uchyt').count()) === 1);
  await snimka(p, 'vzhlad-03-vybrana-dlazdica');

  /* Obrázok a mazanie: dialógy sa otvoria a dajú sa zavrieť. */
  await lista.locator('[data-vw-akcia="obrazok"]').tap();
  await p.waitForSelector('[data-vw-z-medii]', { timeout: 15000 });
  const dlgObr = await p.locator('.vw-dialog').first().boundingBox();
  over('obrázok: dialóg na celú obrazovku s „Vybrať z Médií" a „Nahrať"', dlgObr && Math.round(dlgObr.width) === 390 && (await p.locator('[data-vw-nahrat]').isVisible()), JSON.stringify(dlgObr));
  await snimka(p, 'vzhlad-04-obrazok');
  await p.locator('.vw-dialog .vw-dialog-tlacidla button', { hasText: 'Zrušiť' }).tap();
  await cakaj(async () => (await p.locator('.vw-dialog').count()) === 0, { max: 5000 });
  await prvok(p, dlazdica).tap({ position: { x: 20, y: 20 } });
  await fr(p).locator('.vw-lista [data-vw-akcia="odstranit"]').tap();
  await p.waitForSelector('[data-vw-potvrdit]', { timeout: 5000 });
  over('odstránenie sa pýta (dialóg na celú obrazovku)', Math.round((await p.locator('.vw-dialog').first().boundingBox()).width) === 390);
  await p.locator('.vw-dialog button', { hasText: 'Nechať' }).tap();
  await cakaj(async () => (await p.locator('.vw-dialog').count()) === 0, { max: 5000 });
  over('po „Nechať" je dlaždica stále na mieste', (await poradieDlazdic(p, 'typy')).includes('refugia'));

  /* Skrytie: sekcia „Populárne" — oko v lište, potom späť. */
  await naStred(prvok(p, 'popularne'));
  await prvok(p, 'popularne').tap({ position: { x: 10, y: 6 } });
  await cakaj(async () => (await fr(p).locator('[data-vw-vybrane="popularne"]').count()) === 1, { max: 5000 });
  const oko = fr(p).locator('.vw-lista [data-vw-akcia="skryt"]');
  over('v lište „Populárne" je tlačidlo skryť', (await oko.count()) === 1);
  await oko.tap();
  await spi(500);
  over('skrytie prstom: prvok je na plátne vyšrafovaný', (await fr(p).locator('[data-vw="popularne"][data-vw-skryte="1"]').count()) === 1);
  await viditelne(p, '[data-vw-vratit]').tap();
  await spi(500);
  over('Vrátiť (Ctrl+Z na telefóne) skrytie vráti', (await fr(p).locator('[data-vw="popularne"][data-vw-skryte="1"]').count()) === 0);

  /* Text priamo v stránke s klávesnicou telefónu. */
  await naStred(prvok(p, dlazdica));
  await prvok(p, dlazdica).tap({ position: { x: 20, y: 20 } });
  await fr(p).locator('.vw-lista [data-vw-akcia="text"]').tap();
  over('„Upraviť text" zapne písanie v stránke', await cakaj(async () => (await fr(p).locator('[data-vw-pise]').count()) === 1, { max: 4000 }));
  over('pri písaní sú pod textom tlačidlá Hotovo a Zrušiť', (await fr(p).locator('[data-vw-pise-hotovo]').count()) === 1 && (await fr(p).locator('[data-vw-pise-zrusit]').count()) === 1);
  over('pri písaní sa spodný list zbalí', (await list.getAttribute('data-vw-list')) === 'zbalene');
  await p.keyboard.type('Refúgiá (mobil)', { delay: 8 });
  await snimka(p, 'vzhlad-05-pisanie');
  await fr(p).locator('[data-vw-pise-zrusit]').tap();
  await spi(400);
  over('Zrušiť vráti pôvodný popisok', (await prvok(p, dlazdica).locator('.lkat-nazov').innerText()) === 'Refúgiá' && (await fr(p).locator('[data-vw-pise]').count()) === 0);
  await prvok(p, dlazdica).tap({ position: { x: 20, y: 20 } });
  await fr(p).locator('.vw-lista [data-vw-akcia="text"]').tap();
  await cakaj(async () => (await fr(p).locator('[data-vw-pise]').count()) === 1, { max: 4000 });
  await p.keyboard.type('Refúgiá (mobil)', { delay: 8 });
  await fr(p).locator('[data-vw-pise-hotovo]').tap();
  await spi(500);
  over('Hotovo zapíše nový SK popisok priamo v stránke', (await prvok(p, dlazdica).locator('.lkat-nazov').innerText()) === 'Refúgiá (mobil)' && (await fr(p).locator('[data-vw-pise], [contenteditable]').count()) === 0);
  over('zmena čaká na uloženie', /Neuložené/.test(await stav(p)));

  /* Posun tlačidlom v lište. */
  const pred = await poradieDlazdic(p, 'typy');
  await prvok(p, dlazdica).tap({ position: { x: 20, y: 20 } });
  await fr(p).locator('.vw-lista button[aria-label="Posunúť dozadu"]').tap();
  await spi(500);
  const po = await poradieDlazdic(p, 'typy');
  over('tlačidlo → v lište posunie dlaždicu o miesto', po.indexOf('refugia') === pred.indexOf('refugia') + 1, `${pred.join(',')} → ${po.join(',')}`);
  over('výber ostal na posunutej dlaždici', (await fr(p).locator(`[data-vw-vybrane="${dlazdica}"]`).count()) === 1);

  /* Ťahanie prstom za úchyt v lište (a potom späť cez Vrátiť). */
  {
    const n = 'dlazdica:typy:kniezacie-sidla';
    await naStred(prvok(p, n));
    await prvok(p, n).tap({ position: { x: 20, y: 20 } });
    await cakaj(async () => (await fr(p).locator(`[data-vw-vybrane="${n}"]`).count()) === 1, { max: 4000 });
    const uchyt = await fr(p).locator('.vw-lista .vw-uchyt').boundingBox();
    const ciel = await prvok(p, 'dlazdica:typy:mocenske-centra').boundingBox();
    const hlavicky = await p.evaluate(() => Math.max(...[...document.querySelectorAll('.adm-m-hlavicka, .vw-m-hlava')].map((e) => e.getBoundingClientRect().bottom)));
    over('lišta vybraného prvku nie je pod prilepenými hlavičkami (dá sa trafiť)', uchyt && uchyt.y >= hlavicky, `úchyt ${Math.round(uchyt?.y)} px, hlavičky po ${Math.round(hlavicky)} px`);
    const predTah = await poradieDlazdic(p, 'typy');
    await dotykTah(p, { x: uchyt.x + uchyt.width / 2, y: uchyt.y + uchyt.height / 2 }, { x: ciel.x + ciel.width * 0.85, y: ciel.y + ciel.height / 2 }, { krokov: 18 });
    const poTah = await poradieDlazdic(p, 'typy');
    over('ťahanie prstom za úchyt presunie dlaždicu', poTah.indexOf('kniezacie-sidla') === predTah.indexOf('mocenske-centra') && poTah.indexOf('mocenske-centra') === predTah.indexOf('kniezacie-sidla'), `${predTah.join(',')} → ${poTah.join(',')}`);
    over('po pustení nezostal na plátne duch ani čiara ťahania', (await fr(p).locator('.vw-tahany-duch, .vw-ciara').count()) === 0);
    await viditelne(p, '[data-vw-vratit]').tap();
    await spi(500);
    over('Vrátiť vráti ťahanie', JSON.stringify(await poradieDlazdic(p, 'typy')) === JSON.stringify(predTah));
  }

  /* Potiahnutie prstom po stránke ju posúva — nič sa neťahá ani nepresúva. */
  {
    const predPos = await poradieDlazdic(p, 'typy');
    const b = await prvok(p, 'dlazdica:typy:strazna-funkcia').boundingBox();
    const y0 = await p.evaluate(() => window.scrollY);
    await dotykTah(p, { x: b.x + b.width / 2, y: Math.min(b.y + b.height / 2, 600) }, { x: b.x + b.width / 2, y: Math.min(b.y + b.height / 2, 600) - 260 }, { krokov: 10, cakat: 16 });
    await spi(600);
    const y1 = await p.evaluate(() => window.scrollY);
    over('potiahnutie prstom po dlaždici posunie stránku', y1 > y0 + 50, `${y0} → ${y1}`);
    over('…a dlaždicu nepresunie ani nezačne ťahať', JSON.stringify(await poradieDlazdic(p, 'typy')) === JSON.stringify(predPos) && (await fr(p).locator('.vw-tahany-duch, .vw-ciara').count()) === 0);
  }

  /* Jazyk plátna je dosiahnuteľný. */
  await p.evaluate(() => window.scrollTo(0, 0));
  await viditelne(p, '[data-vw-jazyk="en"]').tap();
  await cakajNaPlatno(p);
  over('prepnutie jazyka EN na telefóne', (await p.locator('[data-vw-jazyk="en"]').getAttribute('class'))?.includes('is-on'));
  await viditelne(p, '[data-vw-jazyk="sk"]').tap();
  await cakajNaPlatno(p);
  over('…a späť SK (popisok je ten nový)', (await prvok(p, dlazdica).locator('.lkat-nazov').innerText()) === 'Refúgiá (mobil)');

  /* Uloženie a zverejnenie. */
  await viditelne(p, '[data-vw-ulozit]').tap();
  over('Uložiť koncept', await cakaj(async () => !/Neuložené/.test(await stav(p)) && /Koncept sa líši/.test(await stav(p)), { max: 20000 }), await stav(p));
  const k2 = (await koncept()).koncept;
  const zaz = k2.kategorie.find((x) => x.kategoria.slug === 'refugia');
  over('koncept v DB: nový SK popisok a nové poradie', zaz.popisokDlazdice.sk === 'Refúgiá (mobil)' && k2.domov.dlazdice.skupiny[0].polozky.map((d) => d.kategoria.slug).join(',') === po.join(','), JSON.stringify(zaz.popisokDlazdice));
  const z2 = await zverejnit(p, 'Test mobil');
  over('zoznam zmien hovorí o popisku a poradí', z2.zmeny.length >= 2, z2.zmeny.join(' | '));
  const webV2 = await podpisWebu('/');
  over('verejná stránka (lokálne) ukazuje nový popisok a poradie', webV2.dlazdice[0].map((x) => x.split('|')[0].replace('/category/', '')).join(',') === po.join(',') && webV2.dlazdice[0].some((x) => x.endsWith('|Refúgiá (mobil)')), JSON.stringify(webV2.dlazdice[0]));
  const webV2m = await podpisWebu('/', '390');
  over('…aj na telefóne', webV2m.dlazdice[0].some((x) => x.endsWith('|Refúgiá (mobil)')), JSON.stringify(webV2m.dlazdice[0]));

  /* História → obnovenie verzie 1 → zverejnenie. */
  await viditelne(p, '[data-vw-menu]').tap();
  await viditelne(p, '[data-vw-menu-historia]').tap();
  await p.waitForSelector('[data-vw-historia]', { timeout: 15000 });
  const dlgHist = await p.locator('.vw-dialog').first().boundingBox();
  over('história: dialóg na celú obrazovku, 2 verzie', Math.round(dlgHist.width) === 390 && (await p.locator('[data-vw-verzia]').count()) === 2, JSON.stringify(dlgHist));
  await snimka(p, 'vzhlad-06-historia');
  await p.locator('[data-vw-obnovit="1"]').tap();
  await cakaj(async () => (await p.locator('[data-vw-historia]').count()) === 0, { max: 20000 });
  await cakajNaPlatno(p);
  const k3 = await koncept();
  over('obnovenie verzie 1 do konceptu', JSON.stringify(k3.koncept) === JSON.stringify(v1.data));
  await zverejnit(p, 'Návrat na verziu 1 (test mobil)');
  const webV3 = await podpisWebu('/');
  over('po zverejnení obnovenej verzie je verejná stránka ako pred testom', stabilne(webV3) === stabilne(webNaZaciatku), JSON.stringify({ a: webNaZaciatku.dlazdice, b: webV3.dlazdice }));

  /* ───────────── 4. Klasická úprava ───────────── */
  sekcia('Klasická úprava na telefóne');
  await viditelne(p, '[data-vw-menu]').tap();
  await viditelne(p, '[data-vw-menu-formular]').tap();
  await p.waitForSelector('[data-vw-formular]', { timeout: 20000 });
  await spi(500);
  over('klasická úprava: bez posunu do strán', bezPretecenia(await pretecenie(p)));
  await p.locator('.apanel-head:has-text("Sekcie domovskej")').tap();
  const okoMapy = p.locator('[data-vw-formular-sekcie] [data-vw-oko="mapa"]');
  const okoBox = await okoMapy.boundingBox();
  over('tlačidlo skrytia v zozname má aspoň 44 px', okoBox && okoBox.width >= 44 && okoBox.height >= 44, JSON.stringify(okoBox));
  await okoMapy.tap();
  await spi(400);
  over('formulár: zmena čaká na uloženie', /Neuložené/.test(await stav(p)));
  await snimka(p, 'formular-01-zmena');
  await zverejnit(p, 'Formulár (test mobil)');
  const v4 = await verejny();
  over('formulár: zverejnená zmena je na webe (Mapa skrytá)', v4.data.domov.sekcie.find((x) => x.id === 'mapa').viditelna === false);
  await okoMapy.tap();
  await spi(400);
  await zverejnit(p, 'Formulár — návrat (test mobil)');
  const v5 = await verejny();
  over('formulár: návrat zverejnený — vzhľad je ako verzia 1', JSON.stringify(v5.data) === JSON.stringify(v1.data));
  over('…a verejná stránka je ako pred testom', stabilne(await podpisWebu('/')) === stabilne(webNaZaciatku));
  await s.ctx.close();

  /* ───────────── 5. Editor článku ───────────── */
  sekcia('Editor článku na telefóne');
  const kandidati = dbr.prepare(`select p.document_id d, p.slug from blog_posts_cmps c join blog_posts p on p.id = c.entity_id
    where c.field = 'blocks' and c.component_type = 'content.rich-text' and p.published_at is null and p.locale = 'sk'
    group by p.id having count(*) between 3 and 8 order by p.id`).all();
  const clanok = kandidati.find((c) => c.slug === 'lipt-stiavnica-lucny-hrib') ?? kandidati[0];
  log(`  (článok: ${clanok.slug})`);
  const pred5 = obsahClanku(clanok.d);
  const se = await otvor(`#/editor/${clanok.d}`, { meno: 'editor-clanku' });
  const pe = se.page;
  const ramC = await pe.waitForSelector('iframe[title="Náhľad článku"]', { timeout: 60000 });
  const fc = await ramC.contentFrame();
  await fc.waitForSelector('[data-block-type="content.rich-text"] p', { timeout: 60000 });
  await spi(1200);
  over('editor článku: bez posunu do strán', bezPretecenia(await pretecenie(pe)));
  over('editor článku: na telefóne predvolene náhľad Mobil (okno plátna 390 px)', (await fc.evaluate(() => window.innerWidth)) === 390);
  await snimka(pe, 'clanok-01-otvoreny');
  /* Prvý odsek prvého textového bloku: klepnutie zapne písanie. */
  const uid = await fc.evaluate(() => document.querySelector('[data-block-type="content.rich-text"]').dataset.blockUid);
  const odsek = fc.locator(`[data-block-uid="${uid}"] p`).first();
  await odsek.scrollIntoViewIfNeeded();
  /* Do stredu odseku — okraj bloku prekrýva pás „+" na vloženie bloku. */
  await odsek.tap();
  over('klepnutie do odseku zapne písanie (TipTap)', await cakaj(() => fc.evaluate((u) => !!document.querySelector(`[data-block-uid="${u}"] .ProseMirror`), uid), { max: 8000 }));
  /* Kurzor na koniec prvého odseku a dopísať. */
  await fc.evaluate((u) => {
    const p = document.querySelector(`[data-block-uid="${u}"] .ProseMirror p`);
    const r = document.createRange();
    r.selectNodeContents(p);
    r.collapse(false);
    const s = getSelection();
    s.removeAllRanges();
    s.addRange(r);
  }, uid);
  await spi(200);
  await pe.keyboard.type(' (mobil test)', { delay: 10 });
  await spi(400);
  over('odsek je upravený a článok čaká na uloženie', (await fc.locator(`[data-block-uid="${uid}"]`).innerText()).includes('(mobil test)') && (await pe.locator('text=Neuložené zmeny').count()) > 0);
  await snimka(pe, 'clanok-02-pisanie');
  /* Titulná fotka: Údaje článku → Vymeniť → knižnica médií na celú obrazovku. */
  await pe.locator('[data-adm-m-udaje]').tap();
  await spi(600);
  const vymenit = pe.locator('.ad-cover-links button', { hasText: 'Vymeniť' }).first();
  await vymenit.scrollIntoViewIfNeeded();
  const vb = await vymenit.boundingBox();
  over('„Vymeniť" titulnú fotku má aspoň 44 px', vb && vb.height >= 44, JSON.stringify(vb));
  await vymenit.tap();
  await pe.waitForSelector('text=Knižnica médií', { timeout: 20000 });
  const kniznica = await pe.locator('[aria-label="Knižnica médií"]').boundingBox();
  over('knižnica médií je na celú obrazovku', kniznica && Math.round(kniznica.width) === 390 && Math.round(kniznica.height) >= 840, JSON.stringify(kniznica));
  const coverPred = pred5.subory.find((x) => x.field === 'coverImage')?.file_id;
  const polozkyKnizn = pe.locator('[aria-label="Knižnica médií"] button:has(img)');
  await polozkyKnizn.first().waitFor({ timeout: 20000 });
  await snimka(pe, 'clanok-03-kniznica');
  await polozkyKnizn.nth(1).tap();
  await cakaj(async () => (await pe.locator('[aria-label="Knižnica médií"]').count()) === 0, { max: 8000 });
  await viditelne(pe, 'button:has-text("Uložiť koncept")').tap();
  over('Uložiť koncept na telefóne', await cakaj(async () => /Uložené \d/.test(await pe.locator('body').innerText()), { max: 30000 }));
  await se.ctx.close();
  const po5 = obsahClanku(clanok.d);
  const coverPo = po5.subory.find((x) => x.field === 'coverImage')?.file_id;
  over('v DB: titulná fotka je vymenená', coverPo && coverPo !== coverPred, `${coverPred} → ${coverPo}`);
  const textyPred = pred5.komponenty.filter((c) => c.field === 'blocks');
  const textyPo = po5.komponenty.filter((c) => c.field === 'blocks');
  const iUpraveny = textyPred.findIndex((c) => c.typ === 'content.rich-text');
  const inePred = textyPred.filter((_, i) => i !== iUpraveny);
  const inePo = textyPo.filter((_, i) => i !== iUpraveny);
  over('v DB: rovnaký počet a poradie blokov', textyPred.length === textyPo.length && textyPred.every((c, i) => c.typ === textyPo[i].typ));
  over('v DB: upravený odsek má dopísaný text', JSON.stringify(textyPo[iUpraveny]?.riadok?.body ?? '').includes('(mobil test)'));
  over('v DB: ostatné bloky bajt po bajte rovnaké', JSON.stringify(inePred) === JSON.stringify(inePo), (() => { const a = JSON.stringify(inePred), b = JSON.stringify(inePo); let k = 0; while (k < a.length && a[k] === b[k]) k++; return `${a.slice(Math.max(0, k - 80), k + 80)} ≠ ${b.slice(Math.max(0, k - 80), k + 80)}`; })());
  const polia = (o) => ({ ...o.clanok, updated_at: 0 });
  over('v DB: polia článku, pobočný stĺpec, galéria, kategória a štítky rovnaké', stabilne(polia(pred5)) === stabilne(polia(po5))
    && JSON.stringify(pred5.komponenty.filter((c) => c.field !== 'blocks')) === JSON.stringify(po5.komponenty.filter((c) => c.field !== 'blocks'))
    && JSON.stringify(pred5.subory.filter((x) => x.field !== 'coverImage')) === JSON.stringify(po5.subory.filter((x) => x.field !== 'coverImage'))
    && JSON.stringify(pred5.kategoria) === JSON.stringify(po5.kategoria) && JSON.stringify(pred5.stitky) === JSON.stringify(po5.stitky));

  over('bez chýb v konzole (všetky obrazovky a kroky)', chyby.length === 0, chyby.slice(0, 6).join(' || '));
  if (varovania.length) log(`  (varovania v konzole: ${[...new Set(varovania.map((v) => v.replace(/^[^:]+: /, '')))].slice(0, 4).join(' | ')})`);
}

/* ───────────── Upratovanie ───────────── */

async function uprac() {
  sekcia('Upratovanie: DB do stavu pred testom');
  const zmenene = vratTabulky(ODLOZENE, PRED_SEKVENCIE);
  log(`  (vrátené tabuľky: ${zmenene.length ? zmenene.join(', ') : 'žiadne'})`);
  const PO = odtlacokDb();
  const rozdielne = rozdielneTabulky(PRED, PO);
  over('upratanie: počty riadkov všetkých tabuliek ako pred testom', Object.keys(PRED).every((t) => PRED[t].n === PO[t]?.n), rozdielne.join(','));
  over('upratanie: obsah všetkých tabuliek bajt po bajte ako pred testom', rozdielne.length === 0, rozdielne.map((t) => `${t} ${PRED[t]?.n}→${PO[t]?.n}`).join(', '));
  const sekv = dbr.prepare('select name, seq from sqlite_sequence').all();
  over('upratanie: počítadlá id (sqlite_sequence) ako pred testom', stabilne(sekv) === stabilne(PRED_SEKVENCIE));
  over('upratanie: verejný GET vzhľadu ako pred testom (data: null)', (await verejny())?.data === null);
  writeFileSync(join(VYSTUP, 'test-mobil-db.json'), JSON.stringify({ pred: PRED, po: PO, rozdielne }, null, 1));
}

let kod = 0;
try {
  await hlavnyTest();
} catch (e) {
  over('test dobehol bez výnimky', false, e?.stack || String(e));
  if (chyby.length) log('  (konzola: ' + chyby.slice(0, 8).join(' || ') + ')');
} finally {
  try { await prehliadac.close(); } catch { /* nič */ }
  try { await uprac(); } catch (e) { over('upratovanie dobehlo bez výnimky', false, e?.stack || String(e)); }
  log(`\nVýsledok: prešlo ${preslo} z ${pocet}${zlyhane.length ? ` — ZLYHALO ${zlyhane.length}:\n  - ${zlyhane.join('\n  - ')}` : ''}`);
  log(`Záznam: ${VYSLEDOK}`);
  kod = zlyhane.length ? 1 : 0;
  dbr.close();
}
process.exit(kod);
