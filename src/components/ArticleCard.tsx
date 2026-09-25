'use client';

import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { Article } from '../data/mock-data';

interface ArticleCardProps {
  article: Article;
  /**
   * Štítok s kategóriou. Na stránke kategórie a v aktualitách ho netreba —
   * všetky karty sú z tej istej kategórie a štítok by len opakoval nadpis
   * stránky. Zmysel má tam, kde sa miešajú (napr. „Mohlo by vás zaujímať").
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
  hradiska: 'Hradiská',
  kultura: 'Kultúra',
  archeologia: 'Archeológia',
  pramene: 'Pramene',
  pravek: 'Pravek',
  vyskum: 'Výskum',
  historia: 'História',
  metodika: 'Metodika',
  aktuality: 'Aktuality',
};

function prettifySlug(slug: string): string {
  const s = slug.replace(/-/g, ' ').trim();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

export function ArticleCard({ article, stitok = true, znak = false }: ArticleCardProps) {
  const categoryLabel =
    (article as any).categoryName ||
    CATEGORY_LABELS[article.category] ||
    prettifySlug(article.category);

  const dateLabel = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString('sk-SK', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '';

  return (
    <a
      href={`/blog/${article.slug}`}
      className={znak ? 'acard acard--znak' : 'acard'}
      aria-label={stitok && categoryLabel ? `${article.title} — ${categoryLabel}` : article.title}
    >
      {/* Obraz v zaoblenom ráme. Text naň nelezie, takže nepotrebuje závoj
          a fotka ostáva celá — to bol dôvod prestavby. */}
      <span className="acard-ram">
        {article.coverImage ? (
          <img className="acard-obraz" src={article.coverImage} alt="" loading="lazy" decoding="async" />
        ) : (
          /* Bez fotky nasadne značka. Prázdny rám pôsobil ako chyba
             načítania; minca hovorí, že fotku k zápisu jednoducho nemáme. */
          <span className="acard-bezfotky" aria-hidden="true">
            <picture>
              <source srcSet="/znak_minca.webp" type="image/webp" />
              <img src="/znak_minca.png" alt="" width={160} height={178} loading="lazy" decoding="async" />
            </picture>
          </span>
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
