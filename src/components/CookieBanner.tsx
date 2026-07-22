'use client';

import { useEffect, useRef, useState } from 'react';
import { getConsent, hasDecided, setConsent, EVT_OPEN_SETTINGS } from '../lib/consent';

/**
 * GDPR cookie-consent banner „Stoj! Kto tam?" — hradiskový pergamenový štýl.
 * Zobrazí sa len ak návštevník ešte nerozhodol; znova sa dá otvoriť z pätičky
 * (event EVT_OPEN_SETTINGS → panel nastavení). Neblokuje scroll (nie je modálne).
 */
export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<'banner' | 'settings'>('banner');
  const [analytics, setAnalytics] = useState(false);
  const firstBtnRef = useRef<HTMLButtonElement>(null);
  const waveId = 'ckwave';

  useEffect(() => {
    // Zobraz banner, ak ešte nie je rozhodnuté.
    if (!hasDecided()) setVisible(true);

    // Otvorenie nastavení z pätičky/zásad (aj po rozhodnutí).
    const openSettings = () => {
      setAnalytics(getConsent()?.analytics ?? false);
      setMode('settings');
      setVisible(true);
    };
    window.addEventListener(EVT_OPEN_SETTINGS, openSettings);
    return () => window.removeEventListener(EVT_OPEN_SETTINGS, openSettings);
  }, []);

  // Po otvorení presuň fokus na prvé tlačidlo (prístupnosť).
  useEffect(() => {
    if (visible) firstBtnRef.current?.focus();
  }, [visible, mode]);

  if (!visible) return null;

  const acceptAll = () => { setConsent(true); setVisible(false); };
  const rejectAll = () => { setConsent(false); setVisible(false); };
  const saveSettings = () => { setConsent(analytics); setVisible(false); };

  return (
    <div className="ck-root ck-dock">
      <div className="ck-card" role="dialog" aria-modal="false" aria-label="Súhlas s cookies">
        {/* Zlatý lem s vlnovkou */}
        <div className="ck-rim-bar" aria-hidden="true">
          <svg width="100%" height="12" preserveAspectRatio="none">
            <defs>
              <pattern id={waveId} width="46" height="12" patternUnits="userSpaceOnUse">
                <path d="M0 9 Q11.5 3 23 9 T46 9" fill="none" stroke="var(--ck-wave)" strokeWidth="1.4" opacity=".7" />
              </pattern>
            </defs>
            <rect width="100%" height="12" fill={`url(#${waveId})`} />
          </svg>
        </div>

        <div className="ck-body">
          {/* Štít stráže */}
          <div className="ck-shield-wrap" aria-hidden="true">
            <div className="ck-shield"><span className="ck-emoji">🛡️</span></div>
            <span className="ck-pill">STRÁŽ</span>
          </div>

          {/* Text */}
          <div className="ck-text">
            {mode === 'banner' ? (
              <>
                <h2 className="ck-title">Stoj! Kto tam?</h2>
                <p className="ck-p">
                  Stráže na palisádach hlásia, že toto hradisko používa{' '}
                  <span className="ck-accent">„cookies“</span>. Nie sú to síce tie upečené na ohnisku
                  v susednej zemnici, ale také tie digitálne. Potrebujeme ich na to, aby sme udržali
                  brány otvorené a zistili, z ktorého kmeňa k nám prichádzate.
                </p>
                <p className="ck-p">
                  Kliknutím na <span className="ck-accent-i">„Súhlasím“</span> upokojíte stráže
                  a pomôžete nám vylepšovať tento blog. <span className="ck-strong">Žiadne rabovanie, sľubujeme!</span>
                </p>

                <div className="ck-actions">
                  <button ref={firstBtnRef} type="button" className="ck-btn ck-btn-primary" onClick={acceptAll}>
                    <span aria-hidden="true">⚔️</span>
                    <span className="ck-nowrap">Prijať ako hosť</span>
                    <span className="ck-nowrap ck-note">(Súhlasím)</span>
                  </button>
                  <button type="button" className="ck-btn ck-btn-secondary" onClick={rejectAll}>
                    <span aria-hidden="true">🐎</span>
                    <span className="ck-nowrap">Otočiť koňa</span>
                    <span className="ck-nowrap ck-note">(Nesúhlasím)</span>
                  </button>
                  <button type="button" className="ck-settings-link" onClick={() => setMode('settings')}>
                    Zvyky hradiska (nastavenia)
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="ck-title">Zvyky hradiska</h2>
                <p className="ck-p">Vyberte, ktoré cookies smú stráže použiť. Nevyhnutné potrebujeme na chod hradiska, o analytické vás slušne prosíme.</p>

                <div className="ck-settings" style={{ padding: 0, marginTop: 14 }}>
                  <div className="ck-cat">
                    <div>
                      <h3>Nevyhnutné</h3>
                      <p>Držia brány otvorené — prihlásenie a zapamätanie tohto rozhodnutia. Bez nich hradisko nefunguje, preto sa nedajú vypnúť.</p>
                    </div>
                    <div className="ck-cat-ctl"><span className="ck-fixed-tag">VŽDY ZAPNUTÉ</span></div>
                  </div>

                  <div className="ck-cat">
                    <div>
                      <h3>Analytické</h3>
                      <p>Anonymne nám prezradia, z ktorého kmeňa prichádzate a ktoré články čítate — aby sme blog vylepšovali. Bez cookies tretích strán.</p>
                    </div>
                    <div className="ck-cat-ctl">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={analytics}
                        aria-label="Analytické cookies"
                        className="ck-toggle"
                        onClick={() => setAnalytics((v) => !v)}
                      >
                        <span className="ck-toggle-knob" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="ck-actions">
                  <button ref={firstBtnRef} type="button" className="ck-btn ck-btn-primary" onClick={saveSettings}>
                    <span aria-hidden="true">📜</span>
                    <span className="ck-nowrap">Uložiť voľbu</span>
                  </button>
                  <button type="button" className="ck-btn ck-btn-secondary" onClick={acceptAll}>
                    <span aria-hidden="true">⚔️</span>
                    <span className="ck-nowrap">Prijať všetko</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Pätka s fleur-de-lis */}
        <div className="ck-foot" aria-hidden="true">
          <span className="ck-rule ck-rule-l" />
          <span className="ck-fleur">⚜</span>
          <span className="ck-rule ck-rule-r" />
        </div>
      </div>
    </div>
  );
}
