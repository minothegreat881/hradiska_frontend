import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
/* Šat Pečať sa sťahuje až pri zapnutí — kým je vypnutý, nikoho nestojí nič.
   Platí len tam, kde je trieda `.lab`, teda v laboratóriu a tu po `?sat=pecat`. */
const SatPecat = lazy(() => import('./design-lab/satPecat'));
/* Článok v novom šate. Nie je to prefarbená `ArticlePage`, ale vlastná
   skladba — preto sa pri zapnutom šate vymieňa celý komponent, nie štýly. */
const ArticlePagePecat = lazy(() => import('./design-lab/LabArticle'));
import { NavBar } from './components/NavBar';
import { HomePage } from './pages/HomePage';
import { SiteDetailPage } from './pages/SiteDetailPage';
import { ArticlePage } from './pages/ArticlePage';
import { AboutPage } from './pages/AboutPage';
import { CategoryPage } from './pages/CategoryPage';
import { AktualityPage } from './pages/AktualityPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';
import { AccountPage, type AccountMode } from './pages/AccountPage';
import { SearchResultsPage } from './pages/SearchResultsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { MemberAuthProvider } from './auth/MemberAuth';
import { Toaster } from './components/ui/sonner';
import { Footer } from './components/Footer';
import { CookieBanner } from './components/CookieBanner';
import { InstallPrompt } from './components/InstallPrompt';
import { initConsent } from './lib/consent';
import { useScrollRestoration } from './hooks/useScrollRestoration';
import './styles/globals.css';

// Admin je lazy — návštevník webu ho nikdy nestiahne, nezväčšuje hlavný bundle.
const AdminApp = lazy(() => import('./admin/AdminApp'));

// Mapa (Cesium/maplibre) a galéria (lightgallery) sú najťažšie závislosti.
// Lazy → nesťahuje ich bežný návštevník článku, len kto otvorí /galeria.

const GalleryPage = lazy(() => import('./pages/GalleryPage').then((m) => ({ default: m.GalleryPage })));

// Skúšobná plocha pre farebný šat domovskej stránky (/design). Lazy — bežný
// návštevník ju nikdy nestiahne. Vykresľuje SKUTOČNÚ HomePage, len ju zvonku
// prefarbí; produkčné komponenty sa nemenia.
const DesignLab = lazy(() => import('./design-lab/DesignLab'));

type Route = 'design' | 'home' | 'site' | 'article' | 'about' | 'category' | 'galeria' | 'aktuality' | 'privacy' | 'terms' | 'admin' | 'account' | 'hladat' | 'notfound';

// Cesty účtov → režim AccountPage
const ACCOUNT_ROUTES: Record<string, AccountMode> = {
  '/prihlasenie': 'login',
  '/registracia': 'register',
  '/zabudnute-heslo': 'forgot',
  '/reset-hesla': 'reset',
  '/profil': 'profile',
};



function App() {
  const [route, setRoute] = useState<Route>('home');
  const [accountMode, setAccountMode] = useState<AccountMode>('login');
  const [params, setParams] = useState<Record<string, string>>({});
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
      const searchParams = new URLSearchParams(window.location.search);

      if (path === '/' || path === '') {
        setRoute('home');
      } else if (path === '/admin' || path.startsWith('/admin/')) {
        setRoute('admin');
      } else if (ACCOUNT_ROUTES[path]) {
        setRoute('account');
        setAccountMode(ACCOUNT_ROUTES[path]);
      } else if (path === '/design' || path.startsWith('/design/')) {
        // Laboratórium má aj podstránky (`/design/blog/<slug>`); cestu si
        // rozoberie samo, router ju sem len pustí.
        setRoute('design');
      } else if (path === '/hladat' || path === '/vyhladavanie') {
        setRoute('hladat');
        setParams({ q: searchParams.get('q') || '' });
      } else if (path === '/aktuality' || path.startsWith('/aktuality/')) {
        setRoute('aktuality');
      } else if (path === '/ochrana-osobnych-udajov' || path === '/privacy') {
        setRoute('privacy');
      } else if (path === '/podmienky-pouzivania' || path === '/podmienky') {
        setRoute('terms');
      } else if (path === '/hradiska' || path.startsWith('/hradiska/')) {
        setRoute('category');
        setParams({ slug: 'hradiska' });
      } else if (path === '/kultura' || path.startsWith('/kultura/')) {
        setRoute('category');
        setParams({ slug: 'kultura' });
      } else if (path === '/archeologia' || path.startsWith('/archeologia/')) {
        setRoute('category');
        setParams({ slug: 'archeologia' });
      } else if (path === '/pramene' || path.startsWith('/pramene/')) {
        setRoute('category');
        setParams({ slug: 'pramene' });
      } else if (path === '/pravek' || path.startsWith('/pravek/')) {
        setRoute('category');
        setParams({ slug: 'pravek' });
      } else if (path.startsWith('/galeria')) {
        setRoute('galeria');
      } else if (path.startsWith('/sites/')) {
        setRoute('site');
        setParams({ slug: path.replace('/sites/', '') });
      } else if (path.startsWith('/category/')) {
        setRoute('category');
        setParams({ slug: path.replace('/category/', '') });
        // `/blog` (statická šablóna nad mock dátami) bola zmazaná — články sa
        // prehliadajú cez kategórie. Samotná cesta spadne nižšie na domovskú.
        // POZOR: `/blog/<slug>` ostáva, detail článku ide cez ňu.
      } else if (path.startsWith('/blog/')) {
        setRoute('article');
        setParams({ slug: path.replace('/blog/', '') });
      } else if (path === '/about') {
        setRoute('about');
      } else {
        // Neznáma cesta → poriadna 404 (nie tiché zobrazenie domovskej = soft 404).
        setRoute('notfound');
      }
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
  const satZapnuty = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const chce = new URLSearchParams(window.location.search).get('sat');
    if (chce === 'pecat') { try { localStorage.setItem('sat', 'pecat'); } catch { /* súkromný režim */ } return true; }
    if (chce === 'povodna') { try { localStorage.removeItem('sat'); } catch { /* súkromný režim */ } return false; }
    try { return localStorage.getItem('sat') === 'pecat'; } catch { return false; }
  }, [pathname]);

  // Laboratórium má vlastný rám — prepínač tém je nad stránkou.
  if (route === 'design') {
    return (
      <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111', color: '#888', fontSize: 14 }}>Načítavam…</div>}>
        <DesignLab />
      </Suspense>
    );
  }

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
        <AdminApp />
      </Suspense>
    );
  }

  return (
    /* ── ŠAT PEČAŤ NA OSTREJ STRÁNKE ────────────────────────────────────
       Šat žije v `design-lab/theme.css` a je zapuzdrený pod `.lab`. Aby
       platil aj tu, stačí ostrej stránke dať tú istú triedu — žiadne
       pravidlo sa neprepisuje a laboratórium ostáva nedotknuté.

       Zapína sa VÝSLOVNE, aby sa dal skúšať na ostrej adrese bez toho, aby
       ho videl každý návštevník:
         ?sat=pecat    zapne a zapamätá
         ?sat=povodna  vypne a zapamätä
       Predvolene je vypnutý. Prepínač je pri `satZapnuty` nižšie. */
    <div className={satZapnuty ? 'min-h-screen lab' : 'min-h-screen'}
         data-theme={satZapnuty ? 'pecat' : undefined}>
      {satZapnuty && <Suspense fallback={null}><SatPecat /></Suspense>}
      <NavBar />

      <Suspense fallback={
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8a795e', fontFamily: 'Georgia, serif', fontSize: 15 }}>
          Načítavam…
        </div>
      }>
        {route === 'home' && <HomePage />}
        {route === 'galeria' && <GalleryPage />}
        {route === 'aktuality' && <AktualityPage />}
        {route === 'privacy' && <PrivacyPage />}
        {route === 'terms' && <TermsPage />}
        {route === 'site' && <SiteDetailPage siteSlug={params.slug} />}
        {route === 'category' && <CategoryPage categorySlug={params.slug} />}
        {route === 'article' && (satZapnuty
          ? <ArticlePagePecat slug={params.slug} />
          : <ArticlePage articleSlug={params.slug} />)}
        {route === 'about' && <AboutPage />}
        {route === 'account' && <AccountPage mode={accountMode} />}
        {route === 'hladat' && <SearchResultsPage query={params.q} />}
        {route === 'notfound' && <NotFoundPage />}
      </Suspense>

      <Toaster position="top-center" />

      <Footer />

      {/* GDPR cookie-consent — fixed dole, neblokuje scroll; späť sa otvorí z pätičky */}
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
