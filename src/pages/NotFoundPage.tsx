'use client';

import { useEffect } from 'react';
import { Home, Search, Compass } from 'lucide-react';

const go = (p: string) => { window.history.pushState({}, '', p); window.dispatchEvent(new PopStateEvent('popstate')); };

/**
 * Stránka 404. Neznáme cesty sem smerujú namiesto tichého zobrazenia domovskej
 * (to bol „soft 404" — HTTP 200 na neexistujúcej URL, čo Google penalizuje).
 *
 * SPA nevie sama vrátiť HTTP 404 (to je vec hostingu), ale aspoň:
 *  - vykreslí zrozumiteľnú 404 stránku,
 *  - dočasne pridá `<meta name="robots" content="noindex">`, aby sa neindexovala,
 *  - ponúkne cestu späť (domov, vyhľadávanie, kategórie).
 */
export function NotFoundPage() {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = 'Stránka sa nenašla (404) — Hradiská.sk';
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex';
    document.head.appendChild(meta);
    return () => {
      document.title = prevTitle;
      meta.remove();
    };
  }, []);

  const btn: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 22px',
    borderRadius: 999, fontFamily: 'var(--font-serif, Georgia, serif)', fontSize: 15,
    fontWeight: 600, cursor: 'pointer', textDecoration: 'none',
  };

  return (
    <div id="main-content" style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#faf7ef', padding: '48px 20px' }}>
      <div style={{ maxWidth: 560, textAlign: 'center', fontFamily: 'var(--font-serif, Georgia, serif)' }}>
        <div style={{ fontSize: 84, fontWeight: 700, color: '#c8a15a', lineHeight: 1, fontFamily: 'var(--font-heading, Cinzel, serif)' }}>404</div>
        <h1 style={{ fontSize: 28, fontWeight: 600, color: '#2e2213', margin: '14px 0 10px' }}>
          Táto stránka sa nenašla
        </h1>
        <p style={{ fontSize: 16, color: '#7a6a52', lineHeight: 1.6, margin: '0 0 28px' }}>
          Odkaz je možno starý alebo neúplný. Skúste hľadať konkrétne hradisko,
          alebo sa vráťte na úvod.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/" onClick={(e) => { e.preventDefault(); go('/'); }}
             style={{ ...btn, background: 'linear-gradient(180deg,#b0813a,#8a5316)', color: '#fbf3e2', border: '1px solid #7c4a13' }}>
            <Home style={{ width: 17, height: 17 }} /> Na úvod
          </a>
          <a href="/hladat" onClick={(e) => { e.preventDefault(); go('/hladat'); }}
             style={{ ...btn, background: 'transparent', color: '#9a5d1f', border: '1px solid #d9c69a' }}>
            <Search style={{ width: 17, height: 17 }} /> Vyhľadávanie
          </a>
          <a href="/hradiska" onClick={(e) => { e.preventDefault(); go('/hradiska'); }}
             style={{ ...btn, background: 'transparent', color: '#9a5d1f', border: '1px solid #d9c69a' }}>
            <Compass style={{ width: 17, height: 17 }} /> Hradiská
          </a>
        </div>
      </div>
    </div>
  );
}
