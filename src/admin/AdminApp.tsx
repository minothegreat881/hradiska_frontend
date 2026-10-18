'use client';

import { useEffect, useState, useRef } from 'react';
import {
  FileText, PenSquare, Image as ImageIcon, FolderTree, Tag, MessageSquare,
  BarChart3, LogOut, Search, ExternalLink, Users, FileEdit, MessageSquarePlus, Flag, LayoutTemplate,
} from 'lucide-react';
import '../styles/admin-redesign.css';
import { AuthProvider, useAuth } from './AuthContext';
import { LoginScreen } from './screens/LoginScreen';
import { ArticlesScreen } from './screens/ArticlesScreen';
import { DraftsScreen } from './screens/DraftsScreen';
import { NahlaseniaScreen } from './screens/NahlaseniaScreen';
import { PripomienkyScreen } from './screens/PripomienkyScreen';
import { maNeulozeneZmeny, odlozTeraz, spravaOdchodu } from './editor/state/rozpracovane';
import { VzhladModul, type StrankaModulu } from './vzhlad/VzhladModul';
import { EditorScreen } from './screens/EditorScreen';
import { AnalyticsScreen } from './screens/AnalyticsScreen';
import { MediaScreen } from './screens/MediaScreen';
import { CommentsScreen } from './screens/CommentsScreen';
import { UsersScreen } from './screens/UsersScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { CategoriesScreen } from './screens/CategoriesScreen';
import { TagsScreen } from './screens/TagsScreen';
import { fetchNavCounts } from './api/posts';
import { StavPosty } from './components/StavPosty';

export type AdminRoute =
  | 'articles' | 'drafts' | 'editor' | 'vzhlad' | 'media' | 'categories' | 'tags' | 'comments' | 'pripomienky' | 'nahlasenia' | 'users' | 'analytics' | 'profile';

/**
 * Poloha v administrácii — v adrese za `#`, aby prežila obnovenie stránky
 * a fungovalo Späť/Vpred v prehliadači:
 *   #/articles, #/drafts, #/media, … (obrazovky),
 *   #/editor/<documentId> (editor článku; #/editor = nový článok),
 *   #/vzhlad/domov, #/vzhlad/kategoria/<slug>, #/vzhlad/menu, #/vzhlad/formular.
 * Na `#/vzhlad/…` vedie aj tlačidlo „Upraviť túto stránku" na webe.
 */
export type Poloha =
  | { route: Exclude<AdminRoute, 'editor' | 'vzhlad'> }
  | { route: 'editor'; id: string | null }
  | { route: 'vzhlad'; stranka: StrankaModulu };

const OBRAZOVKY: AdminRoute[] = ['articles', 'drafts', 'editor', 'vzhlad', 'media', 'categories', 'tags', 'comments', 'pripomienky', 'nahlasenia', 'users', 'analytics', 'profile'];

export function polohaZHashu(hash: string): Poloha {
  const casti = hash.replace(/^#\/?/, '').split('/').map((c) => { try { return decodeURIComponent(c); } catch { return c; } });
  const r = casti[0] as AdminRoute;
  if (r === 'vzhlad') {
    if (casti[1] === 'kategoria' && casti[2]) return { route: 'vzhlad', stranka: { druh: 'kategoria', slug: casti[2] } };
    if (casti[1] === 'menu') return { route: 'vzhlad', stranka: { druh: 'menu' } };
    if (casti[1] === 'formular') return { route: 'vzhlad', stranka: { druh: 'formular' } };
    return { route: 'vzhlad', stranka: { druh: 'domov' } };
  }
  if (r === 'editor') return { route: 'editor', id: casti[1] || null };
  if (OBRAZOVKY.includes(r)) return { route: r as Exclude<AdminRoute, 'editor' | 'vzhlad'> };
  return { route: 'articles' };
}

export function hashZPolohy(p: Poloha): string {
  if (p.route === 'editor') return p.id ? `#/editor/${encodeURIComponent(p.id)}` : '#/editor';
  if (p.route === 'vzhlad') {
    const st = p.stranka;
    return st.druh === 'kategoria' ? `#/vzhlad/kategoria/${encodeURIComponent(st.slug)}` : `#/vzhlad/${st.druh}`;
  }
  return `#/${p.route}`;
}

/** Je to tá istá obrazovka (prechod medzi nimi nič neodmontuje)? */
const tenIstyModul = (a: Poloha, b: Poloha) =>
  a.route === b.route && (a.route !== 'editor' || (b.route === 'editor' && a.id === b.id));

const adresaS = (hash: string) => `${window.location.pathname}${window.location.search}${hash}`;

// Badge sa dopĺňa dynamicky z reálnych počtov (viď `badges` v AdminShell) — žiadne statické čísla.
const NAV_GROUPS: { label: string; items: { id: AdminRoute; label: string; icon: any }[] }[] = [
  {
    label: 'Obsah',
    items: [
      { id: 'articles', label: 'Články', icon: FileText },
      { id: 'drafts', label: 'Koncepty', icon: FileEdit },
      { id: 'editor', label: 'Editor', icon: PenSquare },
      { id: 'vzhlad', label: 'Vzhľad webu', icon: LayoutTemplate },
      { id: 'media', label: 'Médiá', icon: ImageIcon },
    ],
  },
  {
    label: 'Organizácia',
    items: [
      { id: 'categories', label: 'Kategórie', icon: FolderTree },
      { id: 'tags', label: 'Štítky', icon: Tag },
      { id: 'comments', label: 'Komentáre', icon: MessageSquare },
      { id: 'pripomienky', label: 'Pripomienky', icon: MessageSquarePlus },
      { id: 'nahlasenia', label: 'Nahlásenia', icon: Flag },
      { id: 'users', label: 'Používatelia', icon: Users },
    ],
  },
  {
    label: 'Prehľady',
    items: [{ id: 'analytics', label: 'Analytika', icon: BarChart3 }],
  },
];

const ROUTE_LABELS: Record<AdminRoute, string> = {
  articles: 'Články', drafts: 'Koncepty', editor: 'Editor článku', vzhlad: 'Vzhľad webu', media: 'Médiá',
  categories: 'Kategórie', tags: 'Štítky', comments: 'Komentáre', pripomienky: 'Pripomienky', nahlasenia: 'Nahlásenia',
  users: 'Používatelia', analytics: 'Analytika',
  profile: 'Môj profil',
};

export default function AdminApp() {
  return (
    <AuthProvider>
      <AdminShell />
    </AuthProvider>
  );
}

function AdminShell() {
  const { user, ready, signOut, token } = useAuth();
  const [poloha, setPoloha] = useState<Poloha>(() => polohaZHashu(window.location.hash));
  const route = poloha.route;
  const [editingId, setEditingId] = useState<string | null>(() => (poloha.route === 'editor' ? poloha.id : null));
  const polohaRef = useRef(poloha);
  polohaRef.current = poloha;

  /* Stráž odchodu: rozpísaná práca (článok, vzhľad webu) sa najprv odloží
     do prehliadača a redaktor sa dozvie, kde ju nájde. */
  const smiemOdist = (z: Poloha, na: Poloha): boolean => {
    if (tenIstyModul(z, na) || !maNeulozeneZmeny()) return true;
    odlozTeraz();
    return window.confirm(
      spravaOdchodu() ?? [
        'V článku máte neuložené zmeny — na webe sa zatiaľ neprejavia.',
        '',
        'Odložil som ich do tohto prehliadača. Nájdete ich v časti „Koncepty" '
          + 'a po otvorení článku sa vás editor spýta, či ich má vrátiť.',
      ].join(String.fromCharCode(10)),
    );
  };

  /* Späť/Vpred v prehliadači a ručne zmenená adresa. Keď redaktor odchod
     odmietne, adresa sa vráti bez nového záznamu v histórii. */
  useEffect(() => {
    if (!window.location.hash) window.history.replaceState(null, '', adresaS(hashZPolohy(polohaRef.current)));
    const naZmenu = () => {
      const nova = polohaZHashu(window.location.hash);
      const stara = polohaRef.current;
      if (hashZPolohy(nova) === hashZPolohy(stara)) return;
      if (!smiemOdist(stara, nova)) {
        window.history.replaceState(null, '', adresaS(hashZPolohy(stara)));
        return;
      }
      if (nova.route === 'editor') setEditingId(nova.id);
      setPoloha(nova);
    };
    window.addEventListener('hashchange', naZmenu);
    return () => window.removeEventListener('hashchange', naZmenu);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  /** Prechod na inú obrazovku: zápis do adresy → `hashchange` → stav (a stráž). */
  const prejdi = (na: Poloha, nahradit = false) => {
    const h = hashZPolohy(na);
    if (h === window.location.hash) { setPoloha(na); return; }
    if (nahradit) {
      window.history.replaceState(null, '', adresaS(h));
      setPoloha(na);
      return;
    }
    window.location.hash = h;
  };
  const setRoute = (r: AdminRoute) => prejdi(
    r === 'editor' ? { route: 'editor', id: editingId }
      : r === 'vzhlad' ? { route: 'vzhlad', stranka: { druh: 'domov' } }
      : { route: r },
  );

  // Reálne počty pre badge (články/kategórie/štítky/komentáre) — nie statické čísla.
  const [badges, setBadges] = useState<Partial<Record<AdminRoute, number>>>({});
  /* Nahlásenia, ktoré pribudli, kým bola administrácia otvorená. Mail chodí
     správcom vždy, ale kto práve pracuje v administrácii, do schránky
     nepozerá — preto to musí byť vidieť aj tu. */
  const [noveNahlasenia, setNoveNahlasenia] = useState(0);
  const posledneNahlasenia = useRef<number | null>(null);

  useEffect(() => {
    if (!token) return;
    let zivy = true;

    const nacitaj = (prveNacitanie: boolean) => {
      fetchNavCounts(token)
        .then(c => {
          if (!zivy) return;
          const nahlasenia = (c as any).nahlasenia || 0;
          setBadges({ articles: c.articles, categories: c.categories, tags: c.tags, comments: c.comments || undefined, pripomienky: c.pripomienky || undefined, nahlasenia: nahlasenia || undefined });
          /* Prvé načítanie nie je „pribudlo" — to je len stav, s ktorým
             sa prišlo. Hlási sa až rozdiel oproti nemu. */
          const predtym = posledneNahlasenia.current;
          if (!prveNacitanie && predtym != null && nahlasenia > predtym) {
            setNoveNahlasenia(n => n + (nahlasenia - predtym));
          }
          posledneNahlasenia.current = nahlasenia;
        })
        .catch(() => {});
    };

    nacitaj(posledneNahlasenia.current == null);

    /* Dopytovanie beží len vtedy, keď je karta naozaj na očiach — na pozadí
       by to bola len záťaž navyše pre server aj batériu. */
    const tik = () => { if (document.visibilityState === 'visible') nacitaj(false); };
    const id = window.setInterval(tik, 45000);
    document.addEventListener('visibilitychange', tik);
    return () => { zivy = false; window.clearInterval(id); document.removeEventListener('visibilitychange', tik); };
  }, [token, route]);

  /* Keď sa na nahlásenia pozrie, upozornenie zmizne — splnilo úlohu. */
  useEffect(() => { if (route === 'nahlasenia') setNoveNahlasenia(0); }, [route]);

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

  const openEditor = (id: string | null) => prejdi({ route: 'editor', id });

  /* Odchod cez ľavú ponuku. Stráž (`smiemOdist`) sa pýta pri každej zmene
     adresy, teda aj pri Späť v prehliadači — predtým obrazovka len zmizla
     a vyzeralo to, že sa práca stratila. */
  const prejdiNa = (id: AdminRoute) => setRoute(id);

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
                background: 'radial-gradient(circle at 38% 30%, var(--hr-line-soft), var(--hr-line-gold))',
                border: '1px solid var(--hr-on-photo-3)', flexShrink: 0,
              }}
            />
          </picture>
          <div style={{ lineHeight: 1.25, minWidth: 0 }}>
            <div className="ad-brand" style={{ fontSize: 15, fontWeight: 700, color: 'var(--hr-on-photo-2)' }}>
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
                    onClick={() => (it.id === 'editor' ? openEditor(editingId) : prejdiNa(it.id))}
                  >
                    <Icon className="w-4 h-4" style={{ flexShrink: 0 }} />
                    {it.label}
                    {badges[it.id] !== undefined && <span className="ad-badge">{badges[it.id]}</span>}
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
              background: 'linear-gradient(180deg,var(--hr-accent-soft),var(--hr-accent-deep))', color: 'var(--hr-on-photo)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 600,
            }}
          >
            {(user?.username || 'U').charAt(0).toUpperCase()}
          </div>
          {/* Klik na meno otvorí vlastný profil (zmena e-mailu a hesla). */}
          <button
            onClick={() => prejdiNa('profile')}
            title="Môj profil — e-mail a heslo"
            style={{
              minWidth: 0, flex: 1, lineHeight: 1.3, textAlign: 'left',
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: 13, color: 'var(--hr-relief-high)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.username}</div>
            <div style={{ fontSize: 11, color: 'var(--ad-side-label)' }}>Superadmin · upraviť</div>
          </button>
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

        {/* Upozornenie na nové nahlásenie — v administrácii, nielen v pošte. */}
        {noveNahlasenia > 0 && route !== 'nahlasenia' && (
          <div className="ad-upoz" role="status" aria-live="polite">
            <Flag className="w-4 h-4" aria-hidden="true" />
            <span>
              {noveNahlasenia === 1
                ? 'Niekto nahlásil príspevok.'
                : `Pribudli ${noveNahlasenia} nahlásenia príspevkov.`}
            </span>
            <button className="abtn abtn-primary" onClick={() => prejdiNa('nahlasenia')}>Pozrieť</button>
            <button className="ad-upoz-x" onClick={() => setNoveNahlasenia(0)} aria-label="Skryť upozornenie">×</button>
          </div>
        )}

        <main style={{ flex: 1, padding: 24, minWidth: 0 }}>
          {/* Budíček pošty. Ukáže sa len vtedy, keď odosielanie nefunguje —
              inak by z neho po týždni bola tapeta, ktorú nikto nečíta. */}
          {token && <StavPosty token={token} />}

          {route === 'articles' && <ArticlesScreen onEdit={openEditor} />}
          {route === 'drafts' && <DraftsScreen onEdit={openEditor} />}
          {route === "editor" && <EditorScreen articleId={editingId} onBack={() => setRoute("articles")} onSaved={(id) => { setEditingId(id); prejdi({ route: 'editor', id }, true); }} />}
          {poloha.route === 'vzhlad' && (
            <VzhladModul
              stranka={poloha.stranka}
              naStranku={(st) => prejdi({ route: 'vzhlad', stranka: st })}
              upravitClanok={(id) => openEditor(id)}
              spat={() => prejdi({ route: 'articles' })}
            />
          )}
          {route === 'analytics' && <AnalyticsScreen onEdit={openEditor} />}
          {route === 'media' && <MediaScreen />}
          {route === 'categories' && <CategoriesScreen onVzhlad={(slug) => prejdi({ route: 'vzhlad', stranka: { druh: 'kategoria', slug } })} />}
          {route === 'tags' && <TagsScreen />}
          {route === 'comments' && <CommentsScreen />}
          {route === 'pripomienky' && <PripomienkyScreen />}
          {route === 'nahlasenia' && <NahlaseniaScreen />}
          {route === 'users' && <UsersScreen />}
          {route === 'profile' && <ProfileScreen />}
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
