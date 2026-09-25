'use client';

/**
 * ROZCESTNÍK KATEGÓRIÍ pod titulkom domovskej stránky.
 *
 * Deväť kresieb v dvoch radoch (5 + 4) s názvom pod obrázkom — nič viac.
 * Žiadna karta, rámik ani popis: je to rozcestník, po ktorom sa preklikáva,
 * nie čítanie. Podrobná sekcia „Kategórie hradísk" nižšie na stránke ostáva.
 *
 * Názvy sú tu SKRÁTENÉ („Hospodárska", „Legendy", „Svätyne"), aby sa vošli
 * pod obrázok a rad zostal čitateľný. Skutočné názvy kategórií v Strapi ani
 * inde na webe sa tým nemenia — mení sa len popiska v tomto rozcestníku.
 *
 * Obrázky sa berú z toho istého zoznamu ako veľké dlaždice
 * (`src/data/categories.ts`), takže keď pribudne nová kresba, netreba
 * meniť dve miesta. Ťahá sa zmenšenina `small_` (500 px) — obrázok má
 * na obrazovke ~230 px.
 */

import { motion } from 'motion/react';
import { hradiskaCategories, variant } from '../data/categories';

/** Poradie a skrátené názvy podľa predlohy. */
const VYBER: { slug: string; label: string }[] = [
  { slug: 'kniezacie-sidla', label: 'Kniežacie sídla' },
  { slug: 'mocenske-centra', label: 'Mocenské centrá' },
  { slug: 'strazna-funkcia', label: 'Hospodárska' },
  { slug: 'refugia', label: 'Refúgiá' },
  { slug: 'staroveke-sidla', label: 'Staroveké hradiská' },
  { slug: 'listiny-a-pisomne-zdroje', label: 'Listiny a pís. zdroje' },
  { slug: 'vseobecne-o-hradiskach', label: 'Všeobecne o hradiskách' },
  { slug: 'povesti', label: 'Legendy' },
  { slug: 'svatyne-a-sakralne-objekty', label: 'Svätyne' },
];

export function LabKategorieRychle() {
  const base = import.meta.env.PROD
    ? (typeof window !== 'undefined' ? window.location.origin + '/strapi' : '/strapi')
    : import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337';

  const polozky = VYBER
    .map(({ slug, label }) => {
      const k = hradiskaCategories.find((c) => c.slug === slug);
      return k ? { slug, label, image: k.image, popis: k.label } : null;
    })
    .filter(Boolean) as { slug: string; label: string; image: string; popis: string }[];

  return (
    <nav className="lkat" aria-label="Kategórie hradísk">
      <ul className="lkat-rad">
        {polozky.map((p, i) => (
          <li key={p.slug}>
            <motion.a
              className="lkat-polozka"
              href={`/category/${p.slug}`}
              title={p.popis}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: Math.min(i, 5) * 0.04 }}
            >
              <span className="lkat-ram">
                <img
                  className="lkat-obraz"
                  src={`${base}${variant(p.image, 'small')}`}
                  srcSet={`${base}${variant(p.image, 'small')} 500w, ${base}${variant(p.image, 'medium')} 750w`}
                  sizes="(max-width: 640px) 45vw, 230px"
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
              </span>
              <span className="lkat-nazov">{p.label}</span>
            </motion.a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default LabKategorieRychle;
