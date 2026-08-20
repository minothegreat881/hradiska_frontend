'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { searchArticles, makeSnippet, coverToUrl, getSearchIndex, type SearchHit } from '../lib/searchIndex';

const goTo = (path: string) => { window.history.pushState({}, '', path); window.dispatchEvent(new PopStateEvent('popstate')); };

// Design tokens – "Vyhľadávací dropdown, varianta 2B (S náhľadmi)"
const T = {
  panelBg: 'var(--hr-surface-2)',
  panelBorder: 'var(--hr-line-gold)',
  chipBorder: 'var(--hr-chip-border)',
  dividerStrong: 'var(--hr-line-strong)',
  dividerSoft: 'var(--hr-surface-3)',
  hairline: 'var(--hr-hairline)',
  amber: 'var(--hr-accent)',
  amberLight: 'var(--hr-accent-soft)',
  textMain: 'var(--hr-ink-3)',
  textSecondary: 'var(--hr-muted)',
  countChipText: 'var(--hr-chip-text)',
  chipBg: 'var(--hr-chip-bg)',
  footerBg: 'var(--hr-footer-bg)',
  clearBg: 'var(--hr-surface-3)',
  clearText: 'var(--hr-clear-text)',
  markBg: 'var(--hr-mark-bg)',
  markText: 'var(--hr-mark-text)',
  chevron: 'var(--hr-line-gold)',
  focusGlow: 'var(--hr-accent-glow)',
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
  /** Zvýraznený úryvok z tela (ak sa zhoda našla v texte). */
  snip?: { pre: string; mid: string; post: string; matched: boolean };
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
      ? 'repeating-linear-gradient(135deg,var(--hr-line-strong) 0 6px,var(--hr-chip-bg) 6px 12px)'
      : 'repeating-linear-gradient(135deg,var(--hr-chip-border) 0 6px,var(--hr-surface-3) 6px 12px)';

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
          {result.snip && result.snip.matched ? (
            <>
              {result.snip.pre}
              <mark style={{ background: 'transparent', color: T.amber, fontWeight: 600, padding: 0 }}>
                {result.snip.mid}
              </mark>
              {result.snip.post}
            </>
          ) : (
            result.sub
          )}
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
  /* Rám okolo baru je NÁHRADA za obrys prehliadača — nesmie zmiznúť tomu, kto
     web ovláda klávesnicou. Myšou ho ale nikto nepotrebuje a vo vnútri
     pilulky pôsobil ako červená linka. `isFocused` preto naďalej riadi
     roletku a tento stav len ten rám.

     `:focus-visible` sa na to použiť NEDÁ: pri textovom poli ho prehliadač
     priznáva aj kliknutiu (pole čaká na písanie, tak fokus vždy ukazuje).
     Rozlišuje sa teda spôsob príchodu — či fokusu predchádzalo stlačenie
     ukazovateľa. */
  const [ramKlavesnicou, setRamKlavesnicou] = useState(false);
  const prisloMysou = useRef(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [pulseKey, setPulseKey] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const trimmed = query.trim();
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);

  // Hľadanie je async (index sa lenivo stiahne z backendu). Debounce 140 ms,
  // aby sme nespúšťali na každý úder klávesy.
  useEffect(() => {
    if (!trimmed) { setHits([]); setSearching(false); return; }
    let cancelled = false;
    setSearching(true);
    const t = setTimeout(() => {
      searchArticles(trimmed, 40)
        .then((res) => { if (!cancelled) setHits(res); })
        .catch(() => { if (!cancelled) setHits([]); })
        .finally(() => { if (!cancelled) setSearching(false); });
    }, 140);
    return () => { cancelled = true; clearTimeout(t); };
  }, [trimmed]);

  const hitToRow = (hit: SearchHit): RowResult => {
    const h = highlight(hit.title, trimmed);
    const snip = makeSnippet(hit.text, trimmed);
    return {
      id: `article-${hit.slug}`,
      href: `/blog/${hit.slug}`,
      pre: h.pre,
      mid: h.mid,
      post: h.post,
      sub: hit.categoryName || 'Článok',
      snip,
      thumbnail: coverToUrl(hit.cover),
      typeLabel: hit.hasLocation ? 'lokalita' : undefined,
    };
  };

  // Rozdelenie podľa polohy: články s lokalitou = Lokality/hradiská, ostatné = Články.
  const locationResults = useMemo<RowResult[]>(
    () => hits.filter((h) => h.hasLocation).slice(0, 6).map(hitToRow),
    [hits, trimmed],
  );
  const articleResults = useMemo<RowResult[]>(
    () => hits.filter((h) => !h.hasLocation).slice(0, 8).map(hitToRow),
    [hits, trimmed],
  );

  const allResults = useMemo(() => [...locationResults, ...articleResults], [locationResults, articleResults]);
  const showPanel = isFocused && trimmed.length > 0;
  const hasResults = allResults.length > 0;

  useEffect(() => {
    setSelectedIndex(0);
  }, [trimmed]);

  const openResultsPage = () => {
    if (!trimmed) return;
    setIsFocused(false);
    inputRef.current?.blur();
    goTo(`/hladat?q=${encodeURIComponent(trimmed)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      inputRef.current?.blur();
      setIsFocused(false);
      return;
    }
    if (!showPanel) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, allResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      // Enter na vybranom výsledku → článok; inak (žiadne zvýraznené) → stránka výsledkov.
      const target = hasResults ? allResults[selectedIndex] : undefined;
      if (target) goTo(target.href);
      else openResultsPage();
    }
  };

  const clearSearch = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  return (
    /* Šírka a tvar podľa handoffu „Celé hradisko": pilulka 780 × 72.
       Zaoblenie 999 px namiesto 18 — bar leží na spodnej hrane fotografie
       a hranatý roh tam pôsobil ako odrezaný kus obrazu. */
    <div className="relative w-full max-w-[780px] mx-auto">
      <div
        onPointerDown={() => { prisloMysou.current = true; }}
        style={{
          position: 'relative',
          // Pri fokuse sa rozsvieti pergamen a okraj prejde do zlatej. Toto je
          // NÁHRADA za obrys prehliadača, nie ozdoba: textové polia zobrazujú
          // `:focus-visible` aj pri kliknutí myšou, a keďže obal má
          // `overflow: hidden`, obrys sa orezal a kreslil rámik vnútri baru.
          // Zrušiť ho bez náhrady sa nedá — kto ovláda web klávesnicou, musí
          // vidieť, kde stojí. Preto svieti celý bar.
          background: T.panelBg,
          border: `1px solid ${ramKlavesnicou ? T.amberLight : T.panelBorder}`,
          borderRadius: 999,
          boxShadow: ramKlavesnicou
            ? `0 0 0 4px ${T.focusGlow}, 0 24px 48px -14px rgba(74,52,18,.32)`
            : '0 24px 48px -14px rgba(74,52,18,.32)',
          transition: 'border-color 220ms ease, box-shadow 220ms ease, background 220ms ease',
          overflow: 'hidden',
        }}
      >
        {/* Ozdobný vlások po hornej hrane bol tu ešte zo zlatého šatu. V pečati
            je akcent červený, takže z neho vo vnútri pilulky vznikla červená
            linka — a pri kliknutí zosilnela z .35 na .85, čiže sa tvárila ako
            stav. Odstránený bez náhrady; nič nesignalizoval. */}
        {/* Input riadok */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 10px 10px 24px' }}>
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
              setRamKlavesnicou(!prisloMysou.current);
              prisloMysou.current = false;
              setPulseKey((k) => k + 1);
              // Zahrej index hneď pri fokuse, nech je prvé hľadanie okamžité.
              getSearchIndex().catch(() => {});
              // Mobil: softvérová klávesnica prekrýva spodnú polovicu obrazovky a
              // s ňou aj dropdown s výsledkami. Vyscrollujeme input tesne pod horný
              // okraj, aby sa výsledky vykreslili nad klávesnicou.
              if (typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches) {
                setTimeout(() => {
                  const el = inputRef.current;
                  if (!el) return;
                  const top = el.getBoundingClientRect().top + window.scrollY - 72;
                  window.scrollTo({ top, behavior: 'smooth' });
                }, 300);
              }
            }}
            onBlur={() => { setRamKlavesnicou(false); setTimeout(() => setIsFocused(false), 200); }}
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

          {/* Nápoveda, že sa hľadá klávesom Enter. Bar nemá odosielacie tlačidlo,
              takže bez nej to nie je zrejmé. Ukáže sa, až keď je čo odoslať,
              a na úzkych displejoch sa skryje (miesto tam patrí textu). */}
          {query && (
            <motion.span
              aria-hidden="true"
              className="hero-search-enter"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                flexShrink: 0,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontFamily: 'var(--font-heading)',
                fontSize: 10,
                letterSpacing: '.1em',
                color: T.countChipText,
                background: T.chipBg,
                border: `1px solid ${T.chipBorder}`,
                borderRadius: 999,
                padding: '4px 9px',
              }}
            >
              ⏎ ENTER
            </motion.span>
          )}

          {query && (
            <motion.button
              type="button"
              onClick={clearSearch}
              aria-label="Vymazať vyhľadávanie"
              style={{
                flexShrink: 0,
                border: `1px solid ${T.chipBorder}`,
                background: T.clearBg,
                color: T.clearText,
                width: 28,
                height: 28,
                borderRadius: 999,
                fontSize: 13,
                lineHeight: 1,
                cursor: 'pointer',
                transition: 'background 180ms ease, color 180ms ease, border-color 180ms ease',
              }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = T.amber;
                e.currentTarget.style.color = 'var(--hr-surface)';
                e.currentTarget.style.borderColor = T.amber;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = T.clearBg;
                e.currentTarget.style.color = T.clearText;
                e.currentTarget.style.borderColor = T.chipBorder;
              }}
            >
              ✕
            </motion.button>
          )}

          {/* Odosielacie tlačidlo z handoffu. Doteraz sa hľadalo len klávesom
              Enter — dala to tušiť iba nápoveda „⏎ ENTER", ktorá sa navyše
              objaví až keď je čo odoslať, a na dotykovej obrazovke klávesu
              Enter nikto nehľadá. */}
          <button
            type="button"
            /* Prázdne pole tlačidlo NEVYPÍNA — zoslabnutá terakota vyzerala
               ako chyba a v handoffe je tlačidlo stále plné. Klik bez zadania
               postaví kurzor do poľa, čo je to jediné zmysluplné. */
            onClick={() => (trimmed ? openResultsPage() : inputRef.current?.focus())}
            className="hero-search-odoslat"
          >
            Hľadať
          </button>
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
              // Zladené s barom (18), inak roletka pôsobí ako cudzí prvok pod ním.
              borderRadius: 18,
              boxShadow: '0 26px 64px -24px rgba(60,40,15,.55), inset 0 1px 0 rgba(255,255,255,.75)',
              overflow: 'hidden',
              zIndex: 60,
            }}
          >
            {/* Rovnaký zlatý vlások ako na bare — spája ich do jedného celku. */}
            <span
              aria-hidden="true"
              style={{
                position: 'absolute', left: 0, right: 0, top: 0, height: 2,
                background: `linear-gradient(90deg, transparent, ${T.amberLight}, transparent)`,
                opacity: 0.5, pointerEvents: 'none',
              }}
            />
            <div
              id="search-dropdown-results"
              role="listbox"
              className="search-dropdown-scroll"
              style={{ maxHeight: 'min(460px, 48vh)', overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '6px 0' }}
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
                  {searching
                    ? 'Hľadám…'
                    : <>Pre „<strong style={{ color: T.amber }}>{query}</strong>" sme nič nenašli.</>}
                </div>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '9px 18px',
                borderTop: `1px solid ${T.dividerStrong}`,
                background: T.footerBg,
                fontFamily: 'var(--font-serif)',
                fontSize: 14,
                color: T.textSecondary,
              }}
            >
              {hasResults && (
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={openResultsPage}
                  style={{
                    border: 'none', background: 'transparent', cursor: 'pointer',
                    color: T.amber, fontWeight: 600, fontFamily: 'var(--font-serif)',
                    fontSize: 14, padding: 0, textDecoration: 'underline',
                  }}
                >
                  Zobraziť všetky výsledky
                </button>
              )}
              <span style={{ marginLeft: 'auto' }}>{hits.length} výsledkov</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
