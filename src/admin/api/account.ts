/**
 * Vlastný účet správcu — zmena e-mailu a hesla priamo v admine.
 *
 * Prečo dva rôzne endpointy:
 *   - HESLO ide cez natívny `POST /api/auth/change-password` (Strapi si sám
 *     overí staré heslo a prehashuje nové). Rola Authenticated naň má právo.
 *   - E-MAIL natívny endpoint nemá — `/api/users/:id` by síce prešlo (admin má
 *     `user.update`), ale bez akéhokoľvek overenia totožnosti a bez kontroly
 *     jedinečnosti. Preto vlastný `PUT /api/account/me`, ktorý vyžaduje
 *     aktuálne heslo a adresu overí.
 *
 * Zmena e-mailu NEVYŽADUJE nové potvrdenie schránky — účet ostáva `confirmed`.
 * Dôsledok: po zmene chodí „zabudnuté heslo" na novú adresu, takže adresa, ku
 * ktorej nemáš prístup, znamená stratu tejto cesty späť do účtu.
 */

import { strapiFetch } from './client';

export interface AccountMe {
  id: number;
  username: string;
  email: string;
  displayName: string | null;
  joinedAt: string;
}

/** Profil prihláseného správcu. */
export async function getMe(token: string): Promise<AccountMe> {
  return strapiFetch<AccountMe>('/api/account/me', { token });
}

/**
 * „Zabudli ste heslo?" — pošle na adresu účtu e-mail s novým heslom
 * a potvrdzovacím odkazom. Nové heslo platí až po kliknutí naň.
 *
 * Odpoveď je zámerne rovnaká aj pre neexistujúcu adresu, takže sa z nej nedá
 * zisťovať, kto v systéme je. Volajúci teda NESMIE tvrdiť „e-mail odoslaný",
 * len „ak adresa patrí účtu, poslali sme naň e-mail".
 */
export async function forgotPassword(email: string): Promise<{ message: string }> {
  return strapiFetch<{ ok: boolean; message: string }>('/api/account/forgot-password', {
    method: 'POST',
    body: { email },
  });
}

/**
 * Zmení e-mail vlastného účtu. Vyžaduje aktuálne heslo — bráni prevzatiu účtu
 * z otvoreného prihláseného prehliadača (zmena adresy + „zabudnuté heslo").
 */
export async function changeEmail(token: string, email: string, currentPassword: string): Promise<{ email: string }> {
  const res = await strapiFetch<{ ok: boolean; email: string }>('/api/account/me', {
    method: 'PUT',
    token,
    body: { data: { email, currentPassword } },
  });
  return { email: res.email };
}

/**
 * Zmení heslo vlastného účtu. Strapi vráti NOVÝ JWT — starý ostáva platný do
 * expirácie, takže volajúci si má ten nový uložiť.
 */
export async function changePassword(
  token: string,
  currentPassword: string,
  password: string,
): Promise<{ jwt: string }> {
  return strapiFetch<{ jwt: string }>('/api/auth/change-password', {
    method: 'POST',
    token,
    body: { currentPassword, password, passwordConfirmation: password },
  });
}
