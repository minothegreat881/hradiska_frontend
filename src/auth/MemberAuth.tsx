'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { login as apiLogin, me as apiMe, type Member } from '../lib/memberApi';

/**
 * Prihlásenie člena verejnosti.
 *
 * Token je v localStorage pod vlastným kľúčom (nie admin token). Rovnaký
 * kompromis ako pri admine: bez servera niet kam ho uložiť bezpečnejšie;
 * pri prechode na doménu prejsť na httpOnly cookie cez proxy.
 */

const TOKEN_KEY = 'hradiska.member.jwt';

interface MemberAuthValue {
  token: string | null;
  member: Member | null;
  ready: boolean;
  isLoggedIn: boolean;
  signIn: (identifier: string, password: string) => Promise<void>;
  setSession: (jwt: string, member: Member) => void;
  signOut: () => void;
  /** Znovu načíta účet zo servera — po zmene fotografie alebo mena. */
  obnov: () => Promise<void>;
}

const Ctx = createContext<MemberAuthValue | null>(null);

export function MemberAuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [ready, setReady] = useState(false);

  const signOut = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setMember(null);
  }, []);

  const setSession = useCallback((jwt: string, m: Member) => {
    localStorage.setItem(TOKEN_KEY, jwt);
    setToken(jwt);
    setMember(m);
  }, []);

  // Obnova relácie po refreshi — uložený token overiť, nie mu slepo veriť.
  useEffect(() => {
    const saved = localStorage.getItem(TOKEN_KEY);
    if (!saved) { setReady(true); return; }
    let cancelled = false;
    apiMe(saved)
      .then(m => { if (!cancelled) { setToken(saved); setMember(m); } })
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => { if (!cancelled) setReady(true); });
    return () => { cancelled = true; };
  }, []);

  const signIn = useCallback(async (identifier: string, password: string) => {
    const { jwt, user } = await apiLogin(identifier, password);
    setSession(jwt, user);
    /* Prihlásenie vracia účet BEZ fotografie. Dotiahne sa hneď za ním, nech
       sa v hlavičke neobjaví najprv panáčik a až po obnovení stránky fotka. */
    try { setMember(await apiMe(jwt)); } catch { /* fotka nie je dôvod na chybu prihlásenia */ }
  }, [setSession]);

  const obnov = useCallback(async () => {
    if (!token) return;
    try { setMember(await apiMe(token)); } catch { /* ticho — profil sa načíta inde */ }
  }, [token]);

  return (
    <Ctx.Provider value={{ token, member, ready, isLoggedIn: !!member, signIn, setSession, signOut, obnov }}>
      {children}
    </Ctx.Provider>
  );
}

export function useMember(): MemberAuthValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useMember musí byť vnútri <MemberAuthProvider>');
  return v;
}
