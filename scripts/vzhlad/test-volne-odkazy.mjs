/**
 * TEST VOĽNÝCH ODKAZOV — rad pod hľadaním (`domov.odkazy`), tlačidlá a odkazy pod
 * činnosťou (`cinnost.tlacidla`, `cinnost.odkazy`); požiadavka klienta K2, K3, 14. 11. 2026.
 * Bez prehliadača a bez backendu — čisté moduly vzhľadu zbalené cez esbuild (`ts.mjs`).
 *
 *   1. tolerantné čítanie: chýbajúce zoznamy = základný vzhľad; zlé záznamy sa vynechajú,
 *      zlý cieľ či obrázok = bez neho; nepoznané kľúče sa ignorujú,
 *   2. kontrola (server aj editor): zoznamy sú voliteľné, keď sú, kontrolujú sa celé,
 *   3. odkazy: server z nich rozrieši články, kategórie a obrázky (`zbierajOdkazy`)
 *      a článok bez documentId odmietne,
 *   4. prevod dnešného stavu: články a kategórie dostanú documentId, obrázky id súboru,
 *   5. zoznam zmien pred zverejnením hlási zmeny odkazov,
 *   6. STARÝ web a appka (kód z `main` pred zavedením) nový tvar prečítajú bez pádu — nové
 *      kľúče ignorujú; stará kontrola na serveri ho odmietne (preto backend ide prvý).
 *
 *   node scripts/vzhlad/test-volne-odkazy.mjs [--stary <git-ref>]   (predvolene origin/main)
 */
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { nacitajTs, KOREN } from './ts.mjs';

const a = process.argv.slice(2);
const STARY_REF = a.includes('--stary') ? a[a.indexOf('--stary') + 1] : 'origin/main';

const vysledky = [];
const over = (meno, podmienka, detail = '') => {
  vysledky.push({ meno, ok: !!podmienka, detail });
  console.log(`  ${podmienka ? 'OK     ' : 'ZLYHAL '} ${meno}${!podmienka && detail ? ` — ${detail}` : ''}`);
};
const kopia = (x) => JSON.parse(JSON.stringify(x));

const { ocistiVzhlad } = await nacitajTs('src/lib/vzhlad/nacitaj.ts');
const { skontrolujTvar, skontrolujOdkazy, zbierajOdkazy } = await nacitajTs('src/lib/vzhlad/kontrola.ts');
const { prevedVzhlad, odkazyZakladneho } = await nacitajTs('src/lib/vzhlad/prevod.ts');
const { zmenyVzhladu } = await nacitajTs('src/lib/vzhlad/zmeny.ts');
const { ZAKLADNY_VZHLAD: Z } = await nacitajTs('src/lib/vzhlad/zakladny.ts');

/* Vzhľad „ako zo servera" bez nových polí (uložený pred ich zavedením). */
const bezNovych = () => {
  const v = kopia(Z);
  delete v.domov.odkazy;
  delete v.cinnost.tlacidla;
  delete v.cinnost.odkazy;
  return v;
};

console.log('[voľné odkazy] základný vzhľad');
over('základ má 5 odkazov pod hľadaním, 3 tlačidlá, 4 textové odkazy',
  Z.domov.odkazy?.polozky.length === 5 && Z.cinnost.tlacidla?.polozky.length === 3 && Z.cinnost.odkazy?.polozky.length === 4);
over('hlavné tlačidlo je práve jedno (informačné tabule)',
  Z.cinnost.tlacidla.polozky.filter((o) => o.hlavny).map((o) => o.id).join() === 'tabule');
over('čo nemá cieľ, je skryté (nič sa nevymýšľa)',
  [...Z.domov.odkazy.polozky, ...Z.cinnost.tlacidla.polozky, ...Z.cinnost.odkazy.polozky].every((o) => o.ciel || !o.viditelny));
over('základný vzhľad prejde kontrolou tvaru', skontrolujTvar(Z).length === 0, JSON.stringify(skontrolujTvar(Z).slice(0, 3)));

console.log('[voľné odkazy] tolerantné čítanie');
{
  const v = ocistiVzhlad(bezNovych());
  over('chýbajúce zoznamy → zo základného vzhľadu',
    JSON.stringify(v.domov.odkazy) === JSON.stringify(Z.domov.odkazy)
    && JSON.stringify(v.cinnost.tlacidla) === JSON.stringify(Z.cinnost.tlacidla)
    && JSON.stringify(v.cinnost.odkazy) === JSON.stringify(Z.cinnost.odkazy));
}
{
  const x = bezNovych();
  x.domov.odkazy = {
    viditelne: false,
    neznamy: 1,
    polozky: [
      { id: 'dobry', text: { sk: 'Dobrý' }, obrazok: { id: 7 }, ciel: { druh: 'cesta', cesta: '/galeria' }, viditelny: true, hlavny: true, buduci: 'x' },
      { id: 'ZLE ID', text: { sk: 'x' }, obrazok: null, ciel: null, viditelny: true },
      { id: 'bez-textu', obrazok: null, ciel: null, viditelny: true },
      { id: 'zly-ciel', text: { sk: 'Z' }, obrazok: { cesta: 'javascript:alert(1)' }, ciel: { druh: 'url', url: 'javascript:alert(1)' }, viditelny: 'ano' },
      { id: 'dobry', text: { sk: 'Druhý s rovnakým id' }, obrazok: null, ciel: null, viditelny: true },
      { id: 'cudzi-web', text: { sk: 'Z' }, obrazok: null, ciel: { druh: 'cesta', cesta: '//zly.example' }, viditelny: true, hlavny: 'ano' },
    ],
  };
  const v = ocistiVzhlad(x);
  const p = v.domov.odkazy.polozky;
  over('zlé id, chýbajúci text a druhý výskyt id sa vynechajú', p.map((o) => o.id).join() === 'dobry,zly-ciel,cudzi-web', p.map((o) => o.id).join());
  over('nepoznané kľúče sa zahodia', !('neznamy' in v.domov.odkazy) && !('buduci' in p[0]));
  over('viditeľnosť zoznamu sa zachová', v.domov.odkazy.viditelne === false);
  over('zlý cieľ a zlý obrázok = bez nich (javascript:, //…)', p[1].ciel === null && p[1].obrazok === null && p[2].ciel === null);
  over('zlá viditeľnosť = viditeľný, hlavny len pri true', p[1].viditelny === true && p[0].hlavny === true && !('hlavny' in p[2]));
}
{
  const x = bezNovych();
  x.cinnost.tlacidla = 'nie je objekt';
  x.cinnost.odkazy = { viditelne: true, polozky: 'nie je zoznam' };
  const v = ocistiVzhlad(x);
  over('nečitateľný zoznam → zo základného', JSON.stringify(v.cinnost.tlacidla) === JSON.stringify(Z.cinnost.tlacidla)
    && JSON.stringify(v.cinnost.odkazy) === JSON.stringify(Z.cinnost.odkazy));
}

console.log('[voľné odkazy] kontrola (server aj editor)');
over('vzhľad bez nových polí prejde (uložený pred zavedením)', skontrolujTvar(bezNovych()).length === 0);
{
  const v = kopia(Z);
  v.domov.odkazy.polozky[0].nieco = 1;
  over('nepoznaný kľúč v odkaze je chyba', skontrolujTvar(v).some((c) => c.cesta === 'domov.odkazy.polozky[0].nieco'));
}
{
  const v = kopia(Z);
  v.cinnost.odkazy.polozky[1].id = v.cinnost.odkazy.polozky[0].id;
  over('rovnaké id dvakrát je chyba', skontrolujTvar(v).some((c) => c.cesta === 'cinnost.odkazy.polozky[1].id'));
}
{
  const v = kopia(Z);
  v.cinnost.tlacidla.polozky[0].ciel = { druh: 'url', url: 'http://nezabezpecene.example' };
  v.domov.odkazy.polozky[0].text = { sk: '<b>x</b>' };
  v.domov.odkazy.polozky[1].obrazok = { cesta: '/../tajne.png' };
  const ch = skontrolujTvar(v).map((c) => c.cesta);
  over('http://, HTML v texte a zlá cesta obrázka sú chyby',
    ch.includes('cinnost.tlacidla.polozky[0].ciel.url') && ch.includes('domov.odkazy.polozky[0].text.sk') && ch.includes('domov.odkazy.polozky[1].obrazok.cesta'), ch.join(' | '));
}
{
  const v = kopia(Z);
  while (v.domov.odkazy.polozky.length < 9) v.domov.odkazy.polozky.push({ ...v.domov.odkazy.polozky[0], id: `navyse-${v.domov.odkazy.polozky.length}` });
  over('viac ako 8 odkazov je chyba', skontrolujTvar(v).some((c) => c.cesta === 'domov.odkazy.polozky'));
}
{
  const v = kopia(Z);
  v.domov.odkazy.polozky[0].ciel = null;
  v.domov.odkazy.polozky[0].obrazok = null;
  over('odkaz bez cieľa a obrázka je platný (web ho nenakreslí)', skontrolujTvar(v).length === 0);
}

console.log('[voľné odkazy] odkazy na články, kategórie a súbory');
{
  const o = zbierajOdkazy(Z);
  const cl = o.clanky.map((x) => x.cesta);
  over('server rozrieši články z radu a z textových odkazov',
    cl.includes('domov.odkazy.polozky[0].ciel.clanok') && cl.includes('cinnost.odkazy.polozky[2].ciel.clanok'), cl.filter((c) => c.includes('odkazy')).join(' | '));
  over('… kategóriu tlačidla', o.kategorie.some((x) => x.cesta === 'cinnost.tlacidla.polozky[1].ciel.kategoria'));
  over('… a obrázky (ochrana pred zmazaním)', o.obrazky.some((x) => x.cesta === 'domov.odkazy.polozky[0].obrazok') && o.obrazky.some((x) => x.cesta === 'cinnost.tlacidla.polozky[0].obrazok'));
  const ch = skontrolujOdkazy(Z, { kategorie: new Set(), clanky: new Set(), subory: new Set() });
  over('článok bez documentId server odmietne (základ sa musí najprv previesť)', ch.some((c) => c.cesta === 'domov.odkazy.polozky[0].ciel.clanok'));
}

console.log('[voľné odkazy] prevod dnešného stavu');
{
  const { slugyClankov, cestyObrazkov } = odkazyZakladneho(Z);
  const clanky = new Map([...slugyClankov].map((s, i) => [s, `dok${i}`]));
  const subory = new Map([...cestyObrazkov].map((c, i) => [c, 1000 + i]));
  /* Všetky kategórie, na ktoré základ odkazuje (aj skrytá „Ostatné", ktorá v kóde záznam nemá). */
  const slugyKat = [...new Set([...Z.kategorie.map((k) => k.kategoria.slug), ...Z.menu.hlavnyRiadok.map((k) => k.slug), ...Z.menu.skryte.map((k) => k.slug)])];
  const kategorie = slugyKat.map((slug, i) => ({ documentId: `kat${i}`, slug, name: slug, order: i * 10 }));
  const preklad = (sk, j) => (sk === 'Pôvod Slovanov' ? (j === 'en' ? 'Origin of the Slavs' : 'Herkunft der Slawen') : null);
  const { vzhlad: v } = prevedVzhlad({ zakladny: Z, kategorie, clanky, subory, fotogaleria: [], preklad });
  const p0 = v.domov.odkazy.polozky[0];
  over('článok dostal documentId, obrázok id súboru', p0.ciel.clanok.dokument === clanky.get(p0.ciel.clanok.slug) && typeof p0.obrazok.id === 'number');
  over('text dostal výslovné EN a DE zo slovníka', p0.text.en === 'Origin of the Slavs' && p0.text.de === 'Herkunft der Slawen' && p0.text.enZo === 'Pôvod Slovanov');
  over('kategória tlačidla dostala documentId', /^kat\d+$/.test(v.cinnost.tlacidla.polozky[1].ciel.kategoria.dokument));
  over('adresa mimo webu ostala', v.cinnost.tlacidla.polozky[0].ciel.url === 'https://www.facebook.com/groups/118846781525141/');
  over('hlavné tlačidlo a skryté bez cieľa ostali', v.cinnost.tlacidla.polozky[1].hlavny === true && v.cinnost.tlacidla.polozky[2].ciel === null && v.cinnost.tlacidla.polozky[2].viditelny === false);
  over('prevedený vzhľad prejde kontrolou tvaru', skontrolujTvar(v).length === 0, JSON.stringify(skontrolujTvar(v).slice(0, 3)));
}

console.log('[voľné odkazy] zoznam zmien pred zverejnením');
{
  const b = kopia(Z);
  b.domov.odkazy.polozky[0].text = { sk: 'Odkiaľ prišli Slovania' };
  b.cinnost.tlacidla.polozky[2].viditelny = true;
  b.cinnost.odkazy.polozky.reverse();
  const z = zmenyVzhladu(Z, b);
  over('zmena textu, zobrazenie a poradie sa hlásia',
    z.some((r) => r.startsWith('Odkazy pod hľadaním – Pôvod Slovanov – text'))
    && z.some((r) => r.includes('Tlačidlá pod činnosťou – Naše ďalšie blogy: zobrazený'))
    && z.some((r) => r.startsWith('Odkazy pod činnosťou: odkaz')), z.join(' | '));
  over('prvé zverejnenie zoznamov sa hlási', zmenyVzhladu(bezNovych(), Z).some((r) => r.startsWith('Odkazy pod hľadaním: pribudli')));
}

console.log(`[voľné odkazy] starý web a appka (${STARY_REF})`);
{
  const docasny = join(KOREN, 'scripts', 'vzhlad', 'vystup', '.stary-kod');
  rmSync(docasny, { recursive: true, force: true });
  let ok = true;
  try {
    for (const f of ['src/lib/vzhlad/nacitaj.ts', 'src/lib/vzhlad/kontrola.ts', 'src/lib/vzhlad/typy.ts', 'src/lib/vzhlad/zakladny.ts']) {
      const cesta = join(docasny, f);
      mkdirSync(join(cesta, '..'), { recursive: true });
      writeFileSync(cesta, execSync(`git show ${STARY_REF}:${f}`, { cwd: KOREN, maxBuffer: 1 << 24 }));
    }
    /* Starý `zakladny.ts` čerpá z dát a `api-adresa` webu — tie sa medzi verziami nemenili
       (alebo len pribudlo `data/odkazy.ts`, ktoré starý kód nepozná). */
    for (const f of ['src/lib/api-adresa.ts', 'src/data/categories.ts', 'src/data/rozcestnik.ts', 'src/data/cinnost.ts', 'src/data/domovska.ts', 'src/data/menu.ts', 'src/data/pata.ts']) {
      const cesta = join(docasny, f);
      mkdirSync(join(cesta, '..'), { recursive: true });
      writeFileSync(cesta, execSync(`git show ${STARY_REF}:${f}`, { cwd: KOREN, maxBuffer: 1 << 24 }));
    }
  } catch (e) {
    ok = false;
    over('starý kód sa dá vytiahnuť z gitu', false, String(e).slice(0, 200));
  }
  if (ok) {
    const rel = (f) => join('scripts', 'vzhlad', 'vystup', '.stary-kod', f);
    const stary = await nacitajTs(rel('src/lib/vzhlad/nacitaj.ts'));
    const staraKontrola = await nacitajTs(rel('src/lib/vzhlad/kontrola.ts'));
    let v = null, chyba = null;
    try { v = stary.ocistiVzhlad(kopia(Z)); } catch (e) { chyba = e; }
    over('starý web prečíta nový tvar bez výnimky', !chyba && !!v, String(chyba ?? ''));
    over('… a nové kľúče ignoruje (domov aj činnosť sú celé)', !!v && !('odkazy' in v.domov) && !('tlacidla' in v.cinnost) && v.cinnost.polozky.length === Z.cinnost.polozky.length);
    let odp = null;
    try { odp = stary.precitajOdpoved({ data: kopia(Z), verzia: 9, subory: {}, kategorie: {}, clanky: {} }, 'api'); } catch (e) { chyba = e; }
    over('starý web prijme celú odpoveď API s novým tvarom', !!odp && odp.verzia === 9, String(chyba ?? ''));
    const ch = staraKontrola.skontrolujTvar(kopia(Z)).map((c) => c.cesta);
    over('stará kontrola (server pred nasadením) nové polia odmieta → backend sa nasadzuje prvý',
      ch.includes('domov.odkazy') && ch.includes('cinnost.tlacidla'), ch.join(' | '));
  }
  rmSync(docasny, { recursive: true, force: true });
}

const zle = vysledky.filter((v) => !v.ok);
console.log(`\n[voľné odkazy] prešlo ${vysledky.length - zle.length} z ${vysledky.length}`);
process.exit(zle.length ? 1 : 0);
