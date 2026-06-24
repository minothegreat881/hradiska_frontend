'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AktualitaCard } from '../components/AktualityFeed';
import { getAktuality, StrapiAktualita } from '../lib/strapi';

const PAGE_SIZE = 10;

export function AktualityPage() {
  const [items, setItems] = useState<StrapiAktualita[]>([]);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [state, setState] = useState<'loading' | 'ok' | 'empty' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    setState('loading');
    getAktuality({ page, pageSize: PAGE_SIZE })
      .then(({ items, pagination }) => {
        if (cancelled) return;
        setItems(items);
        setPageCount(pagination?.pageCount ?? 1);
        setState(items.length === 0 ? 'empty' : 'ok');
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn('Aktuality API zlyhalo', err);
        setState('error');
      });
    return () => { cancelled = true; };
  }, [page]);

  return (
    <div className="min-h-screen parchment relative">
      {/* Decoratívny header pattern */}
      <div
        className="w-full h-3 bg-repeat-x relative z-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='12' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 6 L25 0 L50 6 L75 0 L100 6' stroke='%237d4f1d' stroke-width='2' fill='none'/%3E%3C/svg%3E")`,
          opacity: 0.3,
        }}
      />

      <div className="container mx-auto px-4 max-w-5xl py-12 md:py-16">
        {/* Hlavička stránky */}
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center mb-10 md:mb-14"
        >
          <div className="flex items-center justify-center gap-2 mb-3 opacity-60" aria-hidden="true">
            <span className="h-px w-16" style={{ background: 'linear-gradient(90deg, transparent, #c4a574)' }} />
            <span style={{ color: '#c4a574', fontSize: 14, lineHeight: 1 }}>⚜</span>
            <span className="h-px w-16" style={{ background: 'linear-gradient(90deg, #c4a574, transparent)' }} />
          </div>
          <h1
            className="font-semibold tracking-wide"
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: 'clamp(32px, 4.5vw, 48px)',
              color: '#2d1810',
              letterSpacing: '0.04em',
            }}
          >
            Aktuality zo života združenia
          </h1>
          <p
            className="mt-3 text-base"
            style={{ color: '#8b7355', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
          >
            Kronika brigád, podujatí a obnov pamiatok
          </p>
        </motion.header>

        {state === 'error' && (
          <p className="text-center py-10" style={{ color: '#8b7355', fontFamily: 'Georgia, serif' }}>
            Aktuality sa momentálne nepodarilo načítať. Skúste neskôr.
          </p>
        )}
        {state === 'loading' && (
          <p className="text-center py-10" style={{ color: '#8b7355', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
            Načítavam…
          </p>
        )}
        {state === 'empty' && (
          <p className="text-center py-10" style={{ color: '#8b7355', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
            Zatiaľ tu nie sú žiadne príspevky.
          </p>
        )}

        {state === 'ok' && (
          <div className="space-y-5">
            {items.map(it => <AktualitaCard key={it.documentId} item={it} />)}
          </div>
        )}

        {/* Pagination */}
        {state === 'ok' && pageCount > 1 && (
          <nav className="flex items-center justify-center gap-2 mt-10" aria-label="Stránkovanie">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-lg text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110"
              style={{
                background: '#faf7f1',
                border: '1px solid rgba(196,165,116,0.55)',
                color: '#5d4e37',
                fontFamily: 'Georgia, serif',
              }}
              aria-label="Predchádzajúca strana"
            >
              <ChevronLeft className="w-4 h-4" /> Predchádzajúca
            </button>
            <span
              className="text-sm px-3"
              style={{ color: '#8b7355', fontFamily: 'Georgia, serif' }}
            >
              {page} / {pageCount}
            </span>
            <button
              onClick={() => setPage(p => Math.min(pageCount, p + 1))}
              disabled={page === pageCount}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-lg text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110"
              style={{
                background: 'linear-gradient(135deg, #7d4f1d 0%, #a87437 100%)',
                color: '#faf7f1',
                border: '1px solid #7d4f1d',
                fontFamily: 'Georgia, serif',
              }}
              aria-label="Nasledujúca strana"
            >
              Nasledujúca <ChevronRight className="w-4 h-4" />
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}
