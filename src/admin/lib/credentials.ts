/**
 * Ponuka „uložiť heslo" cez správcu hesiel prehliadača (Credential Management API).
 *
 * PREČO NIE VLASTNÉ UKLADANIE: čokoľvek, čo si odložíme do localStorage alebo
 * cookie, vie prečítať ľubovoľný skript bežiaci na stránke. Heslo preto
 * neukladáme my — odovzdáme ho správcovi hesiel prehliadača, ktorý ho drží
 * v šifrovanom úložisku operačného systému a vydá ho späť len samotnému
 * prehliadaču pri vypĺňaní formulára. Appka sa k nemu už nedostane.
 *
 * `navigator.credentials.store` vyvolá natívnu ponuku „Uložiť heslo?". Keď sa
 * zavolá znova s tým istým používateľom a NOVÝM heslom, prehliadač uložený
 * záznam aktualizuje — preto ho voláme aj po zmene hesla, nielen po prihlásení.
 *
 * Podpora: Chrome, Edge a ďalšie Chromium prehliadače. Firefox a Safari
 * `PasswordCredential` nemajú — tam sa funkcia ticho preskočí a uplatní sa ich
 * vlastná heuristika nad formulárom (preto majú polia `name` a `autocomplete`).
 * Vyžaduje zabezpečený kontext (https alebo localhost).
 */

/**
 * Ponúkne prehliadaču uloženie/aktualizáciu prihlasovacích údajov.
 * Nikdy nevyhodí výnimku — je to pohodlie, nie súčasť prihlásenia.
 */
export async function rememberCredentials(id: string, password: string, name?: string): Promise<void> {
  try {
    const PC = (window as any).PasswordCredential;
    if (!PC || !navigator.credentials?.store) return; // Firefox/Safari → ich heuristika
    if (!id || !password) return;
    await navigator.credentials.store(new PC({ id, password, name: name || id }));
  } catch {
    /* používateľ ponuku odmietol, alebo prehliadač API nepodporuje — nevadí */
  }
}
