'use client';

/**
 * SEKCIA „ĎALŠÍ OBSAH" — kategórie, ktoré nie sú medzi dlaždicami.
 *
 * Podľa handoffu „Homepage – sekcia Ďalší obsah" (09/2026): pod sebou
 * kategórie, každá ako hlavička (názov, počet, „Zobraziť všetky") a pod ňou
 * rad ŠTYROCH najnovších článkov. Nikdy 2 × 2 — štyri vedľa seba ostávajú
 * na tablete aj na počítači, pod 600 px ide jeden pod druhý.
 *
 * Ktoré kategórie: všetko, čo nemá dlaždicu nad mapou. Dve výnimky:
 *   • `ostatne` má nula publikovaných článkov — prázdny rad by nepovedal nič;
 *   • `aktuality` sú hneď pod touto sekciou ako „Zo života združenia",
 *     takže by sa tie isté štyri príspevky ukázali dvakrát za sebou.
 *
 * Poradie aj obsah sa berú zo Strapi. Handoff mal názvy článkov ukážkové,
 * tu sú skutočné a najnovšie — jeden dotaz na kategóriu vráti aj výber aj
 * celkový počet (`meta.pagination.total`). Do ukážky idú len články
 * s obrázkom; prázdny rám je núdzové riešenie pre kategóriu, kde iné nie sú.
 *
 * Z predlohy sa nepreberá písmo (DM Serif Display + Manrope z Google Fonts):
 * fonty webu sú self-hostované kvôli GDPR, šat stojí na Fraunces + Inter.
 */

import { useEffect, useState } from 'react';
import { getBlogPosts, getStrapiImageUrl } from '../lib/strapi';

/** Poradie podľa handoffu. */
const KATEGORIE: { slug: string; label: string }[] = [
  { slug: 'informacne-tabule', label: 'Informačné tabule' },
  { slug: 'odborne-texty', label: 'Odborné texty' },
  { slug: '3d-modely', label: '3D modely' },
];

interface Clanok {
  slug: string;
  title: string;
  obrazok: string | null;
}

interface Skupina {
  slug: string;
  label: string;
  pocet: number;
  clanky: Clanok[];
}

function Karta({ c }: { c: Clanok }) {
  return (
    <a className="dob-clanok" href={`/blog/${c.slug}`}>
      <span className="dob-ram">
        {c.obrazok && (
          <img className="dob-obraz" src={c.obrazok} alt="" loading="lazy" decoding="async" />
        )}
      </span>
      <span className="dob-nazov">{c.title}</span>
    </a>
  );
}

export function LabDalsiObsah() {
  const [skupiny, setSkupiny] = useState<Skupina[]>([]);

  useEffect(() => {
    let zrusene = false;

    Promise.all(
      KATEGORIE.map(async ({ slug, label }): Promise<Skupina | null> => {
        try {
          // Ťahá sa dvanásť, ukazujú sa štyri. Do ukážky idú len články
          // S OBRÁZKOM — prázdny rám je núdzové riešenie, nie výkladná skriňa.
          // Dvanásť stačí: aj v najhoršej kategórii sú medzi nimi štyri
          // ilustrované (namerané). Počet v kapsule ostáva CELKOVÝ počet
          // článkov kategórie, nie počet tých s obrázkom.
          const { posts, pagination } = await getBlogPosts({ categorySlug: slug, pageSize: 12 });
          const sObrazkom = posts.filter((p) => p.coverImage);
          const vyber = (sObrazkom.length ? sObrazkom : posts).slice(0, 4);
          if (!vyber.length) return null;
          return {
            slug,
            label,
            pocet: pagination?.total ?? posts.length,
            clanky: vyber.map((p) => ({
              slug: p.slug,
              title: p.title,
              obrazok: p.coverImage ? getStrapiImageUrl(p.coverImage, 'small') : null,
            })),
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
  }, []);

  // Kým dáta nedorazia, sekcia sa nevykreslí — prázdne rámy by iba poskakovali.
  if (!skupiny.length) return null;

  return (
    <section className="dob" aria-labelledby="dob-nadpis">
      <div className="dob-predel" id="dob-nadpis">
        <span aria-hidden="true" />
        Ďalší obsah
        <span aria-hidden="true" />
      </div>

      <div className="dob-zoznam">
        {skupiny.map((s, i) => (
          <div className="dob-kategoria" key={s.slug} style={{ ['--dob-poradie' as string]: String(i) }}>
            <div className="dob-hlavicka">
              <h2 className="dob-titul">
                {s.label}
                <span className="dob-pocet">{s.pocet}</span>
              </h2>
              <a className="dob-vsetky" href={`/category/${s.slug}`}>
                Zobraziť všetky <span aria-hidden="true">→</span>
              </a>
            </div>

            <div className="dob-mriezka">
              {s.clanky.map((c) => (
                <Karta key={c.slug} c={c} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default LabDalsiObsah;
