'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { mockSites, mockArticles } from '../data/mock-data';

// Design tokens – "Vyhľadávací dropdown, varianta 2B (S náhľadmi)"
const T = {
  panelBg: '#f6efdd',
  panelBorder: '#c8a15a',
  chipBorder: '#d9c69a',
  dividerStrong: '#e3d4ad',
  dividerSoft: '#ece0c2',
  hairline: '#e6d7b0',
  amber: '#9a5d1f',
  amberLight: '#c8862f',
  textMain: '#2e2213',
  textSecondary: '#8a795e',
  countChipText: '#8a6a35',
  chipBg: '#efe2c0',
  footerBg: '#efe6cf',
  clearBg: '#ece0c2',
  clearText: '#7a6a52',
  markBg: '#f4dca0',
  markText: '#7a3d0a',
  chevron: '#c8a15a',
  focusGlow: 'rgba(200,134,47,.22)',
} as const;

// Diakritiky-necitlivé, case-insensitive porovnanie, zachováva dĺžku reťazca po znakoch
// (aby indexy zvýraznenia sedeli s pôvodným textom).
function normalize(value: string): string {
  return [...value]
    .map((ch) => (ch.normalize('NFD').replace(/\p{Diacritic}/gu, '')[0] ?? ch).toLowerCase())
    .join('');
}

interface Highlight {
  pre: string;
  mid: string;
  post: string;
  matched: boolean;
}

function highlight(text: string, query: string): Highlight {
  if (!query) return { pre: text, mid: '', post: '', matched: false };
  const haystack = normalize(text);
  const needle = normalize(query);
  const index = haystack.indexOf(needle);
  if (index < 0) return { pre: text, mid: '', post: '', matched: false };
  return {
    pre: text.slice(0, index),
    mid: text.slice(index, index + query.length),
    post: text.slice(index + query.length),
    matched: true,
  };
}

interface RowResult {
  id: string;
  href: string;
  pre: string;
  mid: string;
  post: string;
  sub: string;
  thumbnail?: string;
  typeLabel?: string;
}

function GroupHeader({ label, count, withTopBorder }: { label: string; count: number; withTopBorder: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        padding: withTopBorder ? '14px 20px 8px' : '12px 20px 8px',
        marginTop: withTopBorder ? 6 : 0,
        borderTop: withTopBorder ? `1px solid ${T.dividerSoft}` : 'none',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 10,
          letterSpacing: '.16em',
          textTransform: 'uppercase',
          color: T.amber,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 9,
          fontWeight: 700,
          color: T.countChipText,
          background: T.chipBg,
          border: `1px solid ${T.chipBorder}`,
          borderRadius: 999,
          padding: '1px 7px',
        }}
      >
        {count}
      </span>
      <span style={{ flex: 1, height: 1, background: T.hairline }} />
    </div>
  );
}

function ResultRow({
  result,
  kind,
  selected,
  onMouseEnter,
}: {
  result: RowResult;
  kind: 'location' | 'article';
  selected: boolean;
  onMouseEnter: () => void;
}) {
  const fallbackBg =
    kind === 'location'
      ? 'repeating-linear-gradient(135deg,#e3d3a8 0 6px,#efe2c0 6px 12px)'
      : 'repeating-linear-gradient(135deg,#d8c7e0 0 6px,#e9e0f0 6px 12px)';

  return (
    <a
      href={result.href}
      role="option"
      aria-selected={selected}
      data-selected={selected ? 'true' : undefined}
      onMouseEnter={onMouseEnter}
      className="search-result-row"
    >
      <span
        style={{
          display: 'block',
          flexShrink: 0,
          width: 52,
          height: 40,
          borderRadius: 8,
          border: `1px solid ${T.chipBorder}`,
          backgroundImage: result.thumbnail ? `url(${result.thumbnail})` : fallbackBg,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            display: 'block',
            fontSize: 19,
            fontWeight: 600,
            color: T.textMain,
            lineHeight: kind === 'location' ? 1.15 : 1.2,
            fontFamily: 'var(--font-serif)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {result.pre}
          <mark style={{ background: T.markBg, color: T.markText, borderRadius: 3, padding: '0 1px' }}>
            {result.mid}
          </mark>
          {result.post}
        </span>
        <span
          style={{
            display: 'block',
            fontSize: 14,
            color: T.textSecondary,
            fontFamily: 'var(--font-serif)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {result.sub}
        </span>
      </span>
      {result.typeLabel && (
        <span
          style={{
            flexShrink: 0,
            fontFamily: 'var(--font-heading)',
            fontSize: 9,
            letterSpacing: '.08em',
            textTransform: 'uppercase',
            color: T.amber,
            background: T.chipBg,
            border: `1px solid ${T.chipBorder}`,
            borderRadius: 999,
            padding: '3px 10px',
          }}
        >
          {result.typeLabel}
        </span>
      )}
      <span style={{ flexShrink: 0, color: T.chevron, fontSize: 17, lineHeight: 1 }}>›</span>
    </a>
  );
}

export function HeroSearch() {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [pulseKey, setPulseKey] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const trimmed = query.trim();

  const locationResults = useMemo<RowResult[]>(() => {
    if (!trimmed) return [];
    return mockSites
      .map((site) => ({ site, h: highlight(site.name, trimmed) }))
      .filter((x) => x.h.matched)
      .slice(0, 6)
      .map(({ site, h }) => ({
        id: `site-${site.id}`,
        href: `/sites/${site.slug}`,
        pre: h.pre,
        mid: h.mid,
        post: h.post,
        sub: site.district,
        thumbnail: site.images[0],
        typeLabel: site.type === 'hradisko' ? 'hradisko' : 'lokalita',
      }));
  }, [trimmed]);

  const articleResults = useMemo<RowResult[]>(() => {
    if (!trimmed) return [];
    return mockArticles
      .map((article) => ({ article, h: highlight(article.title, trimmed) }))
      .filter((x) => x.h.matched)
      .slice(0, 6)
      .map(({ article, h }) => ({
        id: `article-${article.id}`,
        href: `/blog/${article.slug}`,
        pre: h.pre,
        mid: h.mid,
        post: h.post,
        sub: `Blog · ${article.category ?? 'článok'}`,
        thumbnail: article.coverImage,
      }));
  }, [trimmed]);

  const allResults = useMemo(() => [...locationResults, ...articleResults], [locationResults, articleResults]);
  const showPanel = isFocused && trimmed.length > 0;
  const hasResults = allResults.length > 0;

  useEffect(() => {
    setSelectedIndex(0);
  }, [trimmed]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showPanel || !hasResults) {
      if (e.key === 'Escape') inputRef.current?.blur();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, allResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      window.location.href = allResults[selectedIndex].href;
    } else if (e.key === 'Escape') {
      inputRef.current?.blur();
      setIsFocused(false);
    }
  };

  const clearSearch = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  return (
    <div className="relative w-full max-w-[640px] mx-auto">
      <div
        style={{
          position: 'relative',
          background: T.panelBg,
          border: `1px solid ${T.panelBorder}`,
          borderRadius: 16,
          boxShadow: '0 6px 20px rgba(125,79,29,.14)',
          overflow: 'hidden',
        }}
      >
        {/* Input riadok */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
          <motion.span
            key={pulseKey}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 30,
              height: 30,
              borderRadius: 8,
              flexShrink: 0,
              transition: 'background 250ms ease, color 250ms ease, border-color 250ms ease, box-shadow 250ms ease',
              ...(isFocused
                ? {
                    color: T.panelBg,
                    background: `linear-gradient(135deg, ${T.amberLight}, ${T.amber})`,
                    border: `1px solid ${T.amber}`,
                    boxShadow: `0 0 0 4px ${T.focusGlow}`,
                    animation: 'lupaPulse .5s ease',
                  }
                : {
                    color: T.amber,
                    background: T.chipBg,
                    border: `1px solid ${T.chipBorder}`,
                  }),
            }}
          >
            <Search size={17} strokeWidth={2.3} />
          </motion.span>

          <input
            ref={inputRef}
            type="text"
            id="site-search"
            name="search"
            placeholder="Hľadaj hradiská, články, kľúčové slová…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              setIsFocused(true);
              setPulseKey((k) => k + 1);
            }}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            onKeyDown={handleKeyDown}
            className="flex-1 min-w-0 bg-transparent outline-none border-0 hero-search-input"
            style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: T.textMain, padding: 0, background: 'transparent' }}
            role="combobox"
            aria-label="Vyhľadávanie lokalít a článkov"
            aria-autocomplete="list"
            aria-controls="search-dropdown-results"
            aria-expanded={showPanel}
            autoComplete="off"
          />

          {query && (
            <motion.button
              type="button"
              onClick={clearSearch}
              aria-label="Vymazať vyhľadávanie"
              style={{
                flexShrink: 0,
                border: 'none',
                background: T.clearBg,
                color: T.clearText,
                width: 26,
                height: 26,
                borderRadius: 999,
                fontSize: 13,
                cursor: 'pointer',
              }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
            >
              ✕
            </motion.button>
          )}
        </div>
      </div>

      {/* Roletka výsledkov – plávajúci panel nad obsahom (viď z-index poznámka v HomePage.tsx) */}
      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 10px)',
              left: 0,
              right: 0,
              background: T.panelBg,
              border: `1px solid ${T.panelBorder}`,
              borderRadius: 16,
              boxShadow: '0 26px 64px -24px rgba(60,40,15,.55)',
              overflow: 'hidden',
              zIndex: 60,
            }}
          >
            <div
              id="search-dropdown-results"
              role="listbox"
              className="search-dropdown-scroll"
              style={{ maxHeight: 460, overflowY: 'auto', padding: '6px 0' }}
            >
              {hasResults ? (
                <>
                  {locationResults.length > 0 && (
                    <div>
                      <GroupHeader label="Lokality" count={locationResults.length} withTopBorder={false} />
                      {locationResults.map((r) => (
                        <ResultRow
                          key={r.id}
                          result={r}
                          kind="location"
                          selected={allResults[selectedIndex]?.id === r.id}
                          onMouseEnter={() => setSelectedIndex(allResults.findIndex((x) => x.id === r.id))}
                        />
                      ))}
                    </div>
                  )}
                  {articleResults.length > 0 && (
                    <div>
                      <GroupHeader label="Články" count={articleResults.length} withTopBorder={locationResults.length > 0} />
                      {articleResults.map((r) => (
                        <ResultRow
                          key={r.id}
                          result={r}
                          kind="article"
                          selected={allResults[selectedIndex]?.id === r.id}
                          onMouseEnter={() => setSelectedIndex(allResults.findIndex((x) => x.id === r.id))}
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div
                  style={{
                    padding: '36px 18px',
                    textAlign: 'center',
                    color: T.textSecondary,
                    fontSize: 18,
                    fontFamily: 'var(--font-serif)',
                  }}
                >
                  Pre „<strong style={{ color: T.amber }}>{query}</strong>" sme nič nenašli.
                </div>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '9px 18px',
                borderTop: `1px solid ${T.dividerStrong}`,
                background: T.footerBg,
                fontFamily: 'var(--font-serif)',
                fontSize: 14,
                color: T.textSecondary,
              }}
            >
              <span style={{ marginLeft: 'auto' }}>{allResults.length} výsledkov</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
