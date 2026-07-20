/**
 * Účty pre verejnosť (rola Member v Strapi Users & Permissions).
 *
 * ODLIŠNÉ od admin auth:
 *   - admin používa rolu Authenticated (má práva na správu obsahu)
 *   - členovia rolu Member (len komentovať a lajkovať)
 * Token sa drží pod iným kľúčom, nech sa dve prihlásenia nemiešajú.
 *
 * Registrácia vyžaduje overenie e-mailom (email_confirmation = true), takže
 * `register` NEVRÁTI JWT — používateľ najprv klikne v maile.
 */

const STRAPI_URL = import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337';

export interface Member {
  id: number;
  username: string;
  email: string;
  displayName?: string | null;
  confirmed?: boolean;
  blocked?: boolean;
}

export class AuthError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function call<T>(path: string, opts?: { method?: string; body?: unknown; token?: string }): Promise<T> {
  const res = await fetch(`${STRAPI_URL}${path}`, {
    method: opts?.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(opts?.token ? { Authorization: `Bearer ${opts.token}` } : {}),
    },
    body: opts?.body ? JSON.stringify(opts.body) : undefined,
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new AuthError(res.status, translate(res.status, json?.error?.message || ''));
  }
  return json as T;
}

/** Preloží typické hlášky Strapi do zrozumiteľnej slovenčiny. */
function translate(status: number, raw: string): string {
  const r = raw.toLowerCase();
  if (r.includes('already taken') && r.includes('email')) return 'Tento e-mail už je zaregistrovaný.';
  if (r.includes('already taken') && r.includes('username')) return 'Toto meno už niekto používa.';
  if (r.includes('invalid identifier or password')) return 'Nesprávny e-mail alebo heslo.';
  if (r.includes('not confirmed')) return 'Účet ešte nie je overený. Skontrolujte e-mail.';
  if (r.includes('blocked')) return 'Účet je zablokovaný.';
  if (r.includes('incorrect code')) return 'Neplatný alebo expirovaný odkaz.';
  if (status >= 500) return 'Chyba servera. Skúste neskôr.';
  return raw || `Chyba ${status}`;
}

export async function register(username: string, email: string, password: string): Promise<{ needsConfirmation: boolean }> {
  await call('/api/auth/local/register', { method: 'POST', body: { username, email, password } });
  // Pri zapnutom email_confirmation Strapi nevráti JWT — treba overiť mail.
  return { needsConfirmation: true };
}

export async function login(identifier: string, password: string): Promise<{ jwt: string; user: Member }> {
  return call('/api/auth/local', { method: 'POST', body: { identifier, password } });
}

export async function me(token: string): Promise<Member> {
  return call('/api/users/me', { token });
}

export async function forgotPassword(email: string): Promise<void> {
  await call('/api/auth/forgot-password', { method: 'POST', body: { email } });
}

export async function resetPassword(code: string, password: string): Promise<{ jwt: string; user: Member }> {
  return call('/api/auth/reset-password', {
    method: 'POST',
    body: { code, password, passwordConfirmation: password },
  });
}

export async function resendConfirmation(email: string): Promise<void> {
  await call('/api/auth/send-email-confirmation', { method: 'POST', body: { email } });
}

/** GDPR: člen si zmaže vlastný účet. Komentáre sa anonymizujú, nezmažú. */
export async function deleteMyAccount(token: string): Promise<void> {
  await call('/api/account/me', { method: 'DELETE', token });
}
