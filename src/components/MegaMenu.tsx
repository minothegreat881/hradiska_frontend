'use client';

import { useEffect, useRef } from 'react';
import { NavigationItem } from '../data/navigation-structure';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, MapPin } from 'lucide-react';

interface MegaMenuProps {
  item: NavigationItem;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

const GOLD = '#c4a574';
const GOLD_BRIGHT = '#e8c56e';
const TEXT_LIGHT = '#f0e8dc';
const DROPDOWN_BG = '#2e2317';
const HOVER_BG = 'rgba(196,165,116,0.15)';
const ACTIVE_BG = 'rgba(196,165,116,0.20)';
const BORDER_GOLD = 'rgba(196,165,116,0.25)';
const PILL_BG = 'rgba(196,165,116,0.18)';

function pluralLokalit(n: number): string {
  if (n === 1) return 'lokalitu';
  if (n < 5) return 'lokality';
  return 'lokalít';
}

export function MegaMenu({ item, isOpen, onToggle, onClose }: MegaMenuProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const hasChildren = !!(item.children && item.children.length > 0);

  useEffect(() => {
    if (!isOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [isOpen, onClose]);

  // Flatten children → grandchildren (ako predtým), limit 12
  const allItems: NavigationItem[] = hasChildren
    ? (item.children as NavigationItem[]).flatMap((c) =>
        c.children && c.children.length > 0 ? c.children : [c]
      )
    : [];
  const limit = 12;
  const displayedItems = allItems.slice(0, limit);
  const hasMore = allItems.length > limit;

  // Dropdown sa zobrazí len pre kategórie s child položkami
  const canOpen = hasChildren && allItems.length > 0;

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => {
          if (canOpen) onToggle();
          else if (item.slug) window.location.href = item.slug;
        }}
        aria-expanded={isOpen}
        aria-haspopup={canOpen ? 'menu' : undefined}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 14px',
          background: isOpen ? ACTIVE_BG : 'transparent',
          border: 0,
          borderRadius: 8,
          color: isOpen ? GOLD_BRIGHT : TEXT_LIGHT,
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: 14,
          cursor: 'pointer',
          transition: 'background 0.15s, color 0.15s',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={(e) => {
          if (!isOpen) (e.currentTarget as HTMLElement).style.background = 'rgba(196,165,116,0.12)';
        }}
        onMouseLeave={(e) => {
          if (!isOpen) (e.currentTarget as HTMLElement).style.background = 'transparent';
        }}
      >
        <span>{item.label}</span>
        {typeof item.count === 'number' && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 22,
              height: 18,
              padding: '0 6px',
              borderRadius: 9999,
              background: PILL_BG,
              color: GOLD_BRIGHT,
              fontSize: 10.5,
              fontWeight: 600,
              letterSpacing: '0.02em',
            }}
          >
            {item.count}
          </span>
        )}
        {canOpen && (
          <ChevronDown
            style={{
              width: 13,
              height: 13,
              transition: 'transform 0.15s',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              opacity: 0.8,
            }}
          />
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && canOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            role="menu"
            aria-label={`${item.label} navigation`}
            style={{
              position: 'absolute',
              left: 0,
              top: 'calc(100% + 8px)',
              width: 520,
              maxWidth: 'calc(100vw - 32px)',
              background: DROPDOWN_BG,
              border: `1px solid ${BORDER_GOLD}`,
              borderRadius: 12,
              padding: 8,
              boxShadow: '0 12px 28px rgba(15,10,5,0.5)',
              zIndex: 60,
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 2,
              }}
            >
              {displayedItems.map((child) => (
                <a
                  key={(child.slug || child.label) + child.label}
                  href={child.slug || '#'}
                  onClick={onClose}
                  role="menuitem"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 12px',
                    borderRadius: 8,
                    color: TEXT_LIGHT,
                    textDecoration: 'none',
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    fontSize: 13.5,
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
                  <MapPin
                    style={{
                      width: 12,
                      height: 12,
                      color: '#a87437',
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {child.label}
                  </span>
                </a>
              ))}
            </div>

            {hasMore && item.slug && (
              <div
                style={{
                  marginTop: 8,
                  paddingTop: 8,
                  borderTop: `1px solid ${BORDER_GOLD}`,
                }}
              >
                <a
                  href={item.slug}
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
                    Zobraziť všetkých {allItems.length} {pluralLokalit(allItems.length)}
                  </span>
                  <span style={{ fontSize: 14 }}>→</span>
                </a>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
