'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { login as apiLogin, me as apiMe, type AdminUser } from './api/auth';
import { setUnauthorizedHandler } from './api/client';

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
  }, []);

  return (
    <AuthCtx.Provider value={{ token, user, ready, signIn, signOut }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth(): AuthValue {
  const v = useContext(AuthCtx);
  if (!v) throw new Error('useAuth musí byť vnútri <AuthProvider>');
  return v;
}
