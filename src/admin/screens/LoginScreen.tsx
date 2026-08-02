'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { forgotPassword } from '../api/account';

export function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Obnova hesla — rozbalí sa pod formulárom, neodvádza na inú stránku.
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotBusy, setForgotBusy] = useState(false);
  const [forgotMsg, setForgotMsg] = useState('');
  const [forgotErr, setForgotErr] = useState('');

  const submitForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    const addr = forgotEmail.trim();
    if (!addr) { setForgotErr('Zadajte e-mail účtu.'); return; }
    setForgotBusy(true); setForgotErr(''); setForgotMsg('');
    try {
      const res = await forgotPassword(addr);
      setForgotMsg(res.message || 'Ak adresa patrí správcovskému účtu, poslali sme na ňu e-mail.');
    } catch (err: any) {
      setForgotErr(err?.message || 'Odoslanie zlyhalo. Skúste o chvíľu.');
    } finally {
      setForgotBusy(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Vyplňte e-mail aj heslo.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await signIn(email.trim(), password);
    } catch (err: any) {
      // Zlé údaje sú 400 a Strapi k nim dáva generickú hlášku — tú netreba
      // ukazovať doslova. VŠETKO ostatné ale áno: predtým sa sem chytalo aj
      // 429 (prekročený limit pokusov) a zobrazovalo sa ako „nesprávne heslo",
      // takže sa človek márne pokúšal so správnym heslom dokola.
      setError(
        err?.status === 400
          ? 'Nesprávny e-mail alebo heslo.'
          : (err?.message || 'Prihlásenie zlyhalo.')
      );
      setBusy(false);
    }
  };

  return (
    <div
      className="admin"
      style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
        background: 'radial-gradient(ellipse at 50% 35%, #faf5e8 0%, #f4efe3 45%, #e8dcc4 100%)',
      }}
    >
      <div className="acard" style={{ width: 400, maxWidth: '100%', padding: 32 }}>
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <picture style={{ display: 'contents' }}>
            <source srcSet="/logo_slovanske_hradiska_256.webp" type="image/webp" />
            <img
              src="/logo_slovanske_hradiska_256.jpg"
              alt=""
              aria-hidden="true"
              style={{
                width: 56, height: 56, objectFit: 'contain', borderRadius: 14, padding: 3,
                background: 'radial-gradient(circle at 38% 30%, #f0d9a8, #c8a15a)',
                border: '1px solid #e6c98a', margin: '0 auto 14px', display: 'block',
              }}
            />
          </picture>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--ad-text)' }}>
            Hradiska.sk
          </h1>
          <p style={{ fontSize: 13.5, color: 'var(--ad-secondary)', margin: '6px 0 0' }}>
            Administrácia obsahu
          </p>
        </div>

        <form onSubmit={submit} noValidate>
          <label htmlFor="ad-email" style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
            E-mail
          </label>
          {/* `name` + `autoComplete` sú to, podľa čoho správcovia hesiel bez
              Credential API (Firefox, Safari) rozpoznajú prihlasovací formulár. */}
          <input
            id="ad-email" name="username" type="email" className="afld" autoComplete="username"
            value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
            placeholder="meno@hradiska.sk" style={{ marginBottom: 16 }}
            disabled={busy} autoFocus
          />

          <label htmlFor="ad-pass" style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
            Heslo
          </label>
          <input
            id="ad-pass" name="password" type="password" className="afld" autoComplete="current-password"
            value={password} onChange={e => { setPassword(e.target.value); setError(''); }}
            placeholder="••••••••" style={{ marginBottom: error ? 8 : 20 }}
            disabled={busy}
          />

          {error && (
            <div role="alert" style={{ color: 'var(--ad-danger)', fontSize: 13, marginBottom: 14 }}>
              {error}
            </div>
          )}

          <button
            type="submit" className="abtn abtn-primary" disabled={busy}
            style={{ width: '100%', justifyContent: 'center', padding: 11 }}
          >
            {busy ? (<><Loader2 className="w-4 h-4 animate-spin" /> Prihlasujem…</>) : 'Prihlásiť sa'}
          </button>
        </form>

        {!forgotOpen ? (
          <button
            type="button"
            onClick={() => { setForgotOpen(true); setForgotEmail(email.trim()); }}
            style={{
              display: 'block', margin: '14px auto 0', background: 'none', border: 'none',
              color: 'var(--ad-secondary)', fontSize: 13, cursor: 'pointer', textDecoration: 'underline',
            }}
          >
            Zabudli ste heslo?
          </button>
        ) : (
          <form onSubmit={submitForgot} style={{ marginTop: 18, paddingTop: 18, borderTop: '1px solid var(--ad-border)' }}>
            <label htmlFor="ad-forgot" style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
              E-mail účtu
            </label>
            <p style={{ fontSize: 12, color: 'var(--ad-muted)', margin: '0 0 8px', lineHeight: 1.5 }}>
              Pošleme naň nové heslo. Začne platiť až po potvrdení odkazu v e-maile —
              dovtedy funguje doterajšie.
            </p>
            <input
              id="ad-forgot" type="email" className="afld" autoComplete="username"
              value={forgotEmail} onChange={e => { setForgotEmail(e.target.value); setForgotErr(''); setForgotMsg(''); }}
              placeholder="meno@hradiska.sk" disabled={forgotBusy || !!forgotMsg}
              style={{ marginBottom: 10 }} autoFocus
            />

            {forgotErr && (
              <div role="alert" style={{ color: 'var(--ad-danger)', fontSize: 13, marginBottom: 10 }}>{forgotErr}</div>
            )}
            {forgotMsg && (
              <div role="status" style={{ display: 'flex', gap: 8, alignItems: 'flex-start', color: '#3f6b3a', fontSize: 13, lineHeight: 1.5, marginBottom: 10 }}>
                <CheckCircle2 className="w-4 h-4" style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{forgotMsg}</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button" className="abtn" style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => { setForgotOpen(false); setForgotErr(''); setForgotMsg(''); }}
              >
                {forgotMsg ? 'Späť na prihlásenie' : 'Zrušiť'}
              </button>
              {!forgotMsg && (
                <button type="submit" className="abtn abtn-primary" disabled={forgotBusy} style={{ flex: 1, justifyContent: 'center' }}>
                  {forgotBusy ? <><Loader2 className="w-4 h-4 animate-spin" /> Posielam…</> : 'Poslať heslo'}
                </button>
              )}
            </div>
          </form>
        )}

        <p style={{ fontSize: 12, color: 'var(--ad-muted)', textAlign: 'center', margin: '18px 0 0', lineHeight: 1.5 }}>
          Účty zakladá správca. Registrácia nie je verejná.
        </p>
      </div>
    </div>
  );
}
