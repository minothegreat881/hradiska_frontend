/**
 * NATÍVNA SCHRÁNKA — všetko, čím sa aplikácia líši od webu, je tu.
 *
 * Pravidlo, na ktorom celý prístup stojí: **rozhranie sa nerozdvojuje.** Web
 * a aplikácia bežia z tých istých súborov; odlišnosti sú tenké adaptéry v
 * tomto priečinku. Keby sa začali vetviť komponenty, každá ďalšia zmena na
 * webe by znamenala druhú zmenu v appke — a presne to má tento prístup
 * vylúčiť.
 *
 * Moduly Capacitora sa načítavajú AŽ NA MIESTE a len v schránke
 * (`import()` vnútri vetvy). Na webe sa tým do balíka nedostanú vôbec.
 */

import { jeNatvnaSchranka } from '../lib/api-adresa';

/** Zapnuté? Web vracia `false` a nič z tohto modulu sa nespustí. */
export const vSchranke = (): boolean => jeNatvnaSchranka();

/**
 * Tlačidlo Späť na Androide.
 *
 * Bez tohto systém pri prvom klepnutí aplikáciu **ukončí** — aj keď je
 * čitateľ tri obrazovky hlboko v článku. Správanie: kým je kam ísť späť,
 * ide sa späť; na prvej obrazovke sa appka zavrie.
 */
async function zapojTlacidloSpat(): Promise<void> {
  const { App } = await import('@capacitor/app');
  App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) window.history.back();
    else App.exitApp();
  });
}

/**
 * Stavová lišta.
 *
 * Hlavička webu je krémová, takže ikony času a batérie musia byť tmavé.
 * `Style.Light` v Capacitore znamená „svetlé pozadie, tmavý obsah" — nie
 * naopak; je to častý zdroj zámeny.
 */
async function nastavStavovuListu(): Promise<void> {
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({ style: Style.Light });
    // Len Android; na iOS je to bez účinku a plugin to znesie.
    await StatusBar.setBackgroundColor({ color: '#f7f4ed' }).catch(() => {});
  } catch { /* stavová lišta nie je dôvod na pád aplikácie */ }
}

/** Úvodná obrazovka zhasne až vtedy, keď je čo ukázať. */
async function zhasniUvodnuObrazovku(): Promise<void> {
  try {
    const { SplashScreen } = await import('@capacitor/splash-screen');
    await SplashScreen.hide();
  } catch { /* na webe plugin nie je */ }
}

/**
 * Otvorenie odkazu z e-mailu alebo z upozornenia priamo v aplikácii.
 *
 * Appka dostane celú adresu (`https://hradiska.sk/blog/…?fotoFile=3099`)
 * a musí z nej spraviť vnútornú navigáciu — inak by sa otvorila na domovskej
 * a čitateľ by hľadal, kam mal vlastne prísť.
 */
async function zapojOdkazyZvonku(): Promise<void> {
  const { App } = await import('@capacitor/app');
  App.addListener('appUrlOpen', ({ url }) => {
    try {
      const u = new URL(url);
      window.history.pushState({}, '', u.pathname + u.search + u.hash);
      window.dispatchEvent(new PopStateEvent('popstate'));
    } catch { /* neplatná adresa — necháme appku tam, kde je */ }
  });
}

/**
 * Spustenie. Volá sa raz z `App.tsx`; na webe skončí na prvom riadku.
 */
export function zapojSchranku(): void {
  if (!vSchranke()) return;

  document.documentElement.setAttribute('data-schranka', 'ano');

  zapojTlacidloSpat().catch(() => {});
  zapojOdkazyZvonku().catch(() => {});
  nastavStavovuListu().catch(() => {});

  /* Úvodná obrazovka zhasína až po prvom vykreslení — `requestAnimationFrame`
     v dvoch krokoch je spoľahlivejší než `load`, ktorý na appke so zabaleným
     webom nastane skôr, než React niečo nakreslí. */
  requestAnimationFrame(() => requestAnimationFrame(() => {
    zhasniUvodnuObrazovku().catch(() => {});
  }));
}
