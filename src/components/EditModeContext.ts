import { createContext, useContext } from 'react';

/**
 * Beží renderer na plátne editora?
 *
 * Používa sa na jedinú vec: vypnúť zjavovanie pri scrollovaní. Tie animácie
 * spúšťa IntersectionObserver a plátno býva vo vlastnom okne (iframe), kde sa
 * pozorovanie nespustí — obsah by ostal navždy priehľadný. Na webe je hodnota
 * `false` a nič sa nemení.
 *
 * Kontext (a nie ďalší prop) preto, že animované prvky sú zanorené hlboko:
 * renderer → BlogMedia → jednotlivé rozvrhy.
 */
export const EditModeContext = createContext(false);

export const useEditMode = () => useContext(EditModeContext);
