'use client';

/**
 * Horná lišta — návrh pre redakčný šat. Žije LEN v laboratóriu; produkčná
 * `TwoTierNav.tsx` sa nedotýka.
 *
 * ZACHOVANÉ z pôvodnej lišty:
 *   • dva riadky kategórií — zmestia sa tak VŠETKY (je ich 14),
 *   • klik na kategóriu otvorí roletku so zoznamom jej článkov a odkazom
 *     „Zobraziť všetky"; naraz je otvorená najviac jedna, zatvára ju klik mimo
 *     aj Esc.
 *
 * DVE CHYBY Z PRVEJ VERZIE, KTORÉ SÚ TU OPRAVENÉ:
 *   1. do lišty sa dostalo len 5 kategórií, zvyšných 9 zmizlo za „Ďalšie",
 *   2. keď kategória ešte nemala načítané články (dáta prichádzajú zo Strapi
 *      až po chvíli), klik namiesto roletky rovno odnavigoval. Teraz sa roletka
 *      otvorí vždy a kým sa načítava, povie to.
 *
 * ZMENENÉ oproti pôvodnej: svetlá namiesto tmavohnedej, vlásky namiesto zlatých
 * rámov, podčiarknutie kategórie vyrastá od stredu, roletka je biela karta.
 * Farby idú výhradne cez tokeny `--hr-*`.
 */

import { useEffect, useRef, useState } from 'react';
import { useNavigationData } from '../hooks/useNavigationData';
import { AccountNavLink } from '../components/AccountNavLink';
import type { NavigationItem } from '../data/navigation-structure';

/**
 * Delenie kategórií. Pôvodná lišta ho už používala, len ho nedávala najavo —
 * oba riadky vyzerali rovnako, takže 14 položiek pôsobilo ako stena. Tu každý
 * riadok dostal tichý názov, čím sa z hromady stane štruktúra:
 *   riadok 1 — TYPY HRADÍSK (podľa funkcie sídla)
 *   riadok 2 — ĎALŠÍ OBSAH (pramene, texty, modely, dianie)
 */
const PRIMARY_SLUGS = new Set([
  'kniezacie-sidla', 'mocenske-centra', 'strazna-funkcia',
  'refugia', 'staroveke-sidla', 'vseobecne-o-hradiskach',
]);
// „Ostatné" má 0 článkov — v lište nemá čo robiť (rovnako ako v pôvodnej).
const EXCLUDE_SLUGS = new Set(['ostatne']);
const catSlug = (i: NavigationItem) => (i.slug || '').replace('/category/', '').replace(/^\//, '');

/**
 * Skrátené názvy PRE LIŠTU. Plné znenie ostáva všade inde — v roletke, na
 * stránke kategórie aj v pätičke; tu ide len o to, aby sa rad zmestil na jeden
 * riadok. „Strážna a hospodárska funkcia" a „Všeobecne o hradiskách" spolu
 * zaberali skoro 200 px, čo stačilo na to, aby posledná kategória vypadla
 * mimo obrazovku bez akéhokoľvek náznaku, že tam ešte niečo je.
 *
 * Kľúč je slug, nie názov — keby sa kategória v Strapi premenovala, skratka
 * sa prestane používať a v lište sa objaví nové plné znenie. To je správne:
 * lepšie dlhý názov než nesprávny.
 */
const SHORT: Record<string, string> = {
  'strazna-funkcia': 'Strážna funkcia',
  'vseobecne-o-hradiskach': 'Všeobecne',
  'svatyne-a-sakralne-objekty': 'Svätyne',
  'listiny-a-pisomne-zdroje': 'Listiny a pramene',
  '3d-modely': '3D modely',
  'informacne-tabule': 'Tabule',
};
const shortLabel = (i: NavigationItem) => SHORT[catSlug(i)] ?? i.label;

export function LabNav() {
  const { items, loading } = useNavigationData();
  /**
   * Otvorená roletka. Drží sa aj vodorovná poloha tlačidla, lebo panel sa
   * NEVYKRESĽUJE vnútri radu, ale až na úrovni celej lišty.
   *
   * Prečo: rady majú `overflow` (prvý kvôli posúvaniu do strany, druhý kvôli
   * animácii rozbalenia). Panel vnútri radu si tým rad oreže — prvému radu
   * roletka vôbec nebola vidieť. A keď sa orezanie zrušilo, zas pretiekli
   * kategórie cez služobné odkazy. Panel mimo radu obe veci rieši naraz.
   */
  const [open, setOpen] = useState<{ label: string; left: number } | null>(null);
  // Druhý riadok je zbalený a rozvinie sa, keď je myš nad lištou — mechanika
  // z pôvodnej lišty. Drží sa otvorený aj vtedy, keď je z neho otvorená roletka,
  // inak by sa zavrel spod ruky.
  const [hovered, setHovered] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const catsRef = useRef<HTMLDivElement>(null);
  // Sleduje, či rad kategórií pretečie — podľa toho sa ukáže vytratenie na
  // okraji. Bez toho by sa odrezaná kategória nedala od konca zoznamu rozoznať.
  const [overflow, setOverflow] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  /**
   * Mobilná ponuka. Dva rady kategórií, ktoré sa na počítači vysúvajú myšou,
   * sú na dotyku nedosiahnuteľné — druhý rad sa rozvinie iba pri `hover`,
   * ktorý na telefóne neexistuje. Preto má telefón vlastnú ponuku: zoznam
   * kategórií, ktorý sa rozbaľuje ťuknutím.
   */
  const [menuOpen, setMenuOpen] = useState(false);
  const [openMobileCat, setOpenMobileCat] = useState<string | null>(null);

  useEffect(() => {
    if (open === null) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(null);
    };
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(null); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  useEffect(() => {
    const el = catsRef.current?.querySelector('.lnav-cats-row') as HTMLElement | null;
    if (!el) return;
    const check = () => {
      setOverflow(el.scrollWidth > el.clientWidth + 4);
      setScrolled(el.scrollLeft > 4);
    };
    check();
    el.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    return () => { el.removeEventListener('scroll', check); window.removeEventListener('resize', check); };
  }, [items]);

  /* Kým je ponuka otvorená, stránka pod ňou sa nesmie posúvať — inak sa pri
     dlhom zozname skroluje pozadie a ponuka ostane visieť. */
  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('keydown', onEsc);
    return () => { document.body.style.overflow = prev; document.removeEventListener('keydown', onEsc); };
  }, [menuOpen]);

  const cats = items.filter(i => i.slug !== '/' && !EXCLUDE_SLUGS.has(catSlug(i)));
  const openCat = open ? cats.find(c => c.label === open.label) ?? null : null;

  const rows = [
    { label: 'Typy hradísk', items: cats.filter(c => PRIMARY_SLUGS.has(catSlug(c))) },
    { label: 'Ďalší obsah', items: cats.filter(c => !PRIMARY_SLUGS.has(catSlug(c))) },
  ];
  const secondaryOpen = open !== null && rows[1].items.some(c => c.label === open.label);

  return (
    <nav
      ref={rootRef}
      className="lnav"
      data-expanded={hovered || secondaryOpen ? 'true' : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="lnav-row">
        <a href="/" className="lnav-brand" aria-label="Hradiská — domov">
          {/* Priehľadná verzia loga (podklad odstránený skôr) — v kruhu by
              sivý štvorec pôvodného súboru vyzeral ako nalepený štítok. */}
          <span className="lnav-mark">
            <picture>
              <source srcSet="/logo_hradiska_small.webp" type="image/webp" />
              <img src="/logo_hradiska_small.png" alt="" aria-hidden="true" />
            </picture>
          </span>
          <span>Hradiská</span>
        </a>

        <div className="lnav-cats" ref={catsRef} data-overflow={overflow ? 'true' : undefined} data-scrolled={scrolled ? 'true' : undefined}>
          {rows.map(row => (
            <div className="lnav-cats-row" key={row.label} data-secondary={row.label === 'Ďalší obsah' ? 'true' : undefined}>
              {/* Názov nesie len druhý rad — ten sa vysúva a treba povedať, čo
                  pribudlo. Prvý rad je hlavná navigácia a popisovať ju je šum;
                  navyše tým získa 122 px, vďaka čomu sa zmestí na jeden riadok. */}
              {row.label === 'Ďalší obsah' && <span className="lnav-rowlabel">{row.label}</span>}
              {row.items.map(cat => (
                <CatButton
                  key={cat.label}
                  cat={cat}
                  open={open?.label === cat.label}
                  onToggle={(left) => setOpen(prev => (prev?.label === cat.label ? null : { label: cat.label, left }))}
                />
              ))}
            </div>
          ))}
        </div>

        <div className="lnav-right">
          <a href="/galeria" className="lnav-link">Galéria</a>
          <a href="/aktuality" className="lnav-link">Aktuality</a>
          <AccountNavLink />
          {/* Ponuka pre dotyk. Cieľ má 44 × 44 px — menšie sa palcom trafí ťažko. */}
          <button
            type="button"
            className="lnav-burger"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Zavrieť ponuku' : 'Otvoriť ponuku'}
            onClick={() => setMenuOpen(v => !v)}
          >
            <span className="lnav-burger-i" data-open={menuOpen ? 'true' : undefined} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* ── Mobilná ponuka ──────────────────────────────────────────────── */}
      {menuOpen && (
        <div className="lnav-mobile" role="dialog" aria-label="Ponuka">
          {rows.map(row => (
            <div className="lnav-m-group" key={row.label}>
              <span className="lnav-m-label">{row.label}</span>
              {row.items.map(cat => {
                const isOpen = openMobileCat === cat.label;
                const children = cat.children ?? [];
                return (
                  <div className="lnav-m-cat" key={cat.label}>
                    <button
                      type="button"
                      className="lnav-m-btn"
                      data-open={isOpen ? 'true' : undefined}
                      aria-expanded={isOpen}
                      onClick={() => setOpenMobileCat(prev => (prev === cat.label ? null : cat.label))}
                    >
                      <span>{cat.label}</span>
                      {typeof cat.count === 'number' && cat.count > 0 && <span className="lnav-m-count">{cat.count}</span>}
                      <span className="lnav-m-chev" aria-hidden="true">{isOpen ? '–' : '+'}</span>
                    </button>
                    {isOpen && (
                      <div className="lnav-m-list">
                        {children.length > 0
                          ? children.map(ch => (
                              <a key={(ch.slug ?? '') + ch.label} href={ch.slug ?? '#'} onClick={() => setMenuOpen(false)}>
                                {ch.label}
                              </a>
                            ))
                          : <span className="lnav-m-empty">{loading ? 'Načítavam články…' : 'Zatiaľ bez článkov.'}</span>}
                        {cat.slug && (
                          <a className="lnav-m-all" href={cat.slug} onClick={() => setMenuOpen(false)}>
                            Zobraziť všetky{typeof cat.count === 'number' && cat.count > 0 ? ` (${cat.count})` : ''} <span aria-hidden="true">→</span>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
          <div className="lnav-m-group lnav-m-service">
            <a href="/galeria" onClick={() => setMenuOpen(false)}>Galéria</a>
            <a href="/aktuality" onClick={() => setMenuOpen(false)}>Aktuality</a>
          </div>
        </div>
      )}

      {/* Roletka mimo radov — viď poznámka pri `open` vyššie. */}
      {openCat && (
        <Panel cat={openCat} left={open!.left} loading={loading} onClose={() => setOpen(null)} />
      )}
    </nav>
  );
}

function CatButton({ cat, open, onToggle }: {
  cat: NavigationItem; open: boolean; onToggle: (left: number) => void;
}) {
  return (
    <div className="lnav-cat">
      <button
        type="button"
        className="lnav-cat-btn"
        data-open={open ? 'true' : undefined}
        aria-haspopup="menu"
        aria-expanded={open}
        title={cat.label}
        onClick={(e) => {
          // Poloha tlačidla voči lište — panel sa vykresľuje mimo radu, takže
          // si ju musí niesť so sebou.
          const nav = e.currentTarget.closest('.lnav') as HTMLElement | null;
          const b = e.currentTarget.getBoundingClientRect();
          const n = nav?.getBoundingClientRect();
          onToggle(n ? b.left - n.left : b.left);
        }}
      >
        {shortLabel(cat)}
        {typeof cat.count === 'number' && cat.count > 0 && <span className="lnav-count">{cat.count}</span>}
      </button>
    </div>
  );
}

/** Roletka. Vykresľuje sa na úrovni lišty, nie v rade — viď poznámka pri `open`. */
function Panel({ cat, left, loading, onClose }: {
  cat: NavigationItem; left: number; loading: boolean; onClose: () => void;
}) {
  const children = cat.children ?? [];
  // Pri tlačidle blízko pravého okraja by panel pretiekol mimo obrazovku —
  // vtedy sa ukotví tak, aby sa doň zmestil.
  const W = 380;
  const maxLeft = typeof window !== 'undefined' ? window.innerWidth - W - 24 : left;
  const x = Math.max(12, Math.min(left, maxLeft));

  return (
    <div className="lnav-panel" role="menu" aria-label={`${cat.label} – zoznam lokalít`} style={{ left: x }}>
      <div className="lnav-panel-head">
        {cat.label}
        {typeof cat.count === 'number' && cat.count > 0 && <span>{cat.count}</span>}
      </div>
      {children.length > 0 ? (
        <div className="lnav-panel-list">
          {children.map(ch => (
            <a key={(ch.slug ?? '') + ch.label} href={ch.slug ?? '#'} role="menuitem" onClick={onClose}>
              {ch.label}
            </a>
          ))}
        </div>
      ) : (
        <div className="lnav-panel-empty">
          {loading ? 'Načítavam články…' : 'V tejto kategórii zatiaľ nie sú články.'}
        </div>
      )}
      {cat.slug && (
        <a className="lnav-panel-all" href={cat.slug} onClick={onClose}>
          Zobraziť všetky{typeof cat.count === 'number' && cat.count > 0 ? ` (${cat.count})` : ''} <span aria-hidden="true">→</span>
        </a>
      )}
    </div>
  );
}

export default LabNav;
