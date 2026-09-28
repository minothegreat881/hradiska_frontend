import type { CapacitorConfig } from '@capacitor/cli';
import { existsSync, readFileSync } from 'fs';

/**
 * Verzia zabaleného webu — vyrobil ju `scripts/postav-balik.mjs` do
 * `app-balik.json`. Vstavaný balík v APK sa ňou hlási serveru, takže appka
 * hneď po inštalácii nesťahuje ten istý web, ktorý už v sebe nesie.
 * Keď súbor nie je (niekto zostavuje bez `npm run app:sync`), ostane `1.0`
 * a prvé spustenie si aktualizáciu stiahne — funguje to, len je to zbytočné.
 */
const verziaBalika = (() => {
  try {
    if (existsSync('app-balik.json')) return String(JSON.parse(readFileSync('app-balik.json', 'utf8')).verzia || '1.0');
  } catch {
    /* zlomený súbor nesmie zastaviť zostavenie */
  }
  return '1.0';
})();

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
    /**
     * DORUČOVANIE ZMIEN Z WEBU (OTA). Appka sa pri spustení spýta servera,
     * či je nový balík webu, stiahne ho na pozadí a spustí sa z neho až pri
     * ďalšom otvorení — človek nikdy nečaká na sťahovanie.
     *
     * `notifyAppReady()` v `src/nativne/schranka.ts` je povinné: keď ho nový
     * balík do 10 s nezavolá (napr. spadne na chybe v JS), appka sa sama
     * vráti na predošlý funkčný balík. Bez toho by jedna zlá verzia webu
     * odstavila appku všetkým.
     *
     * `statsUrl: ''` a `channelUrl: ''` vypínajú hlásenia do služby Capgo —
     * beží to celé na našom serveri, nikam inam nič neodchádza.
     */
    CapacitorUpdater: {
      autoUpdate: true,
      updateUrl: 'https://webdesignforhradiskask.vercel.app/strapi/api/aktualizacia',
      statsUrl: '',
      channelUrl: '',
      version: verziaBalika,
      appReadyTimeout: 10000,
      responseTimeout: 20,
      autoDeleteFailed: true,
      autoDeletePrevious: true,
      // Po aktualizácii appky z obchodu zahodiť balíky — nové APK je novšie.
      resetWhenUpdate: true,
    },
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
