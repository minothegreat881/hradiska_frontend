'use client';

import { useState } from 'react';
import { narodneProstredie, kategoria, odkaz, poAnglicky } from '../lib/jazyk';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { Article } from '../data/mock-data';
import { hradiskaCategories, variant } from '../data/categories';
import { zakladStrapi } from '../data/rozcestnik';

interface ArticleCardProps {
  article: Article;
  /**
   * Štítok s kategóriou cez fotografiu. Nikde na webe sa dnes nezapína:
   * na stránke kategórie aj v aktualitách sú všetky karty z tej istej
   * kategórie a v „Mohlo by vás zaujímať" pod článkom štítok len prekrýval
   * obraz. Prepínač ostáva pre prípad, že sa karty raz začnú miešať.
   */
  stitok?: boolean;
  /**
   * Skúška pre kategóriu „Strážna a hospodárska funkcia": karta dostane do
   * pravého horného rohu prekrížené kopije a pod kurzorom sa priblíži
   * výraznejšie než inde — aj obraz, aj znak. Zapína to stránka kategórie,
   * nie samotný článok: rovnaký článok v „Mohlo by vás zaujímať" ostáva
   * obyčajný.
   */
  znak?: boolean;
}

// Fallback labely, ak Strapi nedodá display name kategórie (article.categoryName).
const CATEGORY_LABELS: Record<string, string> = {
  hradiska: 'Hradiská',   // názvy idú cez `t()` pri vykreslení
  kultura: 'Kultúra',
  archeologia: 'Archeológia',
  pramene: 'Pramene',
  pravek: 'Pravek',
  vyskum: 'Výskum',
  historia: 'História',
  metodika: 'Metodika',
  aktuality: 'Aktuality',
};

/* Deväť akvarelových kresieb kategórií — tie isté, čo stoja v dlaždiciach
   pod titulkom domovskej. Nasadnú vtedy, keď k zápisu nemáme fotku alebo sa
   uložená fotka nenačíta. Minca v prázdnom ráme vyzerala ako chyba načítania
   a kresba povie to isté — „obraz k tomuto zápisu nemáme" — len tak, že je na
   ňu pekný pohľad. */
const KRESLENE = [
  'kniezacie-sidla', 'mocenske-centra', 'strazna-funkcia', 'refugia', 'staroveke-sidla',
  'listiny-a-pisomne-zdroje', 'povesti', 'svatyne-a-sakralne-objekty', 'vseobecne-o-hradiskach',
];
const MALBY = KRESLENE
  .map((slug) => hradiskaCategories.find((c) => c.slug === slug)?.image)
  .filter((cesta): cesta is string => !!cesta);

/* Výber nie je náhodný pri každom vykreslení — to by obraz preskakoval pri
   každom prekreslení zoznamu. Je to odtlačok slugu, takže ten istý zápis má
   vždy tú istú kresbu. Keď má článok kreslenú kategóriu, vyhráva tá: je to
   pravdivejšie než náhodný výber. */
function malbaPre(article: Article): string {
  const vlastna = KRESLENE.includes(article.category)
    ? hradiskaCategories.find((c) => c.slug === article.category)?.image
    : undefined;
  if (vlastna) return vlastna;
  const kluc = article.slug || article.title || '';
  /* FNV-1a, nie „h * 31 + znak": výzvy na 2 % majú slugy s rovnakým
     začiatkom (`2-pre-hradiska`, `2-pre-hradiska-v-roku-2025`) a jednoduchý
     súčet im dal tú istú kresbu — v zozname témy potom stáli dve rovnaké
     karty nad sebou. Odtlačok sa tým nemení z vykreslenia na vykreslenie,
     len sa rozloží rovnomernejšie. */
  let h = 0x811c9dc5;
  for (let i = 0; i < kluc.length; i++) {
    h ^= kluc.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return MALBY[h % MALBY.length];
}

function prettifySlug(slug: string): string {
  const s = slug.replace(/-/g, ' ').trim();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

export function ArticleCard({ article, stitok = true, znak = false }: ArticleCardProps) {
  /* Uložená fotka môže byť mŕtva adresa (v zozname aktualít ich pár je).
     Vtedy ostával v karte rozbitý obrázok — po zlyhaní nasadne kresba. */
  const [fotkaZlyhala, setFotkaZlyhala] = useState(false);
  const maFotku = !!article.coverImage && !fotkaZlyhala;
  const malba = malbaPre(article);
  const zaklad = zakladStrapi();
  /* Meno kategórie príde zo Strapi po slovensky (kategórie preklad nemajú),
     preto ide ešte cez prekladovú vrstvu. */
  const categoryLabel = kategoria(
    (article as any).categoryName ||
      CATEGORY_LABELS[article.category] ||
      prettifySlug(article.category),
  );

  const dateLabel = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString(narodneProstredie(), {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '';

  return (
    <a
      href={odkaz(`/blog/${article.slug}`)}
      className={znak ? 'acard acard--znak' : 'acard'}
      aria-label={stitok && categoryLabel ? `${article.title} — ${categoryLabel}` : article.title}
    >
      {/* Obraz v zaoblenom ráme. Text naň nelezie, takže nepotrebuje závoj
          a fotka ostáva celá — to bol dôvod prestavby. */}
      <span className="acard-ram">
        {maFotku ? (
          <img
            className="acard-obraz"
            src={article.coverImage}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setFotkaZlyhala(true)}
          />
        ) : (
          <img
            className="acard-obraz acard-malba"
            src={`${zaklad}${variant(malba, 'small')}`}
            srcSet={`${zaklad}${variant(malba, 'small')} 500w, ${zaklad}${variant(malba, 'medium')} 750w`}
            sizes="(max-width: 720px) 92vw, 380px"
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
          />
        )}

        {stitok && categoryLabel && <span className="acard-stitok">{categoryLabel}</span>}

        {znak && (
          <span className="acard-znak" aria-hidden="true">
            <picture>
              <source srcSet="/znak_kopije.webp" type="image/webp" />
              <img src="/znak_kopije.png" alt="" width={320} height={183} loading="lazy" decoding="async" />
            </picture>
          </span>
        )}
      </span>

      <span className="acard-telo">
        <h3 className="acard-titul" data-title>{article.title}</h3>

        {article.excerpt && <p className="acard-perex">{article.excerpt}</p>}

        <span className="acard-meta">
          <span className="acard-meta-skupina">
            <span className="acard-meta-polozka">
              <Calendar style={{ width: 12, height: 12, opacity: 0.85 }} />
              {dateLabel}
            </span>
            <span aria-hidden="true" className="acard-bodka" />
            <span className="acard-meta-polozka">
              <Clock style={{ width: 12, height: 12, opacity: 0.85 }} />
              {article.readTime} min
            </span>
          </span>

          <ArrowRight data-arrow aria-hidden="true" style={{ width: 16, height: 16, flexShrink: 0 }} />
        </span>
      </span>
    </a>
  );
}
