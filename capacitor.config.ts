import type { CapacitorConfig } from '@capacitor/cli';

/**
 * NATÍVNA SCHRÁNKA pre Android a iOS.
 *
 * Aplikácia si nesie **zabalený web** (`dist/`), nenačítava živú adresu.
 * Je to zámer, nie opatrnosť: appku, ktorá len otvorí webstránku, Apple
 * zamieta podľa pravidla 4.2. Nové verzie rozhrania sa doručujú cez vzduch
 * (viď `docs/MOBILNA-APLIKACIA.md`, kapitola 5), obsah ide cez API a je
 * v appke okamžite.
 *
 * `androidScheme: 'https'` — Android tým appku otvára ako `https://localhost`
 * namiesto `http://`. Bez toho by prehliadačové jadro považovalo stránku za
 * nezabezpečenú a odmietlo by service worker, polohu aj fotoaparát.
 * Oba pôvody (`https://localhost` aj `capacitor://localhost`) sú povolené
 * v CORS na Strapi — viď `config/middlewares.ts` v backende.
 */
const config: CapacitorConfig = {
  appId: 'sk.hradiska.app',
  appName: 'Hradiská.sk',
  // Zoštíhlený balík z `scripts/priprav-app.mjs` — `dist/` má 274 MB.
  webDir: 'dist-app',
  android: {
    // Rovnaký pôvod ako na webe — kvôli bezpečnostnému kontextu (viď vyššie).
    // (`androidScheme` je pod `server`, tu ostáva len to, čo je androidu vlastné.)
    allowMixedContent: false,
  },
  ios: {
    // Krémový podklad, nie biely: pri otáčaní a pri odskoku posunu presvitá.
    backgroundColor: '#f3ede1',
    contentInset: 'always',
  },
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      // Úvodnú obrazovku zhasína appka sama, keď je rozhranie pripravené
      // (`src/nativne/schranka.ts`). Automatické zhasnutie po pevnom čase by
      // na pomalom telefóne ukázalo prázdnu stránku.
      launchAutoHide: false,
      backgroundColor: '#f3ede1',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
  },
};

export default config;
