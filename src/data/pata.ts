/**
 * PÄTIČKA — stĺpce odkazov a siete. Presťahované z `LabFooter`.
 *
 * Komponent ich nečíta priamo: sú zdrojom základného vzhľadu
 * (`lib/vzhlad/zakladny.ts`). Ikony sietí ostávajú v komponente (sú to tvary,
 * nie obsah) a vyberajú sa podľa druhu siete.
 */

/* Odkazy sú zámerne zopakované (nie importované z produkčnej pätičky) — lab
   má ostať samostatný, aby sa v ňom dalo skúšať aj poradie a názvy. */
export const PATA_KATEGORIE = [
  { slug: 'kniezacie-sidla', label: 'Kniežacie sídla' },
  { slug: 'mocenske-centra', label: 'Mocenské centrá' },
  { slug: 'svatyne-a-sakralne-objekty', label: 'Svätyne' },
  { slug: 'vseobecne-o-hradiskach', label: 'Všeobecne o hradiskách' },
];

export const PATA_CLANKY = [
  { slug: 'povesti', label: 'Povesti' },
  { slug: 'listiny-a-pisomne-zdroje', label: 'Listiny a pramene' },
  { slug: 'odborne-texty', label: 'Odborné texty' },
  { slug: '3d-modely', label: '3D modely' },
  { slug: 'aktuality', label: 'Aktuality' },
];

/** Nadpisy stĺpcov (preklad cez `t()`). */
export const PATA_NADPISY = { kategorie: 'Kategórie', clanky: 'Články' };

export const PATA_SIETE: { druh: 'facebook' | 'instagram' | 'youtube' | 'email'; url: string }[] = [
  { druh: 'facebook', url: 'https://www.facebook.com/groups/118846781525141' },
  { druh: 'instagram', url: 'https://www.instagram.com/slovanske_hradiska/' },
  { druh: 'youtube', url: 'https://www.youtube.com/@ozhradiska3940' },
  { druh: 'email', url: 'mailto:info@hradiska.sk' },
];
