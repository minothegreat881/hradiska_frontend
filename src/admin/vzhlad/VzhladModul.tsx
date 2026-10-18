'use client';

/**
 * „VZHĽAD WEBU" v administrácii — vizuálny editor (plátno) aj klasická
 * úprava (formulár) nad jedným spoločným konceptom.
 *
 *   #/vzhlad/domov · #/vzhlad/kategoria/<slug> · #/vzhlad/menu · #/vzhlad/formular
 *
 * `KonceptProvider` žije tu, nad oboma obrazovkami — prechod plátno ↔
 * formulár ani zmena stránky neuložené zmeny nestratí.
 */

import { useCallback, useState } from 'react';
import { Loader2 } from 'lucide-react';
import './vzhlad-editor.css';
import { KonceptProvider, useKoncept, type Stranka } from './stav/KonceptKontext';
import { EditorUIProvider } from './ui';
import { DialogyKonceptu } from './dialogy';
import { VizualnyEditor } from './VizualnyEditor';
import { FormularScreen } from './FormularScreen';

export type StrankaModulu = Stranka | { druh: 'formular' };

export function VzhladModul({ stranka, naStranku, upravitClanok, spat }: {
  stranka: StrankaModulu;
  /** Zmení adresu (`#/vzhlad/…`). */
  naStranku: (s: StrankaModulu) => void;
  upravitClanok: (dokument: string) => void;
  spat: () => void;
}) {
  return (
    <KonceptProvider>
      <Vnutro stranka={stranka} naStranku={naStranku} upravitClanok={upravitClanok} spat={spat} />
    </KonceptProvider>
  );
}

function Vnutro({ stranka, naStranku, upravitClanok, spat }: Parameters<typeof VzhladModul>[0]) {
  const k = useKoncept();
  const [odrolovat, setOdrolovat] = useState<{ nazov: string; id: number } | null>(null);
  /* Posledná stránka plátna — klasická úprava sa na ňu vracia. */
  const [poslednaStranka, setPoslednaStranka] = useState<Stranka>(stranka.druh === 'formular' ? { druh: 'domov' } : stranka);

  const naPlatne = useCallback((s: Stranka, nazov?: string | null) => {
    const ina = s.druh !== stranka.druh || (s.druh === 'kategoria' && stranka.druh === 'kategoria' && s.slug !== stranka.slug);
    if (ina) { k.nastavVyber(null); naStranku(s); setPoslednaStranka(s); }
    if (nazov) { k.nastavVyber(nazov); setOdrolovat({ nazov, id: Date.now() }); }
  }, [stranka, naStranku, k]);

  if (k.stav === 'nacitava') {
    return <div style={{ padding: 60, textAlign: 'center', color: 'var(--ad-secondary)' }}><Loader2 className="w-6 h-6 animate-spin" style={{ display: 'inline' }} /> Načítavam vzhľad webu…</div>;
  }
  if (k.stav === 'chyba') {
    return (
      <div className="acard vw-prazdny">
        <h2>Vzhľad sa nepodarilo načítať</h2>
        <p>{k.chybaNacitania}</p>
        <button className="abtn abtn-primary" onClick={() => void k.nacitajZnova()}>Skúsiť znova</button>
      </div>
    );
  }
  if (k.stav === 'prazdny') {
    return (
      <div className="acard vw-prazdny" data-vw-prazdny>
        <h2>Vzhľad ešte nie je založený</h2>
        <p>
          Web zatiaľ kreslí dlaždice, sekcie, menu aj pätu z kódu. Tlačidlo nižšie z toho istého kódu poskladá vzhľad
          (s prekladmi zo slovníka, poradím kategórií a vybranou fotogalériou z databázy) a uloží ho ako <b>koncept</b>.
          Na webe sa nezmení nič, kým ho nezverejníte.
        </p>
        {k.sprava && <div className={`vw-upozornenie je-${k.sprava.ton === 'chyba' ? 'cervene' : 'sive'}`} style={{ marginBottom: 12 }}>{k.sprava.text}</div>}
        <button className="abtn abtn-primary" onClick={() => void k.zalozitZDnesnehoWebu()} disabled={!!k.pracuje} data-vw-zalozit>
          {k.pracuje ? <><Loader2 className="w-4 h-4 animate-spin" /> {k.pracuje}</> : 'Založiť z dnešného webu'}
        </button>
      </div>
    );
  }

  return (
    <EditorUIProvider kategorieDb={k.kategorieDb} rozriesene={k.rozriesene} naPlatne={naPlatne} upravitClanok={upravitClanok} doplnSubor={k.doplnSubor}>
      {stranka.druh === 'formular' ? (
        <FormularScreen naPlatne={naPlatne} otvorVizualny={() => naStranku(poslednaStranka)} />
      ) : (
        <VizualnyEditor
          stranka={stranka}
          naStranku={(s, vyber) => { naPlatne(s, vyber ?? null); }}
          spat={spat}
          otvorFormular={() => naStranku({ druh: 'formular' })}
          odrolovat={odrolovat}
        />
      )}
      <DialogyKonceptu naPlatne={naPlatne} />
    </EditorUIProvider>
  );
}

export default VzhladModul;
