'use client';

import { useEffect, useRef, useState } from 'react';
import {
  isStandalone, isIOS, hasDeferredPrompt, shouldAutoOffer, engaged,
  promptInstall, markDismissed, EVT_AVAILABLE, EVT_OPEN_INSTALL,
} from '../lib/pwa';
import { hasDecided, onConsentChange } from '../lib/consent';

/**
 * Ponuka „Nainštalovať appku" (PWA). Zobrazí sa až po zapojení a po vybavení
 * cookie lišty; na iOS ukáže návod (Safari nevie programovú inštaláciu).
 * Znova sa dá otvoriť z pätičky (EVT_OPEN_INSTALL).
 */
export function InstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [ios, setIos] = useState(false);
  const [forced, setForced] = useState(false); // otvorené ručne z pätičky
  const firstBtnRef = useRef<HTMLButtonElement>(null);
  const dwellRef = useRef(false);

  useEffect(() => {
    if (isStandalone()) return; // beží ako appka → neponúkať

    const iosDevice = isIOS();

    const tryAuto = () => {
      if (!hasDecided()) return;              // najprv nech vybaví cookies
      if (!shouldAutoOffer()) return;         // standalone / cooldown / nedostupné
      if (!(engaged() || dwellRef.current)) return; // 2. návšteva alebo ~30 s
      setIos(iosDevice);
      setVisible(true);
    };

    const onOpen = () => { // ručné otvorenie z pätičky — bez podmienok
      setIos(iosDevice);
      setForced(true);
      setVisible(true);
    };

    window.addEventListener(EVT_AVAILABLE, tryAuto);
    window.addEventListener(EVT_OPEN_INSTALL, onOpen);
    const offConsent = onConsentChange(() => tryAuto());
    const t = window.setTimeout(() => { dwellRef.current = true; tryAuto(); }, 30_000);
    tryAuto(); // pokrýva vracajúceho sa návštevníka (2.+ návšteva, cookies vybavené)

    return () => {
      window.removeEventListener(EVT_AVAILABLE, tryAuto);
      window.removeEventListener(EVT_OPEN_INSTALL, onOpen);
      offConsent();
      clearTimeout(t);
    };
  }, []);

  useEffect(() => { if (visible) firstBtnRef.current?.focus(); }, [visible]);

  if (!visible) return null;

  const close = () => setVisible(false);
  const dismiss = () => { if (!forced) markDismissed(); close(); };
  const doInstall = async () => {
    const r = await promptInstall();
    // 'unavailable' = prehliadač nemá odchytenú ponuku (napr. desktop menu) → nechaj kartu s návodom
    if (r !== 'unavailable') { markDismissed(); close(); }
    else setIos(false); // ukáž fallback návod nižšie
  };

  const canInstall = !ios && hasDeferredPrompt();

  return (
    <div className="ck-root pwa-dock">
      <div className="pwa-card" role="dialog" aria-modal="false" aria-label="Nainštalovať aplikáciu">
        <div className="ck-rim-bar" aria-hidden="true">
          <svg width="100%" height="12" preserveAspectRatio="none">
            <defs>
              <pattern id="pwawave" width="46" height="12" patternUnits="userSpaceOnUse">
                <path d="M0 9 Q11.5 3 23 9 T46 9" fill="none" stroke="var(--ck-wave)" strokeWidth="1.4" opacity=".7" />
              </pattern>
            </defs>
            <rect width="100%" height="12" fill="url(#pwawave)" />
          </svg>
        </div>

        <div className="pwa-body">
          {/* Náhľad ikony appky — „takto to bude na ploche" */}
          <div className="pwa-icon" aria-hidden="true">
            <picture>
              <source srcSet="/logo_slovanske_hradiska_256.webp" type="image/webp" />
              <img src="/logo_slovanske_hradiska_256.jpg" alt="" />
            </picture>
          </div>

          <div className="ck-text">
            <h2 className="ck-title">Nos hradisko vo vrecku</h2>

            {ios ? (
              <>
                <p className="ck-p">
                  Pridaj <strong>Hradiská.sk</strong> na plochu: ťukni na <span className="pwa-share" aria-hidden="true">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v13M8 7l4-4 4 4M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg>
                  </span> <strong>Zdieľať</strong> a zvoľ <strong>„Pridať na plochu"</strong>.
                </p>
                <div className="ck-actions">
                  <button ref={firstBtnRef} type="button" className="ck-btn ck-btn-primary" onClick={dismiss}>
                    <span className="ck-nowrap">Rozumiem</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="ck-p">
                  Pridaj <strong>Hradiská.sk</strong> na plochu telefónu — otvára sa ako appka,
                  na celú obrazovku a rýchlejšie. {canInstall ? '' : 'Otvor menu prehliadača a zvoľ „Pridať na plochu / Inštalovať".'}
                </p>
                <div className="ck-actions">
                  {canInstall && (
                    <button ref={firstBtnRef} type="button" className="ck-btn ck-btn-primary" onClick={doInstall}>
                      <span aria-hidden="true">⚔️</span>
                      <span className="ck-nowrap">Nainštalovať</span>
                    </button>
                  )}
                  <button ref={canInstall ? undefined : firstBtnRef} type="button" className="ck-btn ck-btn-secondary" onClick={dismiss}>
                    <span className="ck-nowrap">{forced ? 'Zavrieť' : 'Teraz nie'}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="ck-foot" aria-hidden="true">
          <span className="ck-rule ck-rule-l" />
          <span className="ck-fleur">⚜</span>
          <span className="ck-rule ck-rule-r" />
        </div>
      </div>
    </div>
  );
}
