'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { login as apiLogin, me as apiMe, type AdminUser } from './api/auth';
import { setUnauthorizedHandler } from './api/client';
import { rememberCredentials } from './lib/credentials';

/**
 * Držanie prihlásenia.
 *
 * JWT je v `localStorage`. Je to vedomý kompromis: Strapi nemá refresh tokeny
 * a bez servera niet kam token bezpečne uložiť. Riziko je XSS — kto vie spustiť
 * skript na stránke, token prečíta.
 *
 * Pred nasadením na verejnú doménu prejsť na proxy, ktorá drží token na serveri
 * a klientovi dáva httpOnly cookie. Do tej doby je jedinou ochranou heslo.
 */

const TOKEN_KEY = 'hradiska.admin.jwt';

interface AuthValue {
  token: string | null;
  user: AdminUser | null;
  ready: boolean;
  signIn: (identifier: string, password: string) => Promise<void>;
  /** Nahradí uložený JWT — po zmene hesla, kde Strapi vydá nový. */
  updateToken: (jwt: string) => void;
  signOut: () => void;
}

const AuthCtx = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AdminUser | null>(null);
  // `ready` bráni bliknutiu prihlasovacej obrazovky, kým sa overuje uložený token.
  const [ready, setReady] = useState(false);

  const signOut = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  // Každé 401/403 z ktoréhokoľvek volania zhodí prihlásenie.
  useEffect(() => {
    setUnauthorizedHandler(signOut);
    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  // Obnova relácie po refreshi — uložený token treba overiť, nie mu slepo veriť.
  useEffect(() => {
    const saved = localStorage.getItem(TOKEN_KEY);
    if (!saved) { setReady(true); return; }
    let cancelled = false;
    apiMe(saved)
      .then(u => { if (!cancelled) { setToken(saved); setUser(u); } })
      .catch(() => { localStorage.removeItem(TOKEN_KEY); })
      .finally(() => { if (!cancelled) setReady(true); });
    return () => { cancelled = true; };
  }, []);

  const signIn = useCallback(async (identifier: string, password: string) => {
    const { jwt, user } = await apiLogin(identifier, password);
    localStorage.setItem(TOKEN_KEY, jwt);
    setToken(jwt);
    setUser(user);
    // Až PO úspešnom prihlásení — nech prehliadač neponúka uložiť heslo,
    // ktoré nesedí. Heslo si ukladá on, my sa k nemu už nedostaneme.
    void rememberCredentials(identifier, password, user.username);
  }, []);

  // Po zmene hesla vydá Strapi nový JWT. Bez jeho uloženia by v prehliadači
  // ostal starý — ten síce dobehne do expirácie, ale relácia by sa rozišla
  // so skutočným stavom účtu.
  const updateToken = useCallback((jwt: string) => {
    localStorage.setItem(TOKEN_KEY, jwt);
    setToken(jwt);
  }, []);

  return (
    <AuthCtx.Provider value={{ token, user, ready, signIn, updateToken, signOut }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth(): AuthValue {
  const v = useContext(AuthCtx);
  if (!v) throw new Error('useAuth musí byť vnútri <AuthProvider>');
  return v;
}
