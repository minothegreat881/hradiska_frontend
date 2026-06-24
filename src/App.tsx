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
import { AktualityPage } from './pages/AktualityPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { Shield, Facebook, Instagram, Youtube, Mail, ArrowUp } from 'lucide-react';
import { Toaster } from './components/ui/sonner';
import './styles/globals.css';

type Route = 'home' | 'site' | 'blog' | 'article' | 'about' | 'category' | 'mapa' | 'galeria' | 'aktuality' | 'privacy';

// Štýly pre footer stĺpce – garantujú gap/spacing nezávisle od Tailwind
const footerTitleStyle: React.CSSProperties = {
  fontFamily: 'Georgia, serif',
  fontSize: 12,
  fontWeight: 600,
  color: '#c4a574',
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  marginBottom: 14,
  marginTop: 0,
};

const footerListStyle: React.CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

const footerLinkStyle: React.CSSProperties = {
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontSize: 14,
  color: 'rgba(232,220,200,0.85)',
  textDecoration: 'none',
  transition: 'color 150ms ease',
  padding: '2px 0',
  display: 'inline-block',
};


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

      if (!link) return;

      // Skip gallery links (lightGallery handles these)
      if (link.closest('.gallery-grid') || link.closest('.lg-container') || link.hasAttribute('data-lg-size')) {
        return;
      }

      // Skip external links and non-origin links
      if (link.href.startsWith(window.location.origin) && !link.href.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
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
      {route === 'aktuality' && <AktualityPage />}
      {route === 'privacy' && <PrivacyPage />}
      {route === 'site' && <SiteDetailPage siteSlug={params.slug} />}
      {route === 'category' && <CategoryPage categorySlug={params.slug} />}
      {route === 'blog' && <BlogPage />}
      {route === 'article' && <ArticlePage articleSlug={params.slug} />}
      {route === 'about' && <AboutPage />}

      <Toaster position="top-center" />

      {/* Footer */}
      <footer
        style={{
          backgroundColor: '#2d2418', // hlboká teplá tmavohnedá – ladí s mapou header
          color: '#e8dcc8',
        }}
      >
        {/* Jemná dekoratívna vlnka na hornej hrane (zachovaná z pôvodného) */}
        <div
          className="w-full h-2 bg-repeat-x"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='8' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 4 L15 0 L30 4 L45 0 L60 4' stroke='%23c4a574' stroke-width='1.5' fill='none'/%3E%3C/svg%3E")`,
            opacity: 0.4,
          }}
        />
        {/* Tenká zlatá linka pre plynulý prechod */}
        <div style={{ height: 1, background: 'rgba(196,165,116,0.35)' }} />

        <div className="container" style={{ maxWidth: 1200, paddingTop: 48, paddingBottom: 32 }}>
          {/* 4 STĹPCE – brand širší, 3 link stĺpce rovnaké */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: 40,
            }}
            className="footer-grid"
          >
            {/* BRAND stĺpec */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 44, height: 44,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 999,
                    background: 'radial-gradient(circle at 30% 25%, #f5e9d0 0%, #c4a574 70%, #7d4f1d 130%)',
                    border: '1.5px solid #c4a574',
                    flexShrink: 0,
                  }}
                  aria-hidden="true"
                >
                  <Shield className="w-5 h-5" style={{ color: '#3a2d18' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                  <span
                    style={{
                      fontFamily: 'Georgia, "Times New Roman", serif',
                      fontSize: 18,
                      color: '#faf7f1',
                      letterSpacing: '0.04em',
                      fontWeight: 500,
                    }}
                  >
                    Hradiska.sk
                  </span>
                  <span
                    style={{
                      fontFamily: 'Georgia, serif',
                      fontSize: 12,
                      color: 'rgba(232,220,200,0.65)',
                      fontStyle: 'italic',
                      marginTop: 2,
                    }}
                  >
                    Slovanské hradiská
                  </span>
                </div>
              </div>

              <p
                style={{
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontSize: 13.5,
                  color: 'rgba(232,220,200,0.78)',
                  lineHeight: 1.6,
                  maxWidth: 280,
                  margin: 0,
                }}
              >
                Občianske združenie venované slovanským hradiskám, hradom a zámkom Slovenska.
              </p>

              {/* Sociálne ikony – pod popisom */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {[
                  { Icon: Facebook,  href: 'https://facebook.com/hradiska', label: 'Facebook' },
                  { Icon: Instagram, href: 'https://instagram.com/hradiska', label: 'Instagram' },
                  { Icon: Youtube,   href: 'https://youtube.com/@hradiska', label: 'YouTube' },
                  { Icon: Mail,      href: 'mailto:info@hradiska.sk', label: 'E-mail' },
                ].map(({ Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    className="footer-social"
                    style={{
                      width: 36, height: 36,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 999,
                      border: '1px solid rgba(196,165,116,0.4)',
                      color: '#c4a574',
                      transition: 'all 150ms ease',
                    }}
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* KATEGÓRIE */}
            <div>
              <h3 style={footerTitleStyle}>Kategórie</h3>
              <ul style={footerListStyle}>
                {[
                  { href: '/category/kniezacie-sidla', label: 'Kniežacie sídla' },
                  { href: '/category/mocenske-centra', label: 'Mocenské centrá' },
                  { href: '/category/svatyne',         label: 'Svätyne' },
                  { href: '/category/vseobecne',       label: 'Všeobecne o hradiskách' },
                ].map(l => (
                  <li key={l.href} style={{ margin: 0 }}>
                    <a href={l.href} className="footer-link" style={footerLinkStyle}>{l.label}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* ČLÁNKY */}
            <div>
              <h3 style={footerTitleStyle}>Články</h3>
              <ul style={footerListStyle}>
                {[
                  { href: '/blog',                    label: 'Všetky články' },
                  { href: '/blog?category=vyskum',    label: 'Výskum' },
                  { href: '/blog?category=metodika',  label: 'Metodika' },
                  { href: '/aktuality',               label: 'Aktuality' },
                ].map(l => (
                  <li key={l.href} style={{ margin: 0 }}>
                    <a href={l.href} className="footer-link" style={footerLinkStyle}>{l.label}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* O PROJEKTE */}
            <div>
              <h3 style={footerTitleStyle}>O projekte</h3>
              <ul style={footerListStyle}>
                {[
                  { href: '/about',                  label: 'O nás' },
                  { href: '/about#team',             label: 'Tím' },
                  { href: 'mailto:info@hradiska.sk', label: 'Kontakt' },
                  { href: '/about#podporte',         label: 'Podporte nás' },
                ].map(l => (
                  <li key={l.href} style={{ margin: 0 }}>
                    <a href={l.href} className="footer-link" style={footerLinkStyle}>{l.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Spodná lišta */}
          <div
            style={{
              marginTop: 48,
              paddingTop: 22,
              borderTop: '1px solid rgba(196,165,116,0.18)',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              alignItems: 'center',
            }}
            className="footer-bottom"
          >
            <p
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: 12.5,
                color: 'rgba(232,220,200,0.65)',
                lineHeight: 1.55,
                margin: 0,
                textAlign: 'center',
              }}
            >
              © {new Date().getFullYear()} Hradiska.sk · Projekt venovaný slovanskej archeológii a histórii
            </p>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', gap: 20 }}>
              <a
                href="/ochrana-osobnych-udajov"
                className="footer-link"
                style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: 12.5,
                  color: 'rgba(232,220,200,0.78)',
                  textDecoration: 'none',
                  padding: '4px 0',
                }}
              >
                Ochrana osobných údajov
              </a>
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="footer-link"
                style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: 12.5,
                  color: 'rgba(232,220,200,0.78)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 0',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                Späť hore <ArrowUp className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
