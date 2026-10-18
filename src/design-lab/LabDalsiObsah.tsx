'use client';

/**
 * SEKCIA „ĎALŠÍ OBSAH" — kategórie, ktoré nie sú medzi dlaždicami.
 *
 * Podľa handoffu „Homepage – sekcia Ďalší obsah" (09/2026): pod sebou
 * kategórie, každá ako hlavička (názov, počet, „Zobraziť všetky") a pod ňou
 * rad ŠTYROCH najnovších článkov. Nikdy 2 × 2 — štyri vedľa seba ostávajú
 * na tablete aj na počítači, pod 600 px ide jeden pod druhý.
 *
 * Ktoré kategórie a v akom poradí, je vo vzhľade webu (sekcia `dalsi-obsah`,
 * `riadky`). Dnes (základný vzhľad) tri: tabule, odborné texty, 3D modely.
 * Dve kategórie sa sem zámerne nedávajú:
 *   • `ostatne` má nula publikovaných článkov — prázdny rad by nepovedal nič;
 *   • `aktuality` sú hneď pod touto sekciou ako „Zo života združenia",
 *     takže by sa tie isté štyri príspevky ukázali dvakrát za sebou.
 *
 * Riadok má dva režimy:
 *   • `najnovsie` — články z kategórie podľa `zoradenie`, s obrázkom napred
 *     (`lenSObrazkom`); jeden dotaz vráti aj výber aj celkový počet
 *     (`meta.pagination.total`),
 *   • `rucne` — články v zadanom poradí; chýbajúce (zmazané, v jazyku stránky
 *     nie sú) doplnia najnovšie.
 * Obrázok sa dá vymeniť len na dlaždici (`obrazky`), obrázok článku sa nemení.
 *
 * Z predlohy sa nepreberá písmo (DM Serif Display + Manrope z Google Fonts):
 * fonty webu sú self-hostované kvôli GDPR, šat stojí na Fraunces + Inter.
 */

import { useEffect, useState } from 'react';
import { jazyk, odkaz, t } from '../lib/jazyk';
import { getBlogPosts, getStrapiImageUrl, type StrapiBlogPost } from '../lib/strapi';
import { useVzhlad } from '../lib/vzhlad/VzhladContext';
import { clanokVJazyku, nazovKategorie, sekcia as najdiSekciu, slugKategorie } from '../lib/vzhlad/citaj';
import { textVzhladu } from '../lib/vzhlad/texty';
import { adresaObrazka } from '../lib/vzhlad/obrazky';
import { vw, vwSkryte } from '../lib/vzhlad/upravy';
import type { OdkazClanku, SekciaDomov, ZoradenieClankov } from '../lib/vzhlad/typy';

type SekciaDalsiObsah = Extract<SekciaDomov, { typ: 'dalsi-obsah' }>;

/** Zoradenie vzhľadu → `sort` pre Strapi. Predvolené je dnešné správanie. */
const RADENIE: Record<ZoradenieClankov, string> = {
  zverejnenie: 'publishedAt:desc',
  'povodny-datum': 'originalPublishedDate:desc',
  abecedne: 'title:asc',
};

interface Clanok {
  slug: string;
  documentId: string;
  title: string;
  obrazok: string | null;
}

interface Skupina {
  id: string;
  slug: string;
  pocet: number;
  clanky: Clanok[];
}

/** Zodpovedá článok odkazu vzhľadu? Podľa `documentId`, inak podľa slugu. */
const jeTo = (o: OdkazClanku, c: { slug: string; documentId: string }) =>
  o.dokument ? o.dokument === c.documentId : o.slug === c.slug;

const naClanok = (p: StrapiBlogPost): Clanok => ({
  slug: p.slug,
  documentId: p.documentId,
  title: p.title,
  obrazok: p.coverImage ? getStrapiImageUrl(p.coverImage, 'small') : null,
});

function Karta({ c, znacka }: { c: Clanok; znacka?: string }) {
  /* `data-vw-dokument` (len v režime úprav, so značkou) — editor podľa neho
     pozná článok aj vtedy, keď ho riadok doplnil sám („Upraviť článok",
     iný obrázok na dlaždici). */
  return (
    <a className="dob-clanok" href={odkaz(`/blog/${c.slug}`)} data-vw={znacka} data-vw-dokument={znacka ? c.documentId : undefined}>
      <span className="dob-ram">
        {c.obrazok && (
          <img className="dob-obraz" src={c.obrazok} alt="" loading="lazy" decoding="async" />
        )}
      </span>
      <span className="dob-nazov">{c.title}</span>
    </a>
  );
}

export function LabDalsiObsah({ sekcia: zadana }: { sekcia?: SekciaDalsiObsah }) {
  const { vzhlad, rozriesene, upravy } = useVzhlad();
  const sekcia = zadana ?? najdiSekciu(vzhlad, 'dalsi-obsah');
  const [skupiny, setSkupiny] = useState<Skupina[]>([]);
  const j = jazyk();

  /* Čo treba stiahnuť. Kľúč nesie len to, čo mení výsledok dotazu — nadpisy
     a vymenené obrázky sa uplatnia pri vykreslení bez nového sťahovania. */
  const plan = (sekcia?.riadky ?? []).map((r) => {
    const slug = slugKategorie(r.kategoria, rozriesene);
    const rucne = r.vyber === 'rucne'
      ? r.clanky.map((c) => clanokVJazyku(c, rozriesene, j)).filter((c): c is NonNullable<typeof c> => !!c)
      : [];
    return { id: r.id, slug, pocet: r.pocet, vyber: r.vyber, zoradenie: r.zoradenie, lenSObrazkom: r.lenSObrazkom, rucne };
  }).filter((r): r is typeof r & { slug: string } => !!r.slug);
  const klucPlanu = JSON.stringify([j, plan]);

  useEffect(() => {
    let zrusene = false;
    const riadky: typeof plan = JSON.parse(klucPlanu)[1];

    Promise.all(
      riadky.map(async (r): Promise<Skupina | null> => {
        try {
          // Ťahá sa trikrát toľko, koľko sa ukazuje (dnes dvanásť na štyri).
          // Do ukážky idú len články S OBRÁZKOM — prázdny rám je núdzové
          // riešenie, nie výkladná skriňa. Dvanásť stačí: aj v najhoršej
          // kategórii sú medzi nimi štyri ilustrované (namerané). Počet
          // v kapsule ostáva CELKOVÝ počet článkov kategórie.
          const { posts, pagination } = await getBlogPosts({
            categorySlug: r.slug,
            pageSize: Math.max(12, r.pocet * 3),
            sort: RADENIE[r.zoradenie],
          });
          let vyber: StrapiBlogPost[];
          if (r.vyber === 'rucne') {
            const dokumenty = r.rucne.filter((c) => c.dokument).map((c) => c.dokument as string);
            const vybrane = dokumenty.length
              ? (await getBlogPosts({ documentIds: dokumenty, pageSize: dokumenty.length })).posts
              : [];
            const zoznam = [...vybrane, ...posts];
            const ruc = r.rucne
              .map((c) => zoznam.find((p) => (c.dokument ? p.documentId === c.dokument : p.slug === c.slug)))
              .filter((p): p is StrapiBlogPost => !!p);
            const uz = new Set(ruc.map((p) => p.documentId));
            /* Chýbajúce doplnia najnovšie (s obrázkom napred, ako pri `najnovsie`). */
            const doplnok = posts.filter((p) => !uz.has(p.documentId));
            const sObrazkom = doplnok.filter((p) => p.coverImage);
            vyber = [...ruc, ...(sObrazkom.length ? sObrazkom : doplnok)].slice(0, r.pocet);
          } else {
            const sObrazkom = r.lenSObrazkom ? posts.filter((p) => p.coverImage) : posts;
            vyber = (sObrazkom.length ? sObrazkom : posts).slice(0, r.pocet);
          }
          if (!vyber.length) return null;
          return {
            id: r.id,
            slug: r.slug,
            pocet: pagination?.total ?? posts.length,
            clanky: vyber.map(naClanok),
          };
        } catch {
          // Jedna kategória zlyhala — zvyšok sekcie sa zobrazí bez nej.
          return null;
        }
      })
    ).then((v) => {
      if (!zrusene) setSkupiny(v.filter(Boolean) as Skupina[]);
    });

    return () => { zrusene = true; };
  }, [klucPlanu]);

  if (!sekcia) return null;
  if (!sekcia.viditelna && !upravy) return null;
  // Kým dáta nedorazia, sekcia sa nevykreslí — prázdne rámy by iba poskakovali.
  // Na plátne editora ostane aspoň nadpis, aby sa sekcia dala vybrať.
  if (!skupiny.length && !upravy) return null;

  const idNadpisu = sekcia.id === 'dalsi-obsah' ? 'dob-nadpis' : `dob-nadpis-${sekcia.id}`;

  return (
    <section className="dob" aria-labelledby={idNadpisu} data-vw={vw(upravy, `sekcia:${sekcia.id}`)} data-vw-skryte={vwSkryte(upravy, !sekcia.viditelna)}>
      <div className="dob-predel" id={idNadpisu} data-vw={vw(upravy, `dalsi-obsah:nadpis:${sekcia.id}`)}>
        <span aria-hidden="true" />
        {textVzhladu(sekcia.nadpis)}
        <span aria-hidden="true" />
      </div>

      <div className="dob-zoznam">
        {skupiny.map((s, i) => {
          const riadok = sekcia.riadky.find((r) => r.id === s.id);
          const nadpis = riadok?.nadpis ? textVzhladu(riadok.nadpis) : nazovKategorie(vzhlad, rozriesene, s.slug);
          return (
            <div
              className="dob-kategoria"
              key={s.id}
              style={{ ['--dob-poradie' as string]: String(i) }}
              data-vw={vw(upravy, `riadok:${sekcia.id}:${s.id}`)}
            >
              <div className="dob-hlavicka">
                <h2 className="dob-titul" data-vw={vw(upravy, `riadok-nadpis:${sekcia.id}:${s.id}`)}>
                  {nadpis}
                  <span className="dob-pocet">{s.pocet}</span>
                </h2>
                <a className="dob-vsetky" href={odkaz(`/category/${s.slug}`)}>
                  {t('Zobraziť všetky')} <span aria-hidden="true">→</span>
                </a>
              </div>

              <div className="dob-mriezka">
                {s.clanky.map((c, k) => {
                  /* Vymenený obrázok len na tejto dlaždici. */
                  const iny = riadok?.obrazky.find((o) => jeTo(o.clanok, c));
                  const obrazok = (iny && adresaObrazka(iny.obrazok, 'small', rozriesene)) || c.obrazok;
                  return (
                    <Karta
                      key={c.slug}
                      c={obrazok === c.obrazok ? c : { ...c, obrazok }}
                      znacka={vw(upravy, `riadok-clanok:${sekcia.id}:${s.id}:${k}`)}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default LabDalsiObsah;
