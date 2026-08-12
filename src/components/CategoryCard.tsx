'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { ArrowRight } from 'lucide-react';

interface CategoryCardProps {
  category: {
    value: string;
    label: string;
    description: string;
    detailedDescription: string;
    icon: string;
    /**
     * PLNÁ adresa obrázka, nie cesta v médiách. Základ Strapi dopĺňa volajúci
     * (`HomePage`), lebo ten už vie, či beží vývoj alebo produkcia. Keby sa
     * základ pridával aj tu, vzniklo by `http://…1337http://…1337/uploads/…`
     * a na dlaždici by namiesto fotky ostal `alt`.
     */
    image: string;
    /**
     * Voliteľná sada veľkostí (`srcset`). Prehliadač si z nej vyberie podľa
     * šírky dlaždice a hustoty obrazovky, takže na mobile nesťahuje to isté
     * čo 4K monitor. Bez nej sa použije samotný `image`.
     */
    imageSrcSet?: string;
  };
  index: number;
}

export function CategoryCard({ category, index }: CategoryCardProps) {
  const [hover, setHover] = useState(false);

  return (
    <motion.a
      href={`/category/${category.value}`}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="block h-full group"
      style={{
        textDecoration: 'none',
        // Jemné nadvihnutie pri hover
        transform: hover ? 'translateY(-3px)' : 'translateY(0)',
        transition: 'transform 150ms ease-out',
      }}
    >
      <article
        className="h-full flex flex-col overflow-hidden"
        style={{
          background: 'var(--hr-surface)',
          border: `1px solid ${hover ? 'var(--hr-accent-border)' : 'var(--hr-line)'}`,
          borderRadius: 12,
          boxShadow: hover ? 'var(--hr-shadow-md)' : 'var(--hr-shadow-sm)',
          transition: 'border-color 150ms ease, box-shadow 150ms ease',
        }}
      >
        {/* FOTKA – jediný prvok na fotke je decentný badge ikony v pravom hornom rohu */}
        <div className="relative overflow-hidden flex-shrink-0" style={{ height: 220 }}>
          <ImageWithFallback
            src={category.image}
            srcSet={category.imageSrcSet}
            sizes="(max-width: 767px) 92vw, (max-width: 1023px) 46vw, 380px"
            alt={category.label}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
            style={{
              transform: hover ? 'scale(1.04)' : 'scale(1)',
              transition: 'transform 400ms ease-out',
            }}
          />
        </div>

        {/* TELO KARTY */}
        <div className="flex flex-col flex-1 p-6">
          {/* Titulok – pod fotkou, tmavohnedý */}
          <h3
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: 20,
              fontWeight: 600,
              color: 'var(--hr-ink)',
              lineHeight: 1.25,
              letterSpacing: '0.02em',
              margin: 0,
              marginBottom: 10,
            }}
          >
            {category.label}
          </h3>

          {/* Popis – left-align, line-clamp na 3 riadky aby karty mali rovnakú výšku */}
          <p
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: 14.5,
              color: 'var(--hr-body-2)',
              lineHeight: 1.6,
              textAlign: 'left',
              margin: 0,
              marginBottom: 20,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {category.description}
          </p>

          {/* "Preskúmať →" – prilepené k spodku karty, jednotné na všetkých kartách */}
          <span
            className="inline-flex items-center gap-1.5"
            style={{
              marginTop: 'auto',
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--hr-accent-deep)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            Preskúmať
            <ArrowRight
              className="w-4 h-4"
              style={{
                transform: hover ? 'translateX(3px)' : 'translateX(0)',
                transition: 'transform 150ms ease-out',
              }}
            />
          </span>
        </div>
      </article>
    </motion.a>
  );
}
