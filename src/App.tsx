import { useState, useEffect } from 'react';
import { NavBar } from './components/NavBar';
import { HomePage } from './pages/HomePage';
import { SiteDetailPage } from './pages/SiteDetailPage';
import { ArticlePage } from './pages/ArticlePage';
import { AboutPage } from './pages/AboutPage';
import { CategoryPage } from './pages/CategoryPage';
import { MapPage } from './pages/MapPage';
import { GalleryPage } from './pages/GalleryPage';
import { AktualityPage } from './pages/AktualityPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { Toaster } from './components/ui/sonner';
import { Footer } from './components/Footer';
import { useScrollRestoration } from './hooks/useScrollRestoration';
import './styles/globals.css';

type Route = 'home' | 'site' | 'article' | 'about' | 'category' | 'mapa' | 'galeria' | 'aktuality' | 'privacy';



function App() {
  const [route, setRoute] = useState<Route>('home');
  const [params, setParams] = useState<Record<string, string>>({});
  const [pathname, setPathname] = useState(window.location.pathname);
  // true on initial load and browser back/forward (restore old scroll position),
  // false right after a link click (that already scrolls to top itself).
  const [restoreScroll, setRestoreScroll] = useState(true);

  useScrollRestoration(pathname, restoreScroll);

  useEffect(() => {
    // Simple client-side routing
    const handleNavigation = () => {
      const path = window.location.pathname;
      setPathname(path);
      const searchParams = new URLSearchParams(window.location.search);

      if (path === '/' || path === '') {
        setRoute('home');
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
        setRoute('home');
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

  return (
    <div className="min-h-screen">
      <NavBar />
      
      {route === 'home' && <HomePage />}
      {route === 'mapa' && <MapPage />}
      {route === 'galeria' && <GalleryPage />}
      {route === 'aktuality' && <AktualityPage />}
      {route === 'privacy' && <PrivacyPage />}
      {route === 'site' && <SiteDetailPage siteSlug={params.slug} />}
      {route === 'category' && <CategoryPage categorySlug={params.slug} />}
      {route === 'article' && <ArticlePage articleSlug={params.slug} />}
      {route === 'about' && <AboutPage />}

      <Toaster position="top-center" />

      <Footer />
    </div>
  );
}

export default App;
