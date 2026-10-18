/**
 * ZMENY VZHĽADU — ľudsky čitateľný zoznam rozdielov dvoch vzhľadov.
 *
 * Používa ho editor vzhľadu pred zverejnením („Dlaždica Refúgiá: nový
 * obrázok", „Sekcia Mapa: skrytá", „Menu: Povesti na 3. mieste"), dialóg pri
 * súbehu (čo prepíšem, ak uložím svoju verziu) a história.
 *
 * Čistý modul — nič nesťahuje. Mená kategórií a článkov berie zo vzhľadu
 * a z rozriešených údajov (keď sú), inak zo slugu.
 */

import type {
  Vzhlad, Text, TextVolitelny, Obrazok, OdkazKategorie, OdkazClanku, Rozriesene, SekciaDomov,
  VzhladKategorie, Ciel,
} from './typy';

const JAZYKY_TEXTU = [['sk', ''], ['en', ' (EN)'], ['de', ' (DE)']] as const;

const kluc = (o: { dokument: string | null; slug: string } | null | undefined): string =>
  (o ? o.dokument || `slug:${o.slug}` : '');

const skrat = (s: string, n = 60) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
const uvodzovky = (s: string | null | undefined) => (s ? `„${skrat(s)}“` : '(prázdne)');
const rovnake = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** Text: zmeny v jednotlivých jazykoch (výslovné znenia; `enZo`/`deZo` sa nehlásia). */
function zmenyTextu(z: string[], meno: string, a: Text | TextVolitelny | null | undefined, b: Text | TextVolitelny | null | undefined) {
  for (const [j, pripona] of JAZYKY_TEXTU) {
    const x = (a as Record<string, string | null | undefined> | null | undefined)?.[j] ?? null;
    const y = (b as Record<string, string | null | undefined> | null | undefined)?.[j] ?? null;
    if ((x || null) !== (y || null)) {
      z.push(y ? `${meno}${pripona}: ${uvodzovky(y)}` : `${meno}${pripona}: text odstránený${j === 'sk' ? '' : ' (platí slovník alebo slovenčina)'}`);
    }
  }
}

function zmenaObrazka(z: string[], meno: string, a: Obrazok | null | undefined, b: Obrazok | null | undefined) {
  if (rovnake(a ?? null, b ?? null)) return;
  const zdroj = (o: Obrazok | null | undefined) => (!o ? null : 'id' in o ? `id:${o.id}` : `cesta:${o.cesta}`);
  if (zdroj(a) === zdroj(b)) { z.push(`${meno}: iný výrez obrázka`); return; }
  if (!b) { z.push(`${meno}: bez obrázka`); return; }
  z.push(`${meno}: nový obrázok`);
}

/**
 * Ktoré položky sa presunuli. Položky, ktoré sú v oboch zoznamoch, sa
 * porovnajú podľa poradia; „presunuté" sú tie mimo najdlhšej spoločnej
 * rastúcej postupnosti — pri presune jednej položky sa tak nehlásia všetky,
 * ktoré sa len posunuli o miesto.
 */
function presunute(stare: string[], nove: string[]): { kluc: string; miesto: number }[] {
  const spolocne = nove.filter((k) => stare.includes(k));
  const idx = spolocne.map((k) => stare.filter((s) => nove.includes(s)).indexOf(k));
  // najdlhšia rastúca podpostupnosť (O(n²) — zoznamy majú pár desiatok položiek)
  const dlz = idx.map(() => 1);
  const pred = idx.map(() => -1);
  for (let i = 0; i < idx.length; i++) {
    for (let j = 0; j < i; j++) if (idx[j] < idx[i] && dlz[j] + 1 > dlz[i]) { dlz[i] = dlz[j] + 1; pred[i] = j; }
  }
  let koniec = dlz.length ? dlz.indexOf(Math.max(...dlz)) : -1;
  const ostavaju = new Set<number>();
  while (koniec >= 0) { ostavaju.add(koniec); koniec = pred[koniec]; }
  return spolocne
    .map((k, i) => ({ k, i }))
    .filter(({ i }) => !ostavaju.has(i))
    .map(({ k }) => ({ kluc: k, miesto: nove.indexOf(k) + 1 }));
}

/** Pridané, odobraté a presunuté položky zoznamu. */
function zmenyZoznamu<T>(
  z: string[], stare: T[], nove: T[], kluceZ: (t: T) => string, meno: (t: T) => string,
  slova: { pridane: (m: string) => string; odobrate: (m: string) => string; miesto: (m: string, n: number) => string },
) {
  const ks = stare.map(kluceZ);
  const kn = nove.map(kluceZ);
  nove.forEach((t, i) => { if (!ks.includes(kn[i])) z.push(slova.pridane(meno(t))); });
  stare.forEach((t, i) => { if (!kn.includes(ks[i])) z.push(slova.odobrate(meno(t))); });
  for (const p of presunute(ks, kn)) {
    const t = nove[kn.indexOf(p.kluc)];
    z.push(slova.miesto(meno(t), p.miesto));
  }
}

const NAZVY_SEKCII: Record<SekciaDomov['typ'], string> = {
  mapa: 'Mapa',
  'dalsi-obsah': 'Ďalší obsah',
  cinnost: 'Činnosť združenia',
  kronika: 'Zo života združenia',
};

const ZORADENIA: Record<string, string> = {
  zverejnenie: 'podľa zverejnenia na webe',
  'povodny-datum': 'podľa pôvodného dátumu',
  abecedne: 'abecedne',
};

export function zmenyVzhladu(a: Vzhlad | null | undefined, b: Vzhlad | null | undefined, r?: Rozriesene | null): string[] {
  if (!a && !b) return [];
  if (!a) return ['Vzhľad sa na webe zverejní prvý raz — web prestane kresliť vzhľad z kódu a začne kresliť tento.'];
  if (!b) return ['Vzhľad sa vyprázdni — web sa vráti na základný vzhľad z kódu.'];

  const z: string[] = [];

  /* ── Mená ── */
  const zaznamy = new Map<string, VzhladKategorie>();
  for (const v of [a, b]) for (const k of v.kategorie) zaznamy.set(kluc(k.kategoria), k);
  const menoKat = (o: OdkazKategorie | null | undefined): string => {
    if (!o) return '?';
    const zaz = zaznamy.get(kluc(o));
    const zDb = o.dokument ? r?.kategorie?.[o.dokument]?.nazov : null;
    return zaz?.popisokDlazdice?.sk || zDb || zaz?.nazov?.sk || o.slug || '?';
  };
  const menoKatCele = (o: OdkazKategorie | null | undefined): string => {
    if (!o) return '?';
    const zaz = zaznamy.get(kluc(o));
    const zDb = o.dokument ? r?.kategorie?.[o.dokument]?.nazov : null;
    return zaz?.nazov?.sk || zDb || zaz?.titulok?.sk || zaz?.popisokDlazdice?.sk || o.slug || '?';
  };
  const menoCl = (o: OdkazClanku | null | undefined): string => {
    if (!o) return '?';
    const n = o.dokument ? r?.clanky?.[o.dokument]?.sk?.nazov : null;
    return n ? `„${skrat(n, 50)}“` : o.slug || '?';
  };
  const menoCiela = (c: Ciel): string => {
    switch (c.druh) {
      case 'kategoria': return `kategória ${menoKatCele(c.kategoria)}`;
      case 'clanok': return `článok ${menoCl(c.clanok)}`;
      case 'cesta': return c.cesta;
      case 'url': return c.url;
      default: return '?';
    }
  };

  /* ── Úvod ── */
  const da = a.domov, db = b.domov;
  zmenyTextu(z, 'Úvod – nadtitulok', da.uvod.nadtitulok, db.uvod.nadtitulok);
  zmenyTextu(z, 'Úvod – nadpis', da.uvod.nadpis, db.uvod.nadpis);
  if (!rovnake(da.uvod.znak, db.uvod.znak)) z.push(db.uvod.znak ? 'Úvod – znak: nový obrázok' : 'Úvod – znak: pôvodné prekrížené kopije');

  /* ── Dlaždice ── */
  if (da.dlazdice.viditelne !== db.dlazdice.viditelne) z.push(`Dlaždice kategórií: ${db.dlazdice.viditelne ? 'zobrazené' : 'skryté'}`);
  const menoSkupiny = (s: { id: string; nadpis: Text | null }, i: number) => (s.nadpis?.sk ? `„${s.nadpis.sk}“` : i === 0 ? 'prvá skupina' : s.id);
  zmenyZoznamu(z, da.dlazdice.skupiny, db.dlazdice.skupiny, (s) => s.id, (s) => menoSkupiny(s, db.dlazdice.skupiny.indexOf(s)), {
    pridane: (m) => `Dlaždice: nová skupina ${m}`,
    odobrate: (m) => `Dlaždice: skupina ${m} odstránená`,
    miesto: (m, n) => `Dlaždice: skupina ${m} na ${n}. mieste`,
  });
  for (const s of db.dlazdice.skupiny) {
    const p = da.dlazdice.skupiny.find((x) => x.id === s.id);
    if (p) zmenyTextu(z, `Dlaždice – nadpis skupiny ${s.id}`, p.nadpis, s.nadpis);
  }
  type Poloha = { skupina: string; index: number; pocet: boolean; menoSk: string };
  const polohy = (v: Vzhlad) => {
    const m = new Map<string, Poloha>();
    v.domov.dlazdice.skupiny.forEach((s, si) => s.polozky.forEach((p, i) => {
      m.set(kluc(p.kategoria), { skupina: s.id, index: i, pocet: p.pocet, menoSk: menoSkupiny(s, si) });
    }));
    return m;
  };
  const pa = polohy(a), pb = polohy(b);
  const odkazDlazdice = new Map<string, OdkazKategorie>();
  for (const v of [a, b]) for (const s of v.domov.dlazdice.skupiny) for (const p of s.polozky) odkazDlazdice.set(kluc(p.kategoria), p.kategoria);
  for (const [k, n] of pb) {
    const s = pa.get(k);
    const meno = menoKat(odkazDlazdice.get(k));
    if (!s) { z.push(`Dlaždica ${meno}: pridaná (${n.menoSk}, ${n.index + 1}. miesto)`); continue; }
    if (s.skupina !== n.skupina) z.push(`Dlaždica ${meno}: presunutá do skupiny ${n.menoSk} na ${n.index + 1}. miesto`);
    if (s.pocet !== n.pocet) z.push(`Dlaždica ${meno}: počet článkov ${n.pocet ? 'zobrazený' : 'skrytý'}`);
  }
  for (const [k] of pa) if (!pb.has(k)) z.push(`Dlaždica ${menoKat(odkazDlazdice.get(k))}: odstránená z domovskej`);
  for (const s of db.dlazdice.skupiny) {
    const p = da.dlazdice.skupiny.find((x) => x.id === s.id);
    if (!p) continue;
    const stare = p.polozky.map((x) => kluc(x.kategoria));
    const nove = s.polozky.map((x) => kluc(x.kategoria)).filter((x) => stare.includes(x));
    for (const m of presunute(stare.filter((x) => nove.includes(x)), nove)) {
      z.push(`Dlaždica ${menoKat(odkazDlazdice.get(m.kluc))}: na ${s.polozky.findIndex((x) => kluc(x.kategoria) === m.kluc) + 1}. mieste`);
    }
  }

  /* ── Hľadanie ── */
  if (da.hladanie.viditelne !== db.hladanie.viditelne) z.push(`Hľadanie: ${db.hladanie.viditelne ? 'zobrazené' : 'skryté'}`);
  zmenyTextu(z, 'Hľadanie – výzva', da.hladanie.vyzva, db.hladanie.vyzva);
  if (da.hladanie.popularneViditelne !== db.hladanie.popularneViditelne) z.push(`Populárne: ${db.hladanie.popularneViditelne ? 'zobrazené' : 'skryté'}`);
  zmenyZoznamu(z, da.hladanie.popularne, db.hladanie.popularne, (p) => kluc(p.clanok), (p) => `„${p.text.sk}“`, {
    pridane: (m) => `Populárne: pridané ${m}`,
    odobrate: (m) => `Populárne: odobraté ${m}`,
    miesto: (m, n) => `Populárne: ${m} na ${n}. mieste`,
  });
  for (const p of db.hladanie.popularne) {
    const s = da.hladanie.popularne.find((x) => kluc(x.clanok) === kluc(p.clanok));
    if (s) zmenyTextu(z, `Populárne – ${menoCl(p.clanok)}`, s.text, p.text);
  }

  /* ── Sekcie ── */
  const menoSekcie = (s: SekciaDomov) => (s.typ === 'dalsi-obsah' && s.nadpis?.sk ? s.nadpis.sk : NAZVY_SEKCII[s.typ]);
  zmenyZoznamu(z, da.sekcie, db.sekcie, (s) => s.id, menoSekcie, {
    pridane: (m) => `Sekcia ${m}: pridaná`,
    odobrate: (m) => `Sekcia ${m}: odstránená`,
    miesto: (m, n) => `Sekcia ${m}: na ${n}. mieste`,
  });
  for (const s of db.sekcie) {
    const p = da.sekcie.find((x) => x.id === s.id);
    if (!p || p.typ !== s.typ) continue;
    const meno = menoSekcie(s);
    if (p.viditelna !== s.viditelna) z.push(`Sekcia ${meno}: ${s.viditelna ? 'zobrazená' : 'skrytá'}`);
    if (s.typ === 'dalsi-obsah' && p.typ === 'dalsi-obsah') {
      zmenyTextu(z, `Sekcia ${meno} – nadpis`, p.nadpis, s.nadpis);
      const menoRiadku = (rr: (typeof s.riadky)[number]) => rr.nadpis?.sk || menoKatCele(rr.kategoria);
      zmenyZoznamu(z, p.riadky, s.riadky, (x) => x.id, menoRiadku, {
        pridane: (m) => `${meno}: nový riadok ${m}`,
        odobrate: (m) => `${meno}: riadok ${m} odstránený`,
        miesto: (m, n) => `${meno}: riadok ${m} na ${n}. mieste`,
      });
      for (const rr of s.riadky) {
        const pr = p.riadky.find((x) => x.id === rr.id);
        if (!pr) continue;
        const mr = `Riadok ${menoRiadku(rr)}`;
        if (kluc(pr.kategoria) !== kluc(rr.kategoria)) z.push(`${mr}: kategória ${menoKatCele(rr.kategoria)}`);
        zmenyTextu(z, `${mr} – nadpis`, pr.nadpis, rr.nadpis);
        if (pr.pocet !== rr.pocet) z.push(`${mr}: ${rr.pocet} článkov`);
        if (pr.vyber !== rr.vyber) z.push(`${mr}: ${rr.vyber === 'rucne' ? 'vybrané ručne' : 'najnovšie články'}`);
        if (pr.zoradenie !== rr.zoradenie) z.push(`${mr}: zoradenie ${ZORADENIA[rr.zoradenie] ?? rr.zoradenie}`);
        if (pr.lenSObrazkom !== rr.lenSObrazkom) z.push(`${mr}: ${rr.lenSObrazkom ? 'len články s obrázkom' : 'aj články bez obrázka'}`);
        if (!rovnake(pr.clanky.map(kluc), rr.clanky.map(kluc))) {
          z.push(rr.clanky.length ? `${mr}: vybrané články ${rr.clanky.map(menoCl).join(', ')}` : `${mr}: bez ručne vybraných článkov`);
        }
        const obr = (x: typeof rr) => new Map(x.obrazky.map((o) => [kluc(o.clanok), o]));
        const oa = obr(pr), ob = obr(rr);
        for (const [k, o] of ob) if (!rovnake(oa.get(k)?.obrazok, o.obrazok)) z.push(`${mr}, článok ${menoCl(o.clanok)}: iný obrázok na dlaždici`);
        for (const [k, o] of oa) if (!ob.has(k)) z.push(`${mr}, článok ${menoCl(o.clanok)}: pôvodný obrázok článku`);
      }
    }
    if (s.typ === 'kronika' && p.typ === 'kronika') {
      if (kluc(p.uvodnyClanok) !== kluc(s.uvodnyClanok)) z.push(s.uvodnyClanok ? `Kronika: úvodný článok ${menoCl(s.uvodnyClanok)}` : 'Kronika: bez úvodného článku');
      zmenyZoznamu(z, p.pripnute, s.pripnute, kluc, menoCl, {
        pridane: (m) => `Kronika: pripnutý zápis ${m}`,
        odobrate: (m) => `Kronika: odopnutý zápis ${m}`,
        miesto: (m, n) => `Kronika: pripnutý zápis ${m} na ${n}. mieste`,
      });
      zmenaObrazka(z, 'Kronika – obrázok vľavo', p.obrazok, s.obrazok);
      if (p.fotogaleriaViditelna !== s.fotogaleriaViditelna) z.push(`Vybraná fotogaléria: ${s.fotogaleriaViditelna ? 'zobrazená' : 'skrytá'}`);
    }
  }

  /* ── Fotogaléria ── */
  const fa = da.fotogaleria?.fotky ?? null, fb = db.fotogaleria?.fotky ?? null;
  if (!rovnake(fa, fb)) {
    if (!fb) z.push('Vybraná fotogaléria: výber ostáva v databáze');
    else if (fa && fa.length === fb.length && [...fa].sort().join() === [...fb].sort().join()) z.push('Vybraná fotogaléria: nové poradie fotiek');
    else z.push(`Vybraná fotogaléria: ${fb.length} ${fb.length === 1 ? 'fotka' : fb.length < 5 ? 'fotky' : 'fotiek'} (zmenený výber)`);
  }

  /* ── Pridajte sa ── */
  const ja = da.pridajteSa, jb = db.pridajteSa;
  if (ja.viditelna !== jb.viditelna) z.push(`Sekcia Pridajte sa k nám: ${jb.viditelna ? 'zobrazená' : 'skrytá'}`);
  zmenyTextu(z, 'Pridajte sa – nadtitulok', ja.nadtitulok, jb.nadtitulok);
  zmenyTextu(z, 'Pridajte sa – nadpis', ja.nadpis, jb.nadpis);
  zmenyTextu(z, 'Pridajte sa – citát', ja.citat, jb.citat);
  zmenyTextu(z, 'Pridajte sa – úvod', ja.uvod, jb.uvod);
  if (ja.email !== jb.email) z.push(`Pridajte sa – e-mail: ${jb.email}`);
  if (ja.prosby.length !== jb.prosby.length) z.push(`Pridajte sa: ${jb.prosby.length} ${jb.prosby.length === 1 ? 'prosba' : jb.prosby.length < 5 ? 'prosby' : 'prosieb'}`);
  jb.prosby.forEach((p, i) => {
    const s = ja.prosby[i];
    if (!s) return;
    zmenyTextu(z, `Pridajte sa – prosba ${i + 1}, nadpis`, s.nadpis, p.nadpis);
    zmenyTextu(z, `Pridajte sa – prosba ${i + 1}, text`, s.text, p.text);
  });

  /* ── Záznamy kategórií ── */
  for (const k of b.kategorie) {
    const p = a.kategorie.find((x) => kluc(x.kategoria) === kluc(k.kategoria));
    const meno = menoKatCele(k.kategoria);
    if (!p) { z.push(`Kategória ${meno}: pridaný záznam vzhľadu`); continue; }
    zmenyTextu(z, `Kategória ${meno} – názov`, p.nazov, k.nazov);
    zmenyTextu(z, `Kategória ${meno} – bublina dlaždice`, p.titulok, k.titulok);
    zmenyTextu(z, `Dlaždica ${meno} – popisok`, p.popisokDlazdice, k.popisokDlazdice);
    zmenyTextu(z, `Menu ${meno} – krátky názov`, p.popisokMenu, k.popisokMenu);
    zmenyTextu(z, `Kategória ${meno} – popis`, p.popis, k.popis);
    zmenaObrazka(z, `Kategória ${meno}`, p.obrazok, k.obrazok);
    if (!rovnake(p.tvary, k.tvary)) z.push(`Dlaždica ${meno}: tvary počtu ${k.tvary ? `„${k.tvary.sk.join(', ')}“` : 'bez slova'}`);
    if (p.clanky.zoradenie !== k.clanky.zoradenie) z.push(`Kategória ${meno}: články ${ZORADENIA[k.clanky.zoradenie] ?? k.clanky.zoradenie}`);
    if (!rovnake(p.clanky.pripnute.map(kluc), k.clanky.pripnute.map(kluc))) {
      z.push(k.clanky.pripnute.length ? `Kategória ${meno}: pripnuté články ${k.clanky.pripnute.map(menoCl).join(', ')}` : `Kategória ${meno}: bez pripnutých článkov`);
    }
  }
  for (const p of a.kategorie) if (!b.kategorie.some((x) => kluc(x.kategoria) === kluc(p.kategoria))) z.push(`Kategória ${menoKatCele(p.kategoria)}: záznam vzhľadu odstránený`);

  /* ── Činnosť ── */
  zmenyTextu(z, 'Činnosť – nadpis', a.cinnost.nadpis, b.cinnost.nadpis);
  zmenyZoznamu(z, a.cinnost.polozky, b.cinnost.polozky, (c) => c.kluc, (c) => c.nazov.sk, {
    pridane: (m) => `Činnosť ${m}: pridaná`,
    odobrate: (m) => `Činnosť ${m}: odstránená`,
    miesto: (m, n) => `Činnosť ${m}: na ${n}. mieste`,
  });
  for (const c of b.cinnost.polozky) {
    const p = a.cinnost.polozky.find((x) => x.kluc === c.kluc);
    if (!p) continue;
    zmenyTextu(z, `Činnosť ${p.nazov.sk} – názov`, p.nazov, c.nazov);
    zmenyTextu(z, `Činnosť ${c.nazov.sk} – popis`, p.popis, c.popis);
    zmenaObrazka(z, `Činnosť ${c.nazov.sk}`, p.obrazok, c.obrazok);
    if (p.viditelna !== c.viditelna) z.push(`Činnosť ${c.nazov.sk}: ${c.viditelna ? 'zobrazená' : 'skrytá všade'}`);
    if (p.naDomovskej !== c.naDomovskej) z.push(`Činnosť ${c.nazov.sk}: ${c.naDomovskej ? 'zobrazená' : 'skrytá'} na domovskej`);
  }

  /* ── Menu ── */
  if (a.menu.poradie.length || b.menu.poradie.length) {
    zmenyZoznamu(z, a.menu.poradie, b.menu.poradie, kluc, menoKatCele, {
      pridane: (m) => `Menu: ${m} pridaná do poradia`,
      odobrate: (m) => `Menu: ${m} vypadla z poradia`,
      miesto: (m, n) => `Menu: ${m} na ${n}. mieste`,
    });
  }
  const hla = new Set(a.menu.hlavnyRiadok.map(kluc)), hlb = new Set(b.menu.hlavnyRiadok.map(kluc));
  for (const o of b.menu.hlavnyRiadok) if (!hla.has(kluc(o))) z.push(`Menu: ${menoKatCele(o)} v hlavnom riadku`);
  for (const o of a.menu.hlavnyRiadok) if (!hlb.has(kluc(o))) z.push(`Menu: ${menoKatCele(o)} v druhom riadku`);
  const ska = new Set(a.menu.skryte.map(kluc)), skb = new Set(b.menu.skryte.map(kluc));
  for (const o of b.menu.skryte) if (!ska.has(kluc(o))) z.push(`Menu: ${menoKatCele(o)} skrytá`);
  for (const o of a.menu.skryte) if (!skb.has(kluc(o))) z.push(`Menu: ${menoKatCele(o)} zobrazená`);

  /* ── Päta ── */
  zmenyZoznamu(z, a.pata.stlpce, b.pata.stlpce, (s) => s.id, (s) => `„${s.nadpis.sk}“`, {
    pridane: (m) => `Päta: nový stĺpec ${m}`,
    odobrate: (m) => `Päta: stĺpec ${m} odstránený`,
    miesto: (m, n) => `Päta: stĺpec ${m} na ${n}. mieste`,
  });
  for (const s of b.pata.stlpce) {
    const p = a.pata.stlpce.find((x) => x.id === s.id);
    if (!p) continue;
    zmenyTextu(z, `Päta – nadpis stĺpca ${p.nadpis.sk}`, p.nadpis, s.nadpis);
    const kl = (o: (typeof s.odkazy)[number]) => JSON.stringify(o.ciel);
    zmenyZoznamu(z, p.odkazy, s.odkazy, kl, (o) => `„${o.text.sk}“`, {
      pridane: (m) => `Päta – ${s.nadpis.sk}: nový odkaz ${m}`,
      odobrate: (m) => `Päta – ${s.nadpis.sk}: odkaz ${m} odstránený`,
      miesto: (m, n) => `Päta – ${s.nadpis.sk}: odkaz ${m} na ${n}. mieste`,
    });
    for (const o of s.odkazy) {
      const q = p.odkazy.find((x) => kl(x) === kl(o));
      if (q) zmenyTextu(z, `Päta – odkaz na ${menoCiela(o.ciel)}`, q.text, o.text);
    }
  }
  const sa = new Map(a.pata.siete.map((s) => [s.druh, s.url])), sb = new Map(b.pata.siete.map((s) => [s.druh, s.url]));
  for (const [d, u] of sb) if (sa.get(d) !== u) z.push(sa.has(d) ? `Päta – ${d}: nová adresa ${u}` : `Päta: pridaná sieť ${d}`);
  for (const [d] of sa) if (!sb.has(d)) z.push(`Päta: sieť ${d} odstránená`);

  if (!z.length && !rovnake(a, b)) z.push('Drobné zmeny bez viditeľného vplyvu (napr. znenie, z ktorého vznikol preklad).');
  return z;
}

export default zmenyVzhladu;
