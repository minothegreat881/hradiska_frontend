'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import {
  Crown, Landmark, Shield, Mountain, Columns, Book, Church, ScrollText, FileText, ArrowRight,
} from 'lucide-react';

interface CategoryCardProps {
  category: {
    value: string;
    label: string;
    description: string;
    detailedDescription: string;
    icon: string;
    image: string;
  };
  index: number;
}

const iconMap: Record<string, any> = {
  crown: Crown,
  landmark: Landmark,
  shield: Shield,
  mountain: Mountain,
  columns: Columns,
  book: Book,
  church: Church,
  scroll: ScrollText,
  'file-text': FileText,
};

export function CategoryCard({ category, index }: CategoryCardProps) {
  const Icon = iconMap[category.icon] || Book;
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
          background: '#fffdf8',
          border: `1px solid ${hover ? 'rgba(125,79,29,0.55)' : 'rgba(196,165,116,0.4)'}`,
          borderRadius: 12,
          boxShadow: hover
            ? '0 4px 14px rgba(70,40,20,0.10), 0 10px 24px rgba(70,40,20,0.08)'
            : '0 1px 2px rgba(70,40,20,0.06), 0 4px 12px rgba(70,40,20,0.05)',
          transition: 'border-color 150ms ease, box-shadow 150ms ease',
        }}
      >
        {/* FOTKA – jediný prvok na fotke je decentný badge ikony v pravom hornom rohu */}
        <div className="relative overflow-hidden flex-shrink-0" style={{ height: 220 }}>
          <ImageWithFallback
            src={category.image}
            alt={category.label}
            className="w-full h-full object-cover"
            style={{
              transform: hover ? 'scale(1.04)' : 'scale(1)',
              transition: 'transform 400ms ease-out',
            }}
          />
          {/* Badge ikony kategórie – zlatá ikona na tmavohnedom kruhu */}
          <div
            className="absolute top-4 right-4 flex items-center justify-center rounded-full"
            style={{
              width: 46,
              height: 46,
              background: 'rgba(45,24,16,0.88)',
              border: '1.5px solid rgba(232,197,110,0.55)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            }}
            aria-hidden="true"
          >
            <Icon className="w-5 h-5" style={{ color: '#E8C56E' }} />
          </div>
        </div>

        {/* TELO KARTY */}
        <div className="flex flex-col flex-1 p-6">
          {/* Titulok – pod fotkou, tmavohnedý */}
          <h3
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: 20,
              fontWeight: 600,
              color: '#2d1810',
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
              color: '#5d4e37',
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
              color: '#7d4f1d',
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
