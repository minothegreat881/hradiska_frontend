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

import { useEffect, useState } from 'react';
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
import './theme.css';

/* Písmo a skladba sú vo všetkých témach rovnaké (Fraunces na nadpisy + Inter na text,
   redakčný rozvrh) — líši sa výhradne farebná skladba. */
const THEMES = [
  { id: 'povodna', label: 'Pôvodná', note: 'Cinzel · pergamen · zlato — dnešný stav' },
  { id: 'uhlie', label: 'Uhlie', note: 'neutrálny papier · antracit · medená iskra — zvolený štýl' },
  /* Nové kombinácie. Iskra je v každej teplá (pravidlo šatu), mení sa podklad
     a to, o akú dvojicu ide — viď poznámky pri paletách v `theme.css`. */
  { id: 'patina', label: 'Patina', note: 'zelenkastý papier · zelenočierna · bronz — bronz a patina na ňom' },
  { id: 'bridlica', label: 'Bridlica', note: 'bridlicová šeď · modročierna · med — kameň a teplá iskra oproti sebe' },
  { id: 'mach', label: 'Mach', note: 'olivová · machová čierň · hrdza — zarastený val a hrdzavé železo' },
  { id: 'pecat', label: 'Pečať', note: 'pieskovec · atramentová čierň · pečatná červená — pergamen, atrament, vosk' },
  { id: 'hlina', label: 'Hlina', note: 'krém · sýta hrdzavá · tmavohnedá' },
  { id: 'okra', label: 'Okra', note: 'teplá kosť · volová krv · horčicová' },
  { id: 'terakota', label: 'Terakota', note: 'kostený papier · pálená hlina · okrová — najtichšia' },
];

export default function DesignLab() {
  const initial = typeof window !== 'undefined'
    ? (new URLSearchParams(window.location.search).get('t') || 'uhlie')
    : 'uhlie';
  const [theme, setTheme] = useState(initial);
  const current = THEMES.find(t => t.id === theme) ?? THEMES[1];

  /* Laboratórium má dve plochy: domovskú (`/design`) a stránku článku
     (`/design/blog/<slug>`). Cesta sa číta raz pri otvorení — prepínač tém
     ju zachová, aby sa dal ten istý článok pozrieť v každom šate. */
  const path = typeof window !== 'undefined' ? window.location.pathname : '/design';
  const articleSlug = path.startsWith('/design/blog/')
    ? decodeURIComponent(path.slice('/design/blog/'.length).replace(/\/$/, ''))
    : null;

  const pick = (id: string) => {
    setTheme(id);
    window.history.replaceState(null, '', `${path}?t=${id}`);
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
      {/* Prepínač — súčasť laboratória, nie návrhu. */}
      <div style={{
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
          <a href="/" style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', textDecoration: 'none' }}>← na web</a>
        </div>
      </div>

      {/* `povodna` = bez prekrytia, teda presne dnešný web. */}
      <div className={theme === 'povodna' ? undefined : 'lab'} data-theme={theme === 'povodna' ? undefined : theme}>
        {theme === 'povodna' ? <NavBar /> : <LabNav />}

        {articleSlug ? (
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

        {/* To isté pre pätičku — v téme ide nová, `povodna` ukáže produkčnú. */}
        {theme === 'povodna' ? <Footer /> : <LabFooter />}
      </div>
    </>
  );
}
