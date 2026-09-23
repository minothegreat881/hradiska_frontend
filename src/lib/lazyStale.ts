'use client';

/**
 * Odkladané načítanie obrazovky, ktoré prežije nasadenie novej verzie.
 *
 * Súbory appky majú v názve odtlačok obsahu, takže po nasadení sa volajú
 * inak a tie staré na serveri už nie sú. Karta otvorená spred nasadenia si
 * pri prepnutí obrazovky vypýta súbor, ktorý neexistuje — server vráti
 * stránku namiesto skriptu, načítanie zlyhá a používateľovi ostane prázdno
 * alebo polovičná obrazovka. (Presne takto vyzeralo „do časovej osi sa nedá
 * písať" po nasadení počas práce.)
 *
 * Riešenie je jednoduché: raz obnoviť stránku. Značka v `sessionStorage`
 * bráni slučke, keby bola chyba inde, a po úspešnom načítaní sa maže.
 */

import { lazy, type ComponentType } from 'react';

const ZNACKA = 'hradiska.obnovene-po-nasadeni';

export function lazyStale<T extends ComponentType<any>>(load: () => Promise<{ default: T }>) {
  return lazy(() =>
    load()
      .then((m) => {
        try { sessionStorage.removeItem(ZNACKA); } catch { /* nevadí */ }
        return m;
      })
      .catch((e) => {
        let uzSkusene = true;
        try { uzSkusene = sessionStorage.getItem(ZNACKA) === '1'; } catch { /* nevadí */ }
        if (!uzSkusene) {
          try { sessionStorage.setItem(ZNACKA, '1'); } catch { /* nevadí */ }
          window.location.reload();
          // Kým sa stránka obnoví, nech sa nevykreslí chybová hláška.
          return new Promise<{ default: T }>(() => {});
        }
        throw e;
      }),
  );
}
