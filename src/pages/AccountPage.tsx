'use client';

import { useEffect, useState } from 'react';
import { useMember } from '../auth/MemberAuth';
import { ProfilePage } from './ProfilePage';
import {
  register, forgotPassword, resetPassword, resendConfirmation, AuthError,
} from '../lib/memberApi';

export type AccountMode = 'login' | 'register' | 'forgot' | 'reset' | 'profile';

// ── zdieľané štýly (pergamenový web, nie admin) ──────────────────────────────
const wrap: React.CSSProperties = {
  minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: '48px 20px',
};
const card: React.CSSProperties = {
  width: 'min(440px, 100%)', background: 'var(--hr-surface)', borderRadius: 16,
  border: '1px solid rgba(196,165,116,0.4)',
  boxShadow: '0 20px 50px -30px rgba(60,40,15,.4)', padding: '34px 32px',
};
const label: React.CSSProperties = {
  display: 'block', fontFamily: 'Georgia, serif', fontSize: 13.5,
  fontWeight: 500, color: 'var(--hr-ink-2)', marginBottom: 6,
};
const field: React.CSSProperties = {
  width: '100%', height: 44, padding: '0 14px', background: 'var(--hr-surface)',
  border: '1px solid var(--hr-chip-border)', borderRadius: 9, fontFamily: 'Georgia, serif',
  fontSize: 15, color: 'var(--hr-ink)', outline: 'none', marginBottom: 16,
};
const primaryBtn: React.CSSProperties = {
  width: '100%', height: 46, borderRadius: 999, border: '1px solid var(--hr-accent-deep)',
  background: 'linear-gradient(180deg,var(--hr-accent-soft),var(--hr-accent-deep))', color: 'var(--hr-on-photo)',
  fontFamily: 'Georgia, serif', fontSize: 15, fontWeight: 600, cursor: 'pointer',
};
const linkBtn: React.CSSProperties = {
  background: 'none', border: 'none', color: 'var(--hr-accent)', cursor: 'pointer',
  fontFamily: 'Georgia, serif', fontSize: 14, textDecoration: 'underline', padding: 0,
};
const H1: React.CSSProperties = {
  fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 26, fontWeight: 600,
  color: 'var(--hr-ink)', margin: '0 0 6px', textAlign: 'center',
};
const sub: React.CSSProperties = {
  fontFamily: 'Georgia, serif', fontSize: 14.5, fontStyle: 'italic',
  color: 'var(--hr-muted)', textAlign: 'center', margin: '0 0 24px',
};

function Notice({ tone, children }: { tone: 'ok' | 'err'; children: React.ReactNode }) {
  return (
    <div role="alert" style={{
      fontFamily: 'Georgia, serif', fontSize: 13.5, lineHeight: 1.5, borderRadius: 9,
      padding: '10px 13px', marginBottom: 16,
      background: tone === 'ok' ? '#e4ecdc' : 'var(--hr-error-bg)',
      color: tone === 'ok' ? '#3d5c40' : '#a04338',
      border: `1px solid ${tone === 'ok' ? '#c5d4b8' : 'var(--hr-error-line)'}`,
    }}>
      {children}
    </div>
  );
}

const go = (path: string) => { window.history.pushState({}, '', path); window.dispatchEvent(new PopStateEvent('popstate')); };

export function AccountPage({ mode }: { mode: AccountMode }) {
  const { signIn, isLoggedIn, ready } = useMember();

  const [identifier, setIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');

  // ?overeny=1 po kliknutí v maile
  useEffect(() => {
    if (mode === 'login' && new URLSearchParams(window.location.search).get('overeny') === '1') {
      setOk('E-mail overený. Teraz sa môžete prihlásiť.');
    }
  }, [mode]);

  // profil vyžaduje prihlásenie
  useEffect(() => {
    if (mode === 'profile' && ready && !isLoggedIn) go('/prihlasenie');
  }, [mode, ready, isLoggedIn]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr(''); setOk('');
    try {
      if (mode === 'login') {
        await signIn(identifier.trim(), password);
        go('/');
      } else if (mode === 'register') {
        if (password.length < 6) throw new AuthError(400, 'Heslo musí mať aspoň 6 znakov.');
        if (!consent) throw new AuthError(400, 'Pre registráciu je potrebný súhlas so spracovaním údajov.');
        await register(username.trim(), email.trim(), password);
        setOk('Účet vytvorený. Poslali sme vám overovací e-mail — kliknite na odkaz v ňom a potom sa prihláste.');
      } else if (mode === 'forgot') {
        await forgotPassword(email.trim());
        setOk('Ak taký e-mail existuje, poslali sme naň odkaz na obnovu hesla.');
      } else if (mode === 'reset') {
        if (password.length < 6) throw new AuthError(400, 'Heslo musí mať aspoň 6 znakov.');
        const code = new URLSearchParams(window.location.search).get('code') || '';
        await resetPassword(code, password);
        setOk('Heslo zmenené. Presmerúvam na prihlásenie…');
        setTimeout(() => go('/prihlasenie'), 1400);
      }
    } catch (e: any) {
      setErr(e?.message || 'Niečo sa pokazilo.');
    } finally {
      setBusy(false);
    }
  };

  // ── PROFIL ── (plnohodnotná strana: hlavička, taby, nastavenia)
  if (mode === 'profile') {
    if (ready && !isLoggedIn) return null; // guard vyššie presmeruje na /prihlasenie
    return <ProfilePage />;
  }

  const titles: Record<AccountMode, [string, string]> = {
    login: ['Prihlásenie', 'Vitajte späť v komunite'],
    register: ['Registrácia', 'Staňte sa členom a zapojte sa do diskusie'],
    forgot: ['Zabudnuté heslo', 'Pošleme vám odkaz na obnovu'],
    reset: ['Nové heslo', 'Zadajte nové heslo k svojmu účtu'],
    profile: ['', ''],
  };

  return (
    <div style={wrap}>
      <form style={card} onSubmit={submit} noValidate>
        <h1 style={H1}>{titles[mode][0]}</h1>
        <p style={sub}>{titles[mode][1]}</p>

        {ok && <Notice tone="ok">{ok}</Notice>}
        {err && <Notice tone="err">{err}</Notice>}

        {mode === 'register' && (
          <>
            <label style={label} htmlFor="ac-user">Meno (zobrazí sa pri komentároch)</label>
            <input id="ac-user" style={field} value={username} onChange={e => setUsername(e.target.value)}
                   placeholder="Jano Hradský" disabled={busy} autoComplete="nickname" />
          </>
        )}

        {(mode === 'register' || mode === 'forgot') && (
          <>
            <label style={label} htmlFor="ac-email">E-mail</label>
            <input id="ac-email" type="email" style={field} value={email} onChange={e => setEmail(e.target.value)}
                   placeholder="meno@domena.sk" disabled={busy} autoComplete="email" autoFocus />
          </>
        )}

        {mode === 'login' && (
          <>
            <label style={label} htmlFor="ac-id">E-mail</label>
            <input id="ac-id" type="email" style={field} value={identifier} onChange={e => setIdentifier(e.target.value)}
                   placeholder="meno@domena.sk" disabled={busy} autoComplete="username" autoFocus />
          </>
        )}

        {(mode === 'login' || mode === 'register' || mode === 'reset') && (
          <>
            <label style={label} htmlFor="ac-pass">Heslo</label>
            <input id="ac-pass" type="password" style={field} value={password} onChange={e => setPassword(e.target.value)}
                   placeholder="••••••••" disabled={busy}
                   autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
          </>
        )}

        {mode === 'register' && (
          <label style={{ display: 'flex', gap: 9, alignItems: 'flex-start', marginBottom: 16, cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: 13, color: 'var(--hr-body-2)', lineHeight: 1.5 }}>
            <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} style={{ marginTop: 3 }} />
            <span>
              Súhlasím so spracovaním e-mailu na účely účtu a diskusie. Údaje neposkytujeme
              tretím stranám. Viac v{' '}
              <button type="button" style={{ ...linkBtn, fontSize: 13 }} onClick={() => go('/ochrana-osobnych-udajov')}>
                ochrane osobných údajov
              </button>.
            </span>
          </label>
        )}

        <button type="submit" style={{ ...primaryBtn, opacity: busy ? 0.7 : 1 }} disabled={busy}>
          {busy ? 'Moment…' : mode === 'login' ? 'Prihlásiť sa' : mode === 'register' ? 'Zaregistrovať sa'
            : mode === 'forgot' ? 'Poslať odkaz' : 'Zmeniť heslo'}
        </button>

        {/* prepínače medzi režimami */}
        <div style={{ textAlign: 'center', marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {mode === 'login' && (
            <>
              <span style={{ fontFamily: 'Georgia, serif', fontSize: 14, color: 'var(--hr-clear-text)' }}>
                Nemáte účet? <button type="button" style={linkBtn} onClick={() => go('/registracia')}>Zaregistrujte sa</button>
              </span>
              <button type="button" style={linkBtn} onClick={() => go('/zabudnute-heslo')}>Zabudli ste heslo?</button>
            </>
          )}
          {mode === 'register' && (
            <span style={{ fontFamily: 'Georgia, serif', fontSize: 14, color: 'var(--hr-clear-text)' }}>
              Už máte účet? <button type="button" style={linkBtn} onClick={() => go('/prihlasenie')}>Prihláste sa</button>
            </span>
          )}
          {(mode === 'forgot' || mode === 'reset') && (
            <button type="button" style={linkBtn} onClick={() => go('/prihlasenie')}>Späť na prihlásenie</button>
          )}
        </div>

        {mode === 'register' && ok && (
          <div style={{ textAlign: 'center', marginTop: 14 }}>
            <button type="button" style={linkBtn}
                    onClick={() => resendConfirmation(email.trim()).then(() => setOk('Overovací e-mail sme poslali znova.')).catch(() => {})}>
              Neprišiel e-mail? Poslať znova
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
