/**
 * Panel hľadania: vrstvenie a rám pri fokuse.
 *
 * Dve veci, ktoré sa nedajú overiť pohľadom do CSS:
 *   1. či roletka výsledkov kreslí NAD sekciou pod ňou (poradie vrstiev sa
 *      rozhoduje medzi dvomi súbormi a špecifickejší selektor vyhral),
 *   2. či sa červený rám objaví myšou (nemá) a klávesnicou (musí).
 *
 *   node audit/hladanie-stav.mjs [URL]
 */
import { chromium } from 'playwright';

const BASE = process.argv[2] || 'http://localhost:3000';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 } });
/* Súhlas s cookies sa vloží rovno do úložiska. Odklikávanie lišty je pomalé
   a na vývojovom serveri sa nestíhala zavrieť — potom prekrývala presne to
   miesto, kde sa meria vrstvenie roletky. */
await ctx.addInitScript(() => {
  localStorage.setItem('cookie-consent', JSON.stringify({ v: 1, ts: Date.now(), analytics: false }));
});
const p = await ctx.newPage();
await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
await p.waitForSelector('.lhero-obraz');
await p.waitForTimeout(2200);

let zle = 0;
const ram = () => p.locator('.lhero-hladanie > div > div').first()
  .evaluate((el) => ({ okraj: getComputedStyle(el).borderTopColor, tien: getComputedStyle(el).boxShadow }));

const pokoj = await ram();

/* 1 · myšou */
await p.locator('.hero-search-input').click();
await p.waitForTimeout(400);
const mysou = await ram();
const rovnaky = mysou.okraj === pokoj.okraj && mysou.tien === pokoj.tien;
console.log(rovnaky ? '✔ kliknutím myšou rám nepribudne' : `✘ myšou sa rám zmenil: ${pokoj.okraj} → ${mysou.okraj}`);
if (!rovnaky) zle++;

/* 2 · klávesnicou */
await p.locator('.hero-search-input').blur();
await p.waitForTimeout(300);
/* Prejsť sa tabulátorom od začiatku stránky. Bez overenia, že sa naozaj
   dorazilo do poľa, by test hlásil „fokus nevidno" aj vtedy, keď sa doň
   proste netrafil. */
await p.evaluate(() => { window.scrollTo(0, 0); document.body.focus(); });
let dorazil = false, krokov = 0;
const cesta = [];
for (; krokov < 80 && !dorazil; krokov++) {
  await p.keyboard.press('Tab');
  const kde = await p.evaluate(() => {
    const a = document.activeElement;
    if (!a) return '—';
    return a.tagName.toLowerCase() + (a.className && typeof a.className === 'string' && a.className.trim()
      ? '.' + a.className.trim().split(/\s+/).slice(-1)[0] : '');
  });
  cesta.push(kde);
  dorazil = kde.includes('hero-search-input');
}
if (!dorazil) {
  console.log(`✘ tabulátorom sa do poľa nedá dostať (${krokov} krokov)`);
  console.log('  cesta:', cesta.slice(0, 12).join(' → '), '…', cesta.slice(-4).join(' → '));
  process.exitCode = 1;
} else {
  console.log(`  (do poľa vedie ${krokov} stlačení tabulátora)`);
}
await p.waitForTimeout(400);
const klavesou = await ram();
const vidno = klavesou.okraj !== pokoj.okraj || klavesou.tien !== pokoj.tien;
console.log(vidno ? `✔ klávesnicou rám pribudne (${klavesou.okraj})` : '✘ klávesnicou nie je vidieť fokus');
if (!vidno) zle++;

/* 3 · roletka nad obsahom pod ňou */
await p.locator('.hero-search-input').fill('hradisko');
await p.waitForTimeout(1800);
const panel = p.locator('#search-dropdown-results, [id^="search-dropdown"]').first();
if (!(await panel.count())) { console.log('⚠ roletka sa neotvorila, vrstvenie neoverené'); }
else {
  const r = await panel.boundingBox();
  /* Vzorka sa berie z ľavej tretiny roletky. Cookie lišta sedí vpravo dole
     a je nad všetkým zámerne — v strede by ju test hlásil ako prekrytie. */
  const bod = await p.evaluate(([x, y]) => {
    const el = document.elementFromPoint(x, y);
    if (!el) return 'nič';
    if (el.closest('.ck-root')) return 'cookie lišta (nemeria sa)';
    return el.closest('.lhero-sekcia') ? 'titulná časť' : (el.className || el.tagName);
  }, [r.x + r.width * 0.25, r.y + Math.min(r.height - 8, 120)]);
  const ok = bod === 'titulná časť';
  console.log(ok ? '✔ roletka je nad sekciou pod ňou' : `✘ cez roletku prekukuje: ${bod}`);
  if (!ok) zle++;
}

await b.close();
process.exit(zle ? 1 : 0);
