'use client';

/**
 * KATEGÓRIE HRADÍSK. Nahradili pôvodné `CategoryCard.tsx` aj sekciu
 * v zmazanej `HomePage.tsx`.
 *
 * TEXT JE PREVZATÝ DOSLOVA — nadpis, úvodná veta aj všetkých deväť popisov.
 *
 * ČO BOLO ZLE NA PÔVODNEJ:
 *   • deväť úplne rovnakých dlaždíc v mriežke 3 × 3 — oko nemalo kde začať
 *     a sekcia pôsobila ako výpis, nie ako rozcestník,
 *   • popis bol orezaný na tri riadky (`line-clamp`), takže skoro každá
 *     kategória končila v polovici vety,
 *   • karty mali natvrdo zapísané Georgiu, hoci celý zvyšok šatu nesie
 *     Inter s Fraunces na nadpisy — dlaždice vyzerali ako cudzí prvok,
 *   • nadpis sekcie bol vycentrovaný so zlatou ozdôbkou pod ním.
 *
 * ČO ROBÍ NOVÁ:
 *   Prvá kategória je vstupná brána — veľká fotografia cez dva stĺpce a dva
 *   riadky, s textom priamo na nej. Zvyšných osem sú tiché biele dlaždice.
 *   Tým vznikne poradie čítania, ktoré deväť rovnakých kariet nikdy nemalo.
 *   Popisy sa už neorezávajú: dlaždice si držia rovnakú výšku mriežkou, nie
 *   sekaním viet.
 */

import { motion } from 'motion/react';
import { hradiskaCategories, variant } from '../data/categories';

const Arrow = () => (
  <svg
    className="lcat-arrow"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export function LabCategories() {
  // Ten istý výpočet ako v `HomePage` — vo vývoji ide prehliadač priamo na
  // 1337, v produkcii cez proxy `/strapi/*`.
  const base = import.meta.env.PROD
    ? typeof window !== 'undefined'
      ? window.location.origin + '/strapi'
      : '/strapi'
    : import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337';

  const [lead, ...rest] = hradiskaCategories;

  return (
    <section className="lcat">
      <div className="lcat-wrap">
        {/* ── Hlavička: názov vľavo, veta vpravo, pod tým vlások ────────── */}
        <div className="lcat-head">
          <h2 className="lcat-title">Kategórie hradísk</h2>
          <p className="lcat-intro">
            Hradiská triedime podľa toho, čomu slúžili — od kniežacích sídel cez
            strážne body až po písomné pramene, z ktorých o nich vieme
          </p>
        </div>
        <div className="lcat-rule" aria-hidden="true" />

        <div className="lcat-grid">
          {/* ── Vstupná brána ──────────────────────────────────────────── */}
          <motion.a
            className="lcat-lead"
            href={`/category/${lead.slug}`}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <img
              className="lcat-img"
              src={`${base}${variant(lead.image, 'large')}`}
              srcSet={
                `${base}${variant(lead.image, 'medium')} 750w, ` +
                `${base}${variant(lead.image, 'large')} 1000w`
              }
              sizes="(max-width: 900px) 92vw, 62vw"
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
            />
            <div className="lcat-veil" aria-hidden="true" />
            <div className="lcat-lead-body">
              <h3 className="lcat-lead-name">{lead.label}</h3>
              <p className="lcat-lead-desc">{lead.description}</p>
              <span className="lcat-go lcat-go-on-photo">
                Preskúmať <Arrow />
              </span>
            </div>
          </motion.a>

          {/* ── Ostatné ────────────────────────────────────────────────── */}
          {rest.map((c, i) => (
            <motion.a
              className="lcat-tile"
              key={c.slug}
              href={`/category/${c.slug}`}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: Math.min(i, 5) * 0.05 }}
            >
              <div className="lcat-photo">
                <img
                  className="lcat-img"
                  src={`${base}${variant(c.image, 'medium')}`}
                  srcSet={
                    `${base}${variant(c.image, 'small')} 500w, ` +
                    `${base}${variant(c.image, 'medium')} 750w`
                  }
                  sizes="(max-width: 640px) 92vw, (max-width: 1100px) 46vw, 380px"
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="lcat-body">
                <h3 className="lcat-name">{c.label}</h3>
                <p className="lcat-desc">{c.description}</p>
                <span className="lcat-go">
                  Preskúmať <Arrow />
                </span>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}

export default LabCategories;
