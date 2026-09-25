import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
/* Odkladané obrazovky cez `lazyStale` — po nasadení novej verzie sa stará
   karta radšej raz obnoví, než by ostala visieť na chýbajúcom súbore. */
import { lazyStale } from './lib/lazyStale';
/* Pripomienky (klik na prvok → poznámka) — vykreslí sa len prihlásenému
   redaktorovi, čitateľ z nástroja nestiahne nič. */
import { PripomienkyDock } from './pripomienky/PripomienkyDock';
import './design-lab/theme.css';
/* Článok v novom šate. Nie je to prefarbená `ArticlePage`, ale vlastná
   skladba — preto sa pri zapnutom šate vymieňa celý komponent, nie štýly. */
const ArticlePagePecat = lazyStale(() => import('./design-lab/LabArticle'));
/* Časti webu, ktoré v novom šate nesú vlastnú skladbu, nie len farby. */
const LabNav = lazyStale(() => import('./design-lab/LabNav').then(m => ({ default: m.LabNav })));
const LabFooter = lazyStale(() => import('./design-lab/LabFooter').then(m => ({ default: m.LabFooter })));
const LabHome = lazyStale(() => import('./design-lab/LabHome').then(m => ({ default: m.LabHome })));
const LabJoinUs = lazyStale(() => import('./design-lab/LabJoinUs').then(m => ({ default: m.LabJoinUs })));
const GalleryPagePecat = lazyStale(() => import('./design-lab/LabGaleria'));
const AktualityPagePecat = lazyStale(() => import('./design-lab/LabAktualityStranka'));
import { SiteDetailPage } from './pages/SiteDetailPage';
import { CategoryPage } from './pages/CategoryPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';
import { AccountPage, type AccountMode } from './pages/AccountPage';
import { SearchResultsPage } from './pages/SearchResultsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { MemberAuthProvider } from './auth/MemberAuth';
import { Toaster } from './components/ui/sonner';
import { CookieBanner } from './components/CookieBanner';
import { InstallPrompt } from './components/InstallPrompt';
import { initConsent } from './lib/consent';
import { useScrollRestoration } from './hooks/useScrollRestoration';
import './styles/globals.css';

// Admin je lazy — návštevník webu ho nikdy nestiahne, nezväčšuje hlavný bundle.
const AdminApp = lazyStale(() => import('./admin/AdminApp'));

// Mapa (Cesium/maplibre) a galéria (lightgallery) sú najťažšie závislosti.
// Lazy → nesťahuje ich bežný návštevník článku, len kto otvorí /galeria.


type Route = 'home' | 'site' | 'article' | 'category' | 'galeria' | 'aktuality' | 'privacy' | 'terms' | 'admin' | 'account' | 'hladat' | 'notfound';

// Cesty účtov → režim AccountPage
const ACCOUNT_ROUTES: Record<string, AccountMode> = {
  '/prihlasenie': 'login',
  '/registracia': 'register',
  '/zabudnute-heslo': 'forgot',
  '/reset-hesla': 'reset',
  '/profil': 'profile',
};



/**
 * Cesta z adresy — ČISTÁ funkcia, žiadny stav.
 *
 * Predtým sa počiatočná cesta nastavovala na `'home'` a až efekt po pripojení
 * ju opravil podľa adresy. Znamenalo to, že KAŽDÁ stránka na okamih vykreslila
 * domovskú — a tým stiahla jej kód aj s mapou a knižnicou MapLibre. Namerané
 * na `/category/refugia`: 274 kB MapLibre + 38 kB mapy + 9 kB domovskej, na
 * stránke, ktorá mapu nikdy neukáže.
 *
 * Adresa je známa hneď pri prvom vykreslení, takže sa z nej dá vychádzať rovno.
 */
export function urcCestu(path: string, search: string): { route: Route; params: Record<string, string>; accountMode: AccountMode | null } {
  const searchParams = new URLSearchParams(search);
  const vysledok: { route: Route; params: Record<string, string>; accountMode: AccountMode | null } = {
    route: 'home',
    params: {},
    accountMode: null,
  };


      if (path === '/' || path === '') {
        vysledok.route = ('home');
      } else if (path === '/admin' || path.startsWith('/admin/')) {
        vysledok.route = ('admin');
      } else if (ACCOUNT_ROUTES[path]) {
        vysledok.route = ('account');
        vysledok.accountMode = (ACCOUNT_ROUTES[path]);
      } else if (path === '/hladat' || path === '/vyhladavanie') {
        vysledok.route = ('hladat');
        vysledok.params = ({ q: searchParams.get('q') || '' });
      } else if (path === '/aktuality' || path.startsWith('/aktuality/')) {
        vysledok.route = ('aktuality');
      } else if (path === '/ochrana-osobnych-udajov' || path === '/privacy') {
        vysledok.route = ('privacy');
      } else if (path === '/podmienky-pouzivania' || path === '/podmienky') {
        vysledok.route = ('terms');
      } else if (path === '/hradiska' || path.startsWith('/hradiska/')) {
        vysledok.route = ('category');
        vysledok.params = ({ slug: 'hradiska' });
      } else if (path === '/kultura' || path.startsWith('/kultura/')) {
        vysledok.route = ('category');
        vysledok.params = ({ slug: 'kultura' });
      } else if (path === '/archeologia' || path.startsWith('/archeologia/')) {
        vysledok.route = ('category');
        vysledok.params = ({ slug: 'archeologia' });
      } else if (path === '/pramene' || path.startsWith('/pramene/')) {
        vysledok.route = ('category');
        vysledok.params = ({ slug: 'pramene' });
      } else if (path === '/pravek' || path.startsWith('/pravek/')) {
        vysledok.route = ('category');
        vysledok.params = ({ slug: 'pravek' });
      } else if (path.startsWith('/galeria')) {
        vysledok.route = ('galeria');
      } else if (path.startsWith('/sites/')) {
        vysledok.route = ('site');
        vysledok.params = ({ slug: path.replace('/sites/', '') });
      } else if (path.startsWith('/category/')) {
        vysledok.route = ('category');
        vysledok.params = ({ slug: path.replace('/category/', '') });
        // `/blog` (statická šablóna nad mock dátami) bola zmazaná — články sa
        // prehliadajú cez kategórie. Samotná cesta spadne nižšie na domovskú.
        // POZOR: `/blog/<slug>` ostáva, detail článku ide cez ňu.
      } else if (path.startsWith('/blog/')) {
        vysledok.route = ('article');
        vysledok.params = ({ slug: path.replace('/blog/', '') });
      } else {
        // Neznáma cesta → poriadna 404 (nie tiché zobrazenie domovskej = soft 404).
        vysledok.route = ('notfound');
      }
    
  return vysledok;
}

function App() {
  /* Počiatočný stav sa počíta z adresy, nie z 'home' — inak by každá stránka
     na okamih vykreslila domovskú a stiahla jej kód aj s mapou (viď `urcCestu`). */
  const [uvod] = useState(() => urcCestu(window.location.pathname, window.location.search));
  const [route, setRoute] = useState<Route>(uvod.route);
  const [accountMode, setAccountMode] = useState<AccountMode>(uvod.accountMode ?? 'login');
  const [params, setParams] = useState<Record<string, string>>(uvod.params);
  const [pathname, setPathname] = useState(window.location.pathname);
  // true on initial load and browser back/forward (restore old scroll position),
  // false right after a link click (that already scrolls to top itself).
  const [restoreScroll, setRestoreScroll] = useState(true);

  useScrollRestoration(pathname, restoreScroll);

  // Ak už je uložený súhlas s cookies, aplikuj ho pri štarte (napr. spustí analytiku).
  useEffect(() => { initConsent(); }, []);

  useEffect(() => {
    // Simple client-side routing
    const handleNavigation = () => {
      const path = window.location.pathname;
      setPathname(path);
      const v = urcCestu(path, window.location.search);
      setRoute(v.route);
      setParams(v.params);
      if (v.accountMode) setAccountMode(v.accountMode);
    };

    handleNavigation();

    // Listen to popstate for browser back/forward — restore that page's
    // scroll position (this is where users expect to land back where they were).
    const handlePopState = () => {
      setRestoreScroll(true);
      handleNavigation();
    };
    window.addEventListener('popstate', handlePopState);

    // Intercept link clicks
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');

      if (!link) return;

      // Skip gallery links (lightGallery handles these)
      if (link.closest('.gallery-grid') || link.closest('.lg-container') || link.hasAttribute('data-lg-size')) {
        return;
      }

      // Skip external links and non-origin links
      if (link.href.startsWith(window.location.origin) && !link.href.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
        e.preventDefault();
        setRestoreScroll(false); // forward navigation — go to top, don't restore
        window.history.pushState({}, '', link.href);
        handleNavigation();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    document.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('click', handleClick);
    };
  }, []);

  // Mobilné gesto: potiahnutie prstom DOĽAVA cez obsah = späť (história prehliadača).
  // Vylúčené stránky/oblasti s vlastnými horizontálnymi gestami (mapa, galéria,
  // lightbox fotky, mapy, canvas, polia na písanie).
  useEffect(() => {
    if (route === 'galeria') return;
    let x0 = 0, y0 = 0, t0 = 0, skip = false;
    const onStart = (e: TouchEvent) => {
      const t = e.touches[0];
      x0 = t.clientX; y0 = t.clientY; t0 = Date.now();
      const el = e.target as HTMLElement | null;
      skip = !!el?.closest?.('.pl-overlay, .map-3d-box, .maplibregl-map, .mapboxgl-map, canvas, input, textarea, [data-swipe-ignore]');
    };
    const onEnd = (e: TouchEvent) => {
      if (skip) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - x0;
      const dy = t.clientY - y0;
      const dt = Date.now() - t0;
      // Výrazne doľava, dominantne horizontálne, dosť rýchle → späť.
      if (dx < -90 && Math.abs(dx) > Math.abs(dy) * 1.8 && dt < 800) {
        if (window.history.length > 1) window.history.back();
      }
    };
    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchend', onEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchend', onEnd);
    };
  }, [route]);


  /* Voľba šatu prežije preklik na ďalšiu stránku — `?sat=` sa zapamätá.
     Kým sa nezapne, nikto na webe nič nespozoruje. */

  /* Značka na koreni dokumentu. Cookie lišta, výzva na inštaláciu, hlásenia
     aj svetlík fotky idú PORTÁLOM mimo `.lab`, kam by šat nedosiahol, a
     rodiny `--ck-*`, `--ch-*` a `--ad-*` sú definované priamo na svojich
     prvkoch, kde dedenie z `.lab` prehráva. */
  useEffect(() => { document.documentElement.dataset.sat = 'pecat'; }, []);

  // Admin má vlastný shell — bez NavBaru, pätičky a Toasteru webu.
  if (route === 'admin') {
    return (
      <Suspense
        fallback={
          <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4efe3', color: '#8a795e', fontSize: 14 }}>
            Načítavam administráciu…
          </div>
        }
      >
        {/* Aj administrácia beží v šate — má vlastný rám mimo `.lab`, takže
            paletu berie zo značky na koreni dokumentu. Nosič sa tu musí
            vykresliť zvlášť: táto vetva sa vracia skôr než hlavná. */}
        <AdminApp />
      </Suspense>
    );
  }

  return (
    /* Šat Pečať je JEDINÝ šat webu. Trieda `.lab` je tu preto, že pod ňou je
       celý šat zapuzdrený — premenovať ju by znamenalo prepísať vyše dvoch
       tisíc riadkov CSS bez toho, aby sa čokoľvek zmenilo na obrazovke.
       Starý zlatohnedý šat je v značke `stary-sat-2026-08-18`. */
    <div className="min-h-screen lab" data-theme="pecat">
      <LabNav />

      <Suspense fallback={
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--hr-muted)', fontFamily: 'var(--font-serif, Georgia, serif)', fontSize: 15 }}>
          Načítavam…
        </div>
      }>
        {route === 'home' && <><LabHome /><LabJoinUs /></>}
        {route === 'galeria' && <GalleryPagePecat />}
        {route === 'aktuality' && <AktualityPagePecat />}
        {route === 'privacy' && <PrivacyPage />}
        {route === 'terms' && <TermsPage />}
        {route === 'site' && <SiteDetailPage siteSlug={params.slug} />}
        {route === 'category' && <CategoryPage categorySlug={params.slug} />}
        {route === 'article' && <ArticlePagePecat slug={params.slug} />}
        {route === 'account' && <AccountPage mode={accountMode} />}
        {route === 'hladat' && <SearchResultsPage query={params.q} />}
        {route === 'notfound' && <NotFoundPage />}
      </Suspense>

      <Toaster position="top-center" />

      <LabFooter />

      {/* GDPR cookie-consent — fixed dole, neblokuje scroll; späť sa otvorí z pätičky */}
      <PripomienkyDock />
      <CookieBanner />

      {/* PWA — ponuka „Nainštalovať appku" (až po zapojení a cookie lište) */}
      <InstallPrompt />
    </div>
  );
}

// MemberAuthProvider obaľuje celú appku — prihlásenie člena je dostupné všade
// (komentáre, profil), nielen na stránkach účtu.
export default function AppWithAuth() {
  return (
    <MemberAuthProvider>
      <App />
    </MemberAuthProvider>
  );
}
