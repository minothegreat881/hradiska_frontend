'use client';

/**
 * STIAHNUTIE APLIKÁCIE.
 *
 * Nie je to ponuka „pridať si web na plochu" — to vie prehliadač sám a je to
 * niečo iné. Tu sa ponúka **skutočná aplikácia**: nainštaluje sa do systému,
 * nesie si web so sebou a mapu hradísk otvorí aj bez signálu.
 *
 * Stránka hovorí na rovinu aj to nepríjemné: appka zatiaľ nie je v Google
 * Play, takže Android sa pri inštalácii spýta, či súboru veríte. Keby to
 * stránka zamlčala, človek by sa zľakol systémového varovania a inštaláciu
 * zruší — a mal by pravdu, že to bolo prekvapenie.
 */

import { useEffect, useState } from 'react';
import { Download, Smartphone, WifiOff, BellRing, Map as MapIcon, ShieldCheck } from 'lucide-react';
import { STRAPI_URL } from '../lib/api-adresa';

/** APK leží vedľa API na našom serveri, nie v balíku webu — má 50 MB. */
const APK = `${STRAPI_URL}/app/hradiska.apk`;
const VERZIA = '1.0';

type System = 'android' | 'ios' | 'ine';

function urcSystem(): System {
  if (typeof navigator === 'undefined') return 'ine';
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return 'android';
  // iPad sa od iPadOS 13 hlási ako Mac — rozlíši ho dotyk.
  if (/iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
  return 'ine';
}

const VYHODY = [
  { ikona: WifiOff, nadpis: 'Funguje aj bez signálu', text: 'Mapa hradísk je celá v aplikácii. V teréne, kde nechytá dáta, ju otvoríte rovnako ako doma.' },
  { ikona: MapIcon, nadpis: 'Hradiská v okolí', text: 'Aplikácia vie, kde stojíte, a ukáže, čo máte na dosah.' },
  { ikona: BellRing, nadpis: 'Upozornenia', text: 'Keď na váš komentár niekto odpovie alebo pribudne nový článok, dozviete sa to hneď.' },
  { ikona: ShieldCheck, nadpis: 'Bez reklám a sledovania', text: 'To isté, čo web — nič navyše nezbiera.' },
];

export function AplikaciaPage() {
  const [system, setSystem] = useState<System>('ine');
  useEffect(() => { setSystem(urcSystem()); }, []);

  return (
    <div className="lapp">
      <div className="lapp-in">
        <nav className="lart-crumbs" aria-label="Omrvinky">
          <a href="/">Domov</a>
          <span aria-hidden="true">›</span>
          <a className="je-tu" href="/aplikacia">Aplikácia</a>
        </nav>

        <h1 className="lapp-nadpis">Hradiská vo vrecku</h1>
        <p className="lapp-perex">
          Celá encyklopédia aj s mapou v aplikácii, ktorú si nainštalujete do telefónu.
          Obsah je ten istý ako na webe a dopĺňa sa sám.
        </p>

        {/* Ponuka pre systém, z ktorého sa človek práve pozerá, stojí prvá. */}
        <div className="lapp-ponuka">
          <div className={`lapp-karta${system === 'android' ? ' je-teraz' : ''}`}>
            <div className="lapp-karta-hlava">
              <Smartphone aria-hidden="true" />
              <div>
                <h2>Android</h2>
                <span>verzia {VERZIA} · 50 MB</span>
              </div>
            </div>
            <a className="lapp-stiahnut" href={APK} download>
              <Download aria-hidden="true" /> Stiahnuť aplikáciu
            </a>
            <p className="lapp-poznamka">
              Aplikácia zatiaľ nie je v Google Play, preto sa telefón pri inštalácii spýta,
              či súboru veríte — potvrďte <strong>Inštalovať aj tak</strong>. Je podpísaná
              združením a nič iné do telefónu nepridá.
            </p>
          </div>

          <div className={`lapp-karta${system === 'ios' ? ' je-teraz' : ''}`}>
            <div className="lapp-karta-hlava">
              <Smartphone aria-hidden="true" />
              <div>
                <h2>iPhone a iPad</h2>
                <span>pripravujeme</span>
              </div>
            </div>
            <p className="lapp-text">
              Verziu pre App Store dokončujeme. Dovtedy si web pridajte na plochu —
              otvorí sa na celú obrazovku ako aplikácia:
            </p>
            <ol className="lapp-kroky">
              <li>V Safari klepnite na <strong>Zdieľať</strong> (štvorček so šípkou nahor).</li>
              <li>Vyberte <strong>Pridať na plochu</strong>.</li>
              <li>Potvrďte <strong>Pridať</strong>.</li>
            </ol>
          </div>
        </div>

        <h2 className="lapp-podnadpis">Čo aplikácia vie navyše</h2>
        <ul className="lapp-vyhody">
          {VYHODY.map((v) => (
            <li key={v.nadpis}>
              <v.ikona aria-hidden="true" />
              <div>
                <strong>{v.nadpis}</strong>
                <p>{v.text}</p>
              </div>
            </li>
          ))}
        </ul>

        <p className="lapp-pata">
          Aplikáciu vydáva OZ Hradiská. Na čo natrafíte, napíšte v diskusii pod ktorýmkoľvek
          článkom — čítame to.
        </p>
      </div>
    </div>
  );
}

export default AplikaciaPage;
