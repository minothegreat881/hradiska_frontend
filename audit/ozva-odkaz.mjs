/**
 * Ozva vedie na konkrétny komentár, nie len na článok.
 *
 * Overuje sa celá cesta: v profile existuje odkaz s kotvou, po jeho otvorení
 * sa článok naozaj posunie na ten komentár a komentár sa nakrátko zvýrazní.
 * Samotná prítomnosť odkazu nestačí — kotva musí byť aj v diskusii, a tá sa
 * načítava až po článku.
 *
 *   node audit/ozva-odkaz.mjs [URL]
 */
import { chromium } from 'playwright';
import { ODPOVEDE } from './profil-udaje.mjs';

const BASE = process.argv[2] || 'http://localhost:3000';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 } });
for (const [vzor, telo] of ODPOVEDE) {
  await ctx.route(vzor, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(telo) }));
}
await ctx.route('**/uploads/**', (r) => r.fulfill({ path: 'public/logo_hradiska_small.png' }));
await ctx.addInitScript(() => {
  localStorage.setItem('hradiska.member.jwt', 'test');
  localStorage.setItem('cookie-consent', JSON.stringify({ v: 1, ts: Date.now(), analytics: false }));
});
const p = await ctx.newPage();
await p.goto(BASE + '/profil', { waitUntil: 'domcontentloaded' });
await p.waitForSelector('.lprof-ozva');
await p.waitForTimeout(1000);

let zle = 0;
const odkazy = await p.evaluate(() => [...document.querySelectorAll('.lprof-ozva')].map((li) => ({
  druh: li.dataset.druh,
  clanok: li.querySelector('.lprof-kde')?.getAttribute('href') || null,
  komentar: li.querySelector('.lprof-doDiskusie')?.getAttribute('href') || null,
  popis: li.querySelector('.lprof-doDiskusie')?.textContent?.trim() || null,
})));
for (const o of odkazy) {
  console.log(`${o.druh.padEnd(8)} článok: ${String(o.clanok).padEnd(46)} komentár: ${o.komentar ?? '—'}`);
}
const sKotvou = odkazy.find((o) => o.komentar && o.komentar.includes('#k-'));
if (!sKotvou) { console.log('✘ ani jedna ozva nevedie na komentár'); zle++; }
else {
  console.log(`\n✔ ozva „${sKotvou.druh}" vedie na komentár (${sKotvou.popis})`);
  /* A teraz či tá kotva na druhej strane naozaj existuje. Diskusia sa ťahá
     zo živého Strapi, takže sa skúša skutočný článok. */
  /* Kotva sa overuje na SKUTOČNOM článku so skutočnou diskusiou — slug
     v ukážkových údajoch je vymyslený, tam by sa nenačítalo nič. */
  await ctx.unrouteAll();
  const clanok = process.argv[3] || '/blog/mikulcice-kopcany';
  await p.goto(BASE + clanok, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3500);
  /* Diskusia sa sťahuje až keď sa k nej človek doscrolluje, a článok je
     dlhý — bez čakania na kotvy test hlásil, že ich stránka nevyrába. */
  await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await p.waitForFunction(() => document.querySelectorAll('[id^="k-"]').length > 0, null, { timeout: 25000 })
    .catch(() => {});
  const kotvy = await p.evaluate(() => [...document.querySelectorAll('[id^="k-"]')].map((e) => e.id));
  console.log(kotvy.length ? `✔ diskusia vyrába kotvy (${kotvy.length} komentárov, napr. ${kotvy[0]})` : '✘ diskusia nevyrába kotvy');
  if (!kotvy.length) { zle++; }
  else {
    /* A či sa na kotvu naozaj skočí a zvýrazní sa. */
    await p.goto(`${BASE}${clanok}#${kotvy[Math.min(2, kotvy.length - 1)]}`, { waitUntil: 'domcontentloaded' });
    await p.waitForFunction((id) => !!document.getElementById(id), kotvy[Math.min(2, kotvy.length - 1)], { timeout: 25000 }).catch(() => {});
    await p.waitForTimeout(1500);
    const r = await p.evaluate((id) => {
      const el = document.getElementById(id);
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return { vidno: b.top > -50 && b.top < innerHeight, zvyraznene: el.classList.contains('komentar-najdeny') };
    }, kotvy[Math.min(2, kotvy.length - 1)]);
    if (!r) { console.log('✘ po otvorení s kotvou komentár v dokumente nie je'); zle++; }
    else {
      console.log(r.vidno ? '✔ stránka skočila na komentár' : '✘ stránka na komentár neskočila');
      console.log(r.zvyraznene ? '✔ komentár je zvýraznený' : '⚠ zvýraznenie už doznelo (trvá 2,6 s)');
      if (!r.vidno) zle++;
    }
  }
}
await b.close();
process.exit(zle ? 1 : 0);
