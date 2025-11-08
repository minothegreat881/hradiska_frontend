import { useState, useEffect } from 'react';
import { NavBar } from './components/NavBar';
import { HomePage } from './pages/HomePage';
import { SiteDetailPage } from './pages/SiteDetailPage';
import { BlogPage } from './pages/BlogPage';
import { ArticlePage } from './pages/ArticlePage';
import { AboutPage } from './pages/AboutPage';
import { CategoryPage } from './pages/CategoryPage';
import { MapPage } from './pages/MapPage';
import { GalleryPage } from './pages/GalleryPage';
import { Toaster } from './components/ui/sonner';
import './styles/globals.css';

type Route = 'home' | 'site' | 'blog' | 'article' | 'about' | 'category' | 'mapa' | 'galeria';

function App() {
  const [route, setRoute] = useState<Route>('home');
  const [params, setParams] = useState<Record<string, string>>({});

  useEffect(() => {
    // Simple client-side routing
    const handleNavigation = () => {
      const path = window.location.pathname;
      const searchParams = new URLSearchParams(window.location.search);

      if (path === '/' || path === '') {
        setRoute('home');
      } else if (path === '/mapa') {
        setRoute('mapa');
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
      } else if (path === '/blog') {
        setRoute('blog');
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

    // Listen to popstate for browser back/forward
    window.addEventListener('popstate', handleNavigation);

    // Intercept link clicks
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');

      if (link && link.href.startsWith(window.location.origin)) {
        e.preventDefault();
        window.history.pushState({}, '', link.href);
        handleNavigation();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    document.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('popstate', handleNavigation);
      document.removeEventListener('click', handleClick);
    };
  }, []);

  return (
    <div className="min-h-screen">
      <NavBar />
      
      {route === 'home' && <HomePage />}
      {route === 'mapa' && <MapPage />}
      {route === 'galeria' && <GalleryPage />}
      {route === 'site' && <SiteDetailPage siteSlug={params.slug} />}
      {route === 'category' && <CategoryPage categorySlug={params.slug} />}
      {route === 'blog' && <BlogPage />}
      {route === 'article' && <ArticlePage articleSlug={params.slug} />}
      {route === 'about' && <AboutPage />}

      <Toaster richColors position="top-center" />

      {/* Footer */}
      <footer className="bg-stone-900 dark:bg-stone-950 text-stone-400 py-12 md:py-16 border-t-4 border-double border-amber-800/40">
        {/* Decorative top border */}
        <div className="w-full h-2 bg-repeat-x mb-8" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='8' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 4 L15 0 L30 4 L45 0 L60 4' stroke='%23b8792d' stroke-width='1.5' fill='none'/%3E%3C/svg%3E")`,
          opacity: 0.3
        }}></div>

        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-amber-800 flex items-center justify-center border border-amber-900">
                  <span className="text-amber-50 text-sm">🏛️</span>
                </div>
                <span className="text-amber-100 uppercase tracking-wider" style={{
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  letterSpacing: '0.1em'
                }}>Hradiska.sk</span>
              </div>
              <p className="text-sm text-stone-400 leading-relaxed" style={{
                fontFamily: 'Georgia, "Times New Roman", serif'
              }}>
                Vedecká databáza archeologických lokalít a hradísk Slovenska.
              </p>
            </div>

            <div>
              <h3 className="text-amber-100 mb-4 uppercase tracking-wide text-sm" style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                letterSpacing: '0.1em'
              }}>Kategórie</h3>
              <ul className="space-y-2 text-sm" style={{
                fontFamily: 'Georgia, "Times New Roman", serif'
              }}>
                <li>
                  <a href="/category/kniezacie-sidla" className="hover:text-amber-200 transition-colors">
                    Kniežacie sídla
                  </a>
                </li>
                <li>
                  <a href="/category/mocenske-centra" className="hover:text-amber-200 transition-colors">
                    Mocenské centrá
                  </a>
                </li>
                <li>
                  <a href="/category/svatyne" className="hover:text-amber-200 transition-colors">
                    Svätyne
                  </a>
                </li>
                <li>
                  <a href="/category/vseobecne" className="hover:text-amber-200 transition-colors">
                    Všeobecne o hradiskách
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-amber-100 mb-4 uppercase tracking-wide text-sm" style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                letterSpacing: '0.1em'
              }}>Články</h3>
              <ul className="space-y-2 text-sm" style={{
                fontFamily: 'Georgia, "Times New Roman", serif'
              }}>
                <li>
                  <a href="/blog" className="hover:text-amber-200 transition-colors">
                    Všetky články
                  </a>
                </li>
                <li>
                  <a href="/blog?category=vyskum" className="hover:text-amber-200 transition-colors">
                    Výskum
                  </a>
                </li>
                <li>
                  <a href="/blog?category=metodika" className="hover:text-amber-200 transition-colors">
                    Metodika
                  </a>
                </li>
                <li>
                  <a href="/blog?category=aktuality" className="hover:text-amber-200 transition-colors">
                    Aktuality
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-amber-100 mb-4 uppercase tracking-wide text-sm" style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                letterSpacing: '0.1em'
              }}>O projekte</h3>
              <ul className="space-y-2 text-sm" style={{
                fontFamily: 'Georgia, "Times New Roman", serif'
              }}>
                <li>
                  <a href="/about" className="hover:text-amber-200 transition-colors">
                    O nás
                  </a>
                </li>
                <li>
                  <a href="/about#team" className="hover:text-amber-200 transition-colors">
                    Tím
                  </a>
                </li>
                <li>
                  <a href="mailto:info@hradiska.sk" className="hover:text-amber-200 transition-colors">
                    Kontakt
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 mt-8 border-t-2 border-amber-900/30 text-sm text-center md:text-left">
            {/* Decorative ornament */}
            <div className="flex justify-center md:justify-start mb-4">
              <svg width="100" height="12" viewBox="0 0 100 12" className="text-amber-700/40">
                <path d="M0 6 L100 6" stroke="currentColor" strokeWidth="1" fill="none"/>
                <circle cx="50" cy="6" r="4" stroke="currentColor" strokeWidth="1" fill="none"/>
              </svg>
            </div>
            
            <p className="text-stone-400 leading-relaxed" style={{
              fontFamily: 'Georgia, "Times New Roman", serif'
            }}>
              © {new Date().getFullYear()} <span className="text-amber-200">HRADISKA.SK</span> — Všetky práva vyhradené.
              <br className="sm:hidden" />
              <span className="italic"> Projekt venovaný slovenskej archeológii a histórii.</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
