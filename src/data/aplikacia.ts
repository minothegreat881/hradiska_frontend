/**
 * VYDANIE MOBILNEJ APLIKÁCIE — jediné miesto, kde sa píše číslo verzie
 * a veľkosť súboru pre stránku `/aplikacia`.
 *
 * Musí sedieť s `versionName` v `android/app/build.gradle`. Nie je to
 * zbožné prianie: `scripts/postav-android.mjs` to pri každom zostavení
 * porovná a keď to nesedí, zostavenie zastaví — inak by stránka ponúkala
 * „verziu 1.1" a v telefóne by sa nainštalovalo niečo iné.
 */
export const APLIKACIA = {
  verzia: '1.1',
  /** Veľkosť podpísaného APK zaokrúhlená nahor; kontroluje ju ten istý skript. */
  velkostMB: 52,
} as const;
