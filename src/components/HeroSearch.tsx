'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Command, ArrowRight, Sparkles } from 'lucide-react';
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
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut "/"
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape' && isFocused) {
        inputRef.current?.blur();
        setIsFocused(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocused]);

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

  // Typing indicator
  useEffect(() => {
    if (query.length > 0) {
      setIsTyping(true);
      const timeout = setTimeout(() => setIsTyping(false), 300);
      return () => clearTimeout(timeout);
    }
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
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-3xl mx-auto" style={{ zIndex: 100 }}>
      {/* Enhanced ambient particles on focus */}
      <AnimatePresence>
        {isFocused && (
          <>
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  opacity: 0, 
                  scale: 0,
                  x: 0,
                  y: 0
                }}
                animate={{ 
                  opacity: [0, 0.8, 0.4, 0],
                  scale: [0, 1.5, 1, 0],
                  x: Math.cos((i / 20) * Math.PI * 2) * (150 + Math.random() * 60),
                  y: Math.sin((i / 20) * Math.PI * 2) * (150 + Math.random() * 60),
                  rotate: [0, 180, 360],
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 3 + Math.random(),
                  repeat: Infinity,
                  delay: i * 0.08,
                  ease: "easeOut"
                }}
                className="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 pointer-events-none"
                style={{
                  boxShadow: '0 0 12px 3px rgba(217, 119, 6, 0.4), 0 0 20px 5px rgba(251, 191, 36, 0.2)'
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Floating/hovering search container */}
      <motion.div
        className="relative"
        animate={{
          scale: isFocused ? 1.02 : 1,
          y: isFocused ? -2 : [0, -3, 0],
        }}
        transition={{ 
          scale: { type: "spring", stiffness: 300, damping: 25 },
          y: { 
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }
        }}
      >
        {/* Ornamental corners - top left */}
        <motion.div
          initial={{ opacity: 0, x: 10, y: 10 }}
          animate={{
            opacity: isFocused ? 1 : 0,
            x: isFocused ? 0 : 10,
            y: isFocused ? 0 : 10,
          }}
          transition={{ duration: 0.3 }}
          className="absolute -top-3 -left-3 w-8 h-8 pointer-events-none z-10"
        >
          <svg viewBox="0 0 32 32" className="w-full h-full">
            <path
              d="M 0 8 Q 0 0 8 0 M 0 16 Q 0 0 16 0"
              stroke="url(#gradient-corner)"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="gradient-corner" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#d97706" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#92400e" stopOpacity="0.6" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>

        {/* Ornamental corners - top right */}
        <motion.div
          initial={{ opacity: 0, x: -10, y: 10 }}
          animate={{
            opacity: isFocused ? 1 : 0,
            x: isFocused ? 0 : -10,
            y: isFocused ? 0 : 10,
          }}
          transition={{ duration: 0.3 }}
          className="absolute -top-3 -right-3 w-8 h-8 pointer-events-none z-10"
        >
          <svg viewBox="0 0 32 32" className="w-full h-full">
            <path
              d="M 32 8 Q 32 0 24 0 M 32 16 Q 32 0 16 0"
              stroke="url(#gradient-corner)"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </motion.div>

        {/* Ornamental corners - bottom left */}
        <motion.div
          initial={{ opacity: 0, x: 10, y: -10 }}
          animate={{
            opacity: isFocused ? 1 : 0,
            x: isFocused ? 0 : 10,
            y: isFocused ? 0 : -10,
          }}
          transition={{ duration: 0.3 }}
          className="absolute -bottom-3 -left-3 w-8 h-8 pointer-events-none z-10"
        >
          <svg viewBox="0 0 32 32" className="w-full h-full">
            <path
              d="M 0 24 Q 0 32 8 32 M 0 16 Q 0 32 16 32"
              stroke="url(#gradient-corner)"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </motion.div>

        {/* Ornamental corners - bottom right */}
        <motion.div
          initial={{ opacity: 0, x: -10, y: -10 }}
          animate={{
            opacity: isFocused ? 1 : 0,
            x: isFocused ? 0 : -10,
            y: isFocused ? 0 : -10,
          }}
          transition={{ duration: 0.3 }}
          className="absolute -bottom-3 -right-3 w-8 h-8 pointer-events-none z-10"
        >
          <svg viewBox="0 0 32 32" className="w-full h-full">
            <path
              d="M 32 24 Q 32 32 24 32 M 32 16 Q 32 32 16 32"
              stroke="url(#gradient-corner)"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </motion.div>

        {/* Enhanced pulsing glow effect behind */}
        <motion.div
          className="absolute inset-0 rounded-2xl"
          animate={{
            opacity: isFocused ? [0.7, 1, 0.7] : 0,
            scale: isFocused ? [1, 1.05, 1] : 0.98,
          }}
          transition={{ 
            opacity: { duration: 2, repeat: Infinity, ease: "easeInOut" },
            scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
          }}
          style={{
            background: 'radial-gradient(circle at center, rgba(217, 119, 6, 0.25), rgba(251, 191, 36, 0.15) 50%, transparent 70%)',
            filter: 'blur(25px)',
            zIndex: -1,
          }}
        />

        {/* Secondary glow layer */}
        <motion.div
          className="absolute inset-0 rounded-2xl"
          animate={{
            opacity: isFocused ? [0.3, 0.6, 0.3] : 0,
            scale: isFocused ? [1.1, 1.15, 1.1] : 0.98,
          }}
          transition={{ 
            opacity: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 },
            scale: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }
          }}
          style={{
            background: 'radial-gradient(circle at center, rgba(251, 191, 36, 0.2), transparent 60%)',
            filter: 'blur(30px)',
            zIndex: -1,
          }}
        />

        {/* Animated border with pulse */}
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          animate={{
            opacity: isFocused ? [0.8, 1, 0.8] : 0,
          }}
          transition={{ 
            opacity: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
          }}
        >
          <motion.div
            className="absolute inset-0 rounded-2xl"
            style={{
              background: 'linear-gradient(90deg, #fbbf24, #d97706, #92400e, #d97706, #fbbf24)',
              backgroundSize: '400% 100%',
              padding: '2px',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
              filter: 'drop-shadow(0 0 8px rgba(217, 119, 6, 0.6))'
            }}
            animate={{
              backgroundPosition: ['0% 0%', '100% 0%', '0% 0%'],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        </motion.div>

        {/* Shimmer effect that passes through */}
        <AnimatePresence>
          {!isFocused && (
            <motion.div
              className="absolute inset-0 rounded-2xl pointer-events-none overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/20 to-transparent"
                animate={{
                  x: ['-200%', '200%'],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatDelay: 2,
                  ease: 'easeInOut',
                }}
                style={{
                  width: '50%',
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main input container */}
        <div className="relative rounded-2xl overflow-hidden backdrop-blur-sm">
          {/* Parchment background */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50/95 via-orange-50/90 to-amber-100/95 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-amber-900/40" />
          
          {/* Texture overlay */}
          <div 
            className="absolute inset-0 opacity-30 dark:opacity-20"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E")`,
            }}
          />

          {/* Vintage paper grain */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{
              opacity: isFocused ? 0.1 : 0.05,
            }}
            style={{
              backgroundImage: 'radial-gradient(circle at 30% 40%, rgba(139, 92, 46, 0.08) 0%, transparent 50%), radial-gradient(circle at 70% 60%, rgba(120, 53, 15, 0.06) 0%, transparent 50%)',
            }}
          />

          {/* Content */}
          <div className="relative flex items-center gap-4 px-6 py-5">
            {/* Search icon with enhanced animation */}
            <motion.div
              animate={{
                rotate: isFocused ? [0, -12, 12, -12, 10, -8, 0] : 0,
                scale: isFocused ? [1, 1.15, 1.1] : 1,
              }}
              transition={{
                rotate: {
                  duration: 0.6,
                  ease: "easeInOut",
                },
                scale: {
                  duration: 0.3,
                  ease: "backOut"
                }
              }}
              className="relative"
            >
              <motion.div
                animate={{
                  filter: isFocused 
                    ? ['drop-shadow(0 0 0px rgba(217, 119, 6, 0))', 'drop-shadow(0 0 8px rgba(217, 119, 6, 0.8))', 'drop-shadow(0 0 4px rgba(217, 119, 6, 0.6))']
                    : 'drop-shadow(0 0 0px rgba(217, 119, 6, 0))'
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Search className="w-6 h-6 text-amber-700 dark:text-amber-500 flex-shrink-0" />
              </motion.div>
              
              {/* Enhanced sparkle effects on focus */}
              <AnimatePresence>
                {isFocused && (
                  <>
                    <motion.div
                      initial={{ opacity: 0, scale: 0, rotate: 0 }}
                      animate={{ 
                        opacity: [0, 1, 0],
                        scale: [0, 1, 0.8],
                        rotate: [0, 180, 360]
                      }}
                      exit={{ opacity: 0, scale: 0 }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="absolute -top-1 -right-1"
                    >
                      <Sparkles className="w-3 h-3 text-amber-500" />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, scale: 0, rotate: 0 }}
                      animate={{ 
                        opacity: [0, 1, 0],
                        scale: [0, 0.8, 0.6],
                        rotate: [0, -180, -360]
                      }}
                      exit={{ opacity: 0, scale: 0 }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: 0.5,
                        ease: "easeInOut"
                      }}
                      className="absolute -bottom-1 -left-1"
                    >
                      <Sparkles className="w-2 h-2 text-orange-400" />
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Decorative divider */}
            <motion.div
              className="w-px h-8 bg-gradient-to-b from-transparent via-amber-700/30 to-transparent"
              animate={{
                opacity: isFocused ? 1 : 0.3,
                scaleY: isFocused ? 1 : 0.7,
              }}
              transition={{ duration: 0.3 }}
            />

            {/* Input field */}
            <div className="flex-1 relative">
              <motion.input
                ref={inputRef}
                type="text"
                placeholder="Hľadať hradiská, sídliská, články..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                onKeyDown={handleKeyDown}
                className="w-full bg-transparent outline-none text-amber-950 dark:text-amber-50 placeholder:text-amber-800/40 dark:placeholder:text-amber-200/30 transition-all"
                animate={{
                  fontSize: isFocused ? '1.125rem' : '1rem',
                  letterSpacing: isFocused ? '0.02em' : '0.01em',
                }}
                transition={{ duration: 0.2 }}
                aria-label="Vyhľadávanie"
                aria-autocomplete="list"
                aria-controls="search-results"
                aria-activedescendant={
                  results.length > 0 ? `result-${selectedIndex}` : undefined
                }
              />
              
              {/* Enhanced ink effect underline with drip animation */}
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-px overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: isTyping ? 1 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <motion.div
                  className="h-full bg-gradient-to-r from-transparent via-amber-600 to-transparent relative"
                  initial={{ scaleX: 0, originX: 0 }}
                  animate={{
                    scaleX: isTyping ? 1 : 0,
                  }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  {/* Ink drips */}
                  {isTyping && [...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-px bg-amber-600"
                      style={{
                        left: `${20 + i * 30}%`,
                        top: 0,
                      }}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{
                        height: [0, 4, 6, 0],
                        opacity: [0, 0.8, 0.6, 0],
                      }}
                      transition={{
                        duration: 0.8,
                        delay: i * 0.1,
                        ease: "easeIn"
                      }}
                    />
                  ))}
                </motion.div>
              </motion.div>

              {/* Typing particle effects */}
              <AnimatePresence>
                {isTyping && (
                  <>
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-0.5 h-0.5 rounded-full bg-amber-500"
                        style={{
                          left: `${Math.random() * 100}%`,
                          bottom: '-2px',
                        }}
                        initial={{ opacity: 0, y: 0, scale: 0 }}
                        animate={{
                          opacity: [0, 1, 0],
                          y: [0, -20],
                          scale: [0, 1.5, 0],
                        }}
                        exit={{ opacity: 0 }}
                        transition={{
                          duration: 0.6,
                          delay: i * 0.05,
                          ease: "easeOut"
                        }}
                      />
                    ))}
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Decorative divider */}
            <motion.div
              className="w-px h-8 bg-gradient-to-b from-transparent via-amber-700/30 to-transparent"
              animate={{
                opacity: isFocused ? 1 : 0.3,
                scaleY: isFocused ? 1 : 0.7,
              }}
              transition={{ duration: 0.3 }}
            />

            {/* Keyboard shortcut badge */}
            <motion.div
              className="hidden sm:flex items-center gap-2"
              animate={{
                opacity: isFocused ? 0 : 1,
                x: isFocused ? 10 : 0,
              }}
              transition={{ duration: 0.2 }}
            >
              <kbd className="px-2.5 py-1.5 bg-amber-100/80 dark:bg-amber-900/40 rounded-lg border border-amber-300/50 dark:border-amber-700/50 shadow-sm">
                <span className="text-amber-900 dark:text-amber-200">/</span>
              </kbd>
              <span className="text-xs text-amber-800/60 dark:text-amber-200/50">fokus</span>
            </motion.div>

            {/* Enhanced active indicator with ripple effect */}
            <AnimatePresence>
              {isFocused && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  className="flex items-center gap-2 relative"
                >
                  <div className="relative">
                    <motion.div
                      animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.6, 1, 0.6],
                      }}
                      transition={{
                        duration: 1.8,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="w-2 h-2 rounded-full bg-amber-600 dark:bg-amber-400 relative z-10"
                      style={{
                        boxShadow: '0 0 12px rgba(217, 119, 6, 0.8)',
                      }}
                    />
                    {/* Ripple rings */}
                    {[...Array(3)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute inset-0 rounded-full border-2 border-amber-500"
                        initial={{ scale: 1, opacity: 0.8 }}
                        animate={{
                          scale: [1, 2.5],
                          opacity: [0.6, 0],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: i * 0.4,
                          ease: "easeOut"
                        }}
                        style={{
                          left: '50%',
                          top: '50%',
                          transform: 'translate(-50%, -50%)',
                        }}
                      />
                    ))}
                  </div>
                  <motion.span 
                    className="text-xs text-amber-700 dark:text-amber-300"
                    animate={{
                      opacity: [0.7, 1, 0.7],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    Aktívne
                  </motion.span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom decorative line */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-600/40 to-transparent"
            animate={{
              opacity: isFocused ? 1 : 0.3,
            }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </motion.div>

      {/* Suggestions dropdown */}
      <AnimatePresence>
        {isFocused && results.length > 0 && (
          <motion.div
            id="search-results"
            role="listbox"
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-full left-0 right-0 mt-4 rounded-2xl shadow-2xl border-2 border-amber-200/50 dark:border-amber-800/50 overflow-hidden z-50 backdrop-blur-md"
            style={{
              background: 'linear-gradient(to bottom, rgba(255, 251, 235, 0.98), rgba(254, 243, 199, 0.95))',
            }}
          >
            {/* Decorative top border */}
            <div className="h-1 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600" />

            <div className="p-2 max-h-96 overflow-y-auto">
              {results.map((result, idx) => (
                <motion.a
                  key={result.id}
                  id={`result-${idx}`}
                  href={result.href}
                  role="option"
                  aria-selected={idx === selectedIndex}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`flex items-center justify-between px-5 py-4 rounded-xl transition-all duration-200 group relative overflow-hidden ${
                    idx === selectedIndex
                      ? 'bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/60 dark:to-orange-900/50 shadow-md'
                      : 'hover:bg-amber-50/50 dark:hover:bg-amber-900/30'
                  }`}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  {/* Animated background on hover */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-amber-200/0 via-amber-200/50 to-amber-200/0"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '100%' }}
                    transition={{ duration: 0.6 }}
                  />

                  <div className="flex-1 min-w-0 relative z-10">
                    <div className="text-amber-950 dark:text-amber-50 truncate flex items-center gap-2">
                      {result.type === 'site' && (
                        <svg className="w-4 h-4 text-amber-700 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                      {result.type === 'article' && (
                        <svg className="w-4 h-4 text-amber-700 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      )}
                      {result.title}
                    </div>
                    <div className="text-sm text-amber-800/70 dark:text-amber-200/60 truncate mt-1">
                      {result.subtitle}
                    </div>
                  </div>
                  
                  <motion.div
                    animate={{
                      x: idx === selectedIndex ? 0 : -5,
                      opacity: idx === selectedIndex ? 1 : 0.4,
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <ArrowRight className="w-5 h-5 text-amber-700 dark:text-amber-400 flex-shrink-0 ml-2" />
                  </motion.div>
                </motion.a>
              ))}
            </div>

            {/* Footer hint */}
            <div className="px-5 py-4 border-t-2 border-amber-300/30 dark:border-amber-700/30 bg-gradient-to-r from-amber-50/80 to-orange-50/80 dark:from-amber-950/40 dark:to-orange-950/40 flex items-center justify-between text-xs">
              <div className="flex items-center gap-4 text-amber-800/80 dark:text-amber-200/70">
                <span className="flex items-center gap-1.5">
                  <kbd className="px-2 py-1 bg-amber-100/80 dark:bg-amber-900/60 rounded-md border border-amber-300/50 dark:border-amber-700/50">
                    ↑↓
                  </kbd>
                  navigácia
                </span>
                <span className="flex items-center gap-1.5">
                  <kbd className="px-2 py-1 bg-amber-100/80 dark:bg-amber-900/60 rounded-md border border-amber-300/50 dark:border-amber-700/50">
                    Enter
                  </kbd>
                  otvoriť
                </span>
                <span className="flex items-center gap-1.5">
                  <kbd className="px-2 py-1 bg-amber-100/80 dark:bg-amber-900/60 rounded-md border border-amber-300/50 dark:border-amber-700/50">
                    Esc
                  </kbd>
                  zavrieť
                </span>
              </div>
              <a
                href="/search"
                className="text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 hover:underline transition-colors flex items-center gap-1"
              >
                Pokročilé vyhľadávanie
                <ArrowRight className="w-3 h-3" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      <AnimatePresence>
        {isFocused && query.length >= 2 && results.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-4 rounded-2xl shadow-2xl border-2 border-amber-200/50 dark:border-amber-800/50 p-8 text-center z-50 backdrop-blur-md"
            style={{
              background: 'linear-gradient(to bottom, rgba(255, 251, 235, 0.98), rgba(254, 243, 199, 0.95))',
            }}
          >
            <div className="text-amber-900/60 dark:text-amber-100/60">
              Nenašli sa žiadne výsledky pre "<strong className="text-amber-950 dark:text-amber-50">{query}</strong>"
            </div>
            <a
              href="/search"
              className="mt-4 inline-flex items-center gap-2 text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 hover:underline transition-colors"
            >
              Skúste pokročilé vyhľadávanie
              <ArrowRight className="w-4 h-4" />
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
