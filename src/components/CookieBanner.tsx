import { poNemecky, t, poAnglicky } from '../lib/jazyk';
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
      <div className="ck-card" role="dialog" aria-modal="false" aria-label={t('Súhlas s cookies')}>
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
            <span className="ck-pill">{t('STRÁŽ')}</span>
          </div>

          {/* Text */}
          <div className="ck-text">
            {mode === 'banner' ? (
              <>
                <h2 className="ck-title">{t('Stoj! Kto tam?')}</h2>
                {/* Tieto dva odstavce majú vnútri značky, takže do slovníka
                    nejdú — každý jazyk má vlastnú vetvu. */}
                {poAnglicky() ? (
                  <>
                    <p className="ck-p">
                      The watch on the palisade reports that this hillfort uses{' '}
                      <span className="ck-accent">“cookies”</span>. Not the kind baked on the hearth
                      in the sunken hut next door, but the digital sort. We need them to keep the
                      gates open and to learn which tribe you come from.
                    </p>
                    <p className="ck-p">
                      Clicking <span className="ck-accent-i">“I agree”</span> will calm the guards
                      and help us improve this blog. <span className="ck-strong">No pillaging, we promise!</span>
                    </p>
                  </>
                ) : poNemecky() ? (
                  <>
                    <p className="ck-p">
                      Die Wache auf der Palisade meldet, dass dieser Burgwall{' '}
                      <span className="ck-accent">„Cookies“</span> verwendet. Nicht jene, die nebenan
                      im Grubenhaus auf der Feuerstelle gebacken werden, sondern die digitalen. Wir
                      brauchen sie, um die Tore offen zu halten und zu erfahren, aus welchem Stamm
                      Sie zu uns kommen.
                    </p>
                    <p className="ck-p">
                      Ein Klick auf <span className="ck-accent-i">„Ich stimme zu“</span> beruhigt die
                      Wachen und hilft uns, diesen Blog zu verbessern.{' '}
                      <span className="ck-strong">Keine Plünderung, versprochen!</span>
                    </p>
                  </>
                ) : (
                  <>
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
                  </>
                )}

                <div className="ck-actions">
                  <button ref={firstBtnRef} type="button" className="ck-btn ck-btn-primary" onClick={acceptAll}>
                    <span aria-hidden="true">⚔️</span>
                    <span className="ck-nowrap">{t('Prijať ako hosť')}</span>
                    <span className="ck-nowrap ck-note">({t('Súhlasím')})</span>
                  </button>
                  <button type="button" className="ck-btn ck-btn-secondary" onClick={rejectAll}>
                    <span aria-hidden="true">🐎</span>
                    <span className="ck-nowrap">{t('Otočiť koňa')}</span>
                    <span className="ck-nowrap ck-note">({t('Nesúhlasím')})</span>
                  </button>
                  <button type="button" className="ck-settings-link" onClick={() => setMode('settings')}>
                    {t('Zvyky hradiska (nastavenia)')}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="ck-title">{t('Zvyky hradiska')}</h2>
                <p className="ck-p">{t('Vyberte, ktoré cookies smú stráže použiť. Nevyhnutné potrebujeme na chod hradiska, o analytické vás slušne prosíme.')}</p>

                <div className="ck-settings" style={{ padding: 0, marginTop: 14 }}>
                  <div className="ck-cat">
                    <div>
                      <h3>{t('Nevyhnutné')}</h3>
                      <p>{t('Držia brány otvorené — prihlásenie a zapamätanie tohto rozhodnutia. Bez nich hradisko nefunguje, preto sa nedajú vypnúť.')}</p>
                    </div>
                    <div className="ck-cat-ctl"><span className="ck-fixed-tag">{t('VŽDY ZAPNUTÉ')}</span></div>
                  </div>

                  <div className="ck-cat">
                    <div>
                      <h3>{t('Analytické')}</h3>
                      <p>{t('Anonymne nám prezradia, z ktorého kmeňa prichádzate a ktoré články čítate — aby sme blog vylepšovali. Bez cookies tretích strán.')}</p>
                    </div>
                    <div className="ck-cat-ctl">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={analytics}
                        aria-label={t('Analytické cookies')}
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
                    <span className="ck-nowrap">{t('Uložiť voľbu')}</span>
                  </button>
                  <button type="button" className="ck-btn ck-btn-secondary" onClick={acceptAll}>
                    <span aria-hidden="true">⚔️</span>
                    <span className="ck-nowrap">{t('Prijať všetko')}</span>
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
