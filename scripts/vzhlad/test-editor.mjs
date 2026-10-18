/**
 * TEST EDITORA VZHĽADU (plán, časť 10.3) — Playwright proti lokálnemu backendu
 * (`http://127.0.0.1:1337`, `hradiska-strapi` s ENV_PATH=.env.lokalne-vzhlad) a vývojovému
 * serveru webu (`http://127.0.0.1:5190`, `VITE_STRAPI_URL=http://localhost:1337`).
 *
 * Mení údaje v lokálnej DB (koncept, zverejnenie, poradie kategórií, nahraný súbor) a na
 * konci všetko vráti do stavu pred testom a porovná DB (počty, `order`, `name`, slug,
 * `domovska-galeria`, médiá, riadky vzhľadu a histórie, obsah všetkých tabuliek).
 * Ostrý server nikdy: adresy musia byť 127.0.0.1/localhost.
 *
 * Tokeny redaktorov vyrobí rovnako ako `users-permissions` `jwt.issue({ id })`
 * (JWT_SECRET z env súboru backendu) a nikam ich nevypisuje.
 *
 *   node scripts/vzhlad/test-editor.mjs [--be C:/…/hradiska-strapi] [--web http://127.0.0.1:5190]
 *                                       [--api http://127.0.0.1:1337] [--bez-snimok]
 *
 * Výsledok: `vystup/test-editor-vysledok.txt` (aj priebežne), snímky `vystup/snimky-editor/`.
 */
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { KOREN, VYSTUP } from './spolocne.mjs';

const a = process.argv.slice(2);
const arg = (k, d) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : d; };
const BE = resolve(arg('--be', resolve(KOREN, '..', 'hradiska-strapi')));
const WEB = arg('--web', process.env.VZHLAD_WEB || 'http://127.0.0.1:5190').replace(/\/$/, '');
const API = arg('--api', process.env.VZHLAD_API || 'http://127.0.0.1:1337').replace(/\/$/, '');
const SNIMKY = !a.includes('--bez-snimok');
for (const u of [WEB, API]) {
  if (!/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(u)) { console.error(`Test smie bežať len lokálne (dostal som ${u}).`); process.exit(2); }
}

const reqBE = createRequire(join(BE, 'package.json'));
const Database = reqBE('better-sqlite3');
const jwt = reqBE('jsonwebtoken');
const dotenv = reqBE('dotenv');
const ENV = dotenv.parse(readFileSync(join(BE, '.env.lokalne-vzhlad')));
const DB_CESTA = resolve(BE, ENV.DATABASE_FILENAME || '.tmp/data.db');
const SNIMKY_DIR = join(VYSTUP, 'snimky-editor');
mkdirSync(SNIMKY_DIR, { recursive: true });
const VYSLEDOK = join(VYSTUP, 'test-editor-vysledok.txt');
writeFileSync(VYSLEDOK, `Test editora vzhľadu — ${new Date().toISOString()} — web ${WEB}, api ${API}\n`);
const log = (s) => { console.log(s); appendFileSync(VYSLEDOK, s + '\n'); };

let pocet = 0, preslo = 0;
const zlyhane = [];
function over(nazov, ok, detail = '') {
  pocet++;
  if (ok) { preslo++; log(`  ok    ${nazov}`); } else { zlyhane.push(nazov); log(`  CHYBA ${nazov}${detail ? ` — ${String(detail).slice(0, 400)}` : ''}`); }
  return !!ok;
}
const sekcia = (s) => log(`\n## ${s}`);
const spi = (ms) => new Promise((r) => setTimeout(r, ms));
async function cakaj(fn, { max = 20000, krok = 200 } = {}) {
  const koniec = Date.now() + max;
  let v;
  while (Date.now() < koniec) {
    try { v = await fn(); if (v) return v; } catch { v = undefined; }
    await spi(krok);
  }
  return v;
}
const stabilne = (x) => JSON.stringify(x, (k, v) => (v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort(([p], [q]) => p.localeCompare(q))) : v));

/* ───────────── DB a tokeny ───────────── */

const dbr = new Database(DB_CESTA, { readonly: true, fileMustExist: true });
dbr.pragma('busy_timeout = 5000');
const ucty = dbr.prepare(`select u.id, u.username, r.type from up_users u join up_users_role_lnk l on l.user_id = u.id join up_roles r on r.id = l.role_id
  where coalesce(u.blocked, 0) = 0 and coalesce(u.confirmed, 0) = 1 and r.type = 'authenticated' order by u.id`).all();
if (ucty.length < 2) { console.error('V DB chýbajú dvaja redaktori (rola authenticated).'); process.exit(2); }
const token = (id) => jwt.sign({ id }, ENV.JWT_SECRET, { expiresIn: '2h' });

/* Obrázky na výmenu: súbory, ktoré majú na disku originál aj zmenšeniny (lokálnej kópii
   médií pár súborov chýba — prehliadač by vtedy nastavil záložný obrázok). */
const OBRAZKY = (() => {
  const von = [];
  for (const r of dbr.prepare("select id, name, url, formats from files where mime like 'image/%' and url not like '%kategoria_%' and name not like 'vzhlad_editor_test%' order by id desc limit 400").all()) {
    const f = JSON.parse(r.formats || '{}');
    const adresy = [r.url, ...['thumbnail', 'small', 'medium'].map((v) => f[v]?.url)];
    if (adresy.every((u) => u && existsSync(join(BE, 'public', u)))) von.push({ id: r.id, name: r.name });
    if (von.length >= 4) break;
  }
  return von;
})();
if (OBRAZKY.length < 3) { console.error('V lokálnej knižnici médií chýbajú obrázky so zmenšeninami.'); process.exit(2); }
const R1 = token(ucty[0].id);
const R2 = token(ucty[1].id);

function snimkaDb() {
  const kategorie = dbr.prepare('select document_id d, name, slug, "order" o from blog_categories order by id').all();
  const casy = dbr.prepare('select id, updated_at, published_at from blog_categories order by id').all();
  const casGalerie = dbr.prepare('select id, updated_at, published_at from domovska_galeria order by id').all();
  const vazbyGalerie = dbr.prepare("select * from files_related_mph where related_type = 'api::domovska-galeria.domovska-galeria' and field = 'fotky' order by id").all();
  const galeria = dbr.prepare(`select f.file_id id from files_related_mph f where f.related_type = 'api::domovska-galeria.domovska-galeria' and f.field = 'fotky' order by f."order"`).all().map((r) => r.id);
  const vzhlad = dbr.prepare('select * from vzhlad_webu order by id').all();
  const historia = dbr.prepare('select id from vzhlad_webu_verzie order by id').all().map((r) => r.id);
  const subory = dbr.prepare('select count(*) n, max(id) mx from files').get();
  const priecinky = dbr.prepare('select count(*) n from upload_folders').get().n;
  return { kategorie, casy, casGalerie, vazbyGalerie, galeria, vzhlad, historia, subory, priecinky };
}
/** Obsah všetkých tabuliek (počet a odtlačok) — porovnanie celej DB pred a po teste. */
function odtlacokDb() {
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

async function api(metoda, cesta, { tok = R1, telo } = {}) {
  const h = {};
  if (tok) h.Authorization = `Bearer ${tok}`;
  if (telo !== undefined) h['Content-Type'] = 'application/json';
  const r = await fetch(API + cesta, { method: metoda, headers: h, body: telo === undefined ? undefined : JSON.stringify(telo) });
  const text = await r.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = null; }
  return { status: r.status, json, text };
}
const koncept = async () => (await api('GET', '/api/vzhlad-webu/koncept')).json;
const verejny = async () => (await api('GET', '/api/vzhlad-webu', { tok: null })).json;

/* ───────────── Prehliadač ───────────── */

const prehliadac = await chromium.launch({ args: ['--disable-gpu', '--font-render-hinting=none'] });
const konzola = [];
const chybajuceSubory = new Set();
function sleduj(page, meno) {
  page.on('console', (m) => {
    if (m.type() !== 'error' && m.type() !== 'warning') return;
    const t = m.text();
    /* Lokálna kópia médií nemá pár súborov (2 obrázky kategórií) — nie je to chyba editora. */
    if (/^Failed to load resource/.test(t)) return;
    if (/Download the React DevTools|\[vite\]/.test(t)) return;
    konzola.push(`${meno} ${m.type()}: ${t.slice(0, 300)}`);
  });
  page.on('pageerror', (e) => konzola.push(`${meno} pageerror: ${e.message}`));
  page.on('response', (r) => { if (r.status() === 404 && /\/uploads\//.test(r.url())) chybajuceSubory.add(new URL(r.url()).pathname); else if (r.status() >= 500) konzola.push(`${meno} HTTP ${r.status()} ${r.url()}`); });
}

async function novaStranka(tok, { sirka = 1680, vyska = 1050, mobil = false } = {}) {
  const ctx = await prehliadac.newContext({
    viewport: { width: sirka, height: vyska }, deviceScaleFactor: 1, isMobile: mobil, hasTouch: mobil,
    reducedMotion: 'reduce', serviceWorkers: 'block', locale: 'sk-SK', timezoneId: 'Europe/Bratislava',
  });
  if (tok) await ctx.addInitScript((t) => { try { if (!sessionStorage.getItem('__vw_test_tok')) { localStorage.setItem('hradiska.admin.jwt', t); sessionStorage.setItem('__vw_test_tok', '1'); } } catch { /* nič */ } }, tok);
  const page = await ctx.newPage();
  return { ctx, page };
}

const RAMEC = 'iframe[title="Plátno vzhľadu webu"]';
const fr = (page) => page.frameLocator(RAMEC);
async function okno(page) { const h = await page.$(RAMEC); return h ? h.contentFrame() : null; }
const prvok = (page, nazov) => fr(page).locator(`[data-vw="${nazov}"]:visible`).first();

async function cakajNaPlatno(page, { stranka = 'domov' } = {}) {
  await page.waitForSelector(RAMEC, { timeout: 60000 });
  return cakaj(async () => {
    const f = await okno(page);
    if (!f) return false;
    return f.evaluate((s) => {
      const k = document.querySelector('[data-vw-platno]');
      if (!k || k.getAttribute('data-vw-platno') !== s) return false;
      if (s === 'domov') return document.querySelectorAll('[data-vw^="riadok:"]').length >= 3 && document.querySelectorAll('.lakv-card').length > 4 && document.querySelectorAll('.lnav-cat').length > 5;
      if (s === 'kategoria') return !!document.querySelector('[data-vw="kategoria:nazov"]') && document.querySelectorAll('[data-vw^="kategoria:clanok:"]').length > 0;
      return document.querySelectorAll('.lnav-cat').length > 5 && !!document.querySelector('[data-vw^="pata:stlpec:"]');
    }, stranka);
  }, { max: 60000 });
}

async function vyber(page, nazov) {
  await prvok(page, nazov).click({ position: { x: 6, y: 6 } });
  return cakaj(async () => (await fr(page).locator(`[data-vw-vybrane="${nazov}"]`).count()) > 0, { max: 5000 });
}
async function akcia(page, druh) {
  await fr(page).locator(`.vw-lista [data-vw-akcia="${druh}"]`).click();
}
/** V dialógu obrázka: „Vybrať z Médií", vyhľadať súbor podľa mena a vybrať ho. */
async function vyberZMedii(page, subor) {
  await page.click('[data-vw-z-medii]');
  await page.waitForSelector('text=Knižnica médií');
  await page.fill('.acard.admin input[placeholder="Hľadať podľa názvu…"]', subor.name.replace(/\.[a-z]+$/i, '').slice(0, 24));
  const tl = page.locator('.acard.admin button:has(img)', { hasText: subor.name }).first();
  await tl.waitFor({ timeout: 20000 });
  await tl.click();
  await cakaj(async () => (await page.locator('text=Knižnica médií').count()) === 0, { max: 5000 });
}
async function tahaj(page, z, na, { za = true, smer = 'vodorovne' } = {}) {
  const b = await prvok(page, z).boundingBox();
  const c = await prvok(page, na).boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2 + 12, b.y + b.height / 2 + 4, { steps: 3 });
  const x = smer === 'vodorovne' ? c.x + c.width * (za ? 0.85 : 0.15) : c.x + c.width / 2;
  const y = smer === 'zvisle' ? c.y + c.height * (za ? 0.85 : 0.15) : c.y + c.height / 2;
  await page.mouse.move(x, y, { steps: 14 });
  await spi(250);
  return async () => { await page.mouse.up(); await spi(500); };
}
async function pis(page, nazov, selektor, text) {
  const ciel = selektor ? fr(page).locator(`[data-vw="${nazov}"]:visible ${selektor}`).first() : prvok(page, nazov);
  await ciel.dblclick();
  await cakaj(async () => (await fr(page).locator('[data-vw-pise]').count()) > 0, { max: 4000 });
  await page.keyboard.press('Control+A');
  await page.keyboard.type(text, { delay: 5 });
  await page.keyboard.press('Enter');
  await spi(400);
}
const textPrvku = async (page, nazov, selektor) => ((selektor ? fr(page).locator(`[data-vw="${nazov}"]:visible ${selektor}`).first() : prvok(page, nazov)).innerText());
const poradieDlazdic = (page, skupina) => fr(page).locator(`.lkat-rad--${skupina} a.lkat-dlazdica`).evaluateAll((x) => x.map((e) => e.getAttribute('data-vw').split(':')[2]));
const stav = async (page) => (await page.locator('[data-vw-stav]').innerText()).trim();
async function snimka(page, meno) {
  if (!SNIMKY) return;
  await spi(300);
  await page.screenshot({ path: join(SNIMKY_DIR, `${meno}.png`) });
}
async function zariadenie(page, z) {
  await page.click(`[data-vw-zariadenie="${z}"]`);
  await spi(1200);
}
async function ulozit(page) {
  await page.click('[data-vw-ulozit]');
  const ok = await cakaj(async () => /uložený|Koncept sa líši|Zverejnené/.test(await stav(page)) && !/Neuložené/.test(await stav(page)), { max: 20000 });
  if (!ok) log(`  (uloženie: ${(await page.locator('.vw-dialog').allInnerTexts().catch(() => [])).join(' | ').slice(0, 600)} ${(await page.locator('[data-vw-sprava]').allInnerTexts().catch(() => [])).join(' | ')})`);
  return ok;
}
async function zverejnit(page, { poznamka = '', snimkaMeno = null } = {}) {
  await page.click('[data-vw-zverejnit]');
  await page.waitForSelector('[data-vw-zoznam-zmien]', { timeout: 20000 });
  const zmeny = await page.locator('[data-vw-zoznam-zmien] li').allInnerTexts();
  if (snimkaMeno) await snimka(page, snimkaMeno);
  if (poznamka) await page.fill('[data-vw-poznamka]', poznamka);
  await page.click('[data-vw-potvrdit-zverejnenie]');
  await cakaj(async () => (await page.locator('[data-vw-zoznam-zmien]').count()) === 0, { max: 30000 });
  await cakaj(async () => /Zverejnené/.test(await page.locator('[data-vw-sprava]').innerText().catch(() => '')), { max: 15000 });
  return zmeny;
}
async function otvorEditor(tok, hash = '#/vzhlad/domov', o = {}) {
  const s = await novaStranka(tok, o);
  sleduj(s.page, o.meno ?? 'editor');
  /* Otázky prehliadača (confirm, beforeunload): predvolene prijať, test si môže vypýtať „Zrušiť". */
  s.odpoved = 'prijat';
  s.page.on('dialog', (d) => { s.dialogy.push(d.type()); (s.odpoved === 'zrusit' ? d.dismiss() : d.accept()).catch(() => {}); });
  s.dialogy = [];
  await s.page.goto(`${WEB}/admin${hash}`, { waitUntil: 'load' });
  return s;
}

/** Podpis verejného webu (domovská): dlaždice, sekcie, menu, päta, kronika — to, čo vzhľad mení. */
/**
 * Podpis verejného webu. Web najprv kreslí základný vzhľad a zverejnený dostane až
 * odpoveďou `GET /api/vzhlad-webu`; riadky „Ďalší obsah“ si články sťahujú zvlášť.
 * Pri zaťaženom stroji to trvá — preto sa čaká na odpoveď vzhľadu a potom, kým dva
 * podpisy 1,5 s po sebe nie sú rovnaké (najviac 45 s).
 */
async function podpisWebu(cesta = '/') {
  const { ctx, page } = await novaStranka(null, { sirka: 1440, vyska: 900 });
  sleduj(page, `web${cesta}`);
  const vzhladPrisiel = page.waitForResponse((r) => /\/api\/vzhlad-webu(\?|$)/.test(r.url()), { timeout: 60000 }).catch(() => null);
  await page.goto(WEB + cesta, { waitUntil: 'load' });
  await cakaj(() => page.evaluate(() => document.querySelectorAll('.lkat-dlazdica').length > 5 && document.querySelectorAll('.lnav-cat').length > 5 && document.querySelectorAll('.lfoot-col').length > 0), { max: 60000 });
  await vzhladPrisiel;
  try { await page.waitForLoadState('networkidle', { timeout: 15000 }); } catch { /* ďalej */ }
  await spi(1500);
  let p = await precitajPodpis(page);
  for (const koniec = Date.now() + 45000; Date.now() < koniec;) {
    await spi(1500);
    const q = await precitajPodpis(page);
    if (JSON.stringify(q) === JSON.stringify(p)) break;
    p = q;
  }
  await ctx.close();
  return p;
}

function precitajPodpis(page) {
  return page.evaluate(() => ({
    dlazdice: [...document.querySelectorAll('.lkat-rad')].map((r) => [...r.querySelectorAll('a.lkat-dlazdica')].map((x) => `${x.getAttribute('href')}|${x.querySelector('.lkat-nazov')?.textContent}|${x.querySelector('img')?.getAttribute('src') ?? ''}|${x.querySelector('img')?.style.objectPosition ?? ''}`)),
    sekcie: [...document.querySelectorAll('section.lhome-mapa, section.dob, section.lhome-cinnost, section.lakv, section.ljoin')].map((s) => s.className.split(' ').filter((c) => /^(lhome|dob|lakv|ljoin)/.test(c)).join('.')),
    menu: [...document.querySelectorAll('.lnav-cats-row .lnav-cat-btn')].map((b) => b.childNodes[0]?.textContent ?? ''),
    pata: [...document.querySelectorAll('.lfoot-col')].map((c) => [...c.querySelectorAll('a')].map((x) => x.textContent).join(',')),
    riadky: [...document.querySelectorAll('.dob-kategoria')].map((r) => [...r.querySelectorAll('a.dob-clanok')].map((x) => x.getAttribute('href')).join(',')),
    pripnute: [...document.querySelectorAll('.lakv-strip a')].slice(0, 6).map((x) => x.getAttribute('href')),
    upravit: !!document.querySelector('.vw-upravit'),
    dataVw: document.querySelectorAll('[data-vw]').length,
  }));
}

/* ───────────── Príprava ───────────── */

const PRED = snimkaDb();
const ODTLACOK_PRED = odtlacokDb();
const PRED_SEKVENCIE = dbr.prepare('select name, seq from sqlite_sequence').all();
const nahrate = [];
let hlavna = null, druha = null;

async function hlavnyTest() {
  sekcia('Príprava');
  const k0 = await koncept();
  if (!over('na začiatku nie je koncept ani zverejnený vzhľad', k0 && k0.koncept === null && k0.zverejnene === null, JSON.stringify(k0)?.slice(0, 200))) {
    throw new Error('Test potrebuje DB bez vzhľadu (napr. kópiu data.db.pred-editorom).');
  }
  const webNaZaciatku = await podpisWebu('/');
  over('verejný web: bez vzhľadu z API, bez značiek data-vw a bez tlačidla „Upraviť"', webNaZaciatku.dataVw === 0 && !webNaZaciatku.upravit && webNaZaciatku.dlazdice.flat().length === 9);

  /* Prevod skriptom (ten istý kód ako tlačidlo „Založiť") — na porovnanie. */
  execFileSync(process.execPath, [join(KOREN, 'scripts/vzhlad/prevod.mjs'), '--api', API, '--db', DB_CESTA, '--backend-balik', join(BE, 'package.json'), '--vystup', 'test-editor-prevod.json'], { stdio: 'pipe' });
  const prevodSkriptom = readFileSync(join(VYSTUP, 'test-editor-prevod.json'), 'utf8');

  /* Súbor na nahratie (malý JPEG). */
  const subor = join(VYSTUP, 'vzhlad_editor_test.jpg');
  await sharp({ create: { width: 480, height: 320, channels: 3, background: { r: 176, g: 120, b: 52 } } })
    .composite([{ input: Buffer.from('<svg width="480" height="320"><rect x="40" y="40" width="400" height="240" fill="#2f5d8a"/><circle cx="240" cy="160" r="70" fill="#f2c94c"/></svg>'), top: 0, left: 0 }])
    .jpeg({ quality: 80 }).toFile(subor);

  /* ───────────── Založenie ───────────── */
  sekcia('Založenie vzhľadu z dnešného webu');
  hlavna = await otvorEditor(R1, '#/vzhlad/domov', { meno: 'editor-1' });
  const p = hlavna.page;
  await p.waitForSelector('[data-vw-prazdny]', { timeout: 60000 });
  over('editor bez vzhľadu ukáže „Vzhľad ešte nie je založený"', /Vzhľad ešte nie je založený/.test(await p.locator('[data-vw-prazdny]').innerText()));
  await snimka(p, '00-nezalozeny');
  await p.click('[data-vw-zalozit]');
  over('plátno domovskej sa nakreslí', await cakajNaPlatno(p));
  const k1 = await koncept();
  over('„Založiť z dnešného webu" uložil koncept zhodný so skriptom prevod.mjs', JSON.stringify(k1.koncept) === JSON.stringify(JSON.parse(prevodSkriptom)), `${JSON.stringify(k1.koncept).length} vs ${prevodSkriptom.length}`);
  over('verejný GET sa založením nezmenil (data: null)', (await verejny())?.data === null);

  /* Prvé zverejnenie = dnešný web (východzí stav pre „história → obnovenie → web ako na začiatku"). */
  const zmenyV1 = await zverejnit(p, { poznamka: 'Vzhľad z dnešného webu (test)', snimkaMeno: '01-zverejnenie-prve-1440' });
  over('dialóg prvého zverejnenia hovorí, že web prejde na vzhľad', zmenyV1.some((z) => /prvý raz/.test(z)), zmenyV1.join(' | '));
  const v1 = await verejny();
  over('verejný GET po prvom zverejnení: verzia 1, vzhľad = koncept', v1?.verzia === 1 && JSON.stringify(v1.data) === JSON.stringify(k1.koncept));
  const webV1 = await podpisWebu('/');
  over('verejný web s vzhľadom v1 kreslí to isté ako bez vzhľadu (dlaždice, sekcie, menu, päta, riadky)', stabilne({ ...webV1, pripnute: 0 }) === stabilne({ ...webNaZaciatku, pripnute: 0 }), JSON.stringify({ a: webNaZaciatku.menu, b: webV1.menu }));
  const poradieDb = dbr.prepare('select "order" o from blog_categories order by "order", id').all().map((r) => r.o);
  over('zverejnenie zapísalo poradie kategórií 10, 20, 30 …', poradieDb.every((o, i) => o === (i + 1) * 10), poradieDb.join(','));

  /* Snímky troch stránok (počítač a mobil). */
  await snimka(p, '02-domovska-1440');
  await zariadenie(p, 'mobil');
  await cakajNaPlatno(p);
  await snimka(p, '02-domovska-390');
  await zariadenie(p, 'pocitac');
  await cakajNaPlatno(p);

  /* ───────────── Dlaždice ───────────── */
  sekcia('Dlaždice: výber, ťahanie v skupine aj do druhej, klávesy');
  over('klik vyberie dlaždicu a pravý panel ukáže jej polia', await vyber(p, 'dlazdica:typy:refugia') && /Dlaždica · Refúgiá/.test(await p.locator('[data-vw-panel-nadpis]').innerText()));
  await snimka(p, '03-vybrana-dlazdica-1440');
  let pust = await tahaj(p, 'dlazdica:typy:refugia', 'dlazdica:typy:staroveke-sidla', { za: true });
  over('pri ťahaní je vidieť miesto vloženia', (await fr(p).locator('.vw-ciara').count()) === 1);
  await snimka(p, '04-tahanie-1440');
  await pust();
  over('ťahanie v skupine: Refúgiá za Starovekými hradiskami', JSON.stringify(await poradieDlazdic(p, 'typy')) === JSON.stringify(['kniezacie-sidla', 'mocenske-centra', 'strazna-funkcia', 'staroveke-sidla', 'refugia']), (await poradieDlazdic(p, 'typy')).join(','));
  pust = await tahaj(p, 'dlazdica:typy:mocenske-centra', 'dlazdica:pramene:povesti', { za: true });
  await pust();
  over('ťahanie do druhej skupiny: Mocenské centrá v Prameňoch za Povesťami', JSON.stringify(await poradieDlazdic(p, 'pramene')) === JSON.stringify(['listiny-a-pisomne-zdroje', 'vseobecne-o-hradiskach', 'povesti', 'mocenske-centra', 'svatyne-a-sakralne-objekty']), (await poradieDlazdic(p, 'pramene')).join(','));
  over('výber ide s presunutou dlaždicou', (await fr(p).locator('[data-vw-vybrane="dlazdica:pramene:mocenske-centra"]').count()) === 1);
  await vyber(p, 'dlazdica:typy:kniezacie-sidla');
  await p.keyboard.press('Alt+ArrowRight');
  await spi(400);
  over('Alt+→ posunie dlaždicu o miesto', (await poradieDlazdic(p, 'typy'))[1] === 'kniezacie-sidla');
  await p.keyboard.press('Alt+ArrowLeft');
  await spi(400);
  over('Alt+← ju vráti', (await poradieDlazdic(p, 'typy'))[0] === 'kniezacie-sidla');
  await p.keyboard.press('ArrowRight');
  await spi(300);
  over('šípka → zmení výber na ďalší prvok', (await fr(p).locator('[data-vw-vybrane="dlazdica:typy:strazna-funkcia"]').count()) === 1);
  await p.keyboard.press('Escape');

  /* ───────────── Obrázky ───────────── */
  sekcia('Výmena obrázka: Médiá, nahratie, výrez, „Vrátiť pôvodný"');
  const srcPred = await prvok(p, 'dlazdica:typy:strazna-funkcia').locator('img').getAttribute('src');
  await vyber(p, 'dlazdica:typy:strazna-funkcia');
  await akcia(p, 'obrazok');
  await p.waitForSelector('[data-vw-pouzitie]', { timeout: 15000 });
  over('pred výmenou dialóg povie, kde je obrázok ešte použitý', /Kde je terajší obrázok ešte použitý/.test(await p.locator('[data-vw-pouzitie]').innerText()));
  await vyberZMedii(p, OBRAZKY[0]);
  const nahlad = p.locator('[data-vw-nahlad]').first();
  await nahlad.waitFor();
  const nb = await nahlad.boundingBox();
  await p.mouse.move(nb.x + nb.width / 2, nb.y + nb.height / 2);
  await p.mouse.down();
  await p.mouse.move(nb.x + nb.width / 2 + 40, nb.y + nb.height / 2 - 30, { steps: 6 });
  await p.mouse.up();
  await snimka(p, '05-obrazok-dialog-1440');
  await p.click('[data-vw-pouzit-obrazok]');
  await spi(800);
  const img = prvok(p, 'dlazdica:typy:strazna-funkcia').locator('img');
  const srcPo = await img.getAttribute('src');
  const pozicia = await img.evaluate((e) => e.style.objectPosition);
  over('obrázok z Médií je na dlaždici', srcPo && srcPo !== srcPred, `${srcPred} → ${srcPo}`);
  over('výrez ťahaním sa zapísal (object-position)', /%/.test(pozicia) && pozicia !== '50% 50%', pozicia);

  await vyber(p, 'dlazdica:typy:refugia');
  await akcia(p, 'obrazok');
  await p.waitForSelector('[data-vw-subor-vstup]', { state: 'attached' });
  await p.setInputFiles('[data-vw-subor-vstup]', subor);
  await cakaj(async () => (await p.locator('[data-vw-nahlad] img').first().getAttribute('src'))?.includes('vzhlad_editor_test'), { max: 30000 });
  await p.click('[data-vw-pouzit-obrazok]');
  await spi(800);
  const srcNahraty = await prvok(p, 'dlazdica:typy:refugia').locator('img').getAttribute('src');
  over('nahratý obrázok je na dlaždici', /vzhlad_editor_test/.test(srcNahraty ?? ''), srcNahraty);
  for (const f of dbr.prepare("select id from files where name like 'vzhlad_editor_test%'").all()) nahrate.push(f.id);
  over('nahratý súbor je v knižnici médií', nahrate.length >= 1, nahrate.join(','));

  /* Dlaždica článku v „Ďalšom obsahu": iný obrázok a návrat k pôvodnému. */
  const clanok0 = 'riadok-clanok:dalsi-obsah:informacne-tabule:0';
  const srcClanku = await prvok(p, clanok0).locator('img').getAttribute('src');
  await vyber(p, clanok0);
  await akcia(p, 'obrazok');
  await vyberZMedii(p, OBRAZKY[1]);
  await p.click('[data-vw-pouzit-obrazok]');
  await spi(800);
  const srcIny = await prvok(p, clanok0).locator('img').getAttribute('src');
  over('dlaždica článku má iný obrázok (článok sa nemení)', srcIny !== srcClanku, `${srcClanku} → ${srcIny}`);
  await vyber(p, clanok0);
  await akcia(p, 'obrazok');
  await p.click('[data-vw-vratit-povodny]');
  await spi(800);
  over('„Vrátiť pôvodný" vráti obrázok článku', (await prvok(p, clanok0).locator('img').getAttribute('src')) === srcClanku);

  /* ───────────── Texty ───────────── */
  sekcia('Text priamo v stránke: SK, potom EN; DE ostane, SK sa nezmení');
  const deStary = (await koncept()).koncept.kategorie.find((k) => k.kategoria.slug === 'kniezacie-sidla').popisokDlazdice;
  await pis(p, 'dlazdica:typy:kniezacie-sidla', '.lkat-nazov', 'Kniežacie sídla (test)');
  over('SK popisok sa prepísal priamo v stránke', (await textPrvku(p, 'dlazdica:typy:kniezacie-sidla', '.lkat-nazov')) === 'Kniežacie sídla (test)');
  over('po potvrdení nie je na plátne nič z písania (žiadny contenteditable)', (await fr(p).locator('[data-vw-pise], [contenteditable]').count()) === 0);
  await p.click('[data-vw-jazyk="en"]');
  await cakajNaPlatno(p);
  over('v EN je pri texte so starším znením žltá bodka', (await fr(p).locator('.vw-bodka-zlta').count()) > 0);
  await pis(p, 'dlazdica:typy:kniezacie-sidla', '.lkat-nazov', 'Princely seats (test)');
  over('EN popisok sa prepísal', (await textPrvku(p, 'dlazdica:typy:kniezacie-sidla', '.lkat-nazov')) === 'Princely seats (test)');
  await snimka(p, '06-text-en-1440');
  await p.click('[data-vw-jazyk="de"]');
  await cakajNaPlatno(p);
  over('DE ostal pôvodný', (await textPrvku(p, 'dlazdica:typy:kniezacie-sidla', '.lkat-nazov')) === (deStary.de || deStary.sk));
  await p.click('[data-vw-jazyk="sk"]');
  await cakajNaPlatno(p);
  over('SK sa prepisom EN nezmenil', (await textPrvku(p, 'dlazdica:typy:kniezacie-sidla', '.lkat-nazov')) === 'Kniežacie sídla (test)');

  /* ───────────── Sekcie ───────────── */
  sekcia('Sekcie: skrytie a poradie');
  await p.keyboard.press('Escape');
  await p.locator('[data-vw-oko="mapa"]').click();
  await spi(400);
  over('skrytá sekcia Mapa je na plátne vyšrafovaná (data-vw-skryte)', (await fr(p).locator('[data-vw="sekcia:mapa"][data-vw-skryte="1"]').count()) === 1);
  await p.locator('[data-vw-polozka="kronika"] button[aria-label="Vyššie"]').click();
  await spi(600);
  const poradieSekcii = await fr(p).locator('[data-vw^="sekcia:"]').evaluateAll((x) => x.map((e) => e.getAttribute('data-vw')));
  over('kronika sa posunula pred činnosť', poradieSekcii.indexOf('sekcia:kronika') < poradieSekcii.indexOf('sekcia:cinnost'), poradieSekcii.join(','));

  /* ───────────── Ručný riadok ───────────── */
  sekcia('Riadok „Ďalší obsah": vybrané ručne, 3 články');
  await vyber(p, 'riadok:dalsi-obsah:odborne-texty');
  await p.locator('[data-vw-riadok-panel="odborne-texty"] select').nth(2).selectOption('rucne');
  await spi(400);
  const vybrane = [];
  for (let i = 0; i < 3; i++) {
    await p.click('[data-vw-pridat-clanok-riadka="odborne-texty"]');
    const tlacidla = p.locator('.vw-hladanie-vysledky button[data-vw-clanok]:not([disabled])');
    await tlacidla.first().waitFor({ timeout: 20000 });
    const kt = tlacidla.nth(2 - i < 0 ? 0 : 2 - i);
    vybrane.push(await kt.getAttribute('data-vw-clanok'));
    await kt.click();
    await spi(500);
  }
  await cakaj(async () => (await fr(p).locator('[data-vw^="riadok-clanok:dalsi-obsah:odborne-texty:"]').count()) >= 3);
  const hrefy = await fr(p).locator('[data-vw^="riadok-clanok:dalsi-obsah:odborne-texty:"]').evaluateAll((x) => x.map((e) => e.getAttribute('href')));
  over('riadok ukazuje 3 ručne vybrané články v poradí výberu', vybrane.every((s, i) => hrefy[i] === `/blog/${s}`), `${vybrane.join(',')} | ${hrefy.join(',')}`);

  /* ───────────── Kronika ───────────── */
  sekcia('Kronika: pripnutie zápisu');
  const zapis = prvok(p, 'kronika:zapis:0');
  const dokZapisu = await zapis.getAttribute('data-vw-dokument');
  await vyber(p, 'kronika:zapis:0');
  await akcia(p, 'pripnut');
  await spi(800);
  const pripnuteDok = await fr(p).locator('[data-vw^="kronika:pripnuty:"]').evaluateAll((x) => x.map((e) => e.getAttribute('data-vw-dokument')));
  over('zápis je pripnutý na začiatku pásu', pripnuteDok.includes(dokZapisu), `${dokZapisu} v ${pripnuteDok.join(',')}`);

  /* ───────────── Menu ───────────── */
  sekcia('Hlavička a päta: poradie menu a hlavný riadok');
  await p.click('[data-vw-stranka="menu"]');
  over('stránka Hlavička a päta sa nakreslí', await cakajNaPlatno(p, { stranka: 'menu' }));
  await snimka(p, '07-hlavicka-pata-1440');
  pust = await tahaj(p, 'menu:refugia', 'menu:kniezacie-sidla', { za: false });
  await pust();
  const menuPo = await fr(p).locator('.lnav-cats-row:not([data-secondary]) .lnav-cat').evaluateAll((x) => x.map((e) => e.getAttribute('data-vw')));
  over('ťahanie v menu: Refúgiá na prvom mieste', menuPo[0] === 'menu:refugia', menuPo.join(','));
  await p.keyboard.press('Escape');
  await p.click('[data-vw-menu-rad="mocenske-centra"]');
  await spi(600);
  const druhyRiadok = await fr(p).locator('.lnav-cats-row[data-secondary] .lnav-cat').evaluateAll((x) => x.map((e) => e.getAttribute('data-vw')));
  over('Mocenské centrá prešli do druhého riadku', druhyRiadok.includes('menu:mocenske-centra'), druhyRiadok.join(','));
  await zariadenie(p, 'mobil');
  await cakajNaPlatno(p, { stranka: 'menu' });
  await snimka(p, '07-hlavicka-pata-390');
  await zariadenie(p, 'pocitac');

  /* ───────────── Stránka kategórie ───────────── */
  sekcia('Stránka kategórie: obrázok a popis');
  await p.selectOption('[data-vw-stranka="kategoria"]', 'povesti');
  over('stránka kategórie Povesti sa nakreslí', await cakajNaPlatno(p, { stranka: 'kategoria' }));
  const pozadiePred = await prvok(p, 'kategoria:obrazok').evaluate((e) => getComputedStyle(e).backgroundImage);
  await vyber(p, 'kategoria:obrazok');
  await akcia(p, 'obrazok');
  await vyberZMedii(p, OBRAZKY[2]);
  await p.click('[data-vw-pouzit-obrazok]');
  await spi(1200);
  const pozadiePo = await prvok(p, 'kategoria:obrazok').evaluate((e) => getComputedStyle(e).backgroundImage);
  over('hlavička kategórie má nový obrázok', pozadiePo !== pozadiePred, `${pozadiePred.slice(0, 80)} → ${pozadiePo.slice(0, 80)}`);
  await pis(p, 'kategoria:popis', null, 'Povesti o hradiskách — popis z testu editora.');
  over('popis kategórie sa prepísal priamo v stránke', (await textPrvku(p, 'kategoria:popis')) === 'Povesti o hradiskách — popis z testu editora.');
  const obrazokPovesti = await prvok(p, 'lista:povesti').locator('img').getAttribute('src');
  over('nový obrázok kategórie má aj jej mini dlaždica v lište', pozadiePo.includes((obrazokPovesti ?? '').split('/').pop().replace(/^(thumbnail|small|medium|large)_/, '')), obrazokPovesti);
  await snimka(p, '08-kategoria-1440');
  await zariadenie(p, 'mobil');
  await cakajNaPlatno(p, { stranka: 'kategoria' });
  await snimka(p, '08-kategoria-390');
  await zariadenie(p, 'pocitac');

  /* ───────────── Koncept nezmení web ───────────── */
  sekcia('Uloženie konceptu: web sa nezmení');
  over('stav: Neuložené zmeny', /Neuložené/.test(await stav(p)));
  over('uloženie konceptu', await ulozit(p));
  const k2 = await koncept();
  const kn = k2.koncept;
  const zaz = (slug) => kn.kategorie.find((x) => x.kategoria.slug === slug);
  over('koncept: poradie a skupiny dlaždíc', JSON.stringify(kn.domov.dlazdice.skupiny.map((s) => s.polozky.map((d) => d.kategoria.slug))) === JSON.stringify([['kniezacie-sidla', 'strazna-funkcia', 'staroveke-sidla', 'refugia'], ['listiny-a-pisomne-zdroje', 'vseobecne-o-hradiskach', 'povesti', 'mocenske-centra', 'svatyne-a-sakralne-objekty']]));
  over('koncept: nový obrázok a výrez (Médiá), nahratý súbor', !!zaz('strazna-funkcia').obrazok.pozicia && zaz('refugia').obrazok.id === nahrate[0], JSON.stringify([zaz('strazna-funkcia').obrazok, zaz('refugia').obrazok]));
  const pk = zaz('kniezacie-sidla').popisokDlazdice;
  over('koncept: popisok SK + EN, DE nezmenený, enZo = nové SK', pk.sk === 'Kniežacie sídla (test)' && pk.en === 'Princely seats (test)' && pk.enZo === 'Kniežacie sídla (test)' && pk.de === deStary.de && pk.deZo === deStary.deZo, JSON.stringify(pk));
  over('koncept: Mapa skrytá, kronika pred činnosťou', kn.domov.sekcie.find((s) => s.id === 'mapa').viditelna === false && kn.domov.sekcie.findIndex((s) => s.id === 'kronika') < kn.domov.sekcie.findIndex((s) => s.id === 'cinnost'));
  const rr = kn.domov.sekcie.find((s) => s.id === 'dalsi-obsah').riadky.find((x) => x.id === 'odborne-texty');
  over('koncept: ručný riadok s 3 článkami', rr.vyber === 'rucne' && rr.clanky.length === 3 && rr.clanky.every((c) => c.dokument));
  over('koncept: pripnutý zápis kroniky', kn.domov.sekcie.find((s) => s.typ === 'kronika').pripnute.some((c) => c.dokument === dokZapisu));
  const refDok = k2.db && Object.entries(k2.kategorie).find(([, x]) => x.slug === 'refugia')[0];
  over('koncept: menu — Refúgiá prvé, Mocenské centrá mimo hlavného riadku', kn.menu.poradie[0].dokument === refDok && !kn.menu.hlavnyRiadok.some((o) => o.slug === 'mocenske-centra'));
  over('koncept: obrázok a popis kategórie Povesti', zaz('povesti').popis.sk === 'Povesti o hradiskách — popis z testu editora.' && 'id' in zaz('povesti').obrazok && zaz('povesti').obrazok.id !== v1.data.kategorie.find((x) => x.kategoria.slug === 'povesti').obrazok.id, JSON.stringify([zaz('povesti').popis, zaz('povesti').obrazok]));
  over('verejný GET sa uložením konceptu nezmenil', JSON.stringify((await verejny())?.data) === JSON.stringify(v1.data));
  const webPoKoncepte = await podpisWebu('/');
  over('verejný web sa uložením konceptu nezmenil (vykreslenie)', stabilne(webPoKoncepte) === stabilne(webV1));

  /* Náhľad v novom okne (koncept s tokenom; bez tokenu nič). */
  {
    const { ctx, page } = await novaStranka(R1, { sirka: 1440, vyska: 900 });
    sleduj(page, 'nahlad');
    await page.goto(`${WEB}/?nahlad=vzhlad`, { waitUntil: 'load' });
    const ok = await cakaj(() => page.evaluate(() => !!document.querySelector('.lkat-rad--typy') && [...document.querySelectorAll('.lkat-rad--typy a.lkat-dlazdica')].map((x) => x.getAttribute('href')).join(',') === '/category/kniezacie-sidla,/category/strazna-funkcia,/category/staroveke-sidla,/category/refugia'), { max: 30000 });
    over('náhľad v novom okne ukáže koncept (prihlásený redaktor)', ok);
    over('náhľad má pás „Náhľad konceptu"', await page.evaluate(() => /Náhľad konceptu vzhľadu/.test(document.body.innerText)));
    await ctx.close();
    const { ctx: c2, page: p2 } = await novaStranka(null, { sirka: 1440, vyska: 900 });
    await p2.goto(`${WEB}/?nahlad=vzhlad`, { waitUntil: 'load' });
    await spi(4000);
    over('bez prihlásenia ?nahlad=vzhlad neukáže nič navyše', await p2.evaluate(() => !/Náhľad konceptu/.test(document.body.innerText) && [...document.querySelectorAll('.lkat-rad--typy a.lkat-dlazdica')].length === 5));
    await c2.close();
  }

  /* ───────────── Zverejnenie ───────────── */
  sekcia('Zverejnenie: zoznam zmien a web');
  if (SNIMKY) {
    await zariadenie(p, 'mobil');
    await p.click('[data-vw-zverejnit]');
    await p.waitForSelector('[data-vw-zoznam-zmien]', { timeout: 20000 });
    await snimka(p, '09-dialog-zverejnenia-390');
    await p.click('.vw-dialog button:has-text("Zrušiť")');
    await zariadenie(p, 'pocitac');
  }
  const zmenyV2 = await zverejnit(p, { poznamka: 'Test editora', snimkaMeno: '09-dialog-zverejnenia-1440' });
  log(`  (zoznam zmien: ${zmenyV2.length} riadkov: ${zmenyV2.slice(0, 8).join(' | ')} …)`);
  over('zoznam zmien je ľudsky čitateľný (dlaždica, sekcia, menu)', zmenyV2.some((z) => /^Dlaždica .*: nový obrázok|^Kategória .*: nový obrázok/.test(z)) && zmenyV2.some((z) => z === 'Sekcia Mapa: skrytá') && zmenyV2.some((z) => /^Menu: .* na 1\. mieste/.test(z)), zmenyV2.join(' | '));
  const v2 = await verejny();
  over('verejný GET po zverejnení má novú verziu a zmeny', v2?.verzia === 2 && v2.data.domov.sekcie.find((s) => s.id === 'mapa').viditelna === false);
  const webV2 = await podpisWebu('/');
  over('verejný web po zverejnení: nové poradie dlaždíc, nová skupina, popisok', webV2.dlazdice[0].map((x) => x.split('|')[0]).join(',') === '/category/kniezacie-sidla,/category/strazna-funkcia,/category/staroveke-sidla,/category/refugia' && webV2.dlazdice[0][0].includes('Kniežacie sídla (test)') && webV2.dlazdice[1].some((x) => x.startsWith('/category/mocenske-centra')), JSON.stringify(webV2.dlazdice));
  over('verejný web po zverejnení: Mapa skrytá, kronika pred činnosťou', !webV2.sekcie.includes('lhome-mapa') && webV2.sekcie.indexOf('lakv') < webV2.sekcie.indexOf('lhome-cinnost'), webV2.sekcie.join(','));
  over('verejný web po zverejnení: menu z databázy (Refúgiá prvé, Mocenské centrá mimo prvého riadku)', /^Refugi/.test(webV2.menu[0]) && !webV2.menu.some((m) => /Mocensk/.test(m)), webV2.menu.join(','));
  over('verejný web po zverejnení: nahratý obrázok na dlaždici', webV2.dlazdice[0][3].includes('vzhlad_editor_test'));
  const webEn = await podpisWebu('/en');
  over('anglický web má nový EN popisok', webEn.dlazdice[0][0].includes('Princely seats (test)'), webEn.dlazdice[0][0]);
  const katDb = dbr.prepare("select \"order\" o from blog_categories where slug = 'refugia'").get().o;
  over('poradie menu je zapísané v databáze (Refúgiá = 10)', katDb === 10, String(katDb));

  /* ───────────── História → obnovenie → zverejnenie ───────────── */
  sekcia('História → obnovenie → zverejnenie → web ako na začiatku');
  if (SNIMKY) {
    await zariadenie(p, 'mobil');
    await p.click('[data-vw-menu]');
    await p.click('[data-vw-menu-historia]');
    await p.waitForSelector('[data-vw-historia]', { timeout: 15000 });
    await snimka(p, '10-historia-390');
    await p.keyboard.press('Escape');
    await zariadenie(p, 'pocitac');
  }
  await p.click('[data-vw-menu]');
  await p.click('[data-vw-menu-historia]');
  await p.waitForSelector('[data-vw-historia]', { timeout: 15000 });
  const riadkyHistorie = await p.locator('[data-vw-verzia]').count();
  over('história má 2 verzie (kto, kedy, poznámka)', riadkyHistorie === 2 && /Test editora/.test(await p.locator('[data-vw-historia]').innerText()));
  await snimka(p, '10-historia-1440');
  await p.click('[data-vw-pozriet="1"]');
  await p.waitForSelector('[data-vw-citanie]', { timeout: 15000 });
  await cakajNaPlatno(p);
  over('„Pozrieť" ukáže verziu 1 na plátne len na čítanie (pôvodné poradie dlaždíc)', JSON.stringify(await poradieDlazdic(p, 'typy')) === JSON.stringify(['kniezacie-sidla', 'mocenske-centra', 'strazna-funkcia', 'refugia', 'staroveke-sidla']) && (await fr(p).locator('.vw-lista').count()) === 0);
  await snimka(p, '10-historia-pozriet-1440');
  await zariadenie(p, 'mobil');
  await snimka(p, '10-historia-pozriet-390');
  await zariadenie(p, 'pocitac');
  await p.click('[data-vw-obnovit-z-nahladu]');
  await cakaj(async () => (await p.locator('[data-vw-citanie]').count()) === 0, { max: 20000 });
  await cakajNaPlatno(p);
  const k3 = await koncept();
  over('obnovenie: koncept = verzia 1, web sa nezmenil', JSON.stringify(k3.koncept) === JSON.stringify(v1.data) && (await verejny())?.verzia === 2);
  await zverejnit(p, { poznamka: 'Návrat na verziu 1 (test)' });
  const webV3 = await podpisWebu('/');
  over('po zverejnení obnovenej verzie je web ako na začiatku', stabilne(webV3) === stabilne(webV1), JSON.stringify({ a: webV1.menu, b: webV3.menu }));
  over('…a ako bez vzhľadu (pôvodný stav)', stabilne({ ...webV3, pripnute: 0 }) === stabilne({ ...webNaZaciatku, pripnute: 0 }));

  /* ───────────── Súbeh ───────────── */
  sekcia('Súbeh: 409 pri dvoch oknách');
  druha = await otvorEditor(R2, '#/vzhlad/domov', { meno: 'editor-2' });
  await cakajNaPlatno(druha.page);
  await cakajNaPlatno(p);
  await pis(p, 'uvod:nadpis', null, 'Slovanské hradiská (okno 1)');
  await ulozit(p);
  await pis(druha.page, 'uvod:nadtitulok', null, 'Encyklopédia (okno 2)');
  await druha.page.click('[data-vw-ulozit]');
  await druha.page.waitForSelector('[data-vw-konflikt]', { timeout: 20000 });
  const textKonfliktu = await druha.page.locator('[data-vw-konflikt]').innerText();
  over('druhé okno dostane dialóg „Medzitým uložil … o …"', new RegExp(`Medzitým uložil koncept ${ucty[0].username}`).test(textKonfliktu), textKonfliktu.slice(0, 160));
  await snimka(druha.page, '11-subeh-409-1440');
  await druha.page.click('[data-vw-prepisat-mojou]');
  const zoznamPrepisania = await druha.page.locator('.vw-dialog ul.vw-zmeny').innerText();
  over('„Prepísať mojou" ukáže zoznam rozdielov a pýta potvrdenie', /Úvod – nadpis/.test(zoznamPrepisania) && (await druha.page.locator('[data-vw-potvrdit-prepisanie]').count()) === 1, zoznamPrepisania.slice(0, 200));
  await druha.page.click('text=Späť');
  await druha.page.click('[data-vw-nacitat-jeho]');
  await cakajNaPlatno(druha.page);
  over('„Načítať jeho verziu" načíta koncept z okna 1', (await textPrvku(druha.page, 'uvod:nadpis')) === 'Slovanské hradiská (okno 1)' && (await textPrvku(druha.page, 'uvod:nadtitulok')) !== 'Encyklopédia (okno 2)');
  await druha.ctx.close();
  druha = null;

  /* ───────────── Záloha v prehliadači a otázka pri odchode ───────────── */
  sekcia('Záloha v prehliadači, otázka pri odchode');
  await p.keyboard.press('Escape');
  await p.locator('[data-vw-oko="cinnost"]').click();
  await spi(800);
  over('zmena čaká na uloženie', /Neuložené/.test(await stav(p)));
  const dialogyPred = hlavna.dialogy.length;
  hlavna.odpoved = 'zrusit';
  await p.click('nav >> text=Články');
  await spi(800);
  hlavna.odpoved = 'prijat';
  over('odchod cez ponuku administrácie sa pýta (confirm) a po „Zrušiť" editor ostane', hlavna.dialogy.slice(dialogyPred).includes('confirm') && /#\/vzhlad\/domov/.test(p.url()) && /Neuložené/.test(await stav(p)), `${hlavna.dialogy.join(',')} ${p.url()}`);
  await spi(5500);
  const dialogyPredObn = hlavna.dialogy.length;
  await p.reload({ waitUntil: 'load' }).catch(() => {});
  await spi(1000);
  over('obnovenie stránky s neuloženými zmenami sa pýta (beforeunload)', hlavna.dialogy.slice(dialogyPredObn).includes('beforeunload'), hlavna.dialogy.join(','));
  await p.waitForSelector('[data-vw-obnovit-zalohu]', { timeout: 60000 });
  over('po obnovení stránky editor ponúkne rozpracované zmeny z prehliadača', true);
  await p.click('[data-vw-obnovit-zalohu]');
  await cakajNaPlatno(p);
  over('obnovená záloha: sekcia Činnosť je skrytá a zmeny čakajú na uloženie', (await fr(p).locator('[data-vw="sekcia:cinnost"][data-vw-skryte="1"]').count()) === 1 && /Neuložené/.test(await stav(p)));
  await ulozit(p);

  /* ───────────── 30 krokov späť ───────────── */
  sekcia('Ctrl+Z 30 krokov späť → plátno ako po otvorení');
  await p.reload({ waitUntil: 'load' });
  await cakajNaPlatno(p);
  await spi(1500);
  const podpisPlatna = async () => (await okno(p)).evaluate(() => {
    const k = document.querySelector('[data-vw-platno]').cloneNode(true);
    k.querySelectorAll('.lakv-strip, .lakv-os').forEach((e) => e.remove());
    return k.outerHTML.replace(/ style="[^"]*--lkat-poradie[^"]*"/g, '');
  });
  const naZaciatku = await podpisPlatna();
  let krokov = 0;
  const krok = async (fn) => { await fn(); krokov++; await spi(250); };
  await vyber(p, 'dlazdica:typy:kniezacie-sidla');
  for (let i = 0; i < 8; i++) await krok(() => p.keyboard.press('Alt+ArrowRight'));
  await p.keyboard.press('Escape');
  for (const s of ['mapa', 'dalsi-obsah', 'cinnost', 'kronika']) await krok(() => p.locator(`[data-vw-oko="${s}"]`).click());
  for (const s of ['mapa', 'dalsi-obsah', 'cinnost', 'kronika']) await krok(() => p.locator(`[data-vw-oko="${s}"]`).click());
  await vyber(p, 'dlazdica:typy:mocenske-centra');
  for (let i = 0; i < 6; i++) await krok(() => p.keyboard.press('Alt+ArrowRight'));
  await p.keyboard.press('Escape');
  for (let i = 0; i < 4; i++) {
    const hore = p.locator('[data-vw-polozka="kronika"] button[aria-label="Vyššie"]');
    await krok(async () => ((await hore.isDisabled()) ? p.locator('[data-vw-polozka="kronika"] button[aria-label="Nižšie"]').click() : hore.click()));
  }
  await krok(() => pis(p, 'uvod:nadtitulok', null, 'Krok 27'));
  await krok(() => pis(p, 'uvod:nadpis', null, 'Krok 28'));
  await krok(() => pis(p, 'cinnost:nadpis', null, 'Krok 29'));
  await krok(() => pis(p, 'hladanie:vyzva', null, 'Krok 30'));
  await p.keyboard.press('Escape');
  log(`  (urobených krokov: ${krokov})`);
  over('30 zmien je na plátne vidieť', krokov === 30 && (await podpisPlatna()) !== naZaciatku);
  for (let i = 0; i < 30; i++) { await p.keyboard.press('Control+z'); await spi(120); }
  await spi(1500);
  over('po 30× Ctrl+Z je plátno ako po otvorení', (await podpisPlatna()) === naZaciatku);
  over('po 30× Ctrl+Z nie je čo vrátiť a nič nečaká na uloženie', (await p.locator('[data-vw-vratit]').isDisabled()) && !/Neuložené/.test(await stav(p)));

  /* ───────────── Mobil ───────────── */
  sekcia('Mobil 390 px');
  await zariadenie(p, 'mobil');
  await cakajNaPlatno(p);
  const pretecenie = await (await okno(p)).evaluate(() => ({ s: document.documentElement.scrollWidth, c: document.documentElement.clientWidth, w: window.innerWidth }));
  over('plátno mobilu má 390 px a nič nepreteká do strán', pretecenie.w === 390 && pretecenie.s <= 390, JSON.stringify(pretecenie));
  pust = await tahaj(p, 'dlazdica:typy:kniezacie-sidla', 'dlazdica:typy:refugia', { za: true });
  await snimka(p, '12-tahanie-390');
  await pust();
  over('ťahanie v mobilnom rozložení (2 stĺpce)', (await poradieDlazdic(p, 'typy')).indexOf('kniezacie-sidla') > (await poradieDlazdic(p, 'typy')).indexOf('refugia'), (await poradieDlazdic(p, 'typy')).join(','));
  await vyber(p, 'dlazdica:typy:strazna-funkcia');
  await snimka(p, '03-vybrana-dlazdica-390');
  await p.keyboard.press('Control+z');
  await spi(500);
  await zariadenie(p, 'pocitac');

  /* Administrácia na úzkej obrazovke: stránka nepreteká (len plátno sa posúva vo vlastnom ráme). */

  /* ───────────── Klasická úprava ───────────── */
  sekcia('Klasická úprava: zmena + zverejnenie');
  await p.click('[data-vw-menu]');
  await p.click('[data-vw-menu-formular]');
  await p.waitForSelector('[data-vw-formular]', { timeout: 20000 });
  await p.click('.apanel-head:has-text("Sekcie domovskej")');
  await p.locator('[data-vw-formular-sekcie] [data-vw-oko="mapa"]').click();
  await spi(400);
  over('formulár: zmena čaká na uloženie (ten istý koncept)', /Neuložené/.test(await p.locator('[data-vw-stav]').innerText()));
  await snimka(p, '13-klasicka-uprava-1440');
  await p.click('[data-vw-formular] [data-vw-zverejnit]');
  await p.waitForSelector('[data-vw-zoznam-zmien]', { timeout: 20000 });
  const zmenyF = await p.locator('[data-vw-zoznam-zmien] li').allInnerTexts();
  await p.click('[data-vw-potvrdit-zverejnenie]');
  await cakaj(async () => (await p.locator('[data-vw-zoznam-zmien]').count()) === 0, { max: 30000 });
  const v4 = await verejny();
  over('formulár: zverejnenie zmeny (Mapa skrytá) je na webe', zmenyF.some((z) => /Sekcia Mapa: skrytá/.test(z)) && v4.data.domov.sekcie.find((s) => s.id === 'mapa').viditelna === false, zmenyF.join(' | '));
  await p.click('.apanel-head:has-text("Dlaždice kategórií")');
  await p.locator('[data-vw-na-platne^="dlazdica:"]').first().click();
  await cakajNaPlatno(p);
  over('„Otvoriť na plátne" otvorí plátno s vybraným prvkom', (await fr(p).locator('[data-vw-vybrane^="dlazdica:"]').count()) === 1);

  /* ───────────── Kategórie a Médiá ───────────── */
  sekcia('Kategórie a Médiá');
  await p.goto(`${WEB}/admin#/categories`);
  await p.waitForSelector('[data-vw-vzhlad-kategorie="refugia"]', { timeout: 30000 });
  await p.locator('[data-cat-row]').filter({ hasText: 'Refugiá' }).first().click().catch(() => p.locator('[data-cat-row]').nth(3).click());
  over('Kategórie: rozlíšenie „ukladá sa hneď" a „zverejní sa so vzhľadom"', (await p.locator('.vw-druh-ulozenia.je-hned').count()) === 1 && (await p.locator('.vw-druh-ulozenia.je-vzhlad').count()) === 1);
  await p.fill('#cat-slug', 'refugia-zmena');
  over('Kategórie: pri zmene slugu varovanie', (await p.locator('[data-vw-varovanie-slug]').count()) === 1);
  await p.fill('#cat-slug', 'refugia');
  await p.click('[data-vw-vzhlad-kategorie="refugia"]');
  over('„Vzhľad na webe" otvorí plátno kategórie', await cakajNaPlatno(p, { stranka: 'kategoria' }) && /#\/vzhlad\/kategoria\/refugia/.test(p.url()));
  await p.goto(`${WEB}/admin#/media`);
  await p.waitForSelector('text=Médiá');
  const kartaNahrateho = p.locator('.acard:has-text("vzhlad_editor_test")').first();
  await kartaNahrateho.waitFor({ timeout: 30000 });
  await kartaNahrateho.locator('button[title="Zmazať"]').click();
  await p.waitForSelector('[data-vw-subor-pouzity]', { timeout: 20000 });
  over('Médiá: pred zmazaním povie, že obrázok používa vzhľad (a zmazať nedá)', /Tento obrázok sa zmazať nedá/.test(await p.locator('[data-vw-subor-pouzity]').innerText()));
  await p.click('text=Zavrieť');

  over('bez chýb v konzole', konzola.length === 0, konzola.slice(0, 6).join(' || '));
  if (chybajuceSubory.size) log(`  (pozn.: v lokálnej kópii médií chýba ${chybajuceSubory.size} súborov: ${[...chybajuceSubory].join(', ')} — rovnako na verejnom webe)`);
}

/* ───────────── Upratovanie ───────────── */

async function uprac() {
  sekcia('Upratovanie: návrat DB do stavu pred testom');
  for (const s of [druha, hlavna]) { try { await s?.ctx.close(); } catch { /* nič */ } }
  const teraz = snimkaDb();
  for (const k of PRED.kategorie) {
    const n = teraz.kategorie.find((x) => x.d === k.d);
    if (n && (n.name !== k.name || n.slug !== k.slug || n.o !== k.o)) {
      const r = await api('PUT', `/api/blog-categories/${k.d}`, { telo: { data: { name: k.name, slug: k.slug, order: k.o } } });
      if (r.status !== 200) log(`  ! kategória ${k.slug}: návrat zlyhal (${r.status})`);
    }
  }
  if (stabilne(snimkaDb().galeria) !== stabilne(PRED.galeria)) {
    const K = await koncept();
    if (K?.koncept) {
      const v = structuredClone(K.koncept);
      v.domov.fotogaleria = { fotky: PRED.galeria };
      let r = await api('PUT', '/api/vzhlad-webu/koncept', { telo: { zaklad: K.verziaKonceptu, data: v, zakladDb: K.db } });
      if (r.status === 200) r = await api('POST', '/api/vzhlad-webu/zverejnit', { telo: { zaklad: K.verziaKonceptu + 1, poznamka: 'test editora — upratovanie' } });
      if (r.status !== 200) log(`  ! galéria: návrat zlyhal (${r.status})`);
    }
  }
  {
    const dbw = new Database(DB_CESTA, { fileMustExist: true });
    dbw.pragma('busy_timeout = 5000');
    dbw.transaction(() => {
      const povodne = new Set(PRED.historia);
      for (const { id } of dbw.prepare('select id from vzhlad_webu_verzie').all()) if (!povodne.has(id)) dbw.prepare('delete from vzhlad_webu_verzie where id = ?').run(id);
      const predIds = new Set(PRED.vzhlad.map((x) => x.id));
      for (const { id } of dbw.prepare('select id from vzhlad_webu').all()) if (!predIds.has(id)) dbw.prepare('delete from vzhlad_webu where id = ?').run(id);
      for (const row of PRED.vzhlad) {
        const st = Object.keys(row).filter((c) => c !== 'id');
        dbw.prepare(`update vzhlad_webu set ${st.map((c) => `"${c}" = @${c}`).join(', ')} where id = @id`).run(row);
      }
    })();
    dbw.close();
  }
  {
    const s = snimkaDb();
    const dbw = new Database(DB_CESTA, { fileMustExist: true });
    dbw.pragma('busy_timeout = 5000');
    dbw.transaction(() => {
      if (stabilne(s.kategorie) === stabilne(PRED.kategorie)) {
        const u = dbw.prepare('update blog_categories set updated_at = @updated_at, published_at = @published_at where id = @id');
        for (const c of PRED.casy) u.run(c);
      }
      if (stabilne(s.galeria) === stabilne(PRED.galeria)) {
        const u = dbw.prepare('update domovska_galeria set updated_at = @updated_at, published_at = @published_at where id = @id');
        for (const c of PRED.casGalerie) u.run(c);
        dbw.prepare("delete from files_related_mph where related_type = 'api::domovska-galeria.domovska-galeria' and field = 'fotky'").run();
        const st = Object.keys(PRED.vazbyGalerie[0] || {});
        if (st.length) {
          const ins = dbw.prepare(`insert into files_related_mph (${st.map((c) => `"${c}"`).join(', ')}) values (${st.map((c) => `@${c}`).join(', ')})`);
          for (const v of PRED.vazbyGalerie) ins.run(v);
        }
      }
    })();
    dbw.close();
  }
  for (const id of nahrate) {
    const r = await api('GET', `/api/upload/files/${id}`);
    if (r.status === 404) continue;
    const d = await api('DELETE', `/api/upload/files/${id}`);
    if (d.status !== 200) log(`  ! súbor ${id}: zmazanie zlyhalo (${d.status} ${d.text.slice(0, 120)})`);
  }
  /* Počítadlá AUTOINCREMENT (sqlite_sequence) tabuliek, do ktorých test vkladal — späť na hodnotu
     pred testom, keď v tabuľke nie je riadok s vyšším id (ďalšie id tak budú presne ako pred testom). */
  {
    const dbw = new Database(DB_CESTA, { fileMustExist: true });
    dbw.pragma('busy_timeout = 5000');
    dbw.transaction(() => {
      for (const { name, seq } of PRED_SEKVENCIE) {
        const mx = dbw.prepare(`select max(rowid) m from "${name}"`).get().m;
        if (mx === null || mx <= seq) dbw.prepare('update sqlite_sequence set seq = ? where name = ?').run(seq, name);
      }
      const znamych = new Set(PRED_SEKVENCIE.map((x) => x.name));
      for (const { name } of dbw.prepare('select name from sqlite_sequence').all()) {
        if (!znamych.has(name) && dbw.prepare(`select count(*) n from "${name}"`).get().n === 0) dbw.prepare('delete from sqlite_sequence where name = ?').run(name);
      }
    })();
    dbw.close();
  }

  const PO = snimkaDb();
  over('upratanie: kategórie (documentId, názov, slug, poradie) ako pred testom', stabilne(PO.kategorie) === stabilne(PRED.kategorie));
  over('upratanie: časové značky kategórií a galérie, väzby galérie ako pred testom', stabilne(PO.casy) === stabilne(PRED.casy) && stabilne(PO.casGalerie) === stabilne(PRED.casGalerie) && stabilne(PO.vazbyGalerie) === stabilne(PRED.vazbyGalerie));
  over('upratanie: domovská galéria ako pred testom', stabilne(PO.galeria) === stabilne(PRED.galeria));
  over('upratanie: riadok vzhľadu a história ako pred testom', stabilne(PO.vzhlad) === stabilne(PRED.vzhlad) && stabilne(PO.historia) === stabilne(PRED.historia));
  over('upratanie: médiá — počet súborov a priečinkov ako pred testom, nahratý súbor zmazaný', PO.subory.n === PRED.subory.n && PO.priecinky === PRED.priecinky && dbr.prepare(`select count(*) n from files where id in (${nahrate.map(Number).join(',') || 0})`).get().n === 0);
  const naDisku = readdirSync(join(BE, 'public', 'uploads')).filter((n) => n.includes('vzhlad_editor_test'));
  over('upratanie: na disku nie je skúšobný súbor ani zmenšenina', naDisku.length === 0, naDisku.join(', '));
  const w = await verejny();
  over('upratanie: verejný GET ako pred testom (data: null)', w?.data === null);
  const ODTLACOK_PO = odtlacokDb();
  const rozdielne = Object.keys({ ...ODTLACOK_PRED, ...ODTLACOK_PO }).filter((t) => stabilne(ODTLACOK_PRED[t]) !== stabilne(ODTLACOK_PO[t]));
  log(`  (tabuľky s iným obsahom než pred testom: ${rozdielne.length ? rozdielne.map((t) => `${t} ${ODTLACOK_PRED[t]?.n}→${ODTLACOK_PO[t]?.n}`).join(', ') : 'žiadne'})`);
  over('upratanie: počty riadkov všetkých tabuliek ako pred testom', Object.keys(ODTLACOK_PRED).every((t) => ODTLACOK_PRED[t].n === ODTLACOK_PO[t]?.n), rozdielne.join(','));
  over('upratanie: obsah všetkých tabuliek bajt po bajte ako pred testom', rozdielne.length === 0, rozdielne.join(','));
  writeFileSync(join(VYSTUP, 'test-editor-db.json'), JSON.stringify({ pred: ODTLACOK_PRED, po: ODTLACOK_PO, rozdielne }, null, 1));
}

let kod = 0;
try {
  await hlavnyTest();
} catch (e) {
  over('test dobehol bez výnimky', false, e?.stack || String(e));
  if (konzola.length) log('  (konzola: ' + konzola.slice(0, 8).join(' || ') + ')');
  try { if (hlavna) await hlavna.page.screenshot({ path: join(VYSTUP, 'test-editor-chyba.png') }); } catch { /* nič */ }
} finally {
  try { await uprac(); } catch (e) { over('upratovanie dobehlo bez výnimky', false, e?.stack || String(e)); }
  log(`\nVýsledok: prešlo ${preslo} z ${pocet}${zlyhane.length ? ` — ZLYHALO ${zlyhane.length}:\n  - ${zlyhane.join('\n  - ')}` : ''}`);
  log(`Záznam: ${VYSLEDOK}`);
  kod = zlyhane.length ? 1 : 0;
  await prehliadac.close();
  dbr.close();
}
process.exit(kod);
