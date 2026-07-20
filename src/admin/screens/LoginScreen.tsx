'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../AuthContext';

export function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

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
      // Strapi vracia pri zlých údajoch 400 s generickou hláškou — nemá zmysel
      // ju ukazovať doslova.
      setError(
        err?.status === 0
          ? err.message
          : 'Nesprávny e-mail alebo heslo.'
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
          <input
            id="ad-email" type="email" className="afld" autoComplete="username"
            value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
            placeholder="meno@hradiska.sk" style={{ marginBottom: 16 }}
            disabled={busy} autoFocus
          />

          <label htmlFor="ad-pass" style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
            Heslo
          </label>
          <input
            id="ad-pass" type="password" className="afld" autoComplete="current-password"
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

        <p style={{ fontSize: 12, color: 'var(--ad-muted)', textAlign: 'center', margin: '18px 0 0', lineHeight: 1.5 }}>
          Účty zakladá správca. Registrácia nie je verejná.
        </p>
      </div>
    </div>
  );
}
