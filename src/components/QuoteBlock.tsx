'use client';

import { motion } from 'motion/react';
import { Feather, Quote } from 'lucide-react';

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
        <blockquote
          className="relative py-5 px-6"
          style={{
            background: 'rgba(196,165,116,0.08)',
            borderLeft: '3px solid #a87437',
            borderRadius: '0 8px 8px 0',
            color: '#2d2418',
            width: '100%',
          }}
        >
          <Quote
            style={{
              width: 16,
              height: 16,
              color: '#a87437',
              marginBottom: 8,
              opacity: 0.8,
            }}
          />
          <div style={{ whiteSpace: 'pre-line' }}>
            {lines.map((line, idx) => (
              <p
                key={idx}
                style={{
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontStyle: 'italic',
                  fontSize: '16px',
                  lineHeight: 1.55,
                  color: '#2d2418',
                  margin: 0,
                  marginBottom: '0.15rem',
                  textAlign: 'left',
                }}
              >
                {line}
              </p>
            ))}
          </div>

          {(author || source) && (
            <div
              className="flex items-center gap-2"
              style={{
                marginTop: 12,
                paddingTop: 10,
                borderTop: '1px solid rgba(168,116,55,0.25)',
              }}
            >
              <Feather style={{ width: 14, height: 14, color: '#7d4f1d' }} />
              <cite
                className="not-italic"
                style={{
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontSize: 13,
                  color: '#7d4f1d',
                  fontWeight: 600,
                }}
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
      <blockquote
        className="relative py-4 px-6"
        style={{
          background: 'rgba(196,165,116,0.08)',
          borderLeft: '3px solid #a87437',
          borderRadius: '0 8px 8px 0',
          color: '#2d2418',
          width: '100%',
        }}
      >
        <p
          className="text-base md:text-lg italic leading-relaxed"
          style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            color: '#2d2418',
            margin: 0,
          }}
        >
          <span style={{ fontSize: '1.5em', color: '#a87437', opacity: 0.7 }}>„</span>
          {text}
          <span style={{ fontSize: '1.5em', color: '#a87437', opacity: 0.7 }}>“</span>
        </p>

        {(author || source) && (
          <div className="flex items-center gap-2 mt-2">
            <span
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: 13,
                color: '#7d4f1d',
                fontWeight: 600,
              }}
            >
              — {author}{source && `, ${source}`}
            </span>
          </div>
        )}
      </blockquote>
    </motion.div>
  );
}
