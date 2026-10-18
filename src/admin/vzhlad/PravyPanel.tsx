'use client';

/**
 * PRAVÝ PANEL vizuálneho editora.
 *   • s výberom: polia vybraného prvku vo všetkých troch jazykoch (záložky
 *     SK · EN · DE nasledujú jazyk plátna), obrázok, prepínače a celá
 *     oblasť, do ktorej prvok patrí (riadok, skupina, kronika, menu…),
 *   • bez výberu: prehľad stránky — sekcie s očkom a úchytom, upozornenia.
 */

import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import type { Jazyk } from '../../lib/vzhlad/typy';
import { useKoncept, type Stranka } from './stav/KonceptKontext';
import type { OpisPrvku } from './prvky';
import {
  PoliaPrvku, EditorUvodu, EditorDlazdic, EditorHladania, EditorSekcii, EditorDalsiehoObsahu, EditorCinnosti,
  EditorKroniky, EditorPridajteSa, EditorKategorie, EditorMenu, EditorPaty,
} from './oblasti';
import { Prepinac } from './polia';
import { indexZaznamu } from './stav/operacie';

export interface UpozorneniePanela {
  farba: 'zlte' | 'cervene' | 'sive' | 'modre';
  text: ReactNode;
  akcia?: { popis: string; vykonaj: () => void };
}

export function PravyPanel({ stranka, opis, jazyk, onJazyk, onZrusVyber, upozornenia, lenNaCitanie }: {
  stranka: Stranka;
  opis: OpisPrvku | null;
  jazyk: Jazyk;
  onJazyk: (j: Jazyk) => void;
  onZrusVyber: () => void;
  upozornenia: UpozorneniePanela[];
  lenNaCitanie: boolean;
}) {
  const k = useKoncept();
  if (lenNaCitanie) {
    return (
      <aside className="acard vw-panel" data-vw-panel>
        <div className="vw-panel-hlava"><h2>Len na čítanie</h2><p>Pozeráte staršiu verziu z histórie. Upravovať sa dá až po obnovení do konceptu.</p></div>
      </aside>
    );
  }
  const p = { jazyk, onJazyk };
  const c = opis?.nazov.split(':') ?? [];

  const oblast = (() => {
    if (!opis || !k.koncept) return null;
    switch (opis.druh) {
      case 'dlazdica': case 'skupina': {
        const sid = c[1];
        const d = opis.druh === 'dlazdica' ? k.koncept.domov.dlazdice.skupiny.find((s) => s.id === sid)?.polozky.find((x) => x.id === c[2]) : null;
        return (
          <>
            {d && (
              <Prepinac popis="Ukázať počet článkov pod popiskom" hodnota={d.pocet}
                        onZmena={(b) => k.zmen('počet na dlaždici', (w) => { const q = w.domov.dlazdice.skupiny.find((s) => s.id === sid)?.polozky.find((x) => x.id === d.id); if (q) q.pocet = b; })} />
            )}
            {d && <div className="vw-pomoc">Popisok a obrázok patria kategórii — rovnaké sú aj v lište kategórií nad článkom a v hlavičke stránky kategórie.</div>}
            <EditorDlazdic {...p} lenSkupina={sid} />
          </>
        );
      }
      case 'dlazdice': return <EditorDlazdic {...p} />;
      case 'hladanie': case 'popularne': case 'popularne-polozka': return <EditorHladania {...p} />;
      case 'sekcia-mapa': return <div className="vw-pomoc">Mapa sa na plátne nenačítava (zástupný blok má jej výšku). Dá sa presunúť a skryť celá; ikony, legenda a kategórie mapy ostávajú v kóde.</div>;
      case 'sekcia-dalsi-obsah': return <EditorDalsiehoObsahu {...p} sekciaId={c[1]} />;
      case 'riadok': return <EditorDalsiehoObsahu {...p} sekciaId={c[1]} lenRiadok={c[2]} />;
      case 'riadok-clanok': return <EditorDalsiehoObsahu {...p} sekciaId={c[1]} lenRiadok={c[2]} />;
      case 'sekcia-cinnost': return <EditorCinnosti {...p} />;
      case 'cinnost': return <EditorCinnosti {...p} lenKluc={c[1]} />;
      case 'sekcia-kronika': case 'kronika-uvod': case 'kronika-pripnuty': case 'kronika-zapis': case 'fotogaleria': case 'fotka':
        return <EditorKroniky {...p} />;
      case 'pridajte-sa': case 'prosba': return <EditorPridajteSa {...p} />;
      case 'menu': case 'menu-riadok': return <EditorMenu {...p} />;
      case 'pata-stlpec': case 'pata-odkaz': return <EditorPaty {...p} lenStlpec={c[0] === 'pata' ? c[2] : undefined} />;
      case 'pata-siet': return <EditorPaty {...p} />;
      case 'lista': return <EditorKategorie {...p} slug={c.slice(1).join(':')} />;
      case 'kategoria-clanok': return stranka.druh === 'kategoria' ? <EditorKategorie {...p} slug={stranka.slug} /> : null;
      default:
        if (opis.nazov.startsWith('kategoria:') && stranka.druh === 'kategoria') return <EditorKategorie {...p} slug={stranka.slug} />;
        if (opis.nazov.startsWith('uvod:')) return <EditorUvodu {...p} />;
        if (opis.nazov.startsWith('pridajte-sa:')) return <EditorPridajteSa {...p} />;
        if (opis.nazov.startsWith('cinnost:')) return <EditorCinnosti {...p} />;
        if (opis.nazov.startsWith('hladanie:')) return <EditorHladania {...p} />;
        if (opis.nazov.startsWith('dalsi-obsah:')) return <EditorDalsiehoObsahu {...p} sekciaId={c[2]} />;
        if (opis.nazov.startsWith('riadok-nadpis:')) return <EditorDalsiehoObsahu {...p} sekciaId={c[1]} lenRiadok={c[2]} />;
        return null;
    }
  })();

  const prehlad = (() => {
    if (opis || !k.koncept) return null;
    if (stranka.druh === 'domov') return <EditorSekcii {...p} />;
    if (stranka.druh === 'kategoria') return <EditorKategorie {...p} slug={stranka.slug} />;
    return (<><EditorMenu {...p} /><div style={{ height: 6 }} /><EditorPaty {...p} /></>);
  })();

  /* Kategória v menu bez záznamu vo vzhľade. */
  const bezVzhladu = opis?.druh === 'menu' && k.koncept && opis.kategoria
    ? (() => { const d = k.kategorieDb.find((x) => x.slug === opis.kategoria); return d && indexZaznamu(k.koncept!, { dokument: d.documentId, slug: d.slug }, k.rozriesene) < 0 ? d : null; })()
    : null;

  return (
    <aside className="acard vw-panel" data-vw-panel>
      <div className="vw-panel-hlava" style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 data-vw-panel-nadpis>{opis ? opis.stitok : stranka.druh === 'domov' ? 'Domovská stránka' : stranka.druh === 'menu' ? 'Hlavička a päta' : 'Stránka kategórie'}</h2>
          <p>{opis ? 'Kliknutím do stránky vyberiete iný prvok, dvojklikom píšete priamo v stránke.' : 'Kliknite na prvok stránky — vyberie sa a tu sa ukážu jeho polia. Ťahaním presúvate dlaždice, sekcie, riadky aj kategórie v menu.'}</p>
        </div>
        {opis && <button className="abtn abtn-icon" onClick={onZrusVyber} aria-label="Zrušiť výber" title="Zrušiť výber (Esc)"><X className="w-4 h-4" /></button>}
      </div>
      <div className="vw-panel-telo">
        {upozornenia.length > 0 && (
          <div className="vw-upozornenia" data-vw-upozornenia>
            {upozornenia.map((u, i) => (
              <div key={i} className={`vw-upozornenie je-${u.farba}`}>
                <span>{u.text}</span>
                {u.akcia && <button className="abtn" style={{ padding: '3px 9px', fontSize: 12 }} onClick={u.akcia.vykonaj}>{u.akcia.popis}</button>}
              </div>
            ))}
          </div>
        )}
        {bezVzhladu && (
          <div className="vw-upozornenie je-modre"><span>Kategória „{bezVzhladu.name}“ ešte nemá záznam vo vzhľade. Popisok dlaždice bude jej názov.</span></div>
        )}
        {/* Polia vybraného prvku — okrem prípadov, keď ich má celá oblasť nižšie
            (stránka kategórie, činnosť, úvod, „Pridajte sa“), aby neboli dvakrát. */}
        {opis && !/^(kategoria:|uvod:|pridajte-sa:|cinnost:(?!nadpis))/.test(opis.nazov) && opis.druh !== 'lista'
          && <PoliaPrvku opis={opis} jazyk={jazyk} onJazyk={onJazyk} />}
        {oblast}
        {prehlad}
      </div>
    </aside>
  );
}
