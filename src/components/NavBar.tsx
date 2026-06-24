'use client';

import { useState, useEffect } from 'react';
import { Menu, X, Moon, Sun, ChevronDown, MapPin } from 'lucide-react';
import { mainNavigation, NavigationItem } from '../data/navigation-structure';
import { motion, AnimatePresence } from 'motion/react';
import { MegaMenu } from './MegaMenu';

const NAV_BG = '#1f1611';
const NAV_BG_DARKER = '#1f1611';
const GOLD = '#c4a574';
const GOLD_BRIGHT = '#e8c56e';
const TEXT_LIGHT = '#f0e8dc';
const TEXT_MUTED = '#a89a82';
const BORDER_GOLD = 'rgba(196,165,116,0.25)';
const HOVER_BG = 'rgba(196,165,116,0.15)';
const ACTIVE_BG = 'rgba(196,165,116,0.20)';
const PILL_BG = 'rgba(196,165,116,0.18)';
const NAV_HEIGHT = 64;

function pluralLokalit(n: number): string {
  if (n === 1) return 'lokalitu';
  if (n < 5) return 'lokality';
  return 'lokalít';
}

// ---------- Mobile accordion item ----------
interface MobileItemProps {
  item: NavigationItem;
  onItemClick: () => void;
}

function MobileAccordion({ item, onItemClick }: MobileItemProps) {
  const [open, setOpen] = useState(false);
  const hasChildren = !!(item.children && item.children.length > 0);

  const allItems: NavigationItem[] = hasChildren
    ? (item.children as NavigationItem[]).flatMap((c) =>
        c.children && c.children.length > 0 ? c.children : [c]
      )
    : [];
  const limit = 12;
  const displayed = allItems.slice(0, limit);
  const hasMore = allItems.length > limit;

  // Plain link (no children)
  if (!hasChildren) {
    return (
      <a
        href={item.slug || '#'}
        onClick={onItemClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px',
          color: TEXT_LIGHT,
          textDecoration: 'none',
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: 15,
          borderRadius: 10,
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
            }}
          >
            {item.count}
          </span>
        )}
      </a>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          padding: '14px 16px',
          background: open ? ACTIVE_BG : 'transparent',
          border: 0,
          borderRadius: 10,
          color: open ? GOLD_BRIGHT : TEXT_LIGHT,
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: 15,
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          {item.label}
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
              }}
            >
              {item.count}
            </span>
          )}
        </span>
        <ChevronDown
          style={{
            width: 16,
            height: 16,
            transition: 'transform 0.2s',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            opacity: 0.8,
          }}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '4px 8px 8px 8px' }}>
              {displayed.map((child) => (
                <a
                  key={(child.slug || child.label) + child.label}
                  href={child.slug || '#'}
                  onClick={onItemClick}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 12px',
                    borderRadius: 8,
                    color: TEXT_LIGHT,
                    textDecoration: 'none',
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    fontSize: 14,
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
              {hasMore && item.slug && (
                <a
                  href={item.slug}
                  onClick={onItemClick}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    marginTop: 4,
                    padding: '10px 12px',
                    borderTop: `1px solid ${BORDER_GOLD}`,
                    color: GOLD_BRIGHT,
                    textDecoration: 'none',
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  <span>
                    Zobraziť všetkých {allItems.length} {pluralLokalit(allItems.length)}
                  </span>
                  <span style={{ fontSize: 14 }}>→</span>
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------- NavBar ----------
export function NavBar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setDarkMode(isDark);
  }, []);

  // Zatvor desktop dropdown pri otvorení mobile menu (a naopak)
  useEffect(() => {
    if (mobileMenuOpen) setOpenMenu(null);
  }, [mobileMenuOpen]);

  // Lock body scroll keď je mobile menu otvorené
  useEffect(() => {
    if (mobileMenuOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [mobileMenuOpen]);

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
    setDarkMode(!darkMode);
  };

  return (
    <>
      <nav
        className="sticky top-0 z-50"
        style={{
          background: NAV_BG,
          borderBottom: `1px solid ${BORDER_GOLD}`,
          boxShadow: scrolled
            ? '0 4px 12px rgba(15,10,5,0.35)'
            : '0 1px 0 rgba(15,10,5,0.2)',
          transition: 'box-shadow 0.3s',
        }}
      >
        <div className="container">
          <div
            className="flex items-center justify-between"
            style={{ height: NAV_HEIGHT }}
          >
            {/* Logo + názov */}
            <a
              href="/"
              aria-label="Slovanské hradiská - domov"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                textDecoration: 'none',
              }}
            >
              <img
                src="/logo_slovanske_hradiska.jpg"
                alt="Slovanské hradiská"
                style={{
                  height: 44,
                  width: 'auto',
                  mixBlendMode: 'multiply',
                  filter: 'contrast(1.05)',
                }}
              />
              <span
                className="hidden md:inline"
                style={{
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontSize: 17,
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  color: TEXT_LIGHT,
                }}
              >
                Slovanské hradiská
              </span>
            </a>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center" style={{ gap: 2 }}>
              {mainNavigation.map((item) => (
                <MegaMenu
                  key={item.label}
                  item={item}
                  isOpen={openMenu === item.label}
                  onToggle={() =>
                    setOpenMenu((cur) => (cur === item.label ? null : item.label))
                  }
                  onClose={() => setOpenMenu(null)}
                />
              ))}
            </div>

            {/* Akčné tlačidlá */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                type="button"
                onClick={toggleDarkMode}
                aria-label={darkMode ? 'Svetlý režim' : 'Tmavý režim'}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 38,
                  height: 38,
                  borderRadius: 8,
                  background: 'transparent',
                  border: 0,
                  color: TEXT_LIGHT,
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = HOVER_BG;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                {darkMode ? (
                  <Sun style={{ width: 20, height: 20 }} />
                ) : (
                  <Moon style={{ width: 20, height: 20 }} />
                )}
              </button>

              <button
                type="button"
                onClick={() => setMobileMenuOpen((o) => !o)}
                className="lg:hidden"
                aria-label="Menu"
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-nav-menu"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 38,
                  height: 38,
                  borderRadius: 8,
                  background: 'transparent',
                  border: 0,
                  color: TEXT_LIGHT,
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = HOVER_BG;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                {mobileMenuOpen ? (
                  <X style={{ width: 22, height: 22 }} />
                ) : (
                  <Menu style={{ width: 22, height: 22 }} />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Spodný akcent: jemná zlatá hairline pod lištou (vždy) */}
        <div
          style={{
            height: 1,
            background: `linear-gradient(90deg, transparent, ${BORDER_GOLD} 20%, ${BORDER_GOLD} 80%, transparent)`,
          }}
        />

        {/* Ornament len keď nie sme scrollovaní */}
        <AnimatePresence>
          {!scrolled && (
            <motion.div
              key="nav-ornament"
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              exit={{ opacity: 0, scaleX: 0 }}
              transition={{ duration: 0.4 }}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: -2,
                height: 2,
                background: `linear-gradient(90deg, transparent, ${GOLD} 50%, transparent)`,
                opacity: 0.5,
                transformOrigin: 'center',
                pointerEvents: 'none',
              }}
            />
          )}
        </AnimatePresence>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileMenuOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                top: NAV_HEIGHT,
                background: 'rgba(15,10,5,0.4)',
                zIndex: 39,
              }}
              aria-hidden="true"
            />

            {/* Panel */}
            <motion.div
              id="mobile-nav-menu"
              className="lg:hidden"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'fixed',
                top: NAV_HEIGHT,
                left: 0,
                right: 0,
                bottom: 0,
                background: NAV_BG,
                zIndex: 40,
                overflowY: 'auto',
                borderTop: `1px solid ${BORDER_GOLD}`,
              }}
            >
              <div className="container" style={{ padding: '12px 16px 32px 16px' }}>
                {mainNavigation.map((item) => (
                  <div key={item.label} style={{ marginBottom: 4 }}>
                    <MobileAccordion
                      item={item}
                      onItemClick={() => setMobileMenuOpen(false)}
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
