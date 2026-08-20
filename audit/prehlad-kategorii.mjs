/**
 * Prehľad kategórií: mega-ponuka na PC a rozbalená kategória na telefóne.
 *
 *   node audit/prehlad-kategorii.mjs [URL]
 */
import { chromium, devices } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.argv[2] || 'http://localhost:3000';
const KAM = 'audit/snimky/prehlad';
mkdirSync(KAM, { recursive: true });
const suhlas = () => localStorage.setItem('cookie-consent', JSON.stringify({ v: 1, ts: Date.now(), analytics: false }));

const b = await chromium.launch();
let zle = 0;

/* ── PC ──────────────────────────────────────────────────────────────── */
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 } });
  await ctx.addInitScript(suhlas);
  const p = await ctx.newPage();
  await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  /* Lišta v dev režime ťahá 50 článkov pre každú zo 14 kategórií — kým sa
     kategórie objavia, trvá to okolo deviatich sekúnd. */
  await p.waitForSelector('.lnav-cat-btn', { timeout: 40000 });
  await p.waitForTimeout(1200);

  await p.locator('.lnav-cat-btn', { hasText: 'Strážna funkcia' }).first().click();
  await p.waitForSelector('.lprh', { timeout: 8000 });
  await p.waitForTimeout(600);

  const stav = () => p.evaluate(() => {
    const skupiny = [...document.querySelectorAll('.lprh-skupina')].map((s) => ({
      nazov: s.querySelector('.lprh-skupina-h span')?.textContent?.trim(),
      pocet: s.querySelectorAll('.lprh-zoznam li').length,
    }));
    return {
      nadpis: document.querySelector('.lprh-hlava h2')?.textContent?.trim(),
      suhrn: document.querySelector('.lprh-suhrn')?.textContent?.trim(),
      rezim: document.querySelector('.lprh-prepinac button.is-on')?.textContent?.trim(),
      skupiny,
      polozky: skupiny.reduce((n, s) => n + s.pocet, 0),
      stlpcov: getComputedStyle(document.querySelector('.lprh-telo')).columnCount,
    };
  });

  const kraj = await stav();
  console.log(`PC · ${kraj.nadpis} · ${kraj.suhrn} · režim ${kraj.rezim} · stĺpcov ${kraj.stlpcov}`);
  console.log('  ' + kraj.skupiny.map((s) => `${s.nazov} ${s.pocet}`).join(' · '));
  if (kraj.polozky !== 41) { console.log(`✘ zobrazených ${kraj.polozky} položiek, čakalo sa 41`); zle++; }
  else console.log('✔ všetkých 41 lokalít je v skupinách');

  for (const [tlacidlo, ocakavane] of [['Datovanie', 41], ['A–Z', 41]]) {
    await p.locator('.lprh-prepinac button', { hasText: tlacidlo }).click();
    await p.waitForTimeout(400);
    const s = await stav();
    console.log(`  ${tlacidlo}: ${s.skupiny.map((x) => `${x.nazov} ${x.pocet}`).join(' · ')}`);
    if (s.polozky !== ocakavane) { console.log(`✘ ${tlacidlo}: ${s.polozky} položiek namiesto ${ocakavane}`); zle++; }
  }

  /* Hľadanie */
  await p.locator('.lprh-prepinac button', { hasText: 'Kraj' }).click();
  /* Hľadá sa okres, ktorý v TEJTO kategórii naozaj je — Púchov leží pod
     starovekými sídlami, takže nulový výsledok by bol správny a test by
     hlásil chybu, ktorá nie je. */
  await p.locator('.lprh-hladat').fill('Prievidza');
  await p.waitForTimeout(500);
  const h = await stav();
  console.log(`  hľadanie „Prievidza": ${h.polozky} lokalít`);
  if (!h.polozky) { console.log('✘ hľadanie nenašlo nič'); zle++; }
  else console.log('✔ hľadanie filtruje');

  /* Prepnutie kategórie bez zatvorenia panela */
  await p.locator('.lprh-hladat').fill('');
  await p.locator('.lprh-register button', { hasText: 'Mocenské centrá' }).first().click();
  await p.waitForTimeout(500);
  const m = await stav();
  console.log(`  po prepnutí v registri: ${m.nadpis} · ${m.polozky} položiek · režim ${m.rezim}`);
  if (m.nadpis !== 'Mocenské centrá') { console.log('✘ register neprepol kategóriu'); zle++; }
  else console.log('✔ register prepína kategóriu bez zatvorenia');

  await p.screenshot({ path: `${KAM}/pc.png` });
  await ctx.close();
}

/* ── Telefón ─────────────────────────────────────────────────────────── */
{
  const ctx = await b.newContext({ ...devices['iPhone 13'], hasTouch: true, isMobile: true });
  await ctx.addInitScript(suhlas);
  const p = await ctx.newPage();
  await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  /* Ponuka sa otvára až KEĎ sú kategórie načítané — inak sa otvorí prázdna
     a tlačidlá do nej dopadnú neskôr, mimo dosahu ťuknutia. Na telefóne je
     rad kategórií skrytý, takže sa čaká na jeho prítomnosť v dokumente, nie
     na viditeľnosť. */
  await p.waitForSelector('.lnav-burger', { timeout: 40000 });
  await p.waitForSelector('.lnav-cat-btn', { state: 'attached', timeout: 60000 });
  await p.waitForTimeout(800);
  await p.locator('.lnav-burger').tap();
  await p.waitForSelector('.lnav-m-btn', { timeout: 20000 });
  await p.locator('.lnav-m-btn', { hasText: 'Refugiá' }).first().tap();
  await p.waitForTimeout(700);
  const m = await p.evaluate(() => ({
    prepinac: !!document.querySelector('.lprh-m .lprh-prepinac'),
    skupiny: [...document.querySelectorAll('.lprh-m .lprh-skupina')].map((s) => s.querySelector('.lprh-skupina-h span')?.textContent?.trim()),
    polozky: document.querySelectorAll('.lprh-m .lprh-zoznam li').length,
  }));
  console.log(`\nTelefón · Refugiá · prepínač ${m.prepinac ? 'je' : 'CHÝBA'} · ${m.polozky} lokalít`);
  console.log('  ' + m.skupiny.join(' · '));
  if (!m.prepinac || m.polozky !== 11) { console.log(`✘ na telefóne ${m.polozky} položiek, čakalo sa 11`); zle++; }
  else console.log('✔ telefón zoskupuje rovnako');
  await p.screenshot({ path: `${KAM}/mobil.png`, fullPage: false });
  await ctx.close();
}

await b.close();
console.log(zle ? `\n✘ nálezov: ${zle}` : '\n✔ bez nálezov');
process.exit(zle ? 1 : 0);
