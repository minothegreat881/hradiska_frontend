import { useState, useEffect, lazy, Suspense } from 'react';
import { NavBar } from './components/NavBar';
import { HomePage } from './pages/HomePage';
import { SiteDetailPage } from './pages/SiteDetailPage';
import { ArticlePage } from './pages/ArticlePage';
import { AboutPage } from './pages/AboutPage';
import { CategoryPage } from './pages/CategoryPage';
import { AktualityPage } from './pages/AktualityPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { AccountPage, type AccountMode } from './pages/AccountPage';
import { SearchResultsPage } from './pages/SearchResultsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { MemberAuthProvider } from './auth/MemberAuth';
import { Toaster } from './components/ui/sonner';
import { Footer } from './components/Footer';
import { CookieBanner } from './components/CookieBanner';
import { initConsent } from './lib/consent';
import { useScrollRestoration } from './hooks/useScrollRestoration';
import './styles/globals.css';

// Admin je lazy — návštevník webu ho nikdy nestiahne, nezväčšuje hlavný bundle.
const AdminApp = lazy(() => import('./admin/AdminApp'));

// Mapa (Cesium/maplibre) a galéria (lightgallery) sú najťažšie závislosti.
// Lazy → nesťahuje ich bežný návštevník článku, len kto otvorí /mapa alebo /galeria.
const MapPage = lazy(() => import('./pages/MapPage').then((m) => ({ default: m.MapPage })));
const GalleryPage = lazy(() => import('./pages/GalleryPage').then((m) => ({ default: m.GalleryPage })));

type Route = 'home' | 'site' | 'article' | 'about' | 'category' | 'mapa' | 'galeria' | 'aktuality' | 'privacy' | 'admin' | 'account' | 'hladat' | 'notfound';

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
      } else if (path === '/hladat' || path === '/vyhladavanie') {
        setRoute('hladat');
        setParams({ q: searchParams.get('q') || '' });
      } else if (path === '/mapa') {
        setRoute('mapa');
      } else if (path === '/aktuality' || path.startsWith('/aktuality/')) {
        setRoute('aktuality');
      } else if (path === '/ochrana-osobnych-udajov' || path === '/privacy') {
        setRoute('privacy');
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
    <div className="min-h-screen">
      <NavBar />

      <Suspense fallback={
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8a795e', fontFamily: 'Georgia, serif', fontSize: 15 }}>
          Načítavam…
        </div>
      }>
        {route === 'home' && <HomePage />}
        {route === 'mapa' && <MapPage />}
        {route === 'galeria' && <GalleryPage />}
        {route === 'aktuality' && <AktualityPage />}
        {route === 'privacy' && <PrivacyPage />}
        {route === 'site' && <SiteDetailPage siteSlug={params.slug} />}
        {route === 'category' && <CategoryPage categorySlug={params.slug} />}
        {route === 'article' && <ArticlePage articleSlug={params.slug} />}
        {route === 'about' && <AboutPage />}
        {route === 'account' && <AccountPage mode={accountMode} />}
        {route === 'hladat' && <SearchResultsPage query={params.q} />}
        {route === 'notfound' && <NotFoundPage />}
      </Suspense>

      <Toaster position="top-center" />

      <Footer />

      {/* GDPR cookie-consent — fixed dole, neblokuje scroll; späť sa otvorí z pätičky */}
      <CookieBanner />
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
