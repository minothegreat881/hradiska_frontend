'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMember } from '../auth/MemberAuth';
import { deleteMyAccount } from '../lib/memberApi';
import {
  getProfile, getNotifications, getMyComments, getMyFavorites, getMyShares,
  markAllRead, editComment, deleteComment, updateProfile, uploadAvatar,
  type Profile, type NotificationItem, type MyComment, type FavoritePost, type MyShare,
} from '../lib/profileApi';
import {
  pushSupported, pushPermission, enablePush, disablePush, isPushEnabled,
} from '../lib/push';

const STRAPI_URL = import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337';
const go = (path: string) => { window.history.pushState({}, '', path); window.dispatchEvent(new PopStateEvent('popstate')); };

/* ── odznak úrovne podľa počtu komentárov (gamifikácia) ── */
function level(comments: number): string {
  if (comments >= 30) return '✦ Kronikár';
  if (comments >= 10) return '✦ Verný pútnik';
  if (comments >= 3) return '✦ Hosť hradiska';
  return '✦ Pocestný';
}

function initials(name: string): string {
  return name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';
}

const MONTHS = ['januári', 'februári', 'marci', 'apríli', 'máji', 'júni', 'júli', 'auguste', 'septembri', 'októbri', 'novembri', 'decembri'];
function joinedLabel(iso: string): string {
  const d = new Date(iso);
  return `Členom družiny od ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function relTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const sameDay = d.toDateString() === now.toDateString();
  const yest = new Date(now); yest.setDate(now.getDate() - 1);
  if (sameDay) return `DNES · ${hh}:${mm}`;
  if (d.toDateString() === yest.toDateString()) return `VČERA · ${hh}:${mm}`;
  return `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()}`;
}

function mediaUrl(m: { url: string; formats?: Record<string, { url: string }> } | null | undefined): string | null {
  if (!m) return null;
  const u = m.formats?.thumbnail?.url || m.url;
  return u.startsWith('http') ? u : `${STRAPI_URL}${u}`;
}

/* ── farby (pergamen web) ── */
const C = {
  card: '#fdfaf1', border: '#ddcba0', amber: '#9a5d1f', amber2: '#c8862f',
  ink: '#4a3f2e', muted: '#a8946c', bordo: '#7c1f24',
};

export function ProfilePage() {
  const { member, token, signOut } = useMember();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tab, setTab] = useState<'notif' | 'comments' | 'saved'>('notif');
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [notifs, setNotifs] = useState<NotificationItem[] | null>(null);
  const [comments, setComments] = useState<MyComment[] | null>(null);
  const [favorites, setFavorites] = useState<FavoritePost[] | null>(null);
  const [shares, setShares] = useState<MyShare[] | null>(null);
  const [unread, setUnread] = useState(0);

  // načítanie profilu + notifikácií
  useEffect(() => {
    if (!token) return;
    getProfile(token).then(setProfile).catch(() => {});
    getNotifications(token).then((r) => {
      setNotifs(r.data);
      setUnread(r.data.filter((n) => !n.read).length);
    }).catch(() => setNotifs([]));
  }, [token]);

  // lenivé načítanie ostatných tabov + označenie notifikácií prečítanými
  useEffect(() => {
    if (!token) return;
    if (tab === 'notif' && unread > 0) {
      markAllRead(token).then(() => setUnread(0)).catch(() => {});
    }
    if (tab === 'comments' && comments === null) getMyComments(token).then(setComments).catch(() => setComments([]));
    if (tab === 'saved' && favorites === null) {
      getMyFavorites(token).then(setFavorites).catch(() => setFavorites([]));
      getMyShares(token).then(setShares).catch(() => setShares([]));
    }
  }, [tab, token]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!member || !token) return <div style={{ padding: 60, textAlign: 'center', fontFamily: 'Cormorant Garamond, serif' }}>Načítavam…</div>;

  const name = profile?.displayName || member.displayName || member.username;
  const stats = profile?.stats || { comments: 0, favorites: 0, shares: 0 };
  const avatarSrc = mediaUrl(profile?.avatar);

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', padding: '28px 20px 80px' }}>
      {/* ── HLAVIČKA ── */}
      <header style={{
        position: 'relative', overflow: 'hidden', borderRadius: 18, padding: '28px 32px',
        background: 'linear-gradient(180deg,#2c2114,#1c1510)', border: '1px solid #6b4f2a',
        display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap',
      }}>
        <div aria-hidden style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'repeating-linear-gradient(58deg, rgba(200,161,90,.05) 0 2px, transparent 2px 10px)',
        }} />
        {/* avatar */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {avatarSrc ? (
            <img src={avatarSrc} alt="" width={78} height={78}
                 style={{ width: 78, height: 78, borderRadius: '50%', objectFit: 'cover', border: '2px solid #c8a15a' }} />
          ) : (
            <div style={{
              width: 78, height: 78, borderRadius: '50%', border: '2px solid #c8a15a',
              background: 'radial-gradient(circle at 36% 30%, #a5651f, #7c1f24)',
              display: 'grid', placeItems: 'center', fontFamily: 'Cinzel, serif', fontSize: 28, color: '#f0d9a8',
            }}>{initials(name)}</div>
          )}
        </div>
        {/* meno + meta + štatistiky */}
        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: 28, fontWeight: 700, color: '#f4ead4', margin: 0 }}>{name}</h1>
            <span style={{
              fontFamily: 'Cinzel, serif', fontSize: 12, color: '#f0d493', padding: '4px 12px', borderRadius: 999,
              background: 'rgba(122,31,36,.55)', border: '1px solid rgba(200,161,90,.55)',
            }}>{level(stats.comments)}</span>
          </div>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', color: '#a8946c', margin: '6px 0 14px' }}>
            {profile ? joinedLabel(profile.joinedAt) : ''}
          </p>
          <div style={{ display: 'flex', gap: 28 }}>
            {[['komentárov', stats.comments], ['obľúbených', stats.favorites], ['zdieľaní', stats.shares]].map(([lbl, n]) => (
              <div key={lbl as string}>
                <div style={{ fontFamily: 'Cinzel, serif', fontSize: 24, color: '#e6c98a' }}>{n as number}</div>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 14, color: '#a8946c' }}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>
        <button onClick={() => setSettingsOpen(true)} style={{
          position: 'relative', alignSelf: 'flex-start', fontFamily: 'Cinzel, serif', fontSize: 12,
          color: '#e6c98a', background: 'transparent', border: '1px solid #5a462c', borderRadius: 999,
          padding: '8px 16px', cursor: 'pointer',
        }}>⚙ Nastavenia</button>
      </header>

      {/* ── TABY ── */}
      <div role="tablist" aria-label="Sekcie profilu" style={{ display: 'flex', gap: 10, margin: '22px 0 18px', flexWrap: 'wrap' }}>
        <Tab id="notif" active={tab} set={setTab} badge={unread}>Upozornenia</Tab>
        <Tab id="comments" active={tab} set={setTab}>Moje komentáre</Tab>
        <Tab id="saved" active={tab} set={setTab}>Obľúbené a zdieľané</Tab>
      </div>

      {/* ── OBSAH ── */}
      {tab === 'notif' && <div role="tabpanel"><NotifList items={notifs} /></div>}
      {tab === 'comments' && <div role="tabpanel"><CommentsList items={comments} token={token} onChange={() => getMyComments(token).then(setComments)} /></div>}
      {tab === 'saved' && <div role="tabpanel"><SavedGrid favorites={favorites} shares={shares} /></div>}

      {settingsOpen && profile && (
        <Settings profile={profile} token={token}
                  onClose={() => setSettingsOpen(false)}
                  onSaved={(p) => setProfile(p)}
                  onSignOut={() => { signOut(); go('/'); }}
                  onDeleted={() => { signOut(); go('/'); }} />
      )}
    </div>
  );
}

/* ── TAB pilulka ── */
function Tab({ id, active, set, badge, children }: {
  id: 'notif' | 'comments' | 'saved'; active: string; set: (t: any) => void; badge?: number; children: React.ReactNode;
}) {
  const on = active === id;
  return (
    <button role="tab" aria-selected={on} onClick={() => set(id)} style={{
      fontFamily: 'Cinzel, serif', fontSize: 12, letterSpacing: '.02em', cursor: 'pointer',
      padding: '9px 18px', borderRadius: 999, position: 'relative',
      background: on ? 'linear-gradient(180deg,#c8862f,#9a5d1f)' : '#f8f1de',
      color: on ? '#fbf6ea' : C.ink, border: on ? '1px solid #9a5d1f' : `1px solid #d9c69a`,
    }}>
      {children}
      {!on && !!badge && badge > 0 && (
        <span style={{
          marginLeft: 8, background: C.bordo, color: '#fff', borderRadius: 999,
          fontSize: 11, padding: '1px 7px', fontFamily: 'system-ui',
        }}>{badge}</span>
      )}
    </button>
  );
}

/* ── UPOZORNENIA ── */
function NotifList({ items }: { items: NotificationItem[] | null }) {
  if (items === null) return <Skeleton n={3} />;
  if (!items.length) return <Empty>Zatiaľ žiadne upozornenia. Keď niekto zareaguje na tvoj komentár, uvidíš to tu.</Empty>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {items.map((n) => <NotifCard key={n.documentId} n={n} />)}
    </div>
  );
}

function NotifCard({ n }: { n: NotificationItem }) {
  const who = n.actor?.displayName || n.actor?.username || 'Niekto';
  const postTitle = n.post?.title || n.aktualita?.nazov || '';
  const postHref = n.post ? `/blog/${n.post.slug}` : n.aktualita ? '/aktuality' : '#';
  const isWarn = n.type === 'warning';
  const unreadBar = !n.read && (n.type === 'reply' || n.type === 'like');

  const icon = { reply: '↩', like: '♥', warning: '⚠', post: '✦' }[n.type];
  const iconBg = { reply: '#e6eddf', like: '#f2dfda', warning: '#f2d5cc', post: '#efe6cf' }[n.type];
  const iconFg = { reply: '#5c7a52', like: '#7c1f24', warning: '#a04338', post: '#9a5d1f' }[n.type];

  let text: React.ReactNode;
  if (n.type === 'reply') text = <><b>{who}</b> odpovedal/a na tvoj komentár pod <i>{postTitle}</i></>;
  else if (n.type === 'like') text = <><b>{n.aggregateCount > 1 ? `${n.aggregateCount} čitateľov` : who}</b> ocenil{n.aggregateCount > 1 ? 'i' : '/a'} tvoj komentár pod <i>{postTitle}</i></>;
  else if (n.type === 'warning') text = <>Upozornenie správcu o nedodržaní noriem blogu.</>;
  else text = <>Nový článok na Hradiská.sk: <i>{postTitle}</i></>;

  return (
    <div style={{
      display: 'flex', gap: 14, padding: '14px 16px', borderRadius: 12,
      background: isWarn ? '#f6e3dc' : C.card,
      border: `1px solid ${isWarn ? '#dcb3a4' : C.border}`,
      borderLeft: isWarn ? '5px solid #a04338' : unreadBar ? '5px solid #c8862f' : `1px solid ${C.border}`,
      position: 'relative',
    }}>
      <div aria-hidden style={{
        width: 38, height: 38, borderRadius: '50%', flexShrink: 0, display: 'grid', placeItems: 'center',
        background: iconBg, color: iconFg, fontSize: 17,
      }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 17, color: C.ink, margin: 0, lineHeight: 1.4 }}>
          {text}{n.post || n.aktualita ? <> — <a href={postHref} style={{ color: C.amber, fontStyle: 'italic' }}>{postTitle}</a></> : null}
        </p>
        {(n.type === 'reply' || n.type === 'warning') && n.text && (
          <div style={{
            fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', color: '#7a6a52', fontSize: 15.5,
            borderLeft: '3px solid #d8c8a4', padding: '4px 12px', margin: '8px 0 0',
            background: 'rgba(255,251,240,.6)', borderRadius: '0 8px 8px 0',
          }}>{n.text}</div>
        )}
        <div style={{ fontFamily: 'Cinzel, serif', fontSize: 13, color: '#a89a7d', letterSpacing: '.04em', marginTop: 8 }}>
          {relTime(n.createdAt)}
        </div>
      </div>
      {unreadBar && <span aria-hidden style={{ width: 9, height: 9, borderRadius: '50%', background: '#c8862f', flexShrink: 0, alignSelf: 'center' }} />}
    </div>
  );
}

/* ── MOJE KOMENTÁRE ── */
const STATUS_CHIP: Record<string, { t: string; fg: string; bg: string; bd: string }> = {
  visible: { t: 'Zverejnený', fg: '#3d5c40', bg: '#e4ecdc', bd: '#c5d4b8' },
  waiting: { t: 'Čaká na schválenie', fg: '#8a5316', bg: '#f6ead0', bd: '#e0cb95' },
  reported: { t: 'Nahlásený', fg: '#a04338', bg: '#f6e3dc', bd: '#dcb3a4' },
  hidden: { t: 'Skrytý', fg: '#7a6b56', bg: '#efe6d0', bd: '#d9c69a' },
  spam: { t: 'Odstránený', fg: '#7a6b56', bg: '#efe6d0', bd: '#d9c69a' },
};

function CommentsList({ items, token, onChange }: { items: MyComment[] | null; token: string; onChange: () => void }) {
  if (items === null) return <Skeleton n={2} />;
  if (!items.length) return <Empty>Zatiaľ si nenapísal(a) žiadny komentár. Zapoj sa do diskusie pod článkami.</Empty>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {items.map((c) => <CommentCard key={c.documentId} c={c} token={token} onChange={onChange} />)}
    </div>
  );
}

function CommentCard({ c, token, onChange }: { c: MyComment; token: string; onChange: () => void }) {
  const chip = STATUS_CHIP[c.status] || STATUS_CHIP.visible;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(c.content);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try { await editComment(token, c.documentId, draft); setEditing(false); onChange(); } finally { setBusy(false); }
  };
  const remove = async () => {
    if (!window.confirm('Naozaj zmazať tento komentár?')) return;
    setBusy(true);
    try { await deleteComment(token, c.documentId); onChange(); } finally { setBusy(false); }
  };

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '16px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div>
          <span style={{ fontFamily: 'Cinzel, serif', fontSize: 10, color: C.amber, letterSpacing: '.05em' }}>POD ČLÁNKOM</span>{' '}
          {c.post ? <a href={`/blog/${c.post.slug}`} style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 16, color: C.amber, fontWeight: 600 }}>{c.post.title}</a>
                  : <span style={{ color: C.muted }}>—</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontFamily: 'Cinzel, serif', fontSize: 11, padding: '3px 10px', borderRadius: 999, color: chip.fg, background: chip.bg, border: `1px solid ${chip.bd}` }}>{chip.t}</span>
          <span style={{ fontFamily: 'Cinzel, serif', fontSize: 12, color: '#a89a7d' }}>{relTime(c.createdAt)}</span>
        </div>
      </div>
      {editing ? (
        <div style={{ marginTop: 10 }}>
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={3} style={{
            width: '100%', fontFamily: 'Cormorant Garamond, serif', fontSize: 16, color: C.ink,
            border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 12px', background: '#fffdf8', resize: 'vertical',
          }} />
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button onClick={save} disabled={busy} style={btnPrimary}>Uložiť</button>
            <button onClick={() => { setEditing(false); setDraft(c.content); }} style={btnLink}>Zrušiť</button>
          </div>
        </div>
      ) : (
        <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 17, color: C.ink, margin: '10px 0 0', lineHeight: 1.5 }}>{c.content}</p>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginTop: 12, paddingTop: 10, borderTop: '1px solid #efe6d0' }}>
        <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 14.5, color: C.muted }}>
          ♥ {c.likes} páči sa · ↩ {c.replyCount} {c.replyCount === 1 ? 'odpoveď' : 'odpovede'}
        </span>
        {!editing && (
          <span style={{ display: 'flex', gap: 14 }}>
            <button onClick={() => setEditing(true)} style={btnLink}>Upraviť</button>
            <button onClick={remove} disabled={busy} style={{ ...btnLink, color: '#a04338' }}>Zmazať</button>
          </span>
        )}
      </div>
    </div>
  );
}

/* ── OBĽÚBENÉ A ZDIEĽANÉ ── */
function SavedGrid({ favorites, shares }: { favorites: FavoritePost[] | null; shares: MyShare[] | null }) {
  const merged = useMemo(() => {
    if (favorites === null) return null;
    const map = new Map<string, { title: string; slug: string; cat?: string | null; cover?: string | null; fav: boolean; shared: boolean }>();
    for (const f of favorites) map.set(f.slug, { title: f.title, slug: f.slug, cat: f.category?.name ?? null, cover: mediaUrl(f.coverImage), fav: true, shared: false });
    for (const s of shares || []) {
      if (!s.post) continue;
      const ex = map.get(s.post.slug);
      if (ex) ex.shared = true;
      else map.set(s.post.slug, { title: s.post.title, slug: s.post.slug, fav: false, shared: true });
    }
    return [...map.values()];
  }, [favorites, shares]);

  if (merged === null) return <Skeleton n={2} />;
  if (!merged.length) return <Empty>Zatiaľ nemáš obľúbené ani zdieľané články. Klikni na ♥ pri článku, ktorý ťa zaujal.</Empty>;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
      {merged.map((a) => (
        <a key={a.slug} href={`/blog/${a.slug}`} style={{
          display: 'flex', gap: 12, alignItems: 'center', background: C.card, border: `1px solid ${C.border}`,
          borderRadius: 14, padding: 12, textDecoration: 'none', transition: 'transform .15s, box-shadow .15s',
        }}>
          <div style={{ width: 74, height: 54, borderRadius: 9, border: '1px solid #d9c69a', flexShrink: 0, overflow: 'hidden', background: '#efe6d0' }}>
            {a.cover && <img src={a.cover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 18, fontWeight: 700, color: C.ink, lineHeight: 1.25 }}>{a.title}</div>
            {a.cat && <div style={{ fontFamily: 'Cinzel, serif', fontSize: 11, color: C.muted, marginTop: 3 }}>{a.cat}</div>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 15 }}>
            {a.fav && <span style={{ color: C.bordo }} title="Obľúbené">♥</span>}
            {a.shared && <span style={{ color: '#5c7a52' }} title="Zdieľané">⇗</span>}
          </div>
        </a>
      ))}
    </div>
  );
}

/* ── NASTAVENIA (modal) ── */
function Settings({ profile, token, onClose, onSaved, onSignOut, onDeleted }: {
  profile: Profile; token: string; onClose: () => void; onSaved: (p: Profile) => void; onSignOut: () => void; onDeleted: () => void;
}) {
  const [name, setName] = useState(profile.displayName || '');
  const [prefs, setPrefs] = useState(profile.prefs);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [confirmDel, setConfirmDel] = useState(false);
  const [push, setPush] = useState(false);
  const canPush = pushSupported();

  useEffect(() => { isPushEnabled().then(setPush); }, []);

  const save = async () => {
    setBusy(true); setMsg('');
    try {
      await updateProfile(token, { displayName: name, ...prefs });
      const fresh = await getProfile(token);
      onSaved(fresh);
      setMsg('Uložené.');
    } catch { setMsg('Uloženie zlyhalo.'); } finally { setBusy(false); }
  };
  const onAvatar = async (file: File) => {
    setBusy(true); setMsg('');
    try { const id = await uploadAvatar(token, file); await updateProfile(token, { avatar: id }); onSaved(await getProfile(token)); setMsg('Avatar zmenený.'); }
    catch { setMsg('Nahranie avatara zlyhalo.'); } finally { setBusy(false); }
  };
  const togglePush = async () => {
    setBusy(true);
    try {
      if (push) { await disablePush(token); setPush(false); }
      else { const r = await enablePush(token); setPush(r.ok); if (!r.ok) setMsg(r.reason === 'denied' ? 'Povolenie notifikácií bolo zamietnuté.' : 'Push sa nepodarilo zapnúť.'); }
    } finally { setBusy(false); }
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(28,21,16,.5)', display: 'grid', placeItems: 'center', zIndex: 50, padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Nastavenia profilu" style={{
        width: 'min(520px,100%)', maxHeight: '88vh', overflowY: 'auto', background: '#fffdf8',
        border: `1px solid ${C.border}`, borderRadius: 16, padding: '26px 28px',
      }}>
        <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: 20, color: C.ink, margin: '0 0 18px' }}>Nastavenia profilu</h2>

        <Field label="Zobrazené meno">
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} style={input} />
        </Field>

        <Field label="Avatar">
          <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && onAvatar(e.target.files[0])} />
        </Field>

        <fieldset style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 14px', margin: '10px 0' }}>
          <legend style={{ fontFamily: 'Cinzel, serif', fontSize: 12, color: C.amber, padding: '0 6px' }}>Upozornenia v aplikácii</legend>
          {([['notifyReply', 'Odpovede na moje komentáre'], ['notifyLike', 'Lajky mojich komentárov'], ['notifyPost', 'Nové články a aktuality']] as const).map(([k, lbl]) => (
            <label key={k} style={checkRow}>
              <input type="checkbox" checked={(prefs as any)[k]} onChange={(e) => setPrefs({ ...prefs, [k]: e.target.checked })} /> {lbl}
            </label>
          ))}
          <label style={checkRow}>
            <input type="checkbox" checked={prefs.notifyEmail} onChange={(e) => setPrefs({ ...prefs, notifyEmail: e.target.checked })} /> Posielať aj e-mailom
          </label>
        </fieldset>

        {canPush && (
          <label style={{ ...checkRow, marginBottom: 6 }}>
            <input type="checkbox" checked={push} onChange={togglePush} disabled={busy || pushPermission() === 'denied'} />
            Push notifikácie do nainštalovanej aplikácie {pushPermission() === 'denied' && <em style={{ color: '#a04338' }}> (v prehliadači zablokované)</em>}
          </label>
        )}

        {msg && <p style={{ fontFamily: 'Cormorant Garamond, serif', color: '#5c7a52', fontSize: 15 }}>{msg}</p>}

        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <button onClick={save} disabled={busy} style={btnPrimary}>Uložiť zmeny</button>
          <button onClick={onClose} style={btnLink}>Zavrieť</button>
          <button onClick={onSignOut} style={{ ...btnLink, marginLeft: 'auto' }}>Odhlásiť sa</button>
        </div>

        {/* GDPR */}
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px dashed rgba(196,165,116,.5)' }}>
          {!confirmDel ? (
            <button onClick={() => setConfirmDel(true)} style={{ ...btnLink, color: '#a04338' }}>Zmazať účet</button>
          ) : (
            <div>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 15, color: '#5d4a32', margin: '0 0 10px' }}>
                Účet sa zmaže natrvalo. Komentáre zostanú ako <strong>Zmazaný účet</strong>. Nedá sa vrátiť.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setConfirmDel(false)} style={btnLink}>Zrušiť</button>
                <button onClick={async () => { try { await deleteMyAccount(token); onDeleted(); } catch { setMsg('Zmazanie zlyhalo.'); } }}
                        style={{ background: '#a04338', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 16px', cursor: 'pointer', fontFamily: 'Cinzel, serif', fontSize: 13 }}>
                  Zmazať natrvalo
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── drobné ── */
const btnPrimary: React.CSSProperties = { fontFamily: 'Cinzel, serif', fontSize: 13, padding: '9px 18px', borderRadius: 999, border: '1px solid #7c4a13', background: 'linear-gradient(180deg,#c8862f,#9a5d1f)', color: '#fbf6ea', cursor: 'pointer' };
const btnLink: React.CSSProperties = { fontFamily: 'Cinzel, serif', fontSize: 13, background: 'none', border: 'none', color: C.amber, cursor: 'pointer', textDecoration: 'underline', padding: 0 };
const input: React.CSSProperties = { width: '100%', height: 42, padding: '0 12px', background: '#fbf7ec', border: `1px solid ${C.border}`, borderRadius: 8, fontFamily: 'Cormorant Garamond, serif', fontSize: 15, color: C.ink, outline: 'none' };
const checkRow: React.CSSProperties = { display: 'flex', gap: 8, alignItems: 'center', fontFamily: 'Cormorant Garamond, serif', fontSize: 15.5, color: C.ink, padding: '4px 0' };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div style={{ marginBottom: 12 }}><label style={{ display: 'block', fontFamily: 'Cinzel, serif', fontSize: 12, color: C.amber, marginBottom: 5 }}>{label}</label>{children}</div>;
}
function Empty({ children }: { children: React.ReactNode }) {
  return <div style={{ textAlign: 'center', padding: '48px 20px', fontFamily: 'Cormorant Garamond, serif', fontSize: 18, fontStyle: 'italic', color: C.muted }}>{children}</div>;
}
function Skeleton({ n }: { n: number }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{Array.from({ length: n }).map((_, i) => (
    <div key={i} style={{ height: 88, borderRadius: 12, background: 'linear-gradient(90deg,#f3ead4,#faf5e6,#f3ead4)', backgroundSize: '200% 100%', animation: 'shimmer 1.3s infinite' }} />
  ))}<style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style></div>;
}
