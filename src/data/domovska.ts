/**
 * DOMOVSKÁ STRÁNKA — texty a výbery, ktoré boli napísané priamo v komponentoch.
 *
 * Odkedy web číta „vzhľad" (`lib/vzhlad/`), komponenty tieto konštanty
 * nečítajú priamo. Sú ZDROJOM ZÁKLADNÉHO VZHĽADU (`lib/vzhlad/zakladny.ts`):
 * podľa nich sa web nakreslí, keď API vzhľadu nie je, a z nich vyrába prevod
 * dnešného stavu prvú verziu vzhľadu v databáze.
 *
 * Presťahované sem z `LabHome`, `LabDalsiObsah`, `LabAktuality` a `LabJoinUs`,
 * aby základný vzhľad (je v hlavnom balíku) neťahal so sebou kód tých
 * komponentov — tie sa sťahujú až na domovskej.
 */

/** Úvod domovskej nad dlaždicami. Preklad ide cez `t()`. */
export const UVOD = {
  nadtitulok: 'Encyklopédia hradísk Slovenska',
  nadpis: 'Slovanské hradiská',
};

/** Oddeľovač pred druhým radom dlaždíc. */
export const NADPIS_PRAMENE = 'Pramene a tradícia';

/** Výzva nad hľadaním. */
export const VYZVA_HLADANIA = 'Nájdi hradisko vo svojom okolí';

/* Tri ukážkové hradiská pod hľadaním. Článok má v každom jazyku vlastný slug,
   takže anglickú adresu si vypýtame z dát — napísaná v kóde by po premenovaní
   článku viedla na „Article not found". Kým odpoveď nepríde, odkaz vedie na
   slovenskú verziu, ktorá existuje vždy. Texty sa NEPREKLADAJÚ (sú to mená). */
export const POPULARNE: { text: string; slug: string }[] = [
  { text: 'Bojná', slug: 'bojna-vyznamne-velkomoravske-centrum' },
  { text: 'Devín', slug: 'devin' },
  { text: 'Molpír', slug: 'molpir' },
];

/** „Ďalší obsah" — kategórie bez dlaždice nad mapou, v poradí podľa handoffu.
    Názov ide cez `t()` (rovnaký kľúč ako názov kategórie). */
export const NADPIS_DALSI_OBSAH = 'Ďalší obsah';
export const DALSI_OBSAH: { slug: string; label: string }[] = [
  { slug: 'informacne-tabule', label: 'Informačné tabule' },
  { slug: 'odborne-texty', label: 'Odborné texty' },
  { slug: '3d-modely', label: '3D modely' },
];

/** Nadpis bloku činnosti združenia. */
export const NADPIS_CINNOSTI = 'Čo združenie robí';

/* Činnosti, ktoré sa na domovskej VYNECHÁVAJÚ: tabule a 3D rekonštrukcie majú
   vlastný rad článkov v „Ďalšom obsahu" o kus vyššie, takže by na jednej
   obrazovke stáli dvakrát — raz ako dlaždica, raz ako nadpis radu. */
export const CINNOSTI_MIMO_DOMOVSKEJ = ['tabule', 'rekonstrukcie'];

/* Prvé štyri zápisy kroniky sú pripnuté ručne. Pás je to prvé, čo z kroniky
   vidno, a čisto podľa dátumu sa naň dostali zápisy bez použiteľnej fotografie
   — karta potom ukazuje len vodoznak značky. Poradie je redakčné rozhodnutie,
   nie chyba radenia. Slovenské slugy: v základnom vzhľade sa hľadajú podľa
   slugu, takže v angličtine a nemčine sa nenájdu (tak to bolo aj predtým). */
export const PRIPNUTE_KRONIKY = [
  '2-pre-hradiska-v-roku-2025',
  'danuvina-alacris-opat-na-vodach-dunaja',
  'bronzovy-poklad-z-hradiska-na-strednom-povazi',
  'vyprava-polske-hradiska-3-gdansk-a-owidz',
];

/** Slug článku, ktorý je na nástenke pripnutý ako statický úvod. Žije tu, nie
    v `lib/strapi.ts`, aby ho základný vzhľad prečítal bez klienta API
    (`strapi.ts` ho ďalej vyváža pod tým istým menom). */
export const KRONIKA_INTRO_SLUG = 'preco-to-vlastne-robim';

/** Obrázok v ľavom hornom bloku kroniky = kresba tejto kategórie. */
export const KRONIKA_OBRAZOK_KATEGORIE = 'strazna-funkcia';

/* „Staňte sa našimi spolupracovníkmi". TEXT JE PREVZATÝ DOSLOVA z pôvodného
   `JoinUs.tsx` — vety, e-mail aj citát. */
export const PRIDAJTE_SA = {
  nadtitulok: 'Buďme hrdí na naše dejiny',
  nadpis: 'Staňte sa našimi spolupracovníkmi',
  citat: 'Možno sami neviete, aké poklady vlastníte.',
  uvod: 'Aj vy sa môžete podieľať na zveľaďovaní našej stránky. Ak máte doma zaujímavé fotografie z hradísk alebo obrázky a fotky nálezov, stačí sa s nami o ne podeliť — každý záber pomáha dopĺňať náš spoločný obraz o dávnej minulosti.',
  email: 'info@hradiska.sk',
  prosby: [
    {
      nadpis: 'Valy a opevnenia',
      text: 'Zábery na valy, pozostatky opevnení, budov a podobne — najmä pri hradiskách, na ktorých som ešte nebol a ku ktorým preto nemám žiadne fotky.',
    },
    {
      nadpis: 'Nálezy v zahraničí',
      text: 'Slovanské nálezy v Maďarsku a Rakúsku — múzeá vo Visegráde, Novohrade, Ostrihome či Zalavári. Šperky, zbrane, črepy a podobne.',
    },
    {
      nadpis: 'Máte doma nález?',
      text: 'Platí to aj pre náhodných nálezcov, ktorí majú v pivnici či na povale zaujímavé nálezy, na ktoré len sadá prach a s ktorými sa boja oficiálne pochváliť. Urobiť fotku, napísať, kde sa nález našiel, a poslať to na mail sa predsa dá.',
    },
  ],
};
