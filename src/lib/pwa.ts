/**
 * PWA — inštalácia na plochu + service worker.
 *
 * `initPwa()` sa volá raz pri štarte (main.tsx): zaregistruje service worker,
 * odchytí `beforeinstallprompt` (aby sme ponúkli VLASTNÝ, nie natívny mini-banner
 * hneď) a počíta „zapojenie" (návštevy). Ponuka inštalácie sa zobrazí až po
 * zapojení a až keď je vybavená cookie lišta (viď InstallPrompt.tsx).
 */
const DISMISS_KEY = 'pwa-install-dismissed';
const VISITS_KEY = 'pwa-visits';
const SESSION_FLAG = 'pwa-session-counted';
const COOLDOWN = 7 * 24 * 3600 * 1000; // 7 dní ticha po „Teraz nie"

export const EVT_AVAILABLE = 'hradiska:pwa-available';
export const EVT_OPEN_INSTALL = 'hradiska:open-install';

let deferred: any = null; // BeforeInstallPromptEvent

/** Beží už ako nainštalovaná appka (standalone alebo natívna schránka)? */
export function isStandalone(): boolean {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true ||
    /* Natívna appka z obchodu. Bez tejto vetvy by v nej vyskočila ponuka
       „Nainštalovať appku" — komu, keď ju už má? */
    !window.location.origin.startsWith('http')
  );
}

/** iOS Safari — nevie programovú inštaláciu, treba návod „Pridať na plochu". */
export function isIOS(): boolean {
  const ua = navigator.userAgent;
  const iOSDevice = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const safari = /safari/i.test(ua) && !/crios|fxios|edgios|android/i.test(ua);
  return iOSDevice && safari;
}

export function hasDeferredPrompt(): boolean {
  return !!deferred;
}

export function dismissedRecently(): boolean {
  try {
    const t = Number(localStorage.getItem(DISMISS_KEY) || 0);
    return t > 0 && Date.now() - t < COOLDOWN;
  } catch {
    return false;
  }
}

export function markDismissed(): void {
  try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* ignore */ }
}

function getVisits(): number {
  try { return Number(localStorage.getItem(VISITS_KEY) || 0); } catch { return 0; }
}

/** Dosť „zapojený" na ponuku? (2.+ návšteva). Časový spúšťač rieši komponent. */
export function engaged(): boolean {
  return getVisits() >= 2;
}

/** Má sa automaticky ponúknuť inštalácia? */
export function shouldAutoOffer(): boolean {
  if (isStandalone()) return false;
  if (dismissedRecently()) return false;
  return isIOS() || hasDeferredPrompt();
}

/** Spustí natívny inštalačný dialóg (Android/desktop). */
export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!deferred) return 'unavailable';
  try {
    deferred.prompt();
    const choice = await deferred.userChoice;
    deferred = null;
    return choice?.outcome === 'accepted' ? 'accepted' : 'dismissed';
  } catch {
    deferred = null;
    return 'unavailable';
  }
}

/** Otvorí ponuku inštalácie na požiadanie (napr. z pätičky). */
export function openInstall(): void {
  window.dispatchEvent(new CustomEvent(EVT_OPEN_INSTALL));
}

/** Zavolať raz pri štarte appky. */
export function initPwa(): void {
  // 1) počítadlo návštev (raz za reláciu prehliadača)
  try {
    if (!sessionStorage.getItem(SESSION_FLAG)) {
      sessionStorage.setItem(SESSION_FLAG, '1');
      localStorage.setItem(VISITS_KEY, String(getVisits() + 1));
    }
  } catch { /* privátny režim */ }

  // 2) odchyt inštalačnej ponuky
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    deferred = e;
    window.dispatchEvent(new CustomEvent(EVT_AVAILABLE));
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    markDismissed(); // po inštalácii už neponúkať
  });

  /* 3) service worker (inštalovateľnosť + offline). Len v bezpečnom kontexte
        a NIE v natívnej schránke: tam sú súbory priamo v zariadení, takže
        by nemal čo zrýchľovať — a vedel by podsunúť starú verziu z pamäte
        po tom, čo si appka stiahne novú cez vzduch. */
  const vSchranke = typeof window !== 'undefined' && !window.location.origin.startsWith('http');
  if (!vSchranke && 'serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => { /* neblokuj web */ });
    });

    /* Keď nový worker prevezme riadenie, stránka sa raz obnoví — inak by
       bežala so starým shellom, ktorý si pýta už neexistujúce súbory. */
    let obnovene = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (obnovene) return;
      obnovene = true;
      window.location.reload();
    });

    /* Záchytka na bielu obrazovku: keď sa nepodarí načítať skript appky,
       vymaže sa cache, odhlási worker a stránka sa raz obnoví. Značka v
       `sessionStorage` bráni slučke, keby bola chyba inde. */
    const ZNACKA = 'hradiska.zachrana-po-nasadeni';
    const zachrana = async () => {
      if (sessionStorage.getItem(ZNACKA)) return;
      sessionStorage.setItem(ZNACKA, '1');
      try {
        const kluce = await caches.keys();
        await Promise.all(kluce.map((k) => caches.delete(k)));
        const registracie = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registracie.map((r) => r.unregister()));
      } catch { /* aj tak skús obnoviť */ }
      window.location.reload();
    };
    window.addEventListener('error', (e) => {
      const ciel = e.target as HTMLElement | null;
      if (ciel && (ciel.tagName === 'SCRIPT' || ciel.tagName === 'LINK')) void zachrana();
    }, true);
    window.addEventListener('unhandledrejection', (e) => {
      const d = String((e as PromiseRejectionEvent).reason || '');
      if (/dynamically imported module|Importing a module script failed|ChunkLoadError/i.test(d)) void zachrana();
    });
  }
}
