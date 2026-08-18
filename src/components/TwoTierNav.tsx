'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { NavigationItem } from '../data/navigation-structure';
import { AccountNavLink } from './AccountNavLink';

/**
 * Dvojriadková horná lišta — varianta 2A „Dvojriadková lišta".
 *
 * Riadok 1 (primary): hlavné kategórie (typy hradísk) — vždy viditeľný.
 * Riadok 2 (secondary): ostatné kategórie — skrytý, vysunie sa pri :hover nad
 *   lištou (čisté CSS, viď globals.css → [data-sec]).
 * Oba riadky používajú IDENTICKÝ štýl tlačidiel (sú rovnocenné).
 *
 * Klik na kategóriu otvorí roletku (pergamenový panel) so zoznamom lokalít/blogov
 * danej kategórie + odkaz „Zobraziť všetky (n) →". Otvorená je vždy max. jedna
 * (accordion). Dáta sú živé zo Strapi (useNavigationData) — názvy, počty aj
 * odkazy sa preberajú bez zmeny.
 */

// ── Design tokens (2A) ───────────────────────────────────────────────────────
const NAV_GRADIENT = 'linear-gradient(180deg,var(--hr-dark) 0%,var(--hr-dark-2) 100%)';
const NAV_BORDER_GOLD = 'var(--hr-accent)';
const CAT_TEXT = 'var(--hr-on-dark)';
const CAT_TEXT_ACTIVE = 'var(--hr-on-dark-strong)';
const CAT_OPEN_BG = 'var(--hr-line)';
const CAT_HOVER_BG = 'var(--hr-line)';
const CAT_UNDERLINE = 'var(--hr-accent-soft)';
const BADGE_BG = 'var(--hr-accent-soft)';
const BADGE_TEXT = 'var(--hr-dark-2)';
const HAIRLINE = 'var(--hr-dark-line)';
// Roletka (pergamen)
const ROLETKA_BG = 'var(--hr-surface-2)';
const ROLETKA_BORDER = 'var(--hr-line-gold)';
const ROLETKA_ACCENT = 'var(--hr-accent)';
const ROLETKA_ITEM = 'var(--hr-ink-2)';
const ROLETKA_ITEM_HOVER_BG = 'var(--hr-surface-3)';
const ROLETKA_DIVIDER = 'var(--hr-line-strong)';

const FONT_CINZEL = '"Cinzel", Georgia, "Times New Roman", serif';
const FONT_BODY = '"Cormorant Garamond", Georgia, "Times New Roman", serif';

// Slugy kategórií, ktoré patria do 1. riadku (typy hradísk, Strapi order 1–5).
// Všetko ostatné (vrátane budúcich kategórií) spadne do 2. riadku — presne to
// je zámer: hlavné typy hore, zvyšok pod hover-odhalením.
const PRIMARY_SLUGS = new Set([
  'kniezacie-sidla',
  'mocenske-centra',
  'strazna-funkcia',
  'refugia',
  'staroveke-sidla',
  'vseobecne-o-hradiskach',
]);

// Kategórie, ktoré sa v lište vôbec nezobrazujú (napr. prázdna „Ostatné").
const EXCLUDE_SLUGS = new Set(['ostatne']);

function categorySlug(item: NavigationItem): string {
  return (item.slug || '').replace('/category/', '').replace(/^\//, '');
}

interface TwoTierNavProps {
  items: NavigationItem[];
  /** Auto-hide: keď true, lišta sa vysunie nahor (skryje). */
  hidden?: boolean;
  /** Hlásenie hoveru nad lištou — rodič vtedy pozastaví auto-hide. */
  onHover?: (hovered: boolean) => void;
}

export function TwoTierNav({ items, hidden = false, onHover }: TwoTierNavProps) {
  // id práve otvorenej roletky (accordion — max. jedna naraz)
  const [open, setOpen] = useState<string | null>(null);
  // po tape na pull-tab (dotyk, kde :hover neexistuje) drž 2. riadok otvorený
  const [secPinned, setSecPinned] = useState(false);
  const rootRef = useRef<HTMLElement>(null);

  // ── Rozdelenie na dva riadky ───────────────────────────────────────────────
  const { primary, secondary } = useMemo(() => {
    // „Úvod" (slug '/') sa v lište nezobrazuje — chceme len 2 riadky kategórií.
    const cats = items.filter(
      (i) => i.slug !== '/' && !EXCLUDE_SLUGS.has(categorySlug(i))
    );
    const primaryCats = cats.filter((i) => PRIMARY_SLUGS.has(categorySlug(i)));
    const secondaryCats = cats.filter((i) => !PRIMARY_SLUGS.has(categorySlug(i)));
    return {
      primary: primaryCats,
      secondary: secondaryCats,
    };
  }, [items]);

  const secondaryIds = useMemo(
    () => new Set(secondary.map((c) => c.slug || c.label)),
    [secondary]
  );

  // 2. riadok drž rozbalený aj bez hoveru, keď je z neho otvorená roletka,
  // alebo keď ho používateľ „pripol" cez pull-tab.
  const expanded = secPinned || (open !== null && secondaryIds.has(open));

  // Zavri roletku pri kliknutí mimo lišty / Esc.
  useEffect(() => {
    if (open === null) return;
    const onDocDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(null);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null);
    };
    document.addEventListener('mousedown', onDocDown);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocDown);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  return (
    <nav
      ref={rootRef}
      data-tier
      data-expanded={expanded ? 'true' : undefined}
      className="two-tier-nav sticky top-0 z-50"
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
      onClick={(e) => {
        // Klik do prázdnej časti lišty (nie na odkaz/tlačidlo) → scroll na vrch.
        if (!(e.target as HTMLElement).closest('a,button')) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }}
      style={{
        background: NAV_GRADIENT,
        borderBottom: `2px solid ${NAV_BORDER_GOLD}`,
        transform: hidden ? 'translateY(-100%)' : 'translateY(0)',
        transition: 'transform 0.28s ease',
      }}
    >
      <div className="container" style={{ paddingTop: 14, paddingBottom: 16 }}>
        {/* ── Logo (samostatné, naľavo, na úrovni OBOCH riadkov) + kategórie ─ */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
          <a
            href="/"
            aria-label="Slovanské hradiská – domov"
            style={{
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
              textDecoration: 'none',
            }}
          >
            {/* PERF: viď NavBar.tsx — 256 px variant namiesto 5,63 MB originálu.
                .nav-logo je 46 px, pri hoveri scale(1.55) → max ~71 px. */}
            <picture style={{ display: 'contents' }}>
              <source srcSet="/logo_slovanske_hradiska_256.webp" type="image/webp" />
              <img
                className="nav-logo"
                src="/logo_slovanske_hradiska_256.jpg"
                alt="Slovanské hradiská"
                style={{
                  width: 'auto',
                  borderRadius: 8,
                  mixBlendMode: 'multiply',
                  filter: 'contrast(1.05)',
                }}
              />
            </picture>
          </a>

          {/* Pravý stĺpec: dva riadky kategórií (logo sa cez ne centruje) */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Riadok 1: hlavné kategórie (vždy viditeľné) */}
            <CategoryRow cats={primary} openId={open} setOpen={setOpen} />

            {/* Riadok 2: ostatné kategórie (hover-odhalenie) */}
            <div data-sec>
              <CategoryRow cats={secondary} openId={open} setOpen={setOpen} />
            </div>
          </div>

          {/* Appka + účet — prihlásenie alebo odkaz na profil */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            {/* „Získať appku" je len na mobile (v NavBar) — na PC nemá zmysel. */}
            <AccountNavLink />
          </div>
        </div>

        {/* ── Pull-tab „▾" ─────────────────────────────────────────────────── */}
        <div
          data-tabwrap
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: 9,
            opacity: 0.32,
            transition: 'opacity 0.2s ease',
          }}
        >
          <button
            type="button"
            aria-label={expanded ? 'Skryť ďalšie kategórie' : 'Zobraziť ďalšie kategórie'}
            aria-expanded={expanded}
            onClick={() => setSecPinned((v) => !v)}
            style={{
              background: 'transparent',
              border: 0,
              cursor: 'pointer',
              padding: '2px 12px',
              lineHeight: 1,
            }}
          >
            <span
              data-tab
              style={{
                display: 'inline-block',
                fontSize: 11,
                color: 'var(--hr-line-gold)',
                letterSpacing: '0.3em',
                lineHeight: 1,
              }}
            >
              ▾
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
}

// ── Jeden riadok kategórií ────────────────────────────────────────────────────
interface CategoryRowProps {
  cats: NavigationItem[];
  openId: string | null;
  setOpen: (updater: (prev: string | null) => string | null) => void;
}

function CategoryRow({ cats, openId, setOpen }: CategoryRowProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '2px 4px',
      }}
    >
      {cats.map((cat) => (
        <CategoryButton
          key={cat.slug || cat.label}
          cat={cat}
          isOpen={openId === (cat.slug || cat.label)}
          onToggle={setOpen}
        />
      ))}
    </div>
  );
}

// ── Kategória: tlačidlo + roletka ─────────────────────────────────────────────
interface CategoryButtonProps {
  cat: NavigationItem;
  isOpen: boolean;
  onToggle: (updater: (prev: string | null) => string | null) => void;
}

function CategoryButton({ cat, isOpen, onToggle }: CategoryButtonProps) {
  const id = cat.slug || cat.label;
  const blogs = cat.children || [];
  const hasDropdown = blogs.length > 0;
  const showBadge = typeof cat.count === 'number' && cat.count > 0;
  const [alignRight, setAlignRight] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        aria-haspopup={hasDropdown ? 'menu' : undefined}
        aria-expanded={hasDropdown ? isOpen : undefined}
        onClick={(e) => {
          if (!hasDropdown) {
            if (cat.slug) window.location.href = cat.slug;
            return;
          }
          // Roletka je 290px; ak je tlačidlo v pravej polovici okna, ukotvi ju
          // vpravo, nech nepretečie mimo obrazovky.
          const r = e.currentTarget.getBoundingClientRect();
          setAlignRight(r.left > window.innerWidth * 0.5);
          onToggle((prev) => (prev === id ? null : id));
        }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 7,
          cursor: 'pointer',
          fontFamily: FONT_CINZEL,
          fontSize: 13,
          fontWeight: 500,
          letterSpacing: '0.03em',
          lineHeight: 1,
          border: 'none',
          borderRadius: 7,
          padding: '8px 11px',
          background: isOpen ? CAT_OPEN_BG : 'transparent',
          color: isOpen ? CAT_TEXT_ACTIVE : CAT_TEXT,
          boxShadow: isOpen ? `inset 0 -2px 0 ${CAT_UNDERLINE}` : 'none',
          transition: 'background 0.15s, color 0.15s, box-shadow 0.15s',
        }}
        onMouseEnter={(e) => {
          if (!isOpen) e.currentTarget.style.background = CAT_HOVER_BG;
        }}
        onMouseLeave={(e) => {
          if (!isOpen) e.currentTarget.style.background = 'transparent';
        }}
      >
        <span>{cat.label}</span>
        {showBadge && (
          <span
            style={{
              fontFamily: FONT_CINZEL,
              fontSize: 10,
              fontWeight: 700,
              color: BADGE_TEXT,
              background: BADGE_BG,
              borderRadius: 999,
              padding: '1px 6px',
              lineHeight: 1.4,
            }}
          >
            {cat.count}
          </span>
        )}
        {hasDropdown && (
          <span
            aria-hidden="true"
            style={{
              fontSize: 9,
              opacity: 0.75,
              display: 'inline-block',
              transition: 'transform 0.18s',
              transform: `rotate(${isOpen ? 180 : 0}deg)`,
            }}
          >
            ▾
          </span>
        )}
      </button>

      {isOpen && hasDropdown && (
        <Roletka
          cat={cat}
          blogs={blogs}
          alignRight={alignRight}
          onClose={() => onToggle(() => null)}
        />
      )}
    </div>
  );
}

// ── Roletka (dropdown so zoznamom lokalít) ────────────────────────────────────
// Vzhľad prevzatý z pôvodného MegaMenu dropdownu: TMAVÉ pozadie, lokality v
// 2 STĹPCOCH (2 vedľa seba, viac riadkov), ikonka 📍, svetlý text, zlatá pätička.
const ROLETKA_DARK_BG = 'var(--hr-dark-3)';
const ROLETKA_DARK_BORDER = 'var(--hr-line)';
const ROLETKA_DARK_TEXT = 'var(--hr-on-dark-2)';
const ROLETKA_DARK_HOVER_BG = 'var(--hr-line)';
const ROLETKA_DARK_ACCENT = 'var(--hr-badge)';
const ROLETKA_PIN = 'var(--hr-accent-deep)';

interface RoletkaProps {
  cat: NavigationItem;
  blogs: NavigationItem[];
  alignRight: boolean;
  onClose: () => void;
}

function Roletka({ cat, blogs, alignRight, onClose }: RoletkaProps) {
  const total = cat.count ?? blogs.length;
  return (
    <div
      role="menu"
      aria-label={`${cat.label} – zoznam lokalít`}
      style={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        left: alignRight ? 'auto' : 0,
        right: alignRight ? 0 : 'auto',
        zIndex: 70,
        width: 520,
        maxWidth: 'calc(100vw - 32px)',
        background: ROLETKA_DARK_BG,
        border: `1px solid ${ROLETKA_DARK_BORDER}`,
        borderRadius: 12,
        boxShadow: '0 12px 28px rgba(15,10,5,0.5)',
        padding: 8,
        animation: 'roletka 0.16s ease-out',
      }}
    >
      {/* Zoznam lokalít/blogov — 2 stĺpce (scroll pri dlhých zoznamoch) */}
      <div
        className="roletka-scroll"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 2,
          maxHeight: 'min(52vh, 460px)',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {blogs.map((b) => (
          <a
            key={(b.slug || b.label) + b.label}
            href={b.slug || '#'}
            role="menuitem"
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              minWidth: 0,
              padding: '10px 12px',
              borderRadius: 8,
              color: ROLETKA_DARK_TEXT,
              textDecoration: 'none',
              fontFamily: FONT_BODY,
              fontSize: 15,
              lineHeight: 1.2,
              transition: 'background 0.12s, color 0.12s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = ROLETKA_DARK_HOVER_BG;
              e.currentTarget.style.color = ROLETKA_DARK_ACCENT;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = ROLETKA_DARK_TEXT;
            }}
          >
            <MapPin
              style={{ width: 12, height: 12, color: ROLETKA_PIN, flexShrink: 0 }}
            />
            <span
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {b.label}
            </span>
          </a>
        ))}
      </div>

      {/* Pätička: Zobraziť všetky (n) → */}
      {cat.slug && (
        <div
          style={{
            marginTop: 8,
            paddingTop: 8,
            borderTop: `1px solid ${ROLETKA_DARK_BORDER}`,
          }}
        >
          <a
            href={cat.slug}
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              padding: '9px 12px',
              borderRadius: 8,
              fontFamily: FONT_CINZEL,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.04em',
              color: ROLETKA_DARK_ACCENT,
              textDecoration: 'none',
              transition: 'background 0.12s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = ROLETKA_DARK_HOVER_BG;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <span>Zobraziť všetky ({total})</span>
            <span style={{ fontSize: 14 }}>→</span>
          </a>
        </div>
      )}
    </div>
  );
}
