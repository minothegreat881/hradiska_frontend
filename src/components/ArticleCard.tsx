'use client';

import { Calendar, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { Article } from '../data/mock-data';
import { useState } from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface ArticleCardProps {
  article: Article;
}

export function ArticleCard({ article }: ArticleCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const categoryLabels: Record<string, string> = {
    vyskum: 'Výskum',
    historia: 'História',
    metodika: 'Metodika',
    aktuality: 'Aktuality',
  };

  return (
    <motion.a
      href={`/blog/${article.slug}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{
        y: -6,
        transition: { duration: 0.3, type: 'spring', stiffness: 300 },
      }}
      className="block h-full group"
      style={{ textDecoration: 'none' }}
    >
      <article
        className="relative h-full flex flex-col overflow-hidden rounded-2xl"
        style={{
          minHeight: 360,
          background: '#1f1a12',
          boxShadow: isHovered
            ? '0 10px 28px rgba(20,15,10,0.25), 0 20px 48px rgba(20,15,10,0.18)'
            : '0 2px 6px rgba(20,15,10,0.12), 0 8px 24px rgba(20,15,10,0.10)',
          border: '1px solid rgba(196,165,116,0.28)',
          transition: 'box-shadow 200ms ease',
        }}
      >
        {/* Cover image — fills entire card */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="w-full h-full"
            animate={{ scale: isHovered ? 1.05 : 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <ImageWithFallback
              src={article.coverImage}
              alt={article.title}
              className="w-full h-full object-cover"
              style={{ filter: 'contrast(1.05) brightness(0.96)' }}
            />
          </motion.div>

          {/* Gradient overlay — strong dark anchor at bottom, soft fade up */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(to top, rgba(15,11,7,0.96) 0%, rgba(15,11,7,0.90) 22%, rgba(15,11,7,0.72) 45%, rgba(15,11,7,0.35) 65%, rgba(15,11,7,0.08) 82%, rgba(15,11,7,0) 100%)',
            }}
          />

          {/* Top vignette — keeps top pill badges legible without dimming image */}
          <div
            className="absolute inset-x-0 top-0 pointer-events-none"
            style={{
              height: '38%',
              background:
                'linear-gradient(to bottom, rgba(15,11,7,0.45) 0%, rgba(15,11,7,0) 100%)',
            }}
          />

          {/* Shine effect on hover */}
          {isHovered && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'linear-gradient(120deg, transparent 30%, rgba(232,197,110,0.18) 50%, transparent 70%)',
              }}
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ duration: 0.9, ease: 'easeInOut' }}
            />
          )}
        </div>

        {/* Featured badge — top right */}
        {article.featured && (
          <div className="absolute top-3 right-3 z-10">
            <span
              className="px-3 py-1 text-xs uppercase tracking-wider rounded-full"
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                background: 'rgba(154,93,31,0.92)',
                color: '#fef9f0',
                border: '1px solid rgba(232,197,110,0.55)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                letterSpacing: '0.06em',
              }}
            >
              Odporúčané
            </span>
          </div>
        )}

        {/* Category pill — top left */}
        {article.category && categoryLabels[article.category] && (
          <div className="absolute top-3 left-3 z-10">
            <span
              className="px-3 py-1 text-xs rounded-full backdrop-blur-sm"
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontStyle: 'italic',
                background: 'rgba(31,26,18,0.55)',
                color: '#fef9f0',
                border: '1px solid rgba(255,255,255,0.35)',
              }}
            >
              {categoryLabels[article.category]}
            </span>
          </div>
        )}

        {/* Frosted blur panel under text — separate layer so mask works reliably */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 pointer-events-none"
          style={{
            height: '62%',
            backdropFilter: 'blur(3px) saturate(1.1)',
            WebkitBackdropFilter: 'blur(3px) saturate(1.1)',
            maskImage:
              'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%)',
            WebkitMaskImage:
              'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%)',
          }}
        />

        {/* Content overlay — bottom of card */}
        <div className="relative z-10 flex flex-col flex-1 justify-end p-5 pt-16">
          {/* Title — clamped to 2 lines */}
          <h3
            className="mb-2"
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              color: '#fef9f0',
              fontSize: 19,
              lineHeight: 1.3,
              letterSpacing: '0.01em',
              fontWeight: 600,
              textShadow:
                '0 1px 2px rgba(0,0,0,0.85), 0 2px 6px rgba(0,0,0,0.65), 0 0 12px rgba(0,0,0,0.4)',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              margin: 0,
              marginBottom: 8,
            }}
          >
            {article.title}
          </h3>

          {/* Decorative line */}
          <div
            style={{
              width: 36,
              height: 1,
              background: 'rgba(232,197,110,0.7)',
              marginBottom: 10,
              boxShadow: '0 1px 2px rgba(0,0,0,0.5)',
            }}
          />

          {/* Excerpt — left-aligned, 2 lines max */}
          <p
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: 13.5,
              lineHeight: 1.55,
              color: '#fdf0db',
              textAlign: 'left',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              margin: 0,
              marginBottom: 14,
              textShadow:
                '0 1px 2px rgba(0,0,0,0.85), 0 2px 5px rgba(0,0,0,0.6)',
            }}
          >
            {article.excerpt}
          </p>

          {/* Footer row — date + reading time + tag, anchored at bottom */}
          <div
            className="flex items-center justify-between gap-3"
            style={{
              marginTop: 'auto',
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: 12,
              color: '#fdf0db',
              textShadow: '0 1px 2px rgba(0,0,0,0.8)',
            }}
          >
            <div className="flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-3 h-3" style={{ opacity: 0.85 }} />
                {new Date(article.publishedAt).toLocaleDateString('sk-SK', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
              <span style={{ opacity: 0.4 }}>·</span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="w-3 h-3" style={{ opacity: 0.85 }} />
                {article.readTime} min
              </span>
            </div>

            {/* First tag as pill — outline style */}
            {article.tags && article.tags.length > 0 && (
              <span
                className="px-2.5 py-0.5 rounded-full whitespace-nowrap"
                style={{
                  fontSize: 11,
                  fontStyle: 'italic',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.38)',
                  color: 'rgba(253,240,219,0.92)',
                  maxWidth: 160,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {article.tags[0]}
              </span>
            )}
          </div>
        </div>
      </article>
    </motion.a>
  );
}
