'use client';

import { motion } from 'motion/react';
import { Feather } from 'lucide-react';

interface QuoteBlockProps {
  text: string;
  author?: string;
  source?: string;
  variant?: 'default' | 'poem' | 'compact';
}

export function QuoteBlock({ text, author, source, variant = 'default' }: QuoteBlockProps) {
  // Split text by newlines for poem formatting
  const lines = text.split('\n').filter(line => line.trim());
  const isPoem = lines.length > 2 || variant === 'poem';

  if (isPoem || variant === 'poem') {
    return (
      <motion.div
        className="my-6 w-full"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
      >
        <blockquote className="relative py-4 px-6 max-w-2xl mx-auto" style={{ textAlign: 'center' }}>
          <div>
            {lines.map((line, idx) => (
              <p
                key={idx}
                className="text-base md:text-lg italic text-stone-700 dark:text-stone-300"
                style={{
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  textAlign: 'center',
                  lineHeight: '1.4',
                  marginBottom: '0.15rem'
                }}
              >
                {idx === 0 && <span className="text-2xl text-amber-600/60 dark:text-amber-500/60">„</span>}
                {line}
                {idx === lines.length - 1 && <span className="text-2xl text-amber-600/60 dark:text-amber-500/60">„</span>}
              </p>
            ))}
          </div>

          {(author || source) && (
            <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-amber-600/20">
              <Feather className="w-4 h-4 text-amber-600 dark:text-amber-500" />
              <cite
                className="text-sm text-amber-800 dark:text-amber-400 not-italic"
                style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
              >
                {author}{source && ` — ${source}`}
              </cite>
            </div>
          )}
        </blockquote>
      </motion.div>
    );
  }

  // Default/compact single-line quote
  return (
    <motion.div
      className="my-6 w-full"
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
    >
      <blockquote className="relative py-3 px-6 max-w-2xl mx-auto" style={{ textAlign: 'center' }}>
        <p
          className="text-base md:text-lg italic leading-relaxed text-stone-700 dark:text-stone-300"
          style={{ fontFamily: 'Georgia, "Times New Roman", serif', textAlign: 'center' }}
        >
          <span className="text-2xl text-amber-600/60 dark:text-amber-500/60">„</span>
          {text}
          <span className="text-2xl text-amber-600/60 dark:text-amber-500/60">„</span>
        </p>

        {(author || source) && (
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="text-sm text-amber-700 dark:text-amber-400">
              — {author}{source && `, ${source}`}
            </span>
          </div>
        )}
      </blockquote>
    </motion.div>
  );
}
