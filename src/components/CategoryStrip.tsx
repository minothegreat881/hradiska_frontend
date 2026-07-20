'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { NavigationItem } from '../data/navigation-structure';
import { usePathname } from '../hooks/usePathname';

const GOLD_BRIGHT = '#e8c56e';
const TEXT_LIGHT = '#f0e8dc';
const TEXT_MUTED = '#a89a82';
const PILL_BG = 'rgba(196,165,116,0.18)';
const NAV_BG = '#1f1611';
const DROPDOWN_BG = '#2e2317';
const HOVER_BG = 'rgba(196,165,116,0.15)';
const BORDER_GOLD = 'rgba(196,165,116,0.25)';

interface CategoryStripProps {
  categories: NavigationItem[];
}

function pluralLokalit(n: number): string {
  if (n === 1) return 'lokalitu';
  if (n < 5) return 'lokality';
  return 'lokalít';
}

interface DropdownState {
  category: NavigationItem;
  /** Trigger's rect at the moment it was opened — the dropdown is a fixed-position
      portal, so it needs its own coordinates instead of relying on a `position:
      relative` ancestor (which would get clipped by the strip's overflow-x). */
  rect: DOMRect;
}

export function CategoryStrip({ categories }: CategoryStripProps) {
  const pathname = usePathname();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const rafRef = useRef<number | null>(null);
  const [dropdown, setDropdown] = useState<DropdownState | null>(null);

  const updateEdges = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const atStart = el.scrollLeft <= 0;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
    const overflowing = el.scrollWidth > el.clientWidth;
    setCanScrollLeft(overflowing && !atStart);
    setCanScrollRight(overflowing && !atEnd);
  }, []);

  const onScroll = useCallback(() => {
    // The open dropdown's position was computed for the trigger's old spot —
    // rather than track it continuously, just close it (same UX many dropdown
    // libraries use when their trigger scrolls out from under them).
    setDropdown(null);
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      updateEdges();
    });
  }, [updateEdges]);

  const scrollByAmount = (dir: 1 | -1) => {
    scrollRef.current?.scrollBy({ left: dir * 220, behavior: 'smooth' });
  };

  useEffect(() => {
    updateEdges();
    const el = scrollRef.current;
    if (!el) return;
    const resizeObserver = new ResizeObserver(updateEdges);
    resizeObserver.observe(el);
    window.addEventListener('resize', updateEdges, { passive: true });
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateEdges);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [updateEdges, categories.length]);

  // Close on outside click / Escape / page scroll while a dropdown is open.
  useEffect(() => {
    if (!dropdown) return;
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        !document.getElementById('category-strip-dropdown')?.contains(target) &&
        !document.getElementById(`category-strip-trigger-${dropdown.category.slug}`)?.contains(target)
      ) {
        setDropdown(null);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDropdown(null);
    };
    // Capture-phase window scroll fires for ANY scrollable descendant's scroll
    // (scroll events don't bubble, but they do propagate through capture) —
    // ignore ones originating inside the dropdown itself, since that panel
    // has its own internal scroll for long category lists.
    const onWindowScroll = (e: Event) => {
      if ((e.target as HTMLElement)?.closest?.('#category-strip-dropdown')) return;
      setDropdown(null);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEsc);
    window.addEventListener('scroll', onWindowScroll, { passive: true, capture: true });
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEsc);
      window.removeEventListener('scroll', onWindowScroll, true);
    };
  }, [dropdown]);

  const allChildren = (cat: NavigationItem): NavigationItem[] =>
    (cat.children || []).flatMap((c) => (c.children && c.children.length > 0 ? c.children : [c]));

  return (
    <div style={{ position: 'relative', minWidth: 0, flex: 1 }}>
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="scrollbar-hide"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          overflowX: 'auto',
          scrollSnapType: 'x proximity',
        }}
      >
        {categories.map((cat) => {
          const isActive = !!cat.slug && (pathname === cat.slug || pathname.startsWith(cat.slug + '/'));
          const children = allChildren(cat);
          const canOpen = children.length > 0;
          const isOpen = dropdown?.category.slug === cat.slug;

          return (
            <button
              key={cat.slug || cat.label}
              id={`category-strip-trigger-${cat.slug}`}
              type="button"
              aria-current={isActive ? 'page' : undefined}
              aria-haspopup={canOpen ? 'menu' : undefined}
              aria-expanded={canOpen ? isOpen : undefined}
              onClick={(e) => {
                if (!canOpen) {
                  if (cat.slug) window.location.href = cat.slug;
                  return;
                }
                if (isOpen) {
                  setDropdown(null);
                } else {
                  setDropdown({ category: cat, rect: e.currentTarget.getBoundingClientRect() });
                }
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                flexShrink: 0,
                whiteSpace: 'nowrap',
                scrollSnapAlign: 'start',
                padding: '8px 12px',
                background: isOpen ? HOVER_BG : 'transparent',
                border: 0,
                borderRadius: 8,
                borderBottom: `2px solid ${isActive ? GOLD_BRIGHT : 'transparent'}`,
                color: isActive || isOpen ? TEXT_LIGHT : TEXT_MUTED,
                textDecoration: 'none',
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: 14,
                cursor: 'pointer',
                transition: 'color 0.15s, border-color 0.15s, background 0.15s',
              }}
              onMouseEnter={(e) => {
                if (!isActive && !isOpen) (e.currentTarget as HTMLElement).style.color = TEXT_LIGHT;
              }}
              onMouseLeave={(e) => {
                if (!isActive && !isOpen) (e.currentTarget as HTMLElement).style.color = TEXT_MUTED;
              }}
            >
              {cat.label}
              {typeof cat.count === 'number' && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 20,
                    height: 16,
                    padding: '0 5px',
                    borderRadius: 9999,
                    background: PILL_BG,
                    color: GOLD_BRIGHT,
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                >
                  {cat.count}
                </span>
              )}
              {canOpen && (
                <ChevronDown
                  style={{
                    width: 12,
                    height: 12,
                    transition: 'transform 0.15s',
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    opacity: 0.8,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Left edge: fade + clickable arrow, only when there's more to the left */}
      <div
        aria-hidden="true"
        style={{
          pointerEvents: 'none',
          position: 'absolute',
          left: 0,
          top: 0,
          height: '100%',
          width: 40,
          background: `linear-gradient(to right, ${NAV_BG}, transparent)`,
          opacity: canScrollLeft ? 1 : 0,
          transition: 'opacity 0.2s',
        }}
      />
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scrollByAmount(-1)}
          aria-label="Posunúť kategórie doľava"
          style={{
            position: 'absolute',
            left: 2,
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 26,
            height: 26,
            borderRadius: '50%',
            border: `1px solid ${BORDER_GOLD}`,
            background: NAV_BG,
            color: TEXT_LIGHT,
            cursor: 'pointer',
            zIndex: 1,
          }}
        >
          <ChevronLeft style={{ width: 14, height: 14 }} />
        </button>
      )}

      {/* Right edge: fade + clickable arrow, only when there's more to the right */}
      <div
        aria-hidden="true"
        style={{
          pointerEvents: 'none',
          position: 'absolute',
          right: 0,
          top: 0,
          height: '100%',
          width: 40,
          background: `linear-gradient(to left, ${NAV_BG}, transparent)`,
          opacity: canScrollRight ? 1 : 0,
          transition: 'opacity 0.2s',
        }}
      />
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scrollByAmount(1)}
          aria-label="Posunúť kategórie doprava"
          style={{
            position: 'absolute',
            right: 2,
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 26,
            height: 26,
            borderRadius: '50%',
            border: `1px solid ${BORDER_GOLD}`,
            background: NAV_BG,
            color: TEXT_LIGHT,
            cursor: 'pointer',
            zIndex: 1,
          }}
        >
          <ChevronRight style={{ width: 14, height: 14 }} />
        </button>
      )}

      {/* Dropdown — portalled to <body> so it isn't clipped by this strip's
          overflow-x: auto (setting one overflow axis forces the other to
          'auto' too, which would otherwise crop anything absolutely
          positioned against a trigger sitting inside the scroll container). */}
      {dropdown &&
        createPortal(
          <DropdownPanel
            category={dropdown.category}
            children_={allChildren(dropdown.category)}
            rect={dropdown.rect}
            onClose={() => setDropdown(null)}
          />,
          document.body
        )}
    </div>
  );
}

interface DropdownPanelProps {
  category: NavigationItem;
  children_: NavigationItem[];
  rect: DOMRect;
  onClose: () => void;
}

function DropdownPanel({ category, children_, rect, onClose }: DropdownPanelProps) {
  const width = 560;
  const maxWidth = window.innerWidth - 32;
  const left = Math.min(rect.left, window.innerWidth - Math.min(width, maxWidth) - 16);

  return (
    <div
      id="category-strip-dropdown"
      role="menu"
      aria-label={`${category.label} navigácia`}
      style={{
        position: 'fixed',
        left: Math.max(16, left),
        top: rect.bottom + 8,
        width,
        maxWidth,
        background: DROPDOWN_BG,
        border: `1px solid ${BORDER_GOLD}`,
        borderRadius: 12,
        padding: 8,
        boxShadow: '0 12px 28px rgba(15,10,5,0.5)',
        zIndex: 60,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        className="nav-dropdown-scroll"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 2,
          maxHeight: 'min(500px, 70vh)',
          overflowY: 'auto',
          paddingRight: 4,
        }}
      >
        {children_.map((child) => (
          <a
            key={(child.slug || child.label) + child.label}
            href={child.slug || '#'}
            onClick={onClose}
            role="menuitem"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: '10px 12px',
              borderRadius: 8,
              color: TEXT_LIGHT,
              textDecoration: 'none',
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: 13.5,
              lineHeight: 1.35,
              transition: 'background 0.12s, color 0.12s',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              el.style.background = HOVER_BG;
              el.style.color = GOLD_BRIGHT;
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.background = 'transparent';
              el.style.color = TEXT_LIGHT;
            }}
          >
            <MapPin style={{ width: 12, height: 12, color: '#a87437', flexShrink: 0, marginTop: 3 }} />
            <span style={{ whiteSpace: 'normal', overflowWrap: 'break-word', wordBreak: 'break-word' }}>
              {child.label}
            </span>
          </a>
        ))}
      </div>

      {category.slug && children_.length > 0 && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${BORDER_GOLD}`, flexShrink: 0 }}>
          <a
            href={category.slug}
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              padding: '10px 12px',
              borderRadius: 8,
              color: GOLD_BRIGHT,
              textDecoration: 'none',
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: '0.02em',
              transition: 'background 0.12s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = HOVER_BG;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'transparent';
            }}
          >
            <span>
              Zobraziť všetkých {children_.length} {pluralLokalit(children_.length)}
            </span>
            <span style={{ fontSize: 14 }}>→</span>
          </a>
        </div>
      )}
    </div>
  );
}
