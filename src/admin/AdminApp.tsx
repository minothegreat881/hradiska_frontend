'use client';

import { useEffect, useState } from 'react';
import {
  FileText, PenSquare, Image as ImageIcon, FolderTree, Tag, MessageSquare,
  BarChart3, LogOut, Search, ExternalLink,
} from 'lucide-react';
import { AuthProvider, useAuth } from './AuthContext';
import { LoginScreen } from './screens/LoginScreen';
import { ArticlesScreen } from './screens/ArticlesScreen';
import { EditorScreen } from './screens/EditorScreen';
import { AnalyticsScreen } from './screens/AnalyticsScreen';
import { MediaScreen } from './screens/MediaScreen';
import { CommentsScreen } from './screens/CommentsScreen';
import { StubScreen } from './screens/StubScreen';
import { TOTALS } from './data';

export type AdminRoute =
  | 'articles' | 'editor' | 'media' | 'categories' | 'tags' | 'comments' | 'analytics';

const NAV_GROUPS: { label: string; items: { id: AdminRoute; label: string; icon: any; badge?: number }[] }[] = [
  {
    label: 'Obsah',
    items: [
      { id: 'articles', label: 'Články', icon: FileText, badge: TOTALS.all },
      { id: 'editor', label: 'Editor', icon: PenSquare },
      { id: 'media', label: 'Médiá', icon: ImageIcon },
    ],
  },
  {
    label: 'Organizácia',
    items: [
      { id: 'categories', label: 'Kategórie', icon: FolderTree, badge: 13 },
      { id: 'tags', label: 'Štítky', icon: Tag },
      { id: 'comments', label: 'Komentáre', icon: MessageSquare },
    ],
  },
  {
    label: 'Prehľady',
    items: [{ id: 'analytics', label: 'Analytika', icon: BarChart3 }],
  },
];

const ROUTE_LABELS: Record<AdminRoute, string> = {
  articles: 'Články', editor: 'Editor článku', media: 'Médiá',
  categories: 'Kategórie', tags: 'Štítky', comments: 'Komentáre', analytics: 'Analytika',
};

export default function AdminApp() {
  return (
    <AuthProvider>
      <AdminShell />
    </AuthProvider>
  );
}

function AdminShell() {
  const { user, ready, signOut } = useAuth();
  const [route, setRoute] = useState<AdminRoute>('articles');
  const [editingId, setEditingId] = useState<string | null>(null);

  // ⌘K / Ctrl+K na rýchle hľadanie
  const [searchOpen, setSearchOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(v => !v);
      }
      if (e.key === 'Escape') setSearchOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Kým sa overuje uložený token, needáme bliknúť prihlasovaciu obrazovku.
  if (!ready) {
    return (
      <div className="admin" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ad-secondary)', fontSize: 14 }}>
        Overujem prihlásenie…
      </div>
    );
  }
  if (!user) return <LoginScreen />;

  const openEditor = (id: string | null) => { setEditingId(id); setRoute('editor'); };

  return (
    <div className="admin" style={{ display: 'flex', minHeight: '100vh' }}>
      {/* ───────── Sidebar ───────── */}
      <aside
        style={{
          width: 232, flexShrink: 0, position: 'sticky', top: 0, height: '100vh',
          display: 'flex', flexDirection: 'column',
          background: 'linear-gradient(180deg, var(--ad-side-top), var(--ad-side-bottom))',
          borderRight: '1px solid var(--ad-side-line)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '20px 18px 18px' }}>
          <picture style={{ display: 'contents' }}>
            <source srcSet="/logo_slovanske_hradiska_256.webp" type="image/webp" />
            <img
              src="/logo_slovanske_hradiska_256.jpg"
              alt=""
              aria-hidden="true"
              style={{
                width: 38, height: 38, objectFit: 'contain', borderRadius: 10, padding: 2,
                background: 'radial-gradient(circle at 38% 30%, #f0d9a8, #c8a15a)',
                border: '1px solid #e6c98a', flexShrink: 0,
              }}
            />
          </picture>
          <div style={{ lineHeight: 1.25, minWidth: 0 }}>
            <div className="ad-brand" style={{ fontSize: 15, fontWeight: 700, color: '#f4ead4' }}>
              Hradiska.sk
            </div>
            <div style={{ fontSize: 9.5, letterSpacing: '.15em', color: 'var(--ad-side-label)' }}>
              ADMINISTRÁCIA
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, overflowY: 'auto' }}>
          {NAV_GROUPS.map(g => (
            <div key={g.label}>
              <div className="ad-nav-label">{g.label}</div>
              {g.items.map(it => {
                const Icon = it.icon;
                const active = route === it.id;
                return (
                  <button
                    key={it.id}
                    className="ad-nav"
                    aria-current={active ? 'page' : undefined}
                    onClick={() => (it.id === 'editor' ? openEditor(editingId) : setRoute(it.id))}
                  >
                    <Icon className="w-4 h-4" style={{ flexShrink: 0 }} />
                    {it.label}
                    {it.badge !== undefined && <span className="ad-badge">{it.badge}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div style={{ borderTop: '1px solid var(--ad-side-line)', padding: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            aria-hidden="true"
            style={{
              width: 34, height: 34, borderRadius: 999, flexShrink: 0,
              background: 'linear-gradient(180deg,#b0813a,#8a5316)', color: '#fbf3e2',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 600,
            }}
          >
            {(user?.username || 'U').charAt(0).toUpperCase()}
          </div>
          <div style={{ minWidth: 0, flex: 1, lineHeight: 1.3 }}>
            <div style={{ fontSize: 13, color: '#e8dcc8', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.username}</div>
            <div style={{ fontSize: 11, color: 'var(--ad-side-label)' }}>Správca</div>
          </div>
          <button
            onClick={signOut}
            title="Odhlásiť"
            aria-label="Odhlásiť"
            style={{ background: 'none', border: 'none', color: 'var(--ad-side-text)', cursor: 'pointer', padding: 4 }}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* ───────── Obsah ───────── */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <header
          style={{
            position: 'sticky', top: 0, zIndex: 20,
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '12px 24px', background: 'rgba(244,239,227,.9)',
            backdropFilter: 'blur(8px)', borderBottom: '1px solid var(--ad-border)',
          }}
        >
          <span style={{ fontSize: 13, color: 'var(--ad-secondary)' }}>
            Admin <span style={{ color: 'var(--ad-muted)' }}>/</span>{' '}
            <span style={{ color: 'var(--ad-text)' }}>{ROUTE_LABELS[route]}</span>
          </span>
          <div style={{ flex: 1 }} />
          <button className="abtn" onClick={() => setSearchOpen(true)} style={{ color: 'var(--ad-secondary)' }}>
            <Search className="w-4 h-4" />
            Hľadať
            <kbd style={{ marginLeft: 6, fontSize: 11, color: 'var(--ad-muted)', border: '1px solid var(--ad-field-border)', borderRadius: 5, padding: '1px 5px' }}>
              ⌘K
            </kbd>
          </button>
          <a className="abtn" href="/" target="_blank" rel="noreferrer">
            Zobraziť web <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </header>

        <main style={{ flex: 1, padding: 24, minWidth: 0 }}>
          {route === 'articles' && <ArticlesScreen onEdit={openEditor} />}
          {route === "editor" && <EditorScreen articleId={editingId} onBack={() => setRoute("articles")} onSaved={setEditingId} />}
          {route === 'analytics' && <AnalyticsScreen onEdit={openEditor} />}
          {route === 'media' && <MediaScreen />}
          {route === 'categories' && (
            <StubScreen title="Kategórie" note="13 kategórií, poradie ťahaním cez pole `order`. Polia: name*, slug*, description, order." />
          )}
          {route === 'tags' && <StubScreen title="Štítky" note="Polia: name*, slug*. Zobraziť počet použití." />}
          {route === 'comments' && <CommentsScreen />}
        </main>
      </div>

      {/* Rýchle hľadanie */}
      {searchOpen && (
        <div
          onClick={() => setSearchOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(30,22,12,.45)',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '14vh',
          }}
        >
          <div className="acard" onClick={e => e.stopPropagation()} style={{ width: 'min(560px, 92vw)', padding: 14 }}>
            <input className="afld" autoFocus placeholder="Hľadať v článkoch…" />
            <div style={{ fontSize: 12, color: 'var(--ad-muted)', marginTop: 10 }}>
              Napíšte názov článku. Zavrieť klávesou Esc.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
