'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { mockSites, mockArticles } from '../data/mock-data';

interface SearchResult {
  type: 'site' | 'article';
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

export function HeroSearch() {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Search logic
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const searchLower = query.toLowerCase();

    const siteResults: SearchResult[] = mockSites
      .filter(
        (site) =>
          site.name.toLowerCase().includes(searchLower) ||
          site.district.toLowerCase().includes(searchLower) ||
          site.description.toLowerCase().includes(searchLower)
      )
      .slice(0, 4)
      .map((site) => ({
        type: 'site',
        id: site.id,
        title: site.name,
        subtitle: `${site.district} • ${site.type}`,
        href: `/sites/${site.slug}`,
      }));

    const articleResults: SearchResult[] = mockArticles
      .filter(
        (article) =>
          article.title.toLowerCase().includes(searchLower) ||
          article.excerpt.toLowerCase().includes(searchLower)
      )
      .slice(0, 3)
      .map((article) => ({
        type: 'article',
        id: article.id,
        title: article.title,
        subtitle: `Blog • ${article.category}`,
        href: `/blog/${article.slug}`,
      }));

    setResults([...siteResults, ...articleResults]);
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results.length > 0) {
      e.preventDefault();
      window.location.href = results[selectedIndex].href;
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
      {/* Pill searchbar – flat krémové pozadie, 1 px gold border, mäkký teplý shadow */}
      <div
        className="relative flex items-center"
        style={{
          height: 56,
          backgroundColor: '#fdfbf6',
          border: `1px solid ${isFocused ? '#a87437' : '#c4a574'}`,
          borderRadius: 9999,
          boxShadow: isFocused
            ? '0 0 0 4px rgba(196, 165, 116, 0.22), 0 6px 24px rgba(125, 79, 29, 0.15)'
            : '0 6px 24px rgba(125, 79, 29, 0.12)',
          paddingLeft: 22,
          paddingRight: 4,
          gap: 12,
          transition: 'border-color 150ms ease, box-shadow 200ms ease',
        }}
      >
        {/* Lupa vľavo – tlmená hnedá */}
        <Search
          className="w-5 h-5 flex-shrink-0"
          style={{ color: isFocused ? '#7d4f1d' : '#8b7355', transition: 'color 150ms ease' }}
          aria-hidden="true"
        />

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          id="site-search"
          name="search"
          placeholder="Hľadaj články, témy, hradiská alebo kľúčové slová…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          onKeyDown={handleKeyDown}
          className="flex-1 min-w-0 bg-transparent outline-none border-0 hero-search-input"
          style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: 16,
            color: '#2d1810',
            padding: 0,
            background: 'transparent',
          }}
          role="combobox"
          aria-label="Vyhľadávanie článkov, hradísk a kľúčových slov"
          aria-autocomplete="list"
          aria-controls="search-results"
          aria-expanded={isFocused && (results.length > 0 || query.length >= 2)}
          autoComplete="off"
        />

        {/* Clear Button – zobrazí sa pri zadaní */}
        {query && (
          <motion.button
            type="button"
            onClick={clearSearch}
            className="flex-shrink-0 flex items-center justify-center rounded-full"
            style={{
              width: 32, height: 32,
              color: '#8b7355',
              transition: 'background-color 150ms ease',
            }}
            aria-label="Vymazať vyhľadávanie"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
          >
            <X className="w-4 h-4" />
          </motion.button>
        )}

        {/* Hľadať button – embedded vnútri pillu, plná zlato-hnedá */}
        <motion.button
          type="submit"
          className="flex-shrink-0 items-center justify-center"
          style={{
            display: 'inline-flex',
            gap: 8,
            height: 44,
            padding: '0 18px',
            borderRadius: 9999,
            background: 'linear-gradient(135deg, #7d4f1d 0%, #a87437 100%)',
            color: '#faf7f1',
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontWeight: 500,
            fontSize: 14,
            letterSpacing: '0.02em',
            boxShadow: '0 2px 8px rgba(125, 79, 29, 0.35)',
            border: 'none',
            cursor: 'pointer',
            transition: 'filter 150ms ease',
          }}
          aria-label="Vyhľadať"
          whileHover={{ filter: 'brightness(1.08)' }}
          whileTap={{ scale: 0.97 }}
        >
          <Search className="w-4 h-4 md:hidden" />
          <span className="hidden md:inline">Hľadať</span>
        </motion.button>
      </div>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {isFocused && results.length > 0 && (
          <motion.div
            id="search-results"
            role="listbox"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-stone-900 rounded-2xl border-2 border-stone-200 dark:border-stone-700 shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.4)] max-h-[480px] overflow-y-auto z-[60]"
            style={{
              backdropFilter: 'blur(12px)',
            }}
          >
            <div className="p-3">
              {results.map((result, idx) => (
                <motion.a
                  key={result.id}
                  id={`result-${idx}`}
                  href={result.href}
                  role="option"
                  aria-selected={idx === selectedIndex}
                  className={`flex items-start gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 ${
                    idx === selectedIndex
                      ? 'bg-gradient-to-r from-amber-50 to-amber-50/50 dark:from-amber-950/30 dark:to-amber-950/20 border border-amber-300 dark:border-amber-800/50 shadow-sm'
                      : 'hover:bg-stone-50/80 dark:hover:bg-stone-800/50 border border-transparent'
                  }`}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  whileHover={{ x: 4 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                >
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-0.5">
                    {result.type === 'site' ? (
                      <svg className="w-5 h-5 text-amber-600 dark:text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-amber-600 dark:text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div
                      className="font-medium text-stone-900 dark:text-stone-100 truncate"
                      style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                    >
                      {result.title}
                    </div>
                    <div className="text-sm text-stone-600 dark:text-stone-400 truncate mt-0.5">
                      {result.subtitle}
                    </div>
                  </div>
                </motion.a>
              ))}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-stone-200 dark:border-stone-700 bg-gradient-to-b from-stone-50 to-stone-100/50 dark:from-stone-800/50 dark:to-stone-800/80 flex items-center justify-between text-xs text-stone-600 dark:text-stone-400 rounded-b-2xl">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <kbd className="px-2 py-1 bg-white dark:bg-stone-900 rounded-md border border-stone-300 dark:border-stone-600 font-mono shadow-sm">↑↓</kbd>
                  <span style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>navigácia</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <kbd className="px-2 py-1 bg-white dark:bg-stone-900 rounded-md border border-stone-300 dark:border-stone-600 font-mono shadow-sm">Enter</kbd>
                  <span style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>otvoriť</span>
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      <AnimatePresence>
        {isFocused && query.length >= 2 && results.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-stone-900 rounded-2xl border-2 border-stone-200 dark:border-stone-700 shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.4)] p-12 text-center z-[60]"
            style={{
              backdropFilter: 'blur(12px)',
            }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              <svg className="w-16 h-16 mx-auto text-stone-400 dark:text-stone-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p
                className="text-stone-700 dark:text-stone-400 mb-2 text-lg"
                style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
              >
                Nenašli sa žiadne výsledky pre <strong className="text-stone-900 dark:text-stone-100">"{query}"</strong>
              </p>
              <p className="text-sm text-stone-500 dark:text-stone-500">
                Skúste použiť iné kľúčové slová alebo všeobecnejší výraz
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
