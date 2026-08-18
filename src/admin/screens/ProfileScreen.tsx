'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, KeyRound, Loader2, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { changeEmail, changePassword, getMe, type AccountMe } from '../api/account';
import { rememberCredentials } from '../lib/credentials';

/**
 * Vlastný účet správcu: zmena prihlasovacieho e-mailu a hesla.
 *
 * Obe akcie vyžadujú aktuálne heslo — pri e-maile preto, že inak by na prevzatie
 * účtu stačil otvorený prihlásený prehliadač (prepísať adresu → „zabudnuté heslo").
 */
export function ProfileScreen() {
  const { token, updateToken } = useAuth();

  const [me, setMe] = useState<AccountMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // ── zmena e-mailu ──────────────────────────────────────────────────────────
  const [email, setEmail] = useState('');
  const [emailPass, setEmailPass] = useState('');
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailMsg, setEmailMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // ── zmena hesla ────────────────────────────────────────────────────────────
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [newPass2, setNewPass2] = useState('');
  const [passBusy, setPassBusy] = useState(false);
  const [passMsg, setPassMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);
    getMe(token)
      .then(m => { if (!cancelled) { setMe(m); setEmail(m.email); } })
      .catch(e => { if (!cancelled) setLoadError(e?.message || 'Načítanie profilu zlyhalo.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token]);

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setEmailMsg(null);
    const next = email.trim().toLowerCase();
    if (!next) return setEmailMsg({ ok: false, text: 'Zadajte e-mailovú adresu.' });
    if (next === me?.email?.toLowerCase()) return setEmailMsg({ ok: false, text: 'Toto je vaša súčasná adresa.' });
    if (!emailPass) return setEmailMsg({ ok: false, text: 'Na zmenu e-mailu zadajte aktuálne heslo.' });

    setEmailBusy(true);
    try {
      const res = await changeEmail(token, next, emailPass);
      setMe(m => (m ? { ...m, email: res.email } : m));
      // Správca hesiel má záznam pod starou adresou — ulož ho pod novou, inak
      // by pri ďalšom prihlásení ponúkal e-mail, ktorý už neplatí.
      void rememberCredentials(res.email, emailPass, me?.username);
      setEmailPass('');
      setEmailMsg({ ok: true, text: `Prihlasovací e-mail zmenený na ${res.email}. Odteraz sa prihlasujete ním.` });
    } catch (err: any) {
      setEmailMsg({ ok: false, text: err?.message || 'Zmena e-mailu zlyhala.' });
    } finally {
      setEmailBusy(false);
    }
  };

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setPassMsg(null);
    if (!oldPass) return setPassMsg({ ok: false, text: 'Zadajte aktuálne heslo.' });
    if (newPass.length < 8) return setPassMsg({ ok: false, text: 'Nové heslo musí mať aspoň 8 znakov.' });
    if (newPass !== newPass2) return setPassMsg({ ok: false, text: 'Nové heslá sa nezhodujú.' });
    if (newPass === oldPass) return setPassMsg({ ok: false, text: 'Nové heslo je rovnaké ako doterajšie.' });

    setPassBusy(true);
    try {
      const { jwt } = await changePassword(token, oldPass, newPass);
      updateToken(jwt); // Strapi vydá nový token — starý by dobehol až expiráciou
      // Prepíš uložené heslo na nové, nech správca hesiel neponúka to staré.
      if (me?.email) void rememberCredentials(me.email, newPass, me.username);
      setOldPass(''); setNewPass(''); setNewPass2('');
      setPassMsg({ ok: true, text: 'Heslo zmenené. Prehliadač si aktualizuje uložené heslo, ak ho má.' });
    } catch (err: any) {
      setPassMsg({ ok: false, text: err?.message || 'Zmena hesla zlyhala.' });
    } finally {
      setPassBusy(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--ad-secondary)' }}>
        <Loader2 className="w-5 h-5 animate-spin" style={{ display: 'inline' }} /> Načítavam profil…
      </div>
    );
  }

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Môj profil</h1>
        <p style={{ fontSize: 13.5, color: 'var(--ad-secondary)', margin: '6px 0 0' }}>
          Prihlasovacie údaje vlastného účtu
        </p>
      </div>

      {loadError && (
        <div className="acard" style={{ padding: '12px 16px', marginBottom: 14, display: 'flex', gap: 10, background: 'var(--hr-error-bg)', borderColor: 'var(--hr-error-line)' }}>
          <AlertCircle className="w-4 h-4" style={{ color: 'var(--ad-danger)', flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: 13.5, color: 'var(--ad-danger)' }}>{loadError}</div>
        </div>
      )}

      {/* ── Prehľad účtu ── */}
      <div className="acard" style={{ padding: 20, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div
          aria-hidden="true"
          style={{
            width: 44, height: 44, borderRadius: 999, flexShrink: 0,
            background: 'linear-gradient(180deg,var(--hr-accent-soft),var(--hr-accent-deep))', color: 'var(--hr-on-photo)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 600,
          }}
        >
          {(me?.username || 'U').charAt(0).toUpperCase()}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{me?.displayName || me?.username}</div>
          <div style={{ fontSize: 13, color: 'var(--ad-secondary)' }}>{me?.email}</div>
        </div>
        <div style={{ flex: 1 }} />
        <span className="achip achip-pub"><ShieldCheck className="w-3 h-3" /> Superadmin</span>
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))' }}>
        {/* ── Zmena e-mailu ── */}
        <form className="acard" style={{ padding: 20 }} onSubmit={submitEmail}>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Mail className="w-4 h-4" style={{ color: 'var(--ad-secondary)' }} /> Prihlasovací e-mail
          </h2>
          <p style={{ fontSize: 12.5, color: 'var(--ad-secondary)', margin: '0 0 16px', lineHeight: 1.6 }}>
            Touto adresou sa prihlasujete a chodí na ňu obnova hesla. Zadajte adresu,
            ku ktorej máte prístup.
          </p>

          <label htmlFor="pf-email" style={{ display: 'block', fontSize: 12.5, fontWeight: 500, marginBottom: 5 }}>
            Nová adresa
          </label>
          <input
            id="pf-email" type="email" className="afld" autoComplete="email"
            value={email} onChange={e => { setEmail(e.target.value); setEmailMsg(null); }}
            disabled={emailBusy} style={{ marginBottom: 14 }}
          />

          <label htmlFor="pf-email-pass" style={{ display: 'block', fontSize: 12.5, fontWeight: 500, marginBottom: 5 }}>
            Aktuálne heslo (potvrdenie)
          </label>
          <input
            id="pf-email-pass" type="password" className="afld" autoComplete="current-password"
            value={emailPass} onChange={e => { setEmailPass(e.target.value); setEmailMsg(null); }}
            placeholder="••••••••" disabled={emailBusy} style={{ marginBottom: emailMsg ? 10 : 18 }}
          />

          {emailMsg && <Note msg={emailMsg} />}

          <button type="submit" className="abtn abtn-primary" disabled={emailBusy} style={{ width: '100%', justifyContent: 'center', padding: 10 }}>
            {emailBusy ? <><Loader2 className="w-4 h-4 animate-spin" /> Ukladám…</> : 'Zmeniť e-mail'}
          </button>
        </form>

        {/* ── Zmena hesla ── */}
        <form className="acard" style={{ padding: 20 }} onSubmit={submitPassword}>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <KeyRound className="w-4 h-4" style={{ color: 'var(--ad-secondary)' }} /> Heslo
          </h2>
          <p style={{ fontSize: 12.5, color: 'var(--ad-secondary)', margin: '0 0 16px', lineHeight: 1.6 }}>
            Aspoň 8 znakov. Po zmene ostávate prihlásený, nové heslo platí od
            ďalšieho prihlásenia.
          </p>

          <label htmlFor="pf-old" style={{ display: 'block', fontSize: 12.5, fontWeight: 500, marginBottom: 5 }}>
            Aktuálne heslo
          </label>
          <input
            id="pf-old" type="password" className="afld" autoComplete="current-password"
            value={oldPass} onChange={e => { setOldPass(e.target.value); setPassMsg(null); }}
            placeholder="••••••••" disabled={passBusy} style={{ marginBottom: 14 }}
          />

          <label htmlFor="pf-new" style={{ display: 'block', fontSize: 12.5, fontWeight: 500, marginBottom: 5 }}>
            Nové heslo
          </label>
          <input
            id="pf-new" type="password" className="afld" autoComplete="new-password"
            value={newPass} onChange={e => { setNewPass(e.target.value); setPassMsg(null); }}
            placeholder="••••••••" disabled={passBusy} style={{ marginBottom: 14 }}
          />

          <label htmlFor="pf-new2" style={{ display: 'block', fontSize: 12.5, fontWeight: 500, marginBottom: 5 }}>
            Nové heslo znova
          </label>
          <input
            id="pf-new2" type="password" className="afld" autoComplete="new-password"
            value={newPass2} onChange={e => { setNewPass2(e.target.value); setPassMsg(null); }}
            placeholder="••••••••" disabled={passBusy} style={{ marginBottom: passMsg ? 10 : 18 }}
          />

          {passMsg && <Note msg={passMsg} />}

          <button type="submit" className="abtn abtn-primary" disabled={passBusy} style={{ width: '100%', justifyContent: 'center', padding: 10 }}>
            {passBusy ? <><Loader2 className="w-4 h-4 animate-spin" /> Ukladám…</> : 'Zmeniť heslo'}
          </button>
        </form>
      </div>
    </>
  );
}

/** Hláška o výsledku — zelená pri úspechu, bordová pri chybe. */
function Note({ msg }: { msg: { ok: boolean; text: string } }) {
  return (
    <div
      role={msg.ok ? 'status' : 'alert'}
      style={{
        display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 14,
        fontSize: 13, lineHeight: 1.5,
        color: msg.ok ? '#3f6b3a' : 'var(--ad-danger)',
      }}
    >
      {msg.ok
        ? <CheckCircle2 className="w-4 h-4" style={{ flexShrink: 0, marginTop: 1 }} />
        : <AlertCircle className="w-4 h-4" style={{ flexShrink: 0, marginTop: 1 }} />}
      <span>{msg.text}</span>
    </div>
  );
}
