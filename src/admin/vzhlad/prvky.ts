/**
 * PRVKY PLÁTNA — čo je ktorá značka `data-vw` a čo sa s ňou dá robiť.
 *
 * Komponenty webu v režime úprav označia prvky `data-vw="<druh>:<id>"`
 * (zoznam v `docs/VZHLAD-WEBU.md`). Tu sa z názvu a vzhľadu odvodí opis:
 * štítok, texty (kde sú v prvku a kam sa zapisujú), obrázok, zoznam, do
 * ktorého prvok patrí (ťahanie, Alt+šípky), skrytie, odstránenie, pripnutie,
 * „+" na konci zoznamu. Plátno, vrstva, pravý panel aj klávesy čítajú len
 * tento opis — o konkrétnych komponentoch nevedia nič.
 *
 * Funkcie zápisu dostanú hlbokú kópiu vzhľadu (`zmen`) a menia ju priamo.
 */

import { textVzhladu } from '../../lib/vzhlad/texty';
import { clanokVJazyku, adresaCiela } from '../../lib/vzhlad/citaj';
import { LIMITY } from '../../lib/vzhlad/typy';
import type {
  Vzhlad, Rozriesene, Jazyk, Text, TextVolitelny, Obrazok, OdkazClanku, SekciaDomov, RiadokClankov,
  VzhladKategorie, OdkazKategorie,
} from '../../lib/vzhlad/typy';
import {
  zaznamKategorie, indexZaznamu, slugOdkazu, presunVPoli, noveZnenie, noveZnenieVolitelne, radyMenu, nastavRadyMenu,
  NAZVY_SEKCII, klucOdkazu, type KategoriaVDb,
} from './stav/operacie';
import type { Stranka } from './stav/KonceptKontext';

/* ───────────────────────── Typy ───────────────────────── */

export interface KontextPrvku {
  v: Vzhlad;
  r: Rozriesene;
  j: Jazyk;
  db: KategoriaVDb[];
  stranka: Stranka;
  /** Prvok v okne plátna (kvôli `data-vw-dokument`, `data-vw-subor`). */
  el?: Element | null;
}

export interface TextPrvku {
  pole: string;
  nazov: string;
  /** Kde v prvku je text (inak prvok sám). Píše sa len do priamych textových uzlov. */
  selektor?: string;
  limit: number;
  druh: 'text' | 'volitelny' | 'retazec';
  ziskaj: (v: Vzhlad) => Text | TextVolitelny | string | null;
  /** Zapíše nové znenie v jazyku `j`. */
  nastav: (v: Vzhlad, j: Jazyk, hodnota: string) => void;
  /** Čo je na webe, keď text vo vzhľade nie je (názov z databázy a pod.). */
  zaloha?: string;
  /** Premenovanie kategórie — editor vyžaduje aj EN a DE. */
  premenovanie?: boolean;
  /** Slovenčina smie ostať prázdna (krátky názov v menu, nadpis riadku = názov kategórie). */
  smiePrazdne?: boolean;
}

export interface ObrazokPrvku {
  nazov: string;
  ziskaj: (v: Vzhlad) => Obrazok | null;
  nastav: (v: Vzhlad, o: Obrazok | null) => void;
  /** Dá sa ťahaním nastaviť výrez (`pozicia`)? */
  vyrez: boolean;
  /** Pomer strán náhľadov (šírka / výška). */
  nahlady: { nazov: string; pomer: number }[];
  /** Čo ukáže web bez obrázka. */
  bezObrazka?: string;
  /** „Vrátiť pôvodný" (len dlaždica článku v riadku). */
  povodny?: { popis: string; vykonaj: (v: Vzhlad) => void };
}

export type Smer = 'vodorovne' | 'zvisle';

export interface ZoznamPrvku {
  /** Rodina zoznamov, medzi ktorými sa dá presúvať (dlaždice naprieč skupinami, menu naprieč riadkami). */
  rodina: string;
  zoznam: string;
  index: number;
  dlzka: number;
  smer: Smer;
}

export interface AkciaPrvku {
  popis: string;
  vykonaj: (v: Vzhlad) => void;
}

/** Pripnutie článku (kronika, stránka kategórie, ručný výber riadka). `slug` = slovenský slug článku. */
export interface PripnutiePrvku {
  popis: string;
  dokument: string;
  vykonaj: (v: Vzhlad, slug: string) => void;
}

export type VyberPridania = 'kategoria' | 'clanok' | 'fotka' | 'nic' | 'ciel';

export interface PridaniePrvku {
  popis: string;
  vyber: VyberPridania;
  /** Pri hľadaní článku: len z tejto kategórie (slug). */
  kategoria?: string | null;
  /** Kam sa „+" kreslí: za posledný prvok tohto zoznamu (inak na koniec prvku). */
  zaZoznamom?: string;
  vykonaj: (v: Vzhlad, hodnota: PridavanaHodnota) => void;
}

export type PridavanaHodnota =
  | { druh: 'kategoria'; kategoria: KategoriaVDb }
  | { druh: 'clanok'; clanok: OdkazClanku; nazov: string }
  | { druh: 'fotka'; id: number }
  | { druh: 'nic' };

export interface OpisPrvku {
  nazov: string;
  druh: string;
  stitok: string;
  texty: TextPrvku[];
  obrazok?: ObrazokPrvku;
  zoznam?: ZoznamPrvku;
  skryt?: { skryty: boolean; popis: string; prepni: (v: Vzhlad) => void };
  odstranit?: AkciaPrvku;
  pripnut?: PripnutiePrvku;
  pridat?: PridaniePrvku;
  /** Článok (documentId) — „Upraviť článok". */
  clanok?: string | null;
  /** Kategória (slug) — „Otvoriť stránku kategórie". */
  kategoria?: string | null;
  /** Prvok odkazuje na niečo, čo už neexistuje (zmazaná kategória, článok). */
  neplatny?: string;
}

/* ───────────────────────── Pomocné ───────────────────────── */

const textZ = (fn: (v: Vzhlad) => Text | null | undefined) => (v: Vzhlad) => fn(v) ?? null;

/** Text vo vzhľade: `nastavit` dostane nové celé znenie. */
function text(
  pole: string, nazov: string, limit: number,
  ziskaj: (v: Vzhlad) => Text | null | undefined,
  nastavit: (v: Vzhlad, t: Text | null) => void,
  o: Partial<TextPrvku> = {},
): TextPrvku {
  return {
    pole, nazov, limit, druh: 'text',
    ziskaj: textZ(ziskaj),
    nastav: (v, j, h) => {
      const stary = ziskaj(v) ?? null;
      if (o.smiePrazdne && j === 'sk' && h.trim() === '') { nastavit(v, null); return; }
      nastavit(v, noveZnenie(stary ?? (o.zaloha ? { sk: o.zaloha } : null), j, h));
    },
    ...o,
  };
}

const menoKategorie = (o: OdkazKategorie, x: KontextPrvku): string => {
  const slug = slugOdkazu(o, x.r);
  const zaz = x.v.kategorie[indexZaznamu(x.v, o, x.r)];
  const zDb = x.db.find((k) => k.slug === slug);
  return (zaz && textVzhladu(zaz.popisokDlazdice, 'sk')) || zDb?.name || slug;
};

const menoClanku = (o: OdkazClanku | null | undefined, x: KontextPrvku): string => {
  if (!o) return '';
  return (o.dokument && x.r.clanky[o.dokument]?.sk?.nazov) || o.slug;
};

const dokumentPrvku = (x: KontextPrvku): string | null => x.el?.getAttribute('data-vw-dokument') || null;

const existujeKategoria = (o: OdkazKategorie, x: KontextPrvku) =>
  o.dokument ? !!x.r.kategorie[o.dokument] || x.db.some((k) => k.documentId === o.dokument) : x.db.some((k) => k.slug === o.slug);

const POMER_DLAZDICE = 3 / 2;

/** Záznam kategórie podľa slugu (na stránke kategórie a v menu). */
function odkazPodlaSlugu(slug: string, x: KontextPrvku): OdkazKategorie {
  const d = x.db.find((k) => k.slug === slug);
  return { dokument: d?.documentId ?? null, slug };
}

function zaznam(v: Vzhlad, o: OdkazKategorie, x: KontextPrvku): VzhladKategorie {
  return zaznamKategorie(v, o, x.r, x.db);
}

function obrazokKategorie(o: OdkazKategorie, x: KontextPrvku, nazov = 'Obrázok kategórie'): ObrazokPrvku {
  return {
    nazov,
    ziskaj: (v) => v.kategorie[indexZaznamu(v, o, x.r)]?.obrazok ?? null,
    nastav: (v, ob) => { zaznam(v, o, x).obrazok = ob; },
    vyrez: true,
    nahlady: [
      { nazov: 'Dlaždica a lišta (3 : 2)', pomer: POMER_DLAZDICE },
      { nazov: 'Hlavička kategórie — počítač', pomer: 1104 / 380 },
      { nazov: 'Hlavička kategórie — mobil', pomer: 358 / 300 },
    ],
    bezObrazka: 'dlaždica bez obrázka',
  };
}

function popisokDlazdice(o: OdkazKategorie, x: KontextPrvku, selektor: string): TextPrvku {
  return text('popisok', 'Popisok dlaždice', LIMITY.popisokDlazdice,
    (v) => v.kategorie[indexZaznamu(v, o, x.r)]?.popisokDlazdice,
    (v, t) => { if (t) zaznam(v, o, x).popisokDlazdice = t; },
    { selektor, zaloha: menoKategorie(o, x) });
}

function sekciaPodlaTypu<T extends SekciaDomov['typ']>(v: Vzhlad, typ: T) {
  return v.domov.sekcie.find((s) => s.typ === typ) as Extract<SekciaDomov, { typ: T }> | undefined;
}

function riadok(v: Vzhlad, sid: string, rid: string): RiadokClankov | undefined {
  const s = v.domov.sekcie.find((q) => q.id === sid);
  return s && s.typ === 'dalsi-obsah' ? s.riadky.find((r) => r.id === rid) : undefined;
}

/* ───────────────────────── Opis prvku ───────────────────────── */

export function opisPrvku(nazov: string, x: KontextPrvku): OpisPrvku | null {
  try {
    return opis(nazov, x);
  } catch {
    return null;
  }
}

function opis(nazov: string, x: KontextPrvku): OpisPrvku | null {
  const { v, r } = x;
  const c = nazov.split(':');
  const zaklad = (druh: string, stitok: string): OpisPrvku => ({ nazov, druh, stitok, texty: [] });

  switch (c[0]) {
    /* ── Úvod ── */
    case 'uvod': {
      if (c[1] === 'nadtitulok' || c[1] === 'nadpis') {
        const p = c[1];
        const o = zaklad('text', p === 'nadpis' ? 'Úvod · nadpis' : 'Úvod · nadtitulok');
        o.texty = [text(p, p === 'nadpis' ? 'Nadpis' : 'Nadtitulok', LIMITY.nadpis, (w) => w.domov.uvod[p], (w, t) => { if (t) w.domov.uvod[p] = t; })];
        return o;
      }
      if (c[1] === 'znak') {
        const o = zaklad('obrazok', 'Úvod · znak');
        o.obrazok = {
          nazov: 'Znak nad nadpisom', vyrez: false, bezObrazka: 'prekrížené kopije (pôvodný znak)',
          ziskaj: (w) => w.domov.uvod.znak, nastav: (w, ob) => { w.domov.uvod.znak = ob ? { ...ob, pozicia: null } : null; },
          nahlady: [{ nazov: 'Znak', pomer: 320 / 183 }],
        };
        return o;
      }
      return null;
    }

    /* ── Dlaždice ── */
    case 'dlazdice': {
      const o = zaklad('dlazdice', 'Dlaždice kategórií');
      o.skryt = { skryty: !v.domov.dlazdice.viditelne, popis: 'dlaždice kategórií', prepni: (w) => { w.domov.dlazdice.viditelne = !w.domov.dlazdice.viditelne; } };
      o.pridat = {
        popis: 'Pridať skupinu dlaždíc', vyber: 'nic',
        vykonaj: (w) => {
          const id = noveIdSkupiny(w);
          w.domov.dlazdice.skupiny.push({ id, nadpis: { sk: 'Nová skupina' }, polozky: [] });
        },
      };
      return o;
    }
    case 'skupina': {
      const si = v.domov.dlazdice.skupiny.findIndex((s) => s.id === c[1]);
      if (si < 0) return null;
      const s = v.domov.dlazdice.skupiny[si];
      const o = zaklad('skupina', `Skupina dlaždíc · ${s.nadpis?.sk || (si === 0 ? 'prvá' : s.id)}`);
      o.zoznam = { rodina: 'skupiny', zoznam: 'skupiny', index: si, dlzka: v.domov.dlazdice.skupiny.length, smer: 'zvisle' };
      if (v.domov.dlazdice.skupiny.length > 1) {
        o.odstranit = { popis: `skupinu „${s.nadpis?.sk || s.id}“ aj s ${s.polozky.length} dlaždicami`, vykonaj: (w) => { w.domov.dlazdice.skupiny = w.domov.dlazdice.skupiny.filter((q) => q.id !== s.id); } };
      }
      o.pridat = {
        popis: 'Pridať dlaždicu', vyber: 'kategoria', zaZoznamom: `dlazdice:${s.id}`,
        vykonaj: (w, h) => {
          if (h.druh !== 'kategoria') return;
          const sk = w.domov.dlazdice.skupiny.find((q) => q.id === s.id);
          if (!sk) return;
          const uz = new Set(w.domov.dlazdice.skupiny.flatMap((q) => q.polozky.map((p) => p.id)));
          let id = h.kategoria.slug.slice(0, 40);
          for (let n = 2; uz.has(id); n++) id = `${h.kategoria.slug.slice(0, 36)}-${n}`;
          sk.polozky.push({ id, kategoria: { dokument: h.kategoria.documentId, slug: h.kategoria.slug }, pocet: true });
          zaznamKategorie(w, { dokument: h.kategoria.documentId, slug: h.kategoria.slug }, x.r, x.db);
        },
      };
      return o;
    }
    case 'skupina-nadpis': {
      const s = v.domov.dlazdice.skupiny.find((q) => q.id === c[1]);
      if (!s) return null;
      const o = zaklad('text', 'Nadpis skupiny dlaždíc');
      o.texty = [text('nadpis', 'Nadpis skupiny', LIMITY.nadpis, (w) => w.domov.dlazdice.skupiny.find((q) => q.id === s.id)?.nadpis,
        (w, t) => { const q = w.domov.dlazdice.skupiny.find((y) => y.id === s.id); if (q) q.nadpis = t; }, { smiePrazdne: true })];
      return o;
    }
    case 'dlazdica': {
      const si = v.domov.dlazdice.skupiny.findIndex((s) => s.id === c[1]);
      const s = v.domov.dlazdice.skupiny[si];
      const pi = s ? s.polozky.findIndex((p) => p.id === c[2]) : -1;
      if (!s || pi < 0) return null;
      const d = s.polozky[pi];
      const slug = slugOdkazu(d.kategoria, r);
      const o = zaklad('dlazdica', `Dlaždica · ${menoKategorie(d.kategoria, x)}`);
      o.texty = [popisokDlazdice(d.kategoria, x, '.lkat-nazov')];
      o.obrazok = obrazokKategorie(d.kategoria, x);
      o.zoznam = { rodina: 'dlazdice', zoznam: `dlazdice:${s.id}`, index: pi, dlzka: s.polozky.length, smer: 'vodorovne' };
      o.odstranit = { popis: 'dlaždicu z domovskej (kategória ostáva)', vykonaj: (w) => { const q = w.domov.dlazdice.skupiny.find((y) => y.id === s.id); if (q) q.polozky = q.polozky.filter((p) => p.id !== d.id); } };
      o.kategoria = slug;
      if (!existujeKategoria(d.kategoria, x)) o.neplatny = 'kategória bola zmazaná';
      return o;
    }

    /* ── Hľadanie a populárne ── */
    case 'hladanie': {
      const prepni = { skryty: !v.domov.hladanie.viditelne, popis: 'hľadanie', prepni: (w: Vzhlad) => { w.domov.hladanie.viditelne = !w.domov.hladanie.viditelne; } };
      if (c[1] === 'vyzva') {
        const o = zaklad('text', 'Hľadanie · výzva');
        o.texty = [text('vyzva', 'Výzva nad hľadaním', LIMITY.nadpis, (w) => w.domov.hladanie.vyzva, (w, t) => { if (t) w.domov.hladanie.vyzva = t; })];
        o.skryt = prepni;
        return o;
      }
      const o = zaklad('hladanie', 'Pole hľadania');
      o.skryt = prepni;
      return o;
    }
    case 'popularne': {
      const viditelne = v.domov.hladanie.popularne
        .map((p, i) => ({ p, i }))
        .filter(({ p }) => !!clanokVJazyku(p.clanok, r, x.j));
      if (c.length === 1) {
        const o = zaklad('popularne', 'Populárne');
        o.skryt = { skryty: !v.domov.hladanie.popularneViditelne, popis: 'populárne', prepni: (w) => { w.domov.hladanie.popularneViditelne = !w.domov.hladanie.popularneViditelne; } };
        o.pridat = {
          popis: 'Pridať populárne hradisko', vyber: 'clanok', zaZoznamom: 'popularne',
          vykonaj: (w, h) => { if (h.druh === 'clanok') w.domov.hladanie.popularne.push({ text: { sk: h.nazov.slice(0, LIMITY.nazov) }, clanok: h.clanok }); },
        };
        return o;
      }
      const k = Number(c[1]);
      const polozka = viditelne[k];
      if (!polozka) return null;
      const i = polozka.i;
      const o = zaklad('popularne-polozka', `Populárne · ${polozka.p.text.sk}`);
      o.texty = [text('text', 'Text odkazu', LIMITY.nazov, (w) => w.domov.hladanie.popularne[i]?.text, (w, t) => { if (t && w.domov.hladanie.popularne[i]) w.domov.hladanie.popularne[i].text = t; })];
      o.zoznam = { rodina: 'popularne', zoznam: 'popularne', index: i, dlzka: v.domov.hladanie.popularne.length, smer: 'vodorovne' };
      o.odstranit = { popis: `„${polozka.p.text.sk}“ z populárnych`, vykonaj: (w) => { w.domov.hladanie.popularne.splice(i, 1); } };
      o.clanok = polozka.p.clanok.dokument;
      return o;
    }

    /* ── Sekcie ── */
    case 'sekcia': {
      const si = v.domov.sekcie.findIndex((s) => s.id === c[1]);
      if (si < 0) return null;
      const s = v.domov.sekcie[si];
      const meno = s.typ === 'dalsi-obsah' && s.nadpis?.sk ? s.nadpis.sk : NAZVY_SEKCII[s.typ];
      const o = zaklad(`sekcia-${s.typ}`, `Sekcia · ${meno}`);
      o.zoznam = { rodina: 'sekcie', zoznam: 'sekcie', index: si, dlzka: v.domov.sekcie.length, smer: 'zvisle' };
      o.skryt = { skryty: !s.viditelna, popis: `sekciu ${meno}`, prepni: (w) => { const q = w.domov.sekcie.find((y) => y.id === s.id); if (q) q.viditelna = !q.viditelna; } };
      if (s.typ === 'dalsi-obsah') {
        if (v.domov.sekcie.filter((q) => q.typ === 'dalsi-obsah').length > 1) {
          o.odstranit = { popis: `sekciu „${meno}“`, vykonaj: (w) => { w.domov.sekcie = w.domov.sekcie.filter((q) => q.id !== s.id); } };
        }
        o.pridat = {
          popis: 'Pridať riadok článkov', vyber: 'kategoria',
          vykonaj: (w, h) => {
            if (h.druh !== 'kategoria') return;
            const q = w.domov.sekcie.find((y) => y.id === s.id);
            if (!q || q.typ !== 'dalsi-obsah') return;
            const uz = new Set(q.riadky.map((y) => y.id));
            let id = h.kategoria.slug.slice(0, 40);
            for (let n = 2; uz.has(id); n++) id = `${h.kategoria.slug.slice(0, 36)}-${n}`;
            q.riadky.push({ id, kategoria: { dokument: h.kategoria.documentId, slug: h.kategoria.slug }, nadpis: null, pocet: 4, vyber: 'najnovsie', zoradenie: 'zverejnenie', lenSObrazkom: true, clanky: [], obrazky: [] });
          },
        };
      }
      return o;
    }
    case 'dalsi-obsah': {
      const s = v.domov.sekcie.find((q) => q.id === c[2]);
      if (!s || s.typ !== 'dalsi-obsah') return null;
      const o = zaklad('text', 'Ďalší obsah · nadpis');
      o.texty = [text('nadpis', 'Nadpis sekcie', LIMITY.nadpis, (w) => (w.domov.sekcie.find((q) => q.id === s.id) as typeof s | undefined)?.nadpis,
        (w, t) => { const q = w.domov.sekcie.find((y) => y.id === s.id); if (q && q.typ === 'dalsi-obsah' && t) q.nadpis = t; })];
      return o;
    }
    case 'riadok': {
      const s = v.domov.sekcie.find((q) => q.id === c[1]);
      if (!s || s.typ !== 'dalsi-obsah') return null;
      const ri = s.riadky.findIndex((q) => q.id === c[2]);
      if (ri < 0) return null;
      const rr = s.riadky[ri];
      const o = zaklad('riadok', `Riadok · ${rr.nadpis?.sk || menoKategorie(rr.kategoria, x)}`);
      o.zoznam = { rodina: `riadky:${s.id}`, zoznam: `riadky:${s.id}`, index: ri, dlzka: s.riadky.length, smer: 'zvisle' };
      o.odstranit = { popis: 'riadok z domovskej (kategória ani články sa nemenia)', vykonaj: (w) => { const q = w.domov.sekcie.find((y) => y.id === s.id); if (q && q.typ === 'dalsi-obsah') q.riadky = q.riadky.filter((y) => y.id !== rr.id); } };
      o.kategoria = slugOdkazu(rr.kategoria, r);
      if (rr.vyber === 'rucne') {
        o.pridat = {
          popis: 'Pridať článok do riadka', vyber: 'clanok', kategoria: slugOdkazu(rr.kategoria, r), zaZoznamom: `riadok-clanky:${s.id}:${rr.id}`,
          vykonaj: (w, h) => {
            const q = riadok(w, s.id, rr.id);
            if (!q || h.druh !== 'clanok' || q.clanky.some((y) => klucOdkazu(y) === klucOdkazu(h.clanok))) return;
            q.clanky.push(h.clanok);
            if (q.pocet < q.clanky.length) q.pocet = Math.min(LIMITY.clankovVRiadku, q.clanky.length);
          },
        };
      }
      if (!existujeKategoria(rr.kategoria, x)) o.neplatny = 'kategória bola zmazaná';
      return o;
    }
    case 'riadok-nadpis': {
      const rr = riadok(v, c[1], c[2]);
      if (!rr) return null;
      const o = zaklad('text', 'Nadpis riadka');
      o.texty = [text('nadpis', 'Nadpis riadka (prázdny = názov kategórie)', LIMITY.nadpis, (w) => riadok(w, c[1], c[2])?.nadpis,
        (w, t) => { const q = riadok(w, c[1], c[2]); if (q) q.nadpis = t; }, { smiePrazdne: true, zaloha: menoKategorie(rr.kategoria, x) })];
      return o;
    }
    case 'riadok-clanok': {
      const rr = riadok(v, c[1], c[2]);
      if (!rr) return null;
      const dok = dokumentPrvku(x);
      const o = zaklad('riadok-clanok', `Článok v riadku · ${dok ? menoClanku({ dokument: dok, slug: '' }, x) || 'článok' : 'článok'}`);
      o.clanok = dok;
      if (dok) {
        const odkaz: OdkazClanku = { dokument: dok, slug: (x.r.clanky[dok]?.sk?.slug) ?? '' };
        o.obrazok = {
          nazov: 'Obrázok len na tejto dlaždici', vyrez: false,
          ziskaj: (w) => riadok(w, c[1], c[2])?.obrazky.find((y) => y.clanok.dokument === dok)?.obrazok ?? null,
          nastav: (w, ob) => {
            const q = riadok(w, c[1], c[2]);
            if (!q) return;
            q.obrazky = q.obrazky.filter((y) => y.clanok.dokument !== dok);
            if (ob) q.obrazky.push({ clanok: odkaz, obrazok: { ...ob, pozicia: null } });
          },
          nahlady: [{ nazov: 'Dlaždica článku (3 : 2)', pomer: POMER_DLAZDICE }],
          povodny: rr.obrazky.some((y) => y.clanok.dokument === dok)
            ? { popis: 'Vrátiť pôvodný obrázok článku', vykonaj: (w) => { const q = riadok(w, c[1], c[2]); if (q) q.obrazky = q.obrazky.filter((y) => y.clanok.dokument !== dok); } }
            : undefined,
        };
        const mi = rr.clanky.findIndex((y) => y.dokument === dok);
        if (rr.vyber === 'rucne' && mi >= 0) {
          o.zoznam = { rodina: `riadok-clanky:${c[1]}:${c[2]}`, zoznam: `riadok-clanky:${c[1]}:${c[2]}`, index: mi, dlzka: rr.clanky.length, smer: 'vodorovne' };
          o.odstranit = { popis: 'článok z ručného výberu riadka', vykonaj: (w) => { const q = riadok(w, c[1], c[2]); if (q) q.clanky = q.clanky.filter((y) => y.dokument !== dok); } };
        } else if (rr.vyber === 'rucne') {
          o.pripnut = { popis: 'Pridať do ručného výberu', dokument: dok, vykonaj: (w, slug) => { const q = riadok(w, c[1], c[2]); if (q && !q.clanky.some((y) => y.dokument === dok)) q.clanky.push({ dokument: dok, slug }); } };
        }
      }
      return o;
    }

    /* ── Činnosť ── */
    case 'cinnost': {
      if (c[1] === 'nadpis') {
        const o = zaklad('text', 'Činnosť · nadpis');
        o.texty = [text('nadpis', 'Nadpis sekcie', LIMITY.nadpis, (w) => w.cinnost.nadpis, (w, t) => { if (t) w.cinnost.nadpis = t; })];
        return o;
      }
      const i = v.cinnost.polozky.findIndex((p) => p.kluc === c[1]);
      if (i < 0) return null;
      const p = v.cinnost.polozky[i];
      const kl = p.kluc;
      const najdi = (w: Vzhlad) => w.cinnost.polozky.find((y) => y.kluc === kl);
      const o = zaklad('cinnost', `Činnosť · ${p.nazov.sk}`);
      o.texty = [
        text('nazov', 'Názov', LIMITY.nazov, (w) => najdi(w)?.nazov, (w, t) => { const q = najdi(w); if (q && t) q.nazov = t; }, { selektor: '.lcin-nazov' }),
        text('popis', 'Popis', LIMITY.popis, (w) => najdi(w)?.popis, (w, t) => { const q = najdi(w); if (q && t) q.popis = t; }, { selektor: '.lcin-popis' }),
      ];
      o.obrazok = {
        nazov: 'Obrázok činnosti', vyrez: true,
        ziskaj: (w) => najdi(w)?.obrazok ?? null,
        nastav: (w, ob) => { const q = najdi(w); if (q && ob) q.obrazok = ob; },
        nahlady: [{ nazov: 'Dlaždica činnosti (16 : 10)', pomer: 16 / 10 }],
      };
      o.zoznam = { rodina: 'cinnost', zoznam: 'cinnost', index: i, dlzka: v.cinnost.polozky.length, smer: 'vodorovne' };
      if (x.stranka.druh === 'domov') {
        o.skryt = { skryty: !p.naDomovskej || !p.viditelna, popis: 'činnosť na domovskej', prepni: (w) => { const q = najdi(w); if (!q) return; if (!q.viditelna) { q.viditelna = true; q.naDomovskej = true; } else q.naDomovskej = !q.naDomovskej; } };
      } else {
        o.skryt = { skryty: !p.viditelna, popis: 'činnosť všade', prepni: (w) => { const q = najdi(w); if (q) q.viditelna = !q.viditelna; } };
      }
      return o;
    }

    /* ── Kronika ── */
    case 'kronika': {
      const s = sekciaPodlaTypu(v, 'kronika');
      if (!s) return null;
      const sid = s.id;
      const najdi = (w: Vzhlad) => w.domov.sekcie.find((y) => y.id === sid) as typeof s | undefined;
      switch (c[1]) {
        case 'uvod': {
          const o = zaklad('kronika-uvod', `Kronika · úvodný článok${s.uvodnyClanok ? ` · ${menoClanku(s.uvodnyClanok, x)}` : ''}`);
          o.clanok = dokumentPrvku(x) ?? s.uvodnyClanok?.dokument ?? null;
          o.odstranit = { popis: 'úvodný článok (sekcia ostane bez neho)', vykonaj: (w) => { const q = najdi(w); if (q) q.uvodnyClanok = null; } };
          return o;
        }
        case 'obrazok': {
          const o = zaklad('obrazok', 'Kronika · obrázok vľavo');
          o.obrazok = {
            nazov: 'Obrázok v ľavom bloku', vyrez: false, bezObrazka: 'logo združenia',
            ziskaj: (w) => najdi(w)?.obrazok ?? null, nastav: (w, ob) => { const q = najdi(w); if (q) q.obrazok = ob ? { ...ob, pozicia: null } : null; },
            nahlady: [{ nazov: 'Ľavý blok kroniky', pomer: 900 / 886 }],
          };
          return o;
        }
        case 'pripnuty':
        case 'zapis': {
          const dok = dokumentPrvku(x);
          const i = dok ? s.pripnute.findIndex((y) => y.dokument === dok) : -1;
          const o = zaklad(c[1] === 'pripnuty' ? 'kronika-pripnuty' : 'kronika-zapis', `${c[1] === 'pripnuty' ? 'Pripnutý zápis' : 'Zápis kroniky'}${dok ? ` · ${menoClanku({ dokument: dok, slug: '' }, x) || ''}` : ''}`);
          o.clanok = dok;
          if (i >= 0) {
            o.zoznam = { rodina: 'kronika-pripnute', zoznam: 'kronika-pripnute', index: i, dlzka: s.pripnute.length, smer: 'vodorovne' };
            o.odstranit = { popis: 'zápis z pripnutých (v páse ostane podľa dátumu)', vykonaj: (w) => { const q = najdi(w); if (q) q.pripnute = q.pripnute.filter((y) => y.dokument !== dok); } };
          } else if (dok) {
            o.pripnut = {
              popis: 'Pripnúť na začiatok pásu', dokument: dok,
              vykonaj: (w, slug) => { const q = najdi(w); if (q && !q.pripnute.some((y) => y.dokument === dok) && q.pripnute.length < LIMITY.pripnutych) q.pripnute.push({ dokument: dok, slug }); },
            };
          }
          return o;
        }
        case 'fotogaleria': {
          const o = zaklad('fotogaleria', 'Vybraná fotogaléria');
          o.skryt = { skryty: !s.fotogaleriaViditelna, popis: 'vybranú fotogalériu', prepni: (w) => { const q = najdi(w); if (q) q.fotogaleriaViditelna = !q.fotogaleriaViditelna; } };
          o.pridat = {
            popis: 'Pridať fotku do galérie', vyber: 'fotka',
            vykonaj: (w, h) => {
              if (h.druh !== 'fotka') return;
              if (!w.domov.fotogaleria) w.domov.fotogaleria = { fotky: [] };
              if (!w.domov.fotogaleria.fotky.includes(h.id) && w.domov.fotogaleria.fotky.length < LIMITY.fotiekGalerie) w.domov.fotogaleria.fotky.push(h.id);
            },
          };
          return o;
        }
        case 'fotka': {
          const id = Number(x.el?.getAttribute('data-vw-subor'));
          const fotky = v.domov.fotogaleria?.fotky ?? [];
          const i = fotky.indexOf(id);
          if (i < 0) return null;
          const o = zaklad('fotka', `Fotka galérie · ${i + 1}.${i === 0 ? ' (veľká)' : ''}`);
          o.zoznam = { rodina: 'fotogaleria', zoznam: 'fotogaleria', index: i, dlzka: fotky.length, smer: 'vodorovne' };
          o.odstranit = { popis: 'fotku z vybranej galérie', vykonaj: (w) => { if (w.domov.fotogaleria) w.domov.fotogaleria.fotky = w.domov.fotogaleria.fotky.filter((f) => f !== id); } };
          o.obrazok = {
            nazov: 'Fotka galérie', vyrez: false,
            ziskaj: () => ({ id }),
            nastav: (w, ob) => { if (!w.domov.fotogaleria || !ob || !('id' in ob)) return; const k = w.domov.fotogaleria.fotky.indexOf(id); if (k >= 0 && !w.domov.fotogaleria.fotky.includes(ob.id)) w.domov.fotogaleria.fotky[k] = ob.id; },
            nahlady: [{ nazov: i === 0 ? 'Veľká fotka' : 'Fotka galérie', pomer: i === 0 ? 1.2 : 1.2 }],
          };
          return o;
        }
        default: return null;
      }
    }

    /* ── Pridajte sa ── */
    case 'pridajte-sa': {
      const p = v.domov.pridajteSa;
      if (c.length === 1) {
        const o = zaklad('pridajte-sa', 'Sekcia · Pridajte sa k nám');
        o.skryt = { skryty: !p.viditelna, popis: 'sekciu Pridajte sa k nám', prepni: (w) => { w.domov.pridajteSa.viditelna = !w.domov.pridajteSa.viditelna; } };
        o.pridat = {
          popis: 'Pridať prosbu', vyber: 'nic',
          vykonaj: (w) => { if (w.domov.pridajteSa.prosby.length < LIMITY.prosieb) w.domov.pridajteSa.prosby.push({ nadpis: { sk: 'Nová prosba' }, text: { sk: 'Popíšte, s čím môžu ľudia pomôcť.' } }); },
        };
        return o;
      }
      if (c[1] === 'prosba') {
        const i = Number(c[2]);
        if (!p.prosby[i]) return null;
        const o = zaklad('prosba', `Pridajte sa · prosba ${i + 1}`);
        o.texty = [
          text('nadpis', 'Nadpis prosby', LIMITY.textKratky, (w) => w.domov.pridajteSa.prosby[i]?.nadpis, (w, t) => { if (t && w.domov.pridajteSa.prosby[i]) w.domov.pridajteSa.prosby[i].nadpis = t; }, { selektor: '.ljoin-ask-t' }),
          text('text', 'Text prosby', LIMITY.textDlhy, (w) => w.domov.pridajteSa.prosby[i]?.text, (w, t) => { if (t && w.domov.pridajteSa.prosby[i]) w.domov.pridajteSa.prosby[i].text = t; }, { selektor: '.ljoin-ask-d' }),
        ];
        o.zoznam = { rodina: 'prosby', zoznam: 'prosby', index: i, dlzka: p.prosby.length, smer: 'vodorovne' };
        o.odstranit = { popis: `prosbu ${i + 1}`, vykonaj: (w) => { w.domov.pridajteSa.prosby.splice(i, 1); } };
        return o;
      }
      if (c[1] === 'email') {
        const o = zaklad('text', 'Pridajte sa · e-mail');
        o.texty = [{
          pole: 'email', nazov: 'E-mail', limit: LIMITY.email, druh: 'retazec', selektor: 'strong',
          ziskaj: (w) => w.domov.pridajteSa.email,
          nastav: (w, _j, h) => { if (h.trim()) w.domov.pridajteSa.email = h.trim(); },
        }];
        return o;
      }
      const POLIA: Record<string, [string, number]> = {
        nadtitulok: ['Nadtitulok', LIMITY.nadpis], nadpis: ['Nadpis', LIMITY.nadpis], citat: ['Citát', LIMITY.textKratky], uvod: ['Úvod', LIMITY.textDlhy],
      };
      const pole = c[1] as 'nadtitulok' | 'nadpis' | 'citat' | 'uvod';
      if (!POLIA[pole]) return null;
      const o = zaklad('text', `Pridajte sa · ${POLIA[pole][0].toLowerCase()}`);
      o.texty = [text(pole, POLIA[pole][0], POLIA[pole][1], (w) => w.domov.pridajteSa[pole], (w, t) => { if (t) w.domov.pridajteSa[pole] = t; })];
      return o;
    }

    /* ── Menu ── */
    case 'menu': {
      if (c[1] === 'hlavny' || c[1] === 'dalsi') {
        const o = zaklad('menu-riadok', c[1] === 'hlavny' ? 'Menu · hlavný riadok' : 'Menu · druhý riadok');
        return o;
      }
      const slug = c.slice(1).join(':');
      const kat = x.db.find((k) => k.slug === slug);
      if (!kat) return null;
      const odkaz = { dokument: kat.documentId, slug };
      const { hlavny, dalsi } = radyMenu(v, r, x.db);
      const vHlavnom = hlavny.some((k) => k.slug === slug);
      const rad = vHlavnom ? hlavny : dalsi;
      const zaz = v.kategorie[indexZaznamu(v, odkaz, r)];
      const o = zaklad('menu', `Menu · ${zaz?.nazov?.sk || kat.name}`);
      o.texty = [{
        pole: 'popisokMenu', nazov: 'Krátky názov v menu (prázdny = celý názov)', limit: LIMITY.popisokMenu, druh: 'volitelny',
        selektor: x.el?.classList.contains('lnav-m-cat') ? '.lnav-m-btn > span' : '.lnav-cat-btn',
        zaloha: zaz?.nazov?.sk || kat.name,
        smiePrazdne: true,
        ziskaj: (w) => w.kategorie[indexZaznamu(w, odkaz, r)]?.popisokMenu ?? null,
        nastav: (w, j, h) => { const z2 = zaznamKategorie(w, odkaz, r, x.db); z2.popisokMenu = noveZnenieVolitelne(z2.popisokMenu, j, h); },
      }];
      o.zoznam = { rodina: 'menu', zoznam: vHlavnom ? 'menu:hlavny' : 'menu:dalsi', index: rad.findIndex((k) => k.slug === slug), dlzka: rad.length, smer: x.el?.classList.contains('lnav-m-cat') ? 'zvisle' : 'vodorovne' };
      const skryta = v.menu.skryte.some((y) => klucOdkazu(y) === klucOdkazu(odkaz) || y.slug === slug);
      o.skryt = {
        skryty: skryta, popis: 'kategóriu v menu',
        prepni: (w) => {
          if (!w.menu.poradie.length) nastavRadyMenu(w, ...Object.values(radyMenu(w, r, x.db)) as [KategoriaVDb[], KategoriaVDb[]]);
          const je = w.menu.skryte.some((y) => y.slug === slug || (y.dokument && y.dokument === kat.documentId));
          w.menu.skryte = je ? w.menu.skryte.filter((y) => y.slug !== slug && y.dokument !== kat.documentId) : [...w.menu.skryte, odkaz];
          if (!je) w.menu.hlavnyRiadok = w.menu.hlavnyRiadok.filter((y) => y.slug !== slug && y.dokument !== kat.documentId);
        },
      };
      o.kategoria = slug;
      return o;
    }

    /* ── Päta ── */
    case 'pata': {
      if (c[1] === 'stlpec') {
        const i = v.pata.stlpce.findIndex((s) => s.id === c[2]);
        if (i < 0) return null;
        const s = v.pata.stlpce[i];
        const najdi = (w: Vzhlad) => w.pata.stlpce.find((y) => y.id === s.id);
        const o = zaklad('pata-stlpec', `Päta · stĺpec ${s.nadpis.sk}`);
        o.texty = [text('nadpis', 'Nadpis stĺpca', LIMITY.nadpis, (w) => najdi(w)?.nadpis, (w, t) => { const q = najdi(w); if (q && t) q.nadpis = t; }, { selektor: '.lfoot-h' })];
        o.zoznam = { rodina: 'pata-stlpce', zoznam: 'pata-stlpce', index: i, dlzka: v.pata.stlpce.length, smer: 'vodorovne' };
        o.odstranit = { popis: `stĺpec „${s.nadpis.sk}“ aj s odkazmi`, vykonaj: (w) => { w.pata.stlpce = w.pata.stlpce.filter((y) => y.id !== s.id); } };
        o.pridat = {
          popis: 'Pridať odkaz do stĺpca', vyber: 'ciel', zaZoznamom: `pata-odkazy:${s.id}`,
          vykonaj: () => { /* cieľ vyberá panel (dialóg „Pridať odkaz“), zápis robí on */ },
        };
        return o;
      }
      if (c[1] === 'odkaz') {
        const s = v.pata.stlpce.find((y) => y.id === c[2]);
        if (!s) return null;
        const viditelne = s.odkazy.map((q, i) => ({ q, i })).filter(({ q }) => !!adresaCiela(q.ciel, r, x.j));
        const p = viditelne[Number(c[3])];
        if (!p) return null;
        const i = p.i;
        const najdi = (w: Vzhlad) => w.pata.stlpce.find((y) => y.id === s.id)?.odkazy[i];
        const o = zaklad('pata-odkaz', `Päta · odkaz ${p.q.text.sk}`);
        o.texty = [text('text', 'Text odkazu', LIMITY.nazov, (w) => najdi(w)?.text, (w, t) => { const q = najdi(w); if (q && t) q.text = t; })];
        o.zoznam = { rodina: 'pata-odkazy', zoznam: `pata-odkazy:${s.id}`, index: i, dlzka: s.odkazy.length, smer: 'zvisle' };
        o.odstranit = { popis: `odkaz „${p.q.text.sk}“`, vykonaj: (w) => { const q = w.pata.stlpce.find((y) => y.id === s.id); if (q) q.odkazy.splice(i, 1); } };
        if (p.q.ciel.druh === 'clanok') o.clanok = p.q.ciel.clanok.dokument;
        if (p.q.ciel.druh === 'kategoria') o.kategoria = slugOdkazu(p.q.ciel.kategoria, r);
        return o;
      }
      if (c[1] === 'siet') {
        const i = v.pata.siete.findIndex((s) => s.druh === c[2]);
        if (i < 0) return null;
        const o = zaklad('pata-siet', `Päta · ${c[2]}`);
        o.texty = [{
          pole: 'url', nazov: 'Adresa', limit: LIMITY.url, druh: 'retazec',
          ziskaj: (w) => w.pata.siete[i]?.url ?? '',
          nastav: (w, _j, h) => { if (w.pata.siete[i] && h.trim()) w.pata.siete[i].url = h.trim(); },
        }];
        o.odstranit = { popis: `odkaz na ${c[2]}`, vykonaj: (w) => { w.pata.siete.splice(i, 1); } };
        return o;
      }
      return null;
    }

    /* ── Lišta kategórií (stránka kategórie, hlavička a päta) ── */
    case 'lista': {
      const slug = c.slice(1).join(':');
      const odkaz = odkazPodlaSlugu(slug, x);
      const o = zaklad('lista', `Lišta · ${menoKategorie(odkaz, x)}`);
      o.texty = [popisokDlazdice(odkaz, x, '.cat-mini-nazov')];
      o.obrazok = obrazokKategorie(odkaz, x);
      o.kategoria = slug;
      return o;
    }

    /* ── Stránka kategórie ── */
    case 'kategoria': {
      if (x.stranka.druh !== 'kategoria') return null;
      const slug = x.stranka.slug;
      const odkaz = odkazPodlaSlugu(slug, x);
      const kat = x.db.find((k) => k.slug === slug);
      const zaz = v.kategorie[indexZaznamu(v, odkaz, r)];
      const meno = zaz?.nazov?.sk || kat?.name || slug;
      if (c[1] === 'obrazok') {
        const o = zaklad('obrazok', `Kategória ${meno} · obrázok`);
        o.obrazok = obrazokKategorie(odkaz, x, 'Obrázok kategórie (hlavička, dlaždica, lišta)');
        return o;
      }
      if (c[1] === 'nazov') {
        const o = zaklad('text', `Kategória ${meno} · názov`);
        o.texty = [text('nazov', 'Názov kategórie', LIMITY.nazov, (w) => w.kategorie[indexZaznamu(w, odkaz, r)]?.nazov,
          (w, t) => { zaznamKategorie(w, odkaz, r, x.db).nazov = t; }, { zaloha: kat?.name ?? slug, premenovanie: true })];
        return o;
      }
      if (c[1] === 'popis') {
        const o = zaklad('text', `Kategória ${meno} · popis`);
        o.texty = [text('popis', 'Popis na stránke kategórie', LIMITY.popis, (w) => w.kategorie[indexZaznamu(w, odkaz, r)]?.popis,
          (w, t) => { zaznamKategorie(w, odkaz, r, x.db).popis = t; })];
        return o;
      }
      if (c[1] === 'clanok') {
        const dok = dokumentPrvku(x);
        const o = zaklad('kategoria-clanok', `Článok · ${dok ? menoClanku({ dokument: dok, slug: '' }, x) || '' : ''}`);
        o.clanok = dok;
        if (dok) {
          const pripnute = zaz?.clanky.pripnute ?? [];
          const i = pripnute.findIndex((y) => y.dokument === dok);
          if (i >= 0) {
            o.zoznam = { rodina: `kategoria-pripnute:${slug}`, zoznam: `kategoria-pripnute:${slug}`, index: i, dlzka: pripnute.length, smer: 'vodorovne' };
            o.odstranit = { popis: 'článok z pripnutých (ostane v zozname podľa zoradenia)', vykonaj: (w) => { const z2 = zaznamKategorie(w, odkaz, r, x.db); z2.clanky.pripnute = z2.clanky.pripnute.filter((y) => y.dokument !== dok); } };
          } else {
            o.pripnut = {
              popis: 'Pripnúť na začiatok zoznamu', dokument: dok,
              vykonaj: (w, slugCl) => { const z2 = zaznamKategorie(w, odkaz, r, x.db); if (!z2.clanky.pripnute.some((y) => y.dokument === dok) && z2.clanky.pripnute.length < LIMITY.pripnutych) z2.clanky.pripnute.push({ dokument: dok, slug: slugCl }); },
            };
          }
        }
        return o;
      }
      return null;
    }

    default:
      return null;
  }
}

function noveIdSkupiny(v: Vzhlad): string {
  const uz = new Set(v.domov.dlazdice.skupiny.map((s) => s.id));
  for (let i = 1; i < 100; i++) if (!uz.has(`skupina-${i}`)) return `skupina-${i}`;
  return `skupina-${Date.now().toString(36)}`;
}

/* ───────────────────────── Presuny ───────────────────────── */

/**
 * Presun prvku zo zoznamu `z` (index `zi`) do zoznamu `na` na miesto `ni`.
 * `ni` je miesto vloženia PRED vybratím (0 … dĺžka), ako ho ukazuje čiara.
 */
export function presunPrvku(v: Vzhlad, rodina: string, z: string, zi: number, na: string, ni: number, x: Pick<KontextPrvku, 'r' | 'db'>): void {
  const vRamci = (pole: unknown[]) => { let cil = ni; if (cil > zi) cil -= 1; presunVPoli(pole, zi, cil); };
  if (rodina === 'dlazdice') {
    const zs = v.domov.dlazdice.skupiny.find((s) => `dlazdice:${s.id}` === z);
    const ns = v.domov.dlazdice.skupiny.find((s) => `dlazdice:${s.id}` === na);
    if (!zs || !ns) return;
    if (zs === ns) { vRamci(zs.polozky); return; }
    const [p] = zs.polozky.splice(zi, 1);
    if (p) ns.polozky.splice(Math.max(0, Math.min(ns.polozky.length, ni)), 0, p);
    return;
  }
  if (rodina === 'menu') {
    const rady = radyMenu(v, x.r, x.db);
    const zr = z === 'menu:hlavny' ? rady.hlavny : rady.dalsi;
    const nr = na === 'menu:hlavny' ? rady.hlavny : rady.dalsi;
    if (zr === nr) { vRamci(zr); }
    else {
      const [p] = zr.splice(zi, 1);
      if (p) nr.splice(Math.max(0, Math.min(nr.length, ni)), 0, p);
      if (p && na === 'menu:hlavny') v.menu.skryte = v.menu.skryte.filter((y) => y.dokument !== p.documentId && y.slug !== p.slug);
    }
    nastavRadyMenu(v, rady.hlavny, rady.dalsi);
    return;
  }
  if (rodina === 'pata-odkazy') {
    const zs = v.pata.stlpce.find((s) => `pata-odkazy:${s.id}` === z);
    const ns = v.pata.stlpce.find((s) => `pata-odkazy:${s.id}` === na);
    if (!zs || !ns) return;
    if (zs === ns) { vRamci(zs.odkazy); return; }
    const [p] = zs.odkazy.splice(zi, 1);
    if (p) ns.odkazy.splice(Math.max(0, Math.min(ns.odkazy.length, ni)), 0, p);
    return;
  }
  if (z !== na) return;
  const pole = zoznamPola(v, z, x);
  if (pole) vRamci(pole);
}

/** Pole vzhľadu, ktoré zodpovedá zoznamu (pre presuny v rámci jedného zoznamu). */
function zoznamPola(v: Vzhlad, zoznam: string, x: Pick<KontextPrvku, 'r' | 'db'>): unknown[] | null {
  const c = zoznam.split(':');
  switch (c[0]) {
    case 'skupiny': return v.domov.dlazdice.skupiny;
    case 'sekcie': return v.domov.sekcie;
    case 'riadky': { const s = v.domov.sekcie.find((q) => q.id === c[1]); return s && s.typ === 'dalsi-obsah' ? s.riadky : null; }
    case 'riadok-clanky': return riadok(v, c[1], c[2])?.clanky ?? null;
    case 'cinnost': return v.cinnost.polozky;
    case 'popularne': return v.domov.hladanie.popularne;
    case 'kronika-pripnute': return sekciaPodlaTypu(v, 'kronika')?.pripnute ?? null;
    case 'fotogaleria': return v.domov.fotogaleria?.fotky ?? null;
    case 'pata-stlpce': return v.pata.stlpce;
    case 'prosby': return v.domov.pridajteSa.prosby;
    case 'kategoria-pripnute': {
      const slug = c.slice(1).join(':');
      const d = x.db.find((k) => k.slug === slug);
      const i = v.kategorie.findIndex((k) => (d && k.kategoria.dokument ? k.kategoria.dokument === d.documentId : slugOdkazu(k.kategoria, x.r) === slug));
      return i >= 0 ? v.kategorie[i].clanky.pripnute : null;
    }
    default: return null;
  }
}

/** Názov prvku, ktorý nesie zoznam (pre pustenie do prázdneho zoznamu a „+"). */
export function obalZoznamu(zoznam: string): string | null {
  const c = zoznam.split(':');
  switch (c[0]) {
    case 'dlazdice': return `skupina:${c[1]}`;
    case 'menu': return zoznam;
    case 'pata-odkazy': return `pata:stlpec:${c[1]}`;
    case 'riadky': return `sekcia:${c[1]}`;
    case 'riadok-clanky': return `riadok:${c[1]}:${c[2]}`;
    case 'popularne': return 'popularne';
    case 'fotogaleria': return 'kronika:fotogaleria';
    default: return null;
  }
}
