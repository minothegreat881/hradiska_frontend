'use client';

/**
 * KLASICKÁ ÚPRAVA VZHĽADU (plán, časť 8) — alternatíva bez plátna.
 *
 * Zbalené panely po sekciách, zoznamy s úchytmi, polia so záložkami
 * SK · EN · DE. Ten istý koncept, verzie, zverejnenie a história ako
 * vizuálny editor (`KonceptProvider`) — žiadne druhé ukladanie. Pri každom
 * prvku je „Otvoriť na plátne".
 */

import { useState } from 'react';
import { Undo2, Redo2, Loader2, History as HistoryIcon, LayoutTemplate, RotateCcw } from 'lucide-react';
import type { Jazyk } from '../../lib/vzhlad/typy';
import { Panel } from '../components/Panel';
import { useKoncept, type Stranka } from './stav/KonceptKontext';
import {
  EditorUvodu, EditorDlazdic, EditorHladania, EditorSekcii, EditorDalsiehoObsahu, EditorCinnosti, EditorKroniky,
  EditorPridajteSa, EditorKategorie, EditorMenu, EditorPaty,
} from './oblasti';
import { zmenyVzhladu } from '../../lib/vzhlad/zmeny';
import { pocetVyhrad } from './stav/preklady';
import { NAZVY_SEKCII } from './stav/operacie';

export function FormularScreen({ naPlatne, otvorVizualny }: { naPlatne: (s: Stranka, nazov: string | null) => void; otvorVizualny: () => void }) {
  const k = useKoncept();
  const [jazyk, setJazyk] = useState<Jazyk>('sk');
  const [kategoria, setKategoria] = useState<string>(k.kategorieDb[0]?.slug ?? '');
  if (!k.koncept) return null;
  const v = k.koncept;
  const p = { jazyk, onJazyk: setJazyk, naPlatne: (s: Stranka, n: string) => naPlatne(s, n) };
  const zmien = zmenyVzhladu(k.server?.zverejnene ?? null, k.koncept, k.rozriesene).length;
  const stav = k.neulozene ? 'Neuložené zmeny' : !k.server?.zverejnene ? 'Koncept — na webe je zatiaľ vzhľad z kódu' : zmien ? `Koncept sa líši od webu (${zmien})` : 'Zverejnené';
  return (
    <div className="vw-formular" data-vw-formular>
      <div className="ad-editor-head vw-hlava">
        <div className="ad-head-title">
          <div className="ad-head-line"><span className="ad-title">Vzhľad webu · klasická úprava</span></div>
          <div className={`vw-stav ${k.neulozene ? 'je-neulozene' : zmien || !k.server?.zverejnene ? 'je-koncept' : ''}`} data-vw-stav>
            {k.pracuje ? <><Loader2 className="w-3 h-3 animate-spin" /> {k.pracuje}</> : <><span className="vw-stav-bodka" /> {stav}</>}
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <div className="ad-seg" role="group" aria-label="História zmien">
          <button onClick={k.vratit} disabled={!k.mozeVratit} aria-label="Vrátiť zmenu" title={k.popisVratit ? `Vrátiť: ${k.popisVratit}` : 'Nie je čo vrátiť'}><Undo2 className="w-4 h-4" /></button>
          <button onClick={k.zopakovat} disabled={!k.mozeZopakovat} aria-label="Zopakovať zmenu"><Redo2 className="w-4 h-4" /></button>
        </div>
        <div className="ad-seg vw-jazyky" role="group" aria-label="Jazyk polí">
          {(['sk', 'en', 'de'] as const).map((j) => (
            <button key={j} className={jazyk === j ? 'is-on' : ''} onClick={() => setJazyk(j)}>
              {j.toUpperCase()}{j !== 'sk' && pocetVyhrad(v, j) > 0 && <span className="vw-jazyk-bodka" />}
            </button>
          ))}
        </div>
        <button className="abtn" onClick={otvorVizualny}><LayoutTemplate className="w-4 h-4" /> Na plátne</button>
        <button className="abtn" onClick={() => k.otvorDialog({ druh: 'historia' })}><HistoryIcon className="w-4 h-4" /> História</button>
        <button className="abtn" onClick={() => k.otvorDialog({ druh: 'zahodit' })} title="Vrátiť koncept na zverejnený stav"><RotateCcw className="w-4 h-4" /></button>
        <button className="abtn" onClick={() => void k.ulozit()} disabled={!!k.pracuje || !k.neulozene} data-vw-ulozit>Uložiť koncept</button>
        <button className="abtn abtn-primary" onClick={() => void k.pripravZverejnenie()} disabled={!!k.pracuje} data-vw-zverejnit>Zverejniť</button>
      </div>

      {k.sprava && <div className={`acard vw-sprava je-${k.sprava.ton}`} role="status" data-vw-sprava><span>{k.sprava.text}</span></div>}
      {k.chybyKlienta.length > 0 && (
        <div className="acard vw-sprava je-chyba"><span>Kontrola: {k.chybyKlienta.length} {k.chybyKlienta.length === 1 ? 'chyba' : 'chýb'} — {k.chybyKlienta[0].sprava}</span></div>
      )}

      <Panel title="Úvod domovskej" summary={`${v.domov.uvod.nadtitulok.sk} · ${v.domov.uvod.nadpis.sk}`}><div className="vw-panel-telo"><EditorUvodu {...p} /></div></Panel>
      <Panel title="Dlaždice kategórií" summary={`${v.domov.dlazdice.skupiny.length} skupiny · ${v.domov.dlazdice.skupiny.reduce((n, s) => n + s.polozky.length, 0)} dlaždíc${v.domov.dlazdice.viditelne ? '' : ' · skryté'}`}>
        <div className="vw-panel-telo"><EditorDlazdic {...p} /></div>
      </Panel>
      <Panel title="Hľadanie a populárne" summary={`${v.domov.hladanie.popularne.length} populárnych`}><div className="vw-panel-telo"><EditorHladania {...p} /></div></Panel>
      <Panel title="Sekcie domovskej" summary={v.domov.sekcie.map((s) => `${s.typ === 'dalsi-obsah' && s.nadpis?.sk ? s.nadpis.sk : NAZVY_SEKCII[s.typ]}${s.viditelna ? '' : ' (skrytá)'}`).join(' · ')}>
        <div className="vw-panel-telo" data-vw-formular-sekcie><EditorSekcii {...p} /></div>
      </Panel>
      {v.domov.sekcie.filter((s) => s.typ === 'dalsi-obsah').map((s) => (
        <Panel key={s.id} title={`Riadky článkov · ${s.typ === 'dalsi-obsah' ? s.nadpis.sk : ''}`} summary={s.typ === 'dalsi-obsah' ? `${s.riadky.length} riadkov` : ''}>
          <div className="vw-panel-telo"><EditorDalsiehoObsahu {...p} sekciaId={s.id} /></div>
        </Panel>
      ))}
      <Panel title="Činnosť združenia" summary={`${v.cinnost.polozky.length} činností`}><div className="vw-panel-telo"><EditorCinnosti {...p} /></div></Panel>
      <Panel title="Kronika a vybraná fotogaléria" summary="úvodný článok, pripnuté zápisy, obrázok, fotky"><div className="vw-panel-telo"><EditorKroniky {...p} /></div></Panel>
      <Panel title="Pridajte sa k nám" summary={v.domov.pridajteSa.viditelna ? `${v.domov.pridajteSa.prosby.length} prosby` : 'skrytá'}><div className="vw-panel-telo"><EditorPridajteSa {...p} /></div></Panel>
      <Panel title="Stránky kategórií" summary={`${k.kategorieDb.length} kategórií — obrázok, názov, popis, pripnuté`}>
        <div className="vw-panel-telo">
          <label className="vw-pole">
            <span className="vw-pole-nazov">Kategória</span>
            <select className="afld" value={kategoria} onChange={(e) => setKategoria(e.target.value)} data-vw-formular-kategoria>
              {k.kategorieDb.map((x) => <option key={x.documentId} value={x.slug}>{x.name}</option>)}
            </select>
          </label>
          {kategoria && <EditorKategorie {...p} slug={kategoria} />}
        </div>
      </Panel>
      <Panel title="Menu" summary={`${v.menu.hlavnyRiadok.length} v hlavnom riadku`}><div className="vw-panel-telo"><EditorMenu {...p} /></div></Panel>
      <Panel title="Päta" summary={`${v.pata.stlpce.length} stĺpce · ${v.pata.siete.length} siete`}><div className="vw-panel-telo"><EditorPaty {...p} /></div></Panel>
    </div>
  );
}

export default FormularScreen;
