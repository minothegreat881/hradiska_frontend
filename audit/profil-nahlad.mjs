/**
 * Náhľad prihláseného profilu bez prihlásenia.
 *
 * Profil vidí len člen, takže sa nedá otvoriť ani skontrolovať zvonku.
 * Skript preto podstrčí prehliadaču token a odpovede Strapi (vymyslené, ale
 * v tvare, aký vracia server) a odfotí všetky časti registra.
 *
 *   node audit/profil-nahlad.mjs [URL]
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { ODPOVEDE } from './profil-udaje.mjs';

const URL = process.argv[2] || 'http://localhost:3000';
const KAM = 'audit/snimky/profil';
mkdirSync(KAM, { recursive: true });

const b = await chromium.launch();

for (const [meno, sirka, vyska] of [['pc', 1440, 1000], ['mobil', 390, 844]]) {
  const ctx = await b.newContext({ viewport: { width: sirka, height: vyska }, deviceScaleFactor: 2 });
  for (const [vzor, telo] of ODPOVEDE) {
    await ctx.route(vzor, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(telo) }));
  }
  await ctx.addInitScript(() => localStorage.setItem('hradiska.member.jwt', 'test'));
  const p = await ctx.newPage();
  p.on('console', (m) => { if (m.type() === 'error') console.log('  konzola:', m.text().slice(0, 160)); });
  await p.goto(`${URL}/profil`, { waitUntil: 'domcontentloaded' });

  /* Cookie lišta sa objavuje s oneskorením a prekrýva spodok stránky —
     bez trpezlivého odkliknutia by bola na každej snímke. */
  for (let i = 0; i < 12; i++) {
    const x = p.locator('.ck-btn-primary').first();
    if (await x.count() && await x.isVisible()) { await x.click({ force: true }); await p.waitForTimeout(350); }
    if (!(await p.locator('.ck-root').count())) break;
    await p.waitForTimeout(400);
  }

  await p.waitForSelector('.lprof-hlava', { timeout: 15000 });
  await p.waitForTimeout(900);
  await p.screenshot({ path: `${KAM}/${meno}-ozvy.png`, fullPage: true });

  for (const [i, kluc] of ['prispevky', 'ulozene', 'fotky', 'nastavenia'].entries()) {
    await p.locator('.lprof-register button').nth(i + 1).click();
    await p.waitForTimeout(700);
    await p.screenshot({ path: `${KAM}/${meno}-${kluc}.png`, fullPage: true });
  }
  console.log(`✔ ${meno}: 5 snímok`);
  await ctx.close();
}

await b.close();
console.log(`snímky v ${KAM}`);
