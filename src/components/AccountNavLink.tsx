'use client';

import { useEffect, useState } from 'react';
import { User, LogIn } from 'lucide-react';
import { useMember } from '../auth/MemberAuth';
import { getUnreadCount } from '../lib/profileApi';

const go = (path: string) => { window.history.pushState({}, '', path); window.dispatchEvent(new PopStateEvent('popstate')); };

/**
 * Odkaz na účet — prihlásenie (LogIn) alebo profil (User) + badge neprečítaných.
 * `compact` = ikonové tlačidlo do mobilnej lišty; inak pilulka s textom (desktop).
 */
export function AccountNavLink({ compact = false }: { compact?: boolean }) {
  const { isLoggedIn, member, token } = useMember();
  const [unread, setUnread] = useState(0);

  // Počet neprečítaných notifikácií — pri prihlásení + periodicky (60 s).
  useEffect(() => {
    if (!token) { setUnread(0); return; }
    let live = true;
    const poll = () => getUnreadCount(token).then((n) => { if (live) setUnread(n); }).catch(() => {});
    poll();
    const id = setInterval(poll, 60_000);
    return () => { live = false; clearInterval(id); };
  }, [token]);

  const label = isLoggedIn
    ? (unread ? `Môj profil — ${unread} nových upozornení` : 'Môj profil')
    : 'Prihlásiť sa';

  const base: React.CSSProperties = {
    position: 'relative', flexShrink: 0, display: 'inline-flex', alignItems: 'center',
    justifyContent: 'center', cursor: 'pointer', color: '#e8dcc8',
    fontFamily: 'Georgia, serif', fontSize: 13, whiteSpace: 'nowrap',
  };

  const style: React.CSSProperties = compact
    ? { ...base, width: 38, height: 38, borderRadius: 8, background: 'transparent', border: 0 }
    : { ...base, gap: 7, padding: '7px 14px', borderRadius: 999,
        background: 'rgba(255,247,231,0.08)', border: '1px solid rgba(200,161,90,0.4)' };

  return (
    <button
      onClick={() => go(isLoggedIn ? '/profil' : '/prihlasenie')}
      title={label}
      aria-label={label}
      style={style}
      onMouseEnter={(e) => { if (compact) (e.currentTarget as HTMLElement).style.background = 'rgba(196,165,116,0.15)'; }}
      onMouseLeave={(e) => { if (compact) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
    >
      {isLoggedIn ? <User className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
      {!compact && (
        <span className="hidden sm:inline">
          {isLoggedIn ? (member?.displayName || member?.username || 'Účet') : 'Prihlásiť sa'}
        </span>
      )}
      {isLoggedIn && unread > 0 && (
        <span aria-label={`${unread} neprečítaných`} style={{
          position: 'absolute', top: -5, right: -5, minWidth: 18, height: 18, padding: '0 5px',
          borderRadius: 999, background: '#7c1f24', color: '#fff', fontSize: 11, fontWeight: 700,
          display: 'grid', placeItems: 'center', border: '1px solid #c8a15a', fontFamily: 'system-ui',
        }}>{unread > 99 ? '99+' : unread}</span>
      )}
    </button>
  );
}

export default AccountNavLink;
