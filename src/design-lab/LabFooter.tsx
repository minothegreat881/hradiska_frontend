'use client';

/**
 * PÄTIČKA — nový návrh. Žije LEN v laboratóriu; produkčný `Footer.tsx` sa
 * nedotýka (v `DesignLab` sa v téme vykreslí táto namiesto neho).
 *
 * OBSAH JE PREVZATÝ DOSLOVA — tie isté odkazy, ten istý popis aj spodný riadok.
 * Mení sa iba to, ako sú podané.
 *
 * ČO BOLO ZLE NA PÔVODNEJ:
 *   • vlnitá hrana, ⚜ oddeľovač a zlatý prechod boli posledné zvyšky štýlu
 *     starej listiny — na neutrálnej stránke pôsobili ako iný web,
 *   • odkazy mali 19 px v serife a hover, ktorý posúval text doprava (riadok
 *     poskočil pri každom prejdení myšou),
 *   • spodný pruh bol jeden dlhý reťazec štyroch tlačidiel s inline hoverom
 *     cez `onMouseEnter`, čiže bez klávesnicového stavu,
 *   • všetko malo rovnakú váhu: značka, odkazy aj drobné právne texty.
 *
 * ČO ROBÍ NOVÁ:
 *   Dve pásma. Hore značka (logo, popis, siete) proti trom stĺpcom odkazov,
 *   dole tichý služobný riadok oddelený vláskom. Jediná farebná vec je meď —
 *   krátky vrub v hornej hrane a to, čoho sa dotkneš. Namiesto ozdoby je
 *   v pozadí vrstevnicová kresba: tak vyzerá hradisko na mape.
 */

import { openCookieSettings } from '../lib/consent';
import { openInstall, isStandalone } from '../lib/pwa';

/* Odkazy sú zámerne zopakované (nie importované z produkčnej pätičky) — lab
   má ostať samostatný, aby sa v ňom dalo skúšať aj poradie a názvy. */
const KATEGORIE = [
  { href: '/category/kniezacie-sidla', label: 'Kniežacie sídla' },
  { href: '/category/mocenske-centra', label: 'Mocenské centrá' },
  { href: '/category/svatyne-a-sakralne-objekty', label: 'Svätyne' },
  { href: '/category/vseobecne-o-hradiskach', label: 'Všeobecne o hradiskách' },
];

const CLANKY = [
  { href: '/category/povesti', label: 'Povesti' },
  { href: '/category/listiny-a-pisomne-zdroje', label: 'Listiny a pramene' },
  { href: '/category/odborne-texty', label: 'Odborné texty' },
  { href: '/category/3d-modely', label: '3D modely' },
  { href: '/category/aktuality', label: 'Aktuality' },
];

const O_PROJEKTE = [
  { href: '/about', label: 'O nás' },
  { href: '/about#team', label: 'Tím' },
  { href: 'mailto:info@hradiska.sk', label: 'Kontakt' },
  { href: '/about#podporte', label: 'Podporte nás' },
];

const SOCIALS = [
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/groups/118846781525141',
    path: 'M13.5 9H15V6.5h-1.9C10.9 6.5 10 7.9 10 9.6V11H8v2.5h2V21h2.7v-7.5h2l.3-2.5h-2.3V9.9c0-.6.2-.9.8-.9Z',
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/slovanske_hradiska/',
    path: 'M12 7.8A4.2 4.2 0 1 0 12 16.2 4.2 4.2 0 0 0 12 7.8Zm0 6.9a2.7 2.7 0 1 1 0-5.4 2.7 2.7 0 0 1 0 5.4Zm5.4-7.1a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM20 8.3c0-1.4-.4-2.6-1.4-3.6S16.4 3.4 15 3.3C13.7 3.2 10.3 3.2 9 3.3c-1.4 0-2.6.4-3.6 1.4S4 6.9 3.9 8.3c-.1 1.4-.1 4.8 0 6.1 0 1.4.4 2.6 1.4 3.6s2.2 1.4 3.6 1.4c1.4.1 4.8.1 6.1 0 1.4 0 2.6-.4 3.6-1.4s1.4-2.2 1.4-3.6c.1-1.3.1-4.7 0-6.1Zm-1.8 7.6a2.7 2.7 0 0 1-1.5 1.5c-1.1.4-3.6.3-4.7.3s-3.7.1-4.7-.3a2.7 2.7 0 0 1-1.5-1.5c-.4-1.1-.3-3.6-.3-4.7s-.1-3.7.3-4.7A2.7 2.7 0 0 1 7.3 5c1.1-.4 3.6-.3 4.7-.3s3.7-.1 4.7.3a2.7 2.7 0 0 1 1.5 1.5c.4 1.1.3 3.6.3 4.7s.1 3.6-.3 4.7Z',
  },
  {
    label: 'YouTube',
    href: 'https://www.youtube.com/@ozhradiska3940',
    path: 'M21.6 8.2a2.5 2.5 0 0 0-1.8-1.8C18.2 6 12 6 12 6s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 8.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 3.8 2.5 2.5 0 0 0 1.8 1.8C5.8 18 12 18 12 18s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-3.8ZM10 15V9l5.2 3L10 15Z',
  },
  {
    label: 'E-mail',
    href: 'mailto:info@hradiska.sk',
    path: 'M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm8 7.2L4.8 7h14.4L12 12.2Zm0 1.9L5 8.6V17h14V8.6l-7 5.5Z',
  },
];

function Col({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div className="lfoot-col">
      <h3 className="lfoot-h">{title}</h3>
      <nav>
        {links.map((l) => (
          <a key={l.href + l.label} href={l.href}>
            {l.label}
          </a>
        ))}
      </nav>
    </div>
  );
}

export function LabFooter() {
  const scrollTop = () => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  };

  return (
    <footer className="lfoot">
      {/* Vrstevnice — takto je hradisko zakreslené na mape. Nie ozdoba pre
          ozdobu: je to jediná kresba, ktorá o obsahu stránky niečo hovorí. */}
      <div className="lfoot-rings" aria-hidden="true">
        <svg viewBox="0 0 400 400" width="100%" height="100%">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <ellipse
              key={i}
              cx="200"
              cy="200"
              rx={58 + i * 31}
              ry={42 + i * 26}
              transform={`rotate(${-16 + i * 3.5} 200 200)`}
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              opacity={0.36 - i * 0.05}
            />
          ))}
        </svg>
      </div>

      <div className="lfoot-wrap">
        {/* ── Horné pásmo: značka proti odkazom ───────────────────────── */}
        <div className="lfoot-top">
          <div className="lfoot-brand">
            <a className="lfoot-id" href="/">
              <picture style={{ display: 'contents' }}>
                <source srcSet="/logo_slovanske_hradiska_256.webp" type="image/webp" />
                <img
                  className="lfoot-logo"
                  src="/logo_slovanske_hradiska_256.jpg"
                  alt=""
                  aria-hidden="true"
                  width={44}
                  height={44}
                />
              </picture>
              <span>
                <span className="lfoot-name">Hradiska.sk</span>
                <span className="lfoot-tag">Slovanské hradiská</span>
              </span>
            </a>

            <p className="lfoot-desc">
              Občianske združenie venované slovanským hradiskám, hradom a zámkom
              Slovenska.
            </p>

            <div className="lfoot-soc">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  {...(s.href.startsWith('http')
                    ? { target: '_blank', rel: 'noopener noreferrer' }
                    : {})}
                >
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d={s.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          <div className="lfoot-cols">
            <Col title="Kategórie" links={KATEGORIE} />
            <Col title="Články" links={CLANKY} />
            <Col title="O projekte" links={O_PROJEKTE} />
          </div>
        </div>

        {/* ── Spodný riadok: služobné odkazy ──────────────────────────── */}
        <div className="lfoot-bar">
          <span className="lfoot-copy">
            © {new Date().getFullYear()} Hradiska.sk
            <span className="lfoot-sep" aria-hidden="true">·</span>
            Projekt venovaný slovanskej archeológii a histórii
          </span>

          <nav className="lfoot-legal">
            <a href="/ochrana-osobnych-udajov">Ochrana osobných údajov</a>
            <a href="/podmienky-pouzivania">Podmienky používania</a>
            <button type="button" onClick={openCookieSettings}>
              Zvyky hradiska (cookies)
            </button>
            {/* Inštalácia je len mobilná vec — na PC sa appka nenainštaluje,
                preto ju spodný riadok na širokom okne vôbec neponúka (to isté
                rozhodnutie ako pri „Získať appku" v hornej lište). */}
            {typeof window !== 'undefined' && !isStandalone() && (
              <button type="button" className="lfoot-install" onClick={openInstall}>
                Nainštalovať appku
              </button>
            )}
          </nav>

          <button
            type="button"
            className="lfoot-up"
            onClick={scrollTop}
            aria-label="Späť hore"
            title="Späť hore"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </button>
        </div>
      </div>
    </footer>
  );
}

export default LabFooter;
