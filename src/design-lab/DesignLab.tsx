'use client';

/**
 * DESIGN LAB — skúšanie farebného šatu domovskej stránky.
 *
 * Otvára sa na `/design`. Vykresľuje SKUTOČNÚ domovskú stránku (`HomePage`) —
 * tie isté komponenty, to isté poradie, tie isté animácie. Mení sa iba farba,
 * a to zvonku, cez prekrytie v `theme.css` zapuzdrené pod `.lab`.
 *
 * PRODUKCIA SA NEDOTÝKA: žiadny komponent ani `globals.css` sa nemenia.
 * Keď sa na téme zhodneme, prenesie sa do produkčných tokenov naraz —
 * dovtedy je to len skúšobná plocha.
 *
 * ŠTRUKTÚRA OSTÁVA: titulná fotografia → searchbar → aktuality → mapa →
 * kategórie → text s formulárom. Nič sa nepresúva ani nenahrádza.
 */

import { lazy, Suspense, useEffect, useState } from 'react';
import { HomePage } from '../pages/HomePage';
import { ArticlePage } from '../pages/ArticlePage';
import { LabArticle } from './LabArticle';
import { Footer } from '../components/Footer';
import { NavBar } from '../components/NavBar';
import { LabNav } from './LabNav';
import { LabHome } from './LabHome';
import { LabJoinUs } from './LabJoinUs';
import { LabCategories } from './LabCategories';
import { LabFooter } from './LabFooter';
const GalleryPage = lazy(() => import('../pages/GalleryPage').then(m => ({ default: m.GalleryPage })));
const LabGaleria = lazy(() => import('./LabGaleria'));
import './theme.css';

/* Písmo a skladba sú vo všetkých témach rovnaké (Fraunces na nadpisy + Inter na text,
   redakčný rozvrh) — líši sa výhradne farebná skladba. */
const THEMES = [
  { id: 'povodna', label: 'Pôvodná', note: 'Cinzel · pergamen · zlato — dnešný stav' },
  { id: 'uhlie', label: 'Uhlie', note: 'neutrálny papier · antracit · medená iskra' },
  /* Nové kombinácie. Iskra je v každej teplá (pravidlo šatu), mení sa podklad
     a to, o akú dvojicu ide — viď poznámky pri paletách v `theme.css`. */
  { id: 'patina', label: 'Patina', note: 'zelenkastý papier · zelenočierna · bronz — bronz a patina na ňom' },
  { id: 'bridlica', label: 'Bridlica', note: 'bridlicová šeď · modročierna · med — kameň a teplá iskra oproti sebe' },
  { id: 'mach', label: 'Mach', note: 'olivová · machová čierň · hrdza — zarastený val a hrdzavé železo' },
  { id: 'pecat', label: 'Pečať', note: 'pieskovec · atramentová čierň · pečatná červená — ZVOLENÝ ŠTÝL' },
  { id: 'hlina', label: 'Hlina', note: 'krém · sýta hrdzavá · tmavohnedá' },
  { id: 'okra', label: 'Okra', note: 'teplá kosť · volová krv · horčicová' },
  { id: 'terakota', label: 'Terakota', note: 'kostený papier · pálená hlina · okrová — najtichšia' },
];

export default function DesignLab() {
  // Bez `?t=` sa otvára zvolený šat, nie prvý pokus v poradí.
  const initial = typeof window !== 'undefined'
    ? (new URLSearchParams(window.location.search).get('t') || 'pecat')
    : 'pecat';
  const [theme, setTheme] = useState(initial);
  const current = THEMES.find(t => t.id === theme) ?? THEMES[0];

  /* Laboratórium má dve plochy: domovskú (`/design`) a stránku článku
     (`/design/blog/<slug>`). Cesta sa číta raz pri otvorení — prepínač tém
     ju zachová, aby sa dal ten istý článok pozrieť v každom šate. */
  const path = typeof window !== 'undefined' ? window.location.pathname : '/design';
  const articleSlug = path.startsWith('/design/blog/')
    ? decodeURIComponent(path.slice('/design/blog/'.length).replace(/\/$/, ''))
    : null;
  /* Ďalšie stránky webu v šate. Vykresľujú sa PRODUKČNÉ komponenty — tie sú
     potokenizované, takže šat si nesú samy a netreba pre ne druhú verziu.
     Laboratórium je tu na to, aby sa dali pozrieť pred nasadením. */
  const podstranka = path.startsWith('/design/galeria') ? 'galeria' : null;

  const pick = (id: string) => {
    setTheme(id);
    window.history.replaceState(null, '', `${path}?t=${id}`);
  };

  /**
   * Odkazy vnútri laboratória vedú na produkčné adresy (`/`, `/blog/…`),
   * lenže tie sú v starom šate — jedno ťuknutie na logo a človek je zrazu
   * na hnedom pergamene a myslí si, že tak vyzerá návrh. Kde má lab vlastnú
   * plochu, klik sa preto presmeruje na ňu a téma sa nesie so sebou.
   *
   * Kategórie, galéria a aktuality labovú plochu nemajú, takže tie
   * z laboratória naozaj odvedú — inak by sa tvárili, že existujú.
   */
  const keepInLab = (e: React.MouseEvent) => {
    if (theme === 'povodna') return;
    const a = (e.target as HTMLElement).closest?.('a');
    if (!a || a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    const href = a.getAttribute('href') || '';
    const dest = href === '/' ? `/design?t=${theme}`
      : href.startsWith('/blog/') ? `/design${href}?t=${theme}`
      : null;
    if (!dest) return;
    e.preventDefault();
    window.location.href = dest;
  };

  /* Svetelný box galérie sa vykresľuje portálom priamo do `body`, teda mimo
     `.lab`. Bez tejto značky by sa k nemu tokeny šatu nedostali a ostal by
     zlatohnedý. Po odchode z laboratória sa značka upratuje. */
  useEffect(() => {
    if (theme === 'povodna') delete document.body.dataset.labTheme;
    else document.body.dataset.labTheme = theme;
    return () => { delete document.body.dataset.labTheme; };
  }, [theme]);

  return (
    <>
      {/* Prvý fokusovateľný prvok na stránke. Bez neho vedie ku obsahu vyše
          dvadsať krokov tabulátorom — cez celú navigáciu a jej rozbaľovacie
          panely. Vidno ho, až keď naň príde zameranie. */}
      <a className="lab-skip" href="#lab-obsah">Preskočiť na obsah</a>

      {/* Prepínač — súčasť laboratória, nie návrhu. Trieda je tu kvôli
          fokusovému rámu: predvolený rám prehliadača mal na čiernej lište
          kontrast 2,7:1, teda pod normou. */}
      <div className="lab-toolbar" style={{
        position: 'sticky', top: 0, zIndex: 200, background: '#111', color: '#fff',
        fontFamily: 'ui-sans-serif, -apple-system, "Segoe UI", Roboto, sans-serif',
      }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '9px 20px', display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '.18em', color: 'rgba(255,255,255,.5)', marginRight: 4 }}>
            ŠTÝL
          </span>
          {THEMES.map(t => (
            <button
              key={t.id}
              onClick={() => pick(t.id)}
              style={{
                border: '1px solid ' + (theme === t.id ? '#fff' : 'rgba(255,255,255,.28)'),
                background: theme === t.id ? '#fff' : 'transparent',
                color: theme === t.id ? '#111' : 'rgba(255,255,255,.85)',
                borderRadius: 999, padding: '6px 14px', fontSize: 12.5, cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          ))}
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,.45)', marginLeft: 4 }}>{current.note}</span>
          <span style={{ flex: 1 }} />
          {/* Pomenované naplno: mimo laboratória je stále starý šat, nech to
              nie je prekvapenie po ťuknutí na kategóriu či galériu. */}
          <a href="/" style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', textDecoration: 'none' }}>← na web (starý šat)</a>
        </div>
      </div>

      {/* `povodna` = bez prekrytia, teda presne dnešný web. */}
      <div
        className={theme === 'povodna' ? undefined : 'lab'}
        data-theme={theme === 'povodna' ? undefined : theme}
        onClickCapture={keepInLab}
      >
        {theme === 'povodna' ? <NavBar /> : <LabNav />}

        {/* Cieľ preskočenia. `tabIndex={-1}` je nutný, aby sa dal zamerať
            programovo — bez neho skok presunie iba pohľad, nie zameranie,
            a ďalší tabulátor pokračuje zase od navigácie. */}
        <div id="lab-obsah" tabIndex={-1}>
        {podstranka === 'galeria' ? (
          <Suspense fallback={<div className="lart-wait">Načítavam…</div>}>
            {/* `povodna` ukáže dnešnú galériu, aby sa dali postaviť vedľa seba. */}
            {theme === 'povodna' ? <GalleryPage /> : <LabGaleria />}
          </Suspense>
        ) : articleSlug ? (
          /* Stránka článku. `povodna` ukáže produkčnú, aby sa dali postaviť
             vedľa seba na tom istom článku. */
          theme === 'povodna' ? <ArticlePage articleSlug={articleSlug} /> : <LabArticle slug={articleSlug} />
        ) : (
          <>
            {/* `LabHome` je tá istá skladba ako `HomePage`, len s labovým pásom
                kroniky (ten sedí uprostred, tak sa nedá dokresliť za stránku).
                Kategórie a výzva idú za ňou ako samostatné labové komponenty —
                poradie stránky tým ostáva zachované. */}
            {theme === 'povodna' ? <HomePage /> : <LabHome />}
            {theme !== 'povodna' && <LabCategories />}
            {theme !== 'povodna' && <LabJoinUs />}
          </>
        )}

        </div>

        {/* To isté pre pätičku — v téme ide nová, `povodna` ukáže produkčnú. */}
        {theme === 'povodna' ? <Footer /> : <LabFooter />}
      </div>
    </>
  );
}
