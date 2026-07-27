'use client';

import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { isStandalone, openInstall, EVT_AVAILABLE } from '../lib/pwa';

/**
 * Lákavá ikona „Získať appku" — zlatý gradient s pulzujúcim glow efektom.
 * Zobrazí sa VŽDY, kým appka nebeží ako standalone (t.j. kým nie je nainštalovaná)
 * — klik otvorí ponuku s inštaláciou alebo návodom (aj iOS/desktop).
 * `compact` = kruhová ikona (mobil), inak pilulka s textom (desktop).
 */
export function InstallAppButton({ compact = false }: { compact?: boolean }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const check = () => setShow(!isStandalone());
    check();
    window.addEventListener(EVT_AVAILABLE, check);
    window.addEventListener('appinstalled', check);
    return () => {
      window.removeEventListener(EVT_AVAILABLE, check);
      window.removeEventListener('appinstalled', check);
    };
  }, []);

  if (!show) return null;

  return (
    <button
      onClick={() => openInstall()}
      className="install-app-btn"
      title="Nainštalovať Hradiská.sk ako aplikáciu"
      aria-label="Nainštalovať aplikáciu"
      style={{
        flexShrink: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        padding: compact ? 0 : '8px 15px',
        width: compact ? 38 : undefined,
        height: compact ? 38 : undefined,
        borderRadius: 999,
        cursor: 'pointer',
        background: 'linear-gradient(135deg,#e8c56e 0%,#c8862f 55%,#9a5d1f 100%)',
        border: '1px solid #e8c56e',
        color: '#1c1510',
        fontFamily: '"Cinzel", Georgia, serif',
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
      }}
    >
      <Download className="w-4 h-4" />
      {!compact && <span>Získať appku</span>}
    </button>
  );
}

export default InstallAppButton;
