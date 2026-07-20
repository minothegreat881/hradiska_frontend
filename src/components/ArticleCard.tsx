'use client';

import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { Article } from '../data/mock-data';

interface ArticleCardProps {
  article: Article;
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

export function ArticleCard({ article }: ArticleCardProps) {
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
      className="article-card"
      aria-label={categoryLabel ? `${article.title} — ${categoryLabel}` : article.title}
    >
      {/* 1. Fotka — pozadie karty (vlastný element kvôli hover zoomu) */}
      <div
        data-img
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'var(--card-img-fallback)',
          backgroundImage: article.coverImage ? `url("${article.coverImage}")` : undefined,
          backgroundSize: 'cover',
          // Hrady bývajú na kopci — ťažisko mierne nad stredom.
          backgroundPosition: 'center 32%',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* 2. Scrim — horná tretina číra, spodok takmer nepriehľadný */}
      <div
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, background: 'var(--card-scrim)' }}
      />

      {/* 3. Chip kategórie — vľavo hore */}
      {categoryLabel && (
        <span
          style={{
            position: 'absolute',
            top: 14,
            left: 14,
            zIndex: 2,
            fontFamily: 'var(--font-heading)',
            fontSize: 10,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--card-chip-text)',
            background: 'var(--card-chip-bg)',
            border: '1px solid var(--card-chip-border)',
            backdropFilter: 'blur(3px)',
            WebkitBackdropFilter: 'blur(3px)',
            padding: '5px 11px',
            borderRadius: 999,
          }}
        >
          {categoryLabel}
        </span>
      )}

      {/* 4. Textový blok — dole na scrime */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 2,
          padding: '20px 20px 18px',
        }}
      >
        {/* Nadpis */}
        <h3
          data-title
          style={{
            margin: '0 0 8px',
            fontFamily: 'var(--font-serif)',
            fontSize: 24,
            fontWeight: 700,
            lineHeight: 1.14,
            color: 'var(--card-title)',
            textWrap: 'pretty',
          }}
        >
          {article.title}
        </h3>

        {/* Excerpt — orezaný na 2 riadky */}
        {article.excerpt && (
          <p
            style={{
              margin: '0 0 12px',
              fontFamily: 'var(--font-serif)',
              fontSize: 16,
              lineHeight: 1.42,
              color: 'var(--card-excerpt)',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {article.excerpt}
          </p>
        )}

        {/* Meta riadok — nad hornou linkou */}
        <div
          style={{
            borderTop: '1px solid var(--card-meta-line)',
            paddingTop: 11,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            fontFamily: 'var(--font-heading)',
            fontSize: 11,
            letterSpacing: '0.04em',
            color: 'var(--card-meta)',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <Calendar style={{ width: 12, height: 12, opacity: 0.85 }} />
              {dateLabel}
            </span>
            <span
              aria-hidden="true"
              style={{ width: 3, height: 3, borderRadius: 999, background: 'var(--card-dot)' }}
            />
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <Clock style={{ width: 12, height: 12, opacity: 0.85 }} />
              {article.readTime} min
            </span>
          </span>

          {/* Šípka — čisto vizuálny prvok */}
          <ArrowRight
            data-arrow
            aria-hidden="true"
            style={{ width: 16, height: 16, color: 'var(--card-arrow)', flexShrink: 0 }}
          />
        </div>
      </div>
    </a>
  );
}
