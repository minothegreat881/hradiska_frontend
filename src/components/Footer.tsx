'use client';

import { useId } from 'react';
import { openCookieSettings } from '../lib/consent';

/**
 * Pätička webu — varianta 7A „Vlnovková hrana".
 *
 * Predtým bola vpísaná priamo do `App.tsx` (~230 riadkov vrátane troch objektov
 * so štýlmi navrchu súboru). Vyčlenená sem, aby App.tsx ostal len routerom.
 * Farby a stavy sú v `globals.css` pod `.site-footer`, nie inline.
 */

const KATEGORIE = [
  { href: '/category/kniezacie-sidla', label: 'Kniežacie sídla' },
  { href: '/category/mocenske-centra', label: 'Mocenské centrá' },
  // Pozor: slugy `svatyne` a `vseobecne` v Strapi neexistujú — pôvodná pätička
  // na ne odkazovala a odkazy končili na prázdnej stránke.
  { href: '/category/svatyne-a-sakralne-objekty', label: 'Svätyne' },
  { href: '/category/vseobecne-o-hradiskach', label: 'Všeobecne o hradiskách' },
];

const CLANKY = [
  // `/blog` bola statická šablóna nad mock dátami — zmazaná. Články sa
  // prehliadajú cez kategórie, tak sem vedú odkazy na reálne kategórie.
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
    href: 'https://facebook.com/hradiska',
    path: 'M13.5 9H15V6.5h-1.9C10.9 6.5 10 7.9 10 9.6V11H8v2.5h2V21h2.7v-7.5h2l.3-2.5h-2.3V9.9c0-.6.2-.9.8-.9Z',
  },
  {
    label: 'Instagram',
    href: 'https://instagram.com/hradiska',
    path: 'M12 7.8A4.2 4.2 0 1 0 12 16.2 4.2 4.2 0 0 0 12 7.8Zm0 6.9a2.7 2.7 0 1 1 0-5.4 2.7 2.7 0 0 1 0 5.4Zm5.4-7.1a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM20 8.3c0-1.4-.4-2.6-1.4-3.6S16.4 3.4 15 3.3C13.7 3.2 10.3 3.2 9 3.3c-1.4 0-2.6.4-3.6 1.4S4 6.9 3.9 8.3c-.1 1.4-.1 4.8 0 6.1 0 1.4.4 2.6 1.4 3.6s2.2 1.4 3.6 1.4c1.4.1 4.8.1 6.1 0 1.4 0 2.6-.4 3.6-1.4s1.4-2.2 1.4-3.6c.1-1.3.1-4.7 0-6.1Zm-1.8 7.6a2.7 2.7 0 0 1-1.5 1.5c-1.1.4-3.6.3-4.7.3s-3.7.1-4.7-.3a2.7 2.7 0 0 1-1.5-1.5c-.4-1.1-.3-3.6-.3-4.7s-.1-3.7.3-4.7A2.7 2.7 0 0 1 7.3 5c1.1-.4 3.6-.3 4.7-.3s3.7-.1 4.7.3a2.7 2.7 0 0 1 1.5 1.5c.4 1.1.3 3.6.3 4.7s.1 3.6-.3 4.7Z',
  },
  {
    label: 'YouTube',
    href: 'https://youtube.com/@hradiska',
    path: 'M21.6 8.2a2.5 2.5 0 0 0-1.8-1.8C18.2 6 12 6 12 6s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 8.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 3.8 2.5 2.5 0 0 0 1.8 1.8C5.8 18 12 18 12 18s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-3.8ZM10 15V9l5.2 3L10 15Z',
  },
  {
    label: 'E-mail',
    href: 'mailto:info@hradiska.sk',
    path: 'M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm8 7.2L4.8 7h14.4L12 12.2Zm0 1.9L5 8.6V17h14V8.6l-7 5.5Z',
  },
];

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h3 className="fhead">{title}</h3>
      <div className="fhead-rule" aria-hidden="true" />
      <nav>
        {links.map((l) => (
          <a key={l.href + l.label} href={l.href} className="flink">
            {l.label}
          </a>
        ))}
      </nav>
    </div>
  );
}

export function Footer() {
  const uid = useId();
  const waveId = `footer-wave-${uid}`;

  const scrollTop = () => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  };

  return (
    <footer className="site-footer">
      {/* Vlnovková horná hrana — zlatý podklad presvitá vo „vlnách". */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 22,
          background: 'var(--ft-wave-base)',
        }}
      >
        <svg
          width="100%"
          height="22"
          preserveAspectRatio="none"
          style={{ display: 'block', position: 'absolute', bottom: -1 }}
        >
          <defs>
            <pattern id={waveId} width="80" height="22" patternUnits="userSpaceOnUse">
              <path d="M0 22 L0 11 Q20 -4 40 11 T80 11 L80 22 Z" fill="var(--ft-bg-top)" />
              <path
                d="M0 11 Q20 -4 40 11 T80 11"
                fill="none"
                stroke="var(--ft-wave-line)"
                strokeWidth="1.4"
                opacity=".5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="22" fill={`url(#${waveId})`} />
        </svg>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '64px 44px 0' }}>
        <div className="ft-grid">
          {/* ---- Brand ---- */}
          <div className="ft-brand">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {/* Oficiálne logo OZ — to isté, čo je v navigácii. */}
              <picture style={{ display: 'contents' }}>
                <source srcSet="/logo_slovanske_hradiska_256.webp" type="image/webp" />
                <img
                  src="/logo_slovanske_hradiska_256.jpg"
                  alt=""
                  aria-hidden="true"
                  style={{
                    width: 50,
                    height: 50,
                    objectFit: 'contain',
                    borderRadius: 13,
                    background:
                      'radial-gradient(circle at 38% 30%, #f0d9a8, #c8a15a)',
                    border: '1px solid var(--ft-head)',
                    boxShadow: '0 6px 16px -6px rgba(0,0,0,.5)',
                    padding: 3,
                    flexShrink: 0,
                  }}
                />
              </picture>
              <div style={{ lineHeight: 1.2 }}>
                <div
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 22,
                    fontWeight: 700,
                    color: 'var(--ft-brand)',
                  }}
                >
                  Hradiska.sk
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontStyle: 'italic',
                    fontSize: 16,
                    color: 'var(--ft-tagline)',
                    marginTop: 2,
                  }}
                >
                  Slovanské hradiská
                </div>
              </div>
            </div>

            <p
              style={{
                fontSize: 18,
                lineHeight: 1.55,
                color: 'var(--ft-desc)',
                maxWidth: 320,
                margin: '18px 0 20px',
              }}
            >
              Občianske združenie venované slovanským hradiskám, hradom a zámkom Slovenska.
            </p>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {SOCIALS.map((s) => (
                <a key={s.label} href={s.href} className="soc" aria-label={s.label}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d={s.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* ---- Navigačné stĺpce ---- */}
          <FooterColumn title="Kategórie" links={KATEGORIE} />
          <FooterColumn title="Články" links={CLANKY} />
          <FooterColumn title="O projekte" links={O_PROJEKTE} />
        </div>

        {/* ---- Fleur-de-lis oddeľovač ---- */}
        <div
          aria-hidden="true"
          style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 44 }}
        >
          <span
            style={{
              flex: 1,
              height: 1,
              background: 'linear-gradient(90deg, transparent, var(--ft-edge))',
            }}
          />
          <span style={{ color: 'var(--ft-fleur)', fontSize: 14 }}>⚜</span>
          <span
            style={{
              flex: 1,
              height: 1,
              background: 'linear-gradient(90deg, var(--ft-edge), transparent)',
            }}
          />
        </div>

        {/* ---- Spodný pruh ---- */}
        <div
          className="ft-bottom"
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
            padding: '20px 0 26px',
          }}
        >
          <span style={{ fontSize: 16, color: 'var(--ft-bottom-text)' }}>
            © {new Date().getFullYear()} Hradiska.sk · Projekt venovaný slovanskej archeológii a histórii
          </span>
          <span style={{ flex: 1 }} />
          <a
            href="/ochrana-osobnych-udajov"
            style={{
              fontSize: 16,
              color: 'var(--ft-tagline)',
              textDecoration: 'none',
              transition: 'color 0.16s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--ft-link-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--ft-tagline)'; }}
          >
            Ochrana osobných údajov
          </a>
          <a
            href="/podmienky-pouzivania"
            style={{
              fontSize: 16,
              color: 'var(--ft-tagline)',
              textDecoration: 'none',
              transition: 'color 0.16s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--ft-link-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--ft-tagline)'; }}
          >
            Podmienky používania
          </a>
          <button
            type="button"
            onClick={openCookieSettings}
            style={{
              fontSize: 16,
              color: 'var(--ft-tagline)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              fontFamily: 'inherit',
              transition: 'color 0.16s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--ft-link-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--ft-tagline)'; }}
          >
            Zvyky hradiska (cookies)
          </button>
          <button type="button" onClick={scrollTop} className="to-top">
            Späť hore ↑
          </button>
        </div>
      </div>
    </footer>
  );
}
