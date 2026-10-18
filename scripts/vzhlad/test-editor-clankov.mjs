/**
 * TEST EDITORA ČLÁNKOV PO PRESUNE CanvasFrame (plán, časť 10.3, posledný bod).
 *
 * Pre 20 článkov: otvor článok v editore článkov (#/editor/<documentId>), klikni do
 * každého textového bloku (tým sa v ňom zapne TipTap), nič nemeň a ulož koncept.
 * Obsah konceptu v databáze musí ostať bajt po bajte rovnaký: polia článku, všetky
 * bloky v poradí (aj vnorené komponenty a obrázky), pobočný stĺpec, titulná fotka,
 * galéria, kategória a štítky. Porovnáva sa obsah, nie čísla riadkov a časy — Strapi
 * pri uložení komponenty zakladá nanovo (nové id, prečíslované `order`) a zapíše čas
 * úpravy.
 *
 * Štyri polia editor článkov odjakživa ukladá po svojom (nezávisí to od plátna) — test
 * ich porovná vo význame a vypíše zvlášť, nie ako zmenu obsahu:
 *   `gallery_columns`          null → 3 (web null kreslí ako 3),
 *   `cover_position`           null → „center center“ (web null kreslí ako stred),
 *   `original_published_date`  čas sa stratí, ostane deň (pole dátumu v editore je bez času),
 *   popis vloženého videa      "" → null (docs/EDITOR.md, „Čo ostáva otvorené“).
 *
 * Klik ide vždy na skutočný text bloku (bod, kde `elementFromPoint` vráti prvok bloku
 * v okne plátna aj samotné okno v administrácii) — nie na obrázok alebo panel vedľa,
 * inak by test meral svoje vlastné kliknutia do polí obrázka.
 *
 * Uloženie mení v DB časy a id komponentov. Test preto na konci vypíše, ktoré tabuľky
 * sa líšia; DB sa po teste vracia zo zálohy (pozri docs/VZHLAD-WEBU.md, „Testy").
 * Inšpirácia: dnešný `_roundtrip.tmp.mjs` (nedá sa spustiť, chýba mu pomocný súbor).
 *
 *   node scripts/vzhlad/test-editor-clankov.mjs [--pocet 20] [--slug a,b] [--be …] [--web …] [--api …]
 *
 * `--slug` vyberie konkrétne články (na ladenie) namiesto rovnomerného výberu.
 */
import { createRequire } from 'node:module';
import { appendFileSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright';
import { KOREN, VYSTUP } from './spolocne.mjs';

const a = process.argv.slice(2);
const arg = (k, d) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : d; };
const BE = resolve(arg('--be', resolve(KOREN, '..', 'hradiska-strapi')));
const WEB = arg('--web', process.env.VZHLAD_WEB || 'http://127.0.0.1:5190').replace(/\/$/, '');
const API = arg('--api', process.env.VZHLAD_API || 'http://127.0.0.1:1337').replace(/\/$/, '');
const POCET = Number(arg('--pocet', '20'));
const SLUGY = arg('--slug', '').split(',').filter(Boolean);
for (const u of [WEB, API]) {
  if (!/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(u)) { console.error(`Test smie bežať len lokálne (dostal som ${u}).`); process.exit(2); }
}

const reqBE = createRequire(join(BE, 'package.json'));
const Database = reqBE('better-sqlite3');
const jwt = reqBE('jsonwebtoken');
const ENV = reqBE('dotenv').parse(readFileSync(join(BE, '.env.lokalne-vzhlad')));
const DB_CESTA = resolve(BE, ENV.DATABASE_FILENAME || '.tmp/data.db');
const VYSLEDOK = join(VYSTUP, 'test-editor-clankov-vysledok.txt');
writeFileSync(VYSLEDOK, `Test editora článkov — ${new Date().toISOString()}\n`);
const log = (s) => { console.log(s); appendFileSync(VYSLEDOK, s + '\n'); };
const spi = (ms) => new Promise((r) => setTimeout(r, ms));

/* Tabuľky komponentov podľa schémy backendu (collectionName). */
const TABULKY = {};
for (const kat of readdirSync(join(BE, 'src', 'components'))) {
  for (const f of readdirSync(join(BE, 'src', 'components', kat))) {
    const s = JSON.parse(readFileSync(join(BE, 'src', 'components', kat, f), 'utf8'));
    TABULKY[`${kat}.${f.replace(/\.json$/, '')}`] = s.collectionName;
  }
}

const db = new Database(DB_CESTA, { readonly: true, fileMustExist: true });
/** Koľkokrát bol popis videa "" (pred uložením) — editor ho uloží ako null. */
let prazdnychPopisovVidea = 0;
db.pragma('busy_timeout = 5000');
const existuje = (t) => !!db.prepare("select 1 from sqlite_master where type='table' and name=?").get(t);
const bez = (r, ...k) => { const o = { ...r }; for (const x of ['id', 'created_at', 'updated_at', 'created_by_id', 'updated_by_id', 'published_at', ...k]) delete o[x]; return o; };

/** Komponent aj s vnorenými komponentmi a súbormi (bez id riadkov). */
function komponent(typ, id) {
  const t = TABULKY[typ];
  const riadok = t ? db.prepare(`select * from "${t}" where id = ?`).get(id) : null;
  const subory = db.prepare('select file_id, field from files_related_mph where related_type = ? and related_id = ? order by field, "order"').all(typ, id);
  const vnorene = t && existuje(`${t}_cmps`)
    ? db.prepare(`select cmp_id, component_type, field, "order" from "${t}_cmps" where entity_id = ? order by field, "order"`).all(id).map((c) => ({ field: c.field, typ: c.component_type, obsah: komponent(c.component_type, c.cmp_id) }))
    : [];
  const r = riadok ? bez(riadok) : null;
  if (r && typ === 'content.embed' && r.caption === '') { r.caption = null; prazdnychPopisovVidea++; }
  return { typ, riadok: r, subory, vnorene };
}

/** Obsah konceptu článku (slovenská verzia bez publishedAt). */
function obsah(dokument) {
  const p = db.prepare("select * from blog_posts where document_id = ? and locale = 'sk' and published_at is null").get(dokument);
  if (!p) return null;
  const clanok = bez(p);
  if (clanok.gallery_columns == null) clanok.gallery_columns = 3;
  if (clanok.cover_position == null) clanok.cover_position = 'center center';
  if (clanok.original_published_date != null) clanok.original_published_date = new Date(clanok.original_published_date).toISOString().slice(0, 10);
  return JSON.stringify({
    clanok,
    komponenty: db.prepare('select cmp_id, component_type, field, "order" from blog_posts_cmps where entity_id = ? order by field, "order"').all(p.id)
      .map((c) => ({ field: c.field, ...komponent(c.component_type, c.cmp_id) })),
    subory: db.prepare("select file_id, field from files_related_mph where related_type = 'api::blog-post.blog-post' and related_id = ? order by field, \"order\"").all(p.id),
    kategoria: db.prepare('select c.document_id from blog_posts_category_lnk l join blog_categories c on c.id = l.blog_category_id where l.blog_post_id = ?').all(p.id),
    stitky: db.prepare('select t.document_id from blog_posts_tags_lnk l join blog_tags t on t.id = l.blog_tag_id where l.blog_post_id = ? order by l.blog_tag_ord, l.id').all(p.id),
  });
}

/* 20 článkov s 2 až 14 textovými blokmi, rovnomerne naprieč databázou. */
const kandidati = db.prepare(`select p.document_id d, p.slug, count(*) n from blog_posts_cmps c join blog_posts p on p.id = c.entity_id
  where c.field = 'blocks' and c.component_type = 'content.rich-text' and p.published_at is null and p.locale = 'sk'
  group by p.id having n between 2 and 14 order by p.id`).all();
const krok = Math.max(1, Math.floor(kandidati.length / POCET));
const clanky = SLUGY.length ? kandidati.filter((c) => SLUGY.includes(c.slug)) : kandidati.filter((_, i) => i % krok === 0).slice(0, POCET);
log(`${clanky.length} článkov z ${kandidati.length} vhodných`);

const ucet = db.prepare(`select u.id from up_users u join up_users_role_lnk l on l.user_id = u.id join up_roles r on r.id = l.role_id
  where r.type = 'authenticated' and coalesce(u.blocked, 0) = 0 order by u.id limit 1`).get();
const TOKEN = jwt.sign({ id: ucet.id }, ENV.JWT_SECRET, { expiresIn: '2h' });

/** Surové hodnoty troch polí, ktoré editor článkov ukladá po svojom (pozri hlavičku). */
const POLIA_PO_SVOJOM = { gallery_columns: 0, cover_position: 0, original_published_date: 0 };
let popisVidea = 0;
function polia(dokument) {
  return db.prepare("select gallery_columns, cover_position, original_published_date from blog_posts where document_id = ? and locale = 'sk' and published_at is null").get(dokument) ?? {};
}
function rozdielyPoli(a, b) {
  const ukaz = (k, x) => (x == null ? 'null' : k.endsWith('date') ? new Date(x).toISOString() : String(x));
  return Object.keys(POLIA_PO_SVOJOM).filter((k) => a[k] !== b[k]).map((k) => `${k} ${ukaz(k, a[k])} → ${ukaz(k, b[k])}`);
}

/** V okne plátna označí rodiča prvého neprázdneho textu bloku (`data-test-ciel`), k nemu sa odroluje. */
function oznacCiel(f, uid) {
  return f.evaluate((u) => {
    for (const e of document.querySelectorAll('[data-test-ciel]')) e.removeAttribute('data-test-ciel');
    const blok = document.querySelector(`[data-block-uid="${u}"]`);
    if (!blok) return false;
    const w = document.createTreeWalker(blok, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      if (n.textContent.trim() && n.parentElement) { n.parentElement.setAttribute('data-test-ciel', '1'); return true; }
    }
    return false;
  }, uid);
}

/**
 * Bod na texte bloku v súradniciach stránky administrácie: odroluje k prvému neprázdnemu
 * textu bloku, prejde jeho riadky a vráti prvý bod, kde je v okne plátna prvok tohto bloku
 * (nie obrázok, odkaz ani ovládanie) a v administrácii samotné okno (nie lišta, panel
 * obrázka ani hlavička).
 */
async function bodNaTexte(page, ramec, f, uid) {
  for (let pokus = 0; pokus < 3; pokus++) {
    if (!(await oznacCiel(f, uid))) return pokus ? null : 'prazdny';
    await f.locator('[data-test-ciel]').first().scrollIntoViewIfNeeded().catch(() => {});
    if (pokus) await page.mouse.wheel(0, pokus === 1 ? -220 : 220);
    await spi(150);
    const k = await f.evaluate((u) => {
      for (const e of document.querySelectorAll('[data-test-ciel]')) e.removeAttribute('data-test-ciel');
      const blok = document.querySelector(`[data-block-uid="${u}"]`);
      const von = [];
      const w = document.createTreeWalker(blok, NodeFilter.SHOW_TEXT);
      for (let n = w.nextNode(); n && von.length < 60; n = w.nextNode()) {
        if (!n.textContent.trim()) continue;
        const r = document.createRange();
        r.selectNodeContents(n);
        const riadky = [...r.getClientRects()].filter((q) => q.width >= 4 && q.height >= 4);
        const skus = (x, y) => {
          const t = document.elementFromPoint(x, y);
          if (t && blok.contains(t) && !t.closest('button, input, textarea, select, label, img, a, figure')) von.push({ x, y });
        };
        for (const q of riadky) for (const dx of [0.25, 0.5, 0.75]) skus(q.left + q.width * dx, q.top + q.height / 2);
        /* Odsek, ktorý je celý odkaz: klik vedľa odkazu, do toho istého odseku (na odkaz nie — viedol by preč). */
        const odsek = n.parentElement.closest('p, h1, h2, h3, h4, li');
        const posl = riadky[riadky.length - 1];
        if (odsek && posl && odsek.getBoundingClientRect().right > posl.right + 20) skus(posl.right + 15, posl.top + posl.height / 2);
      }
      return { von, sirka: window.innerWidth };
    }, uid);
    const r = await ramec.boundingBox();
    if (!r || !k.von.length) continue;
    const m = r.width / k.sirka;
    const body = k.von.map((b) => ({ x: r.x + b.x * m, y: r.y + b.y * m }));
    const bod = await page.evaluate((body) => body.find((b) => document.elementFromPoint(b.x, b.y)?.tagName === 'IFRAME') ?? null, body);
    if (bod) return bod;
  }
  return null;
}

const prehliadac = await chromium.launch();
let rovnakych = 0, zlyhanych = 0;
const chyby = [];
for (const [i, c] of clanky.entries()) {
  prazdnychPopisovVidea = 0;
  const pred = obsah(c.d);
  const predVidea = prazdnychPopisovVidea;
  const predPolia = polia(c.d);
  const ctx = await prehliadac.newContext({ viewport: { width: 1600, height: 1000 }, serviceWorkers: 'block' });
  await ctx.addInitScript((t) => localStorage.setItem('hradiska.admin.jwt', t), TOKEN);
  const page = await ctx.newPage();
  const konzola = [];
  /* Vložené prehrávače (YouTube, Sketchfab) si do konzoly píšu samy — to nie je editor. */
  page.on('console', (m) => { if (m.type() === 'error' && !/^Failed to load resource|Permissions policy violation/.test(m.text())) konzola.push(m.text().slice(0, 200)); });
  page.on('pageerror', (e) => konzola.push(`pageerror: ${e.message}`));
  page.on('dialog', (d) => d.dismiss().catch(() => {}));
  try {
    await page.goto(`${WEB}/admin#/editor/${c.d}`, { waitUntil: 'load' });
    const ramec = await page.waitForSelector('iframe[title="Náhľad článku"]', { timeout: 60000 });
    const f = await ramec.contentFrame();
    await f.waitForSelector('[data-block-type="content.rich-text"]', { timeout: 60000 });
    await spi(800);
    const uids = await f.evaluate(() => [...document.querySelectorAll('[data-block-type="content.rich-text"]')].map((e) => e.dataset.blockUid));
    /* Skutočný klik myšou do každého textového bloku — na jeho text. */
    let otvorenych = 0;
    const netrafene = [];
    let prazdnych = 0;
    for (const uid of uids) {
      const bod = await bodNaTexte(page, ramec, f, uid);
      if (bod === 'prazdny') { prazdnych++; continue; }
      if (!bod) { netrafene.push(uid); continue; }
      await page.mouse.click(bod.x, bod.y);
      await spi(250);
      if (await f.evaluate((u) => !!document.querySelector(`[data-block-uid="${u}"] .ProseMirror`), uid)) otvorenych++;
    }
    const tiptap = otvorenych;
    const neulozene = await page.locator('text=Neuložené zmeny').count();
    await page.click('button:has-text("Uložiť koncept")', { timeout: 15000 }).catch(async (e) => {
      await page.screenshot({ path: join(VYSTUP, `test-editor-clankov-chyba-${c.slug}.png`) }).catch(() => {});
      throw e;
    });
    await page.waitForFunction(() => /Uložené \d/.test(document.body.innerText), null, { timeout: 30000 });
    const po = obsah(c.d);
    const rovnake = po === pred;
    if (rovnake) rovnakych++;
    else {
      let k = 0;
      while (k < pred.length && pred[k] === po[k]) k++;
      chyby.push({ slug: c.slug, kde: k, pred: pred.slice(Math.max(0, k - 120), k + 120), po: po?.slice(Math.max(0, k - 120), k + 120) });
    }
    const pol = rozdielyPoli(predPolia, polia(c.d));
    if (predVidea) { pol.push(`popis videa "" → null (${predVidea}×)`); popisVidea++; }
    log(`[${i + 1}/${clanky.length}] ${c.slug}: textových blokov ${uids.length}, TipTap zapnutý ${tiptap}×${prazdnych ? ` (bez textu: ${prazdnych})` : ''}${netrafene.length ? ` (netrafený text: ${netrafene.length})` : ''}, ${neulozene ? 'OZNAČENÉ AKO ZMENENÉ, ' : ''}${rovnake ? 'obsah v DB rovnaký ✓' : 'OBSAH SA LÍŠI ✗'}${pol.length ? ` · editor po svojom: ${pol.join(', ')}` : ''}${konzola.length ? ` · konzola: ${konzola[0]}` : ''}`);
    for (const pole of Object.keys(POLIA_PO_SVOJOM)) if (pol.some((x) => x.startsWith(pole))) POLIA_PO_SVOJOM[pole]++;
    if (neulozene || konzola.length || tiptap < uids.length - prazdnych) zlyhanych++;
  } catch (e) {
    zlyhanych++;
    log(`[${i + 1}/${clanky.length}] ${c.slug}: CHYBA ${String(e.message).split('\n')[0].slice(0, 160)}`);
  } finally {
    await ctx.close();
  }
}
await prehliadac.close();
db.close();
writeFileSync(join(VYSTUP, 'test-editor-clankov-rozdiely.json'), JSON.stringify(chyby, null, 2));
const ok = rovnakych === clanky.length && zlyhanych === 0;
log(`\nEditor článkov po svojom (nie zmena obsahu), počet článkov: ${Object.entries(POLIA_PO_SVOJOM).map(([k, n]) => `${k} ${n}`).join(', ')}, prázdny popis videa ${popisVidea}`);
log(`Výsledok: obsah rovnaký ${rovnakych} z ${clanky.length}, problémov ${zlyhanych}${ok ? '' : ' — ZLYHAL'}`);
process.exit(ok ? 0 : 1);
