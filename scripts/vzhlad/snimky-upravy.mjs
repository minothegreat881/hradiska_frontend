/**
 * SNÍMKY REŽIMU ÚPRAV — domovská tak, ako ju uvidí editor vzhľadu na plátne:
 * značky `data-vw`, skryté prvky nakreslené s `data-vw-skryte="1"`
 * (vyšrafované), zástupca mapy namiesto MapLibre, bez animácií.
 *
 * Režim úprav sa na verejnom webe zapnúť nedá; tu sa používa prepínač, ktorý
 * existuje len vo vývojovom serveri (`?vzhlad-upravy`, viď VzhladContext).
 * Vývojový server Vite beží proti referenčnému Strapi (VITE_STRAPI_URL).
 * Vzhľad je v1 z prevodu, v ktorom sú na ukážku skryté vybraná fotogaléria
 * a „Pridajte sa"; tabule a 3D rekonštrukcie sú skryté na domovskej už dnes.
 *
 *   node scripts/vzhlad/snimky-upravy.mjs
 * Výstup: vystup/upravy-domov-1440.png, upravy-domov-390.png, upravy-data-vw.json
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { KOREN, VYSTUP, BACKEND, SIRKY, spustiPrehliadac, novyKontext, ustal, zapis } from './spolocne.mjs';

process.env.VITE_STRAPI_URL = BACKEND;
const { createServer } = await import('vite');
const PORT = 3000;
const vite = await createServer({ root: KOREN, configFile: join(KOREN, 'vite.config.ts'), server: { port: PORT, strictPort: true, open: false, host: '127.0.0.1' }, logLevel: 'warn' });
await vite.listen();

const odp = JSON.parse(readFileSync(join(VYSTUP, 'vzhlad-v1-odpoved.json'), 'utf8'));
odp.data.domov.sekcie.find((s) => s.typ === 'kronika').fotogaleriaViditelna = false;
odp.data.domov.pridajteSa.viditelna = false;
const telo = JSON.stringify(odp);

/* Názvy, ktoré editor potrebuje nájsť na domovskej (pozri docs/VZHLAD-WEBU.md). */
const OCAKAVANE = [
  'uvod:nadtitulok', 'uvod:nadpis', 'uvod:znak', 'dlazdice', 'skupina:typy', 'skupina:pramene', 'skupina-nadpis:pramene',
  'dlazdica:typy:kniezacie-sidla', 'dlazdica:pramene:povesti', 'hladanie:vyzva', 'hladanie:pole', 'popularne', 'popularne:0',
  'sekcia:mapa', 'sekcia:dalsi-obsah', 'dalsi-obsah:nadpis:dalsi-obsah', 'riadok:dalsi-obsah:informacne-tabule',
  'riadok-nadpis:dalsi-obsah:odborne-texty', 'riadok-clanok:dalsi-obsah:3d-modely:0', 'sekcia:cinnost', 'cinnost:nadpis',
  'cinnost:tabule', 'cinnost:prednasky', 'sekcia:kronika', 'kronika:uvod', 'kronika:obrazok', 'kronika:pripnuty:0',
  'kronika:fotogaleria', 'pridajte-sa', 'pridajte-sa:nadtitulok', 'pridajte-sa:nadpis', 'pridajte-sa:citat',
  'pridajte-sa:uvod', 'pridajte-sa:email', 'pridajte-sa:prosba:0', 'menu:hlavny', 'menu:kniezacie-sidla',
  'pata:stlpec:kategorie', 'pata:odkaz:clanky:0', 'pata:siet:facebook',
];

const prehliadac = await spustiPrehliadac();
const vysledok = {};
let ok = true;
try {
  for (const sirka of SIRKY) {
    const ctx = await novyKontext(prehliadac, sirka, {
      route: (c) => c.route('**/api/vzhlad-webu', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: telo })),
    });
    const page = await ctx.newPage();
    const chyby = [];
    const mapa = [];
    page.on('pageerror', (e) => chyby.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error' && !/^Failed to load resource/.test(m.text())) chyby.push(m.text()); });
    page.on('request', (r) => { if (/LabMapa|MapaHradisk|maplibre/i.test(r.url())) mapa.push(r.url()); });
    await page.goto(`http://127.0.0.1:${PORT}/?vzhlad-upravy=1`, { waitUntil: 'load', timeout: 120000 });
    await ustal(page, { max: 60000 });
    /* Posun dolu aj hore: na webe by sa tým načítala mapa a vysunula lišta — na plátne nie. */
    await page.mouse.wheel(0, 3000); await page.waitForTimeout(800);
    await page.mouse.wheel(0, -600); await page.waitForTimeout(800);
    await page.evaluate(() => window.scrollTo(0, 0));
    await ustal(page, { pokoj: 3 });
    const stav = await page.evaluate(() => ({
      vw: [...document.querySelectorAll('[data-vw]')].map((e) => e.getAttribute('data-vw')),
      skryte: [...document.querySelectorAll('[data-vw-skryte="1"]')].map((e) => e.getAttribute('data-vw') || e.className),
      zastupMapy: !!document.querySelector('section.lhome-mapa[data-vw="sekcia:mapa"] .vw-mapa-zastup'),
      vyskaZastupu: document.querySelector('.vw-mapa-zastup')?.getBoundingClientRect().height ?? 0,
      vysuvVidno: !!document.querySelector('.cat-vysuv.je-vidno'),
      animacie: document.getAnimations().filter((x) => x.playState === 'running').length,
    }));
    const chybaju = OCAKAVANE.filter((n) => !stav.vw.includes(n));
    const png = await page.screenshot({ fullPage: true, animations: 'disabled' });
    zapis(`upravy-domov-${sirka.meno}.png`, png);
    vysledok[sirka.meno] = { pocetVw: stav.vw.length, unikatnych: new Set(stav.vw).size, chybaju, skryte: stav.skryte, zastupMapy: stav.zastupMapy, vyskaZastupu: stav.vyskaZastupu, mapaSaNacitala: mapa, vysuvVidno: stav.vysuvVidno, beziaceAnimacie: stav.animacie, chyby, vw: [...new Set(stav.vw)] };
    const tuOk = !chybaju.length && stav.zastupMapy && !mapa.length && !stav.vysuvVidno && !chyby.length && stav.skryte.length > 0;
    ok &&= tuOk;
    console.log(`[úpravy] ${sirka.meno}: ${stav.vw.length} značiek data-vw (${new Set(stav.vw).size} rôznych), skrytých ${stav.skryte.length}, zástupca mapy ${stav.zastupMapy ? `áno (${Math.round(stav.vyskaZastupu)} px)` : 'NIE'}, mapa ${mapa.length ? 'SA NAČÍTALA' : 'sa nenačítala'}, lišta ${stav.vysuvVidno ? 'SA VYSUNULA' : 'sa nevysunula'}${chybaju.length ? `, CHÝBA: ${chybaju.join(', ')}` : ''}${chyby.length ? `, chyby: ${chyby.join(' | ')}` : ''} → vystup/upravy-domov-${sirka.meno}.png`);
    await ctx.close();
  }
} finally {
  await prehliadac.close();
  await vite.close();
}
zapis('upravy-data-vw.json', vysledok);
process.exit(ok ? 0 : 1);
