'use client';

/**
 * Dialógy konceptu — súbeh pri uložení, chyby kontroly, zverejnenie so
 * zoznamom zmien, konflikt s databázou, história, obnova zálohy, zahodenie.
 * Spoločné pre vizuálny editor aj klasickú úpravu (kreslí ich `VzhladModul`).
 */

import { useEffect, useMemo, useState } from 'react';
import { Loader2, History as HistoryIcon } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { nacitajHistoriu, nacitajVerziu, type VerziaVZozname } from '../api/vzhlad';
import { zmenyVzhladu } from '../../lib/vzhlad/zmeny';
import { naplanujZapisy } from '../../lib/vzhlad/zlucenie';
import { useKoncept, type Stranka } from './stav/KonceptKontext';
import { pocetVyhrad } from './stav/preklady';
import { miestoZCesty } from './cesty';
import { Okno, useEditorUI } from './ui';

const cas = (iso: string | null | undefined) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.toLocaleDateString('sk-SK')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export function DialogyKonceptu({ naPlatne }: { naPlatne: (s: Stranka, nazov: string | null) => void }) {
  const k = useKoncept();
  const d = k.dialog;
  if (!d) return null;
  const zavri = () => k.otvorDialog(null);
  switch (d.druh) {
    case 'konflikt': return <KonfliktDialog detail={d.detail} onZavri={zavri} />;
    case 'chyby': return (
      <Okno nadpis={d.pri === 'zverejnenie' ? 'Zverejnenie neprešlo kontrolou' : 'Koncept sa neuložil — server ho odmietol'} onZavri={zavri}>
        <p>Server skontroloval vzhľad a našiel {d.chyby.length} {d.chyby.length === 1 ? 'chybu' : d.chyby.length < 5 ? 'chyby' : 'chýb'}. Nič sa neuložilo; po oprave skúste znova.</p>
        <ul className="vw-zmeny" data-vw-chyby>
          {d.chyby.map((c, i) => {
            const m = k.koncept ? miestoZCesty(c.cesta, k.koncept, k.rozriesene) : null;
            return (
              <li key={i}>
                {c.sprava} <small style={{ color: 'var(--ad-muted)' }}>({c.cesta})</small>
                {m && <> <button className="abtn" style={{ padding: '1px 8px', fontSize: 12 }} onClick={() => { zavri(); naPlatne(m.stranka, m.nazov ?? m.obal); }}>Ukázať</button></>}
              </li>
            );
          })}
        </ul>
        <div className="vw-dialog-tlacidla"><button className="abtn abtn-primary" onClick={zavri}>Rozumiem</button></div>
      </Okno>
    );
    case 'zverejnit': return <ZverejnitDialog onZavri={zavri} />;
    case 'konfliktDb': return (
      <Okno nadpis="V databáze sa medzitým niečo zmenilo" onZavri={zavri}>
        <p>Kým ste upravovali vzhľad, niekto zmenil v databáze hodnoty, ktoré zverejnenie zapisuje (napr. na obrazovke Kategórie). Zverejnenie sa zastavilo a nezapísalo nič.</p>
        <ul className="vw-zmeny" data-vw-konflikty>{d.konflikty.map((c, i) => <li key={i}>{c.sprava}</li>)}</ul>
        <div className="vw-dialog-tlacidla">
          <button className="abtn" onClick={zavri}>Zatvoriť</button>
          <button className="abtn" onClick={() => k.vyriesitKonfliktDb(d.konflikty, d.db, 'ponechat')}>Ponechať moje (prepíše databázu)</button>
          <button className="abtn abtn-primary" data-vw-prevziat-z-db onClick={() => k.vyriesitKonfliktDb(d.konflikty, d.db, 'prevziat')}>Prevziať hodnoty z databázy</button>
        </div>
      </Okno>
    );
    case 'historia': return <HistoriaDialog onZavri={zavri} naPlatne={naPlatne} />;
    case 'obnova': return (
      <Okno nadpis="Máte tu rozpracované zmeny" onZavri={() => k.zahoditZalohu()}>
        <p>
          Z <b>{cas(new Date(d.zaloha.ulozene).toISOString())}</b> sa v tomto prehliadači našli zmeny vzhľadu, ktoré sa nestihli uložiť.
          Chcete ich vrátiť do editora? Web sa nezmení, kým koncept neuložíte a nezverejníte.
        </p>
        {d.zaloha.zaklad !== k.verziaKonceptu && (
          <div className="vw-upozornenie je-zlte" style={{ marginBottom: 10 }}>
            <span>Odvtedy koncept uložil niekto iný (verzia {k.verziaKonceptu}, záloha vychádza z verzie {d.zaloha.zaklad}). Pri uložení sa editor opýta, ktorú verziu ponechať.</span>
          </div>
        )}
        <div className="vw-dialog-tlacidla">
          <button className="abtn" onClick={() => k.zahoditZalohu()}>Zahodiť rozpracované</button>
          <button className="abtn abtn-primary" data-vw-obnovit-zalohu onClick={() => k.obnovitZalohu(d.zaloha)}>Obnoviť rozpracované</button>
        </div>
      </Okno>
    );
    case 'zahodit': return (
      <Okno nadpis="Zahodiť koncept?" onZavri={zavri}>
        <p>Koncept sa vráti na stav, ktorý je teraz na webe{k.server?.zverejnene ? '' : ' (nič zverejnené ešte nie je — koncept bude prázdny)'}. Všetky jeho zmeny sa stratia — aj tie uložené. Zverejnené verzie v histórii ostávajú.</p>
        <div className="vw-dialog-tlacidla">
          <button className="abtn" onClick={zavri}>Nechať</button>
          <button className="abtn abtn-danger" onClick={() => k.zahoditKoncept()}>Zahodiť koncept</button>
        </div>
      </Okno>
    );
    default: return null;
  }
}

function KonfliktDialog({ detail, onZavri }: { detail: import('../api/vzhlad').KonceptZmeneny; onZavri: () => void }) {
  const k = useKoncept();
  const [prepisat, setPrepisat] = useState(false);
  const zmeny = useMemo(() => zmenyVzhladu(detail.koncept, k.koncept, k.rozriesene), [detail.koncept, k.koncept, k.rozriesene]);
  return (
    <Okno nadpis="Koncept medzitým uložil niekto iný" onZavri={onZavri}>
      <p data-vw-konflikt>
        Medzitým uložil koncept <b>{detail.konceptUpravil ?? 'iný redaktor'}</b> o <b>{cas(detail.konceptUpravene)}</b> (verzia {detail.verziaKonceptu}).
        Vaša verzia vychádza zo staršej, takže by jeho prácu ticho prepísala — preto sa neuložila.
      </p>
      {!prepisat ? (
        <div className="vw-dialog-tlacidla">
          <button className="abtn" onClick={() => setPrepisat(true)} data-vw-prepisat-mojou>Prepísať mojou…</button>
          <button className="abtn abtn-primary" onClick={() => k.nacitatJehoVerziu()} data-vw-nacitat-jeho>Načítať jeho verziu</button>
        </div>
      ) : (
        <>
          <p>Ak uložíte svoju verziu, jeho koncept sa zmení takto:</p>
          <ul className="vw-zmeny">{zmeny.length ? zmeny.map((z, i) => <li key={i}>{z}</li>) : <li>Bez rozdielov — verzie sú rovnaké.</li>}</ul>
          <div className="vw-dialog-tlacidla">
            <button className="abtn" onClick={() => setPrepisat(false)}>Späť</button>
            <button className="abtn abtn-danger" onClick={() => k.prepisatMojou(detail)} data-vw-potvrdit-prepisanie>Áno, prepísať jeho verziu mojou</button>
          </div>
        </>
      )}
    </Okno>
  );
}

function ZverejnitDialog({ onZavri }: { onZavri: () => void }) {
  const k = useKoncept();
  const [poznamka, setPoznamka] = useState('');
  const [pracuje, setPracuje] = useState(false);
  const zmeny = useMemo(() => zmenyVzhladu(k.server?.zverejnene ?? null, k.koncept, k.rozriesene), [k.server, k.koncept, k.rozriesene]);
  const plan = useMemo(() => (k.koncept && k.server ? naplanujZapisy(k.koncept, k.zakladDb, k.server.db) : null), [k.koncept, k.zakladDb, k.server]);
  const en = pocetVyhrad(k.koncept, 'en');
  const de = pocetVyhrad(k.koncept, 'de');
  const menoKat = (id?: string) => k.kategorieDb.find((x) => x.documentId === id)?.name ?? id ?? '';
  return (
    <Okno nadpis="Zverejniť vzhľad na webe" onZavri={onZavri}>
      <p>Koncept je uložený. Po potvrdení ho uvidia návštevníci (web si ho stiahne do 30 sekúnd). Predošlý stav ostane v histórii a dá sa obnoviť.</p>
      <h3 style={{ fontSize: 13, margin: '0 0 6px' }}>Zmeny oproti webu ({zmeny.length})</h3>
      <ul className="vw-zmeny" data-vw-zoznam-zmien>{zmeny.length ? zmeny.map((z, i) => <li key={i}>{z}</li>) : <li>Žiadne — koncept je rovnaký ako web.</li>}</ul>
      {plan && plan.zapisy.length > 0 && (
        <>
          <h3 style={{ fontSize: 13, margin: '0 0 6px' }}>Zapíše sa aj do databázy (staré verzie webu a appka)</h3>
          <ul className="vw-zmeny">
            {plan.zapisy.filter((z) => z.druh !== 'poradie').map((z, i) => (
              <li key={i}>{z.druh === 'nazov' ? `Názov kategórie: „${z.z ?? '—'}“ → „${z.na}“` : `Domovská galéria: ${z.na.length} fotiek`}</li>
            ))}
            {plan.zapisy.some((z) => z.druh === 'poradie') && <li>Poradie kategórií v menu ({plan.zapisy.filter((z) => z.druh === 'poradie').length} kategórií dostane poradie 10, 20, 30 …)</li>}
          </ul>
        </>
      )}
      <div className="vw-upozornenia" style={{ marginBottom: 12 }}>
        {plan && plan.konflikty.length > 0 && (
          <div className="vw-upozornenie je-cervene"><span>V databáze sa medzitým zmenilo: {plan.konflikty.map((c) => c.sprava).join(' ')} Zverejnenie sa zastaví a ponúkne riešenie.</span></div>
        )}
        {(en > 0 || de > 0) && (
          <div className="vw-upozornenie je-zlte"><span>Preklady: {en > 0 ? `${en} textov v angličtine` : ''}{en > 0 && de > 0 ? ' a ' : ''}{de > 0 ? `${de} v nemčine` : ''} chýba alebo je k staršiemu zneniu. Web tam ukáže starý preklad, slovník alebo slovenčinu.</span></div>
        )}
        {k.chybyKlienta.length > 0 && (
          <div className="vw-upozornenie je-cervene"><span>Kontrola v editore našla {k.chybyKlienta.length} {k.chybyKlienta.length === 1 ? 'chybu' : 'chýb'} (napr. {k.chybyKlienta[0].sprava}). Server zverejnenie s chybou odmietne.</span></div>
        )}
        {plan?.konflikty.length === 0 && plan.zapisy.some((z) => z.druh === 'nazov') && (
          <div className="vw-upozornenie je-sive"><span>Premenované kategórie: {plan.zapisy.filter((z) => z.druh === 'nazov').map((z) => menoKat((z as { kategoria: string }).kategoria)).join(', ')}.</span></div>
        )}
      </div>
      <label className="vw-pole">
        <span className="vw-pole-nazov">Poznámka do histórie (nepovinná)</span>
        <input className="afld" value={poznamka} maxLength={200} onChange={(e) => setPoznamka(e.target.value.replace(/[<>]/g, ''))} placeholder="napr. Nové obrázky kategórií" data-vw-poznamka />
      </label>
      <div className="vw-dialog-tlacidla">
        <button className="abtn" onClick={onZavri}>Zrušiť</button>
        <button className="abtn abtn-primary" disabled={pracuje} data-vw-potvrdit-zverejnenie
                onClick={async () => { setPracuje(true); await k.potvrdZverejnenie(poznamka); setPracuje(false); }}>
          {pracuje && <Loader2 className="w-4 h-4 animate-spin" />} Zverejniť
        </button>
      </div>
    </Okno>
  );
}

function HistoriaDialog({ onZavri, naPlatne }: { onZavri: () => void; naPlatne: (s: Stranka, n: string | null) => void }) {
  const { token } = useAuth();
  const k = useKoncept();
  const ui = useEditorUI();
  const [verzie, setVerzie] = useState<VerziaVZozname[] | null>(null);
  const [chyba, setChyba] = useState('');
  const [nacitava, setNacitava] = useState<number | null>(null);
  useEffect(() => {
    if (!token) return;
    nacitajHistoriu(token).then(setVerzie).catch((e) => setChyba(e?.message || 'Históriu sa nepodarilo načítať.'));
  }, [token]);
  const aktualna = k.server?.verziaZverejnena ?? 0;
  return (
    <Okno nadpis="História zverejnení" onZavri={onZavri} siroke>
      <p>Každé zverejnenie je tu ako verzia. „Pozrieť“ ju ukáže na plátne len na čítanie, „Obnoviť do konceptu“ ju skopíruje do konceptu — na webe sa prejaví až po zverejnení.</p>
      {chyba && <div className="vw-upozornenie je-cervene">{chyba}</div>}
      {!verzie && !chyba && <div className="vw-pomoc"><Loader2 className="w-4 h-4 animate-spin" style={{ display: 'inline' }} /> Načítavam…</div>}
      {verzie && !verzie.length && <div className="vw-pomoc">Zatiaľ nič nebolo zverejnené.</div>}
      {verzie && verzie.length > 0 && (
        <div className="vw-zoznam" data-vw-historia>
          {verzie.map((v) => (
            <div key={v.verzia} className="vw-zoznam-riadok" data-vw-verzia={v.verzia}>
              <HistoryIcon className="w-4 h-4" style={{ flexShrink: 0, color: 'var(--ad-muted)' }} />
              <span className="vw-text">
                Verzia {v.verzia}{v.verzia === aktualna ? ' · na webe' : ''}{v.poznamka ? ` · ${v.poznamka}` : ''}
                <small>{v.zverejnil ?? '—'} · {cas(v.zverejnene)}</small>
              </span>
              <button className="abtn" style={{ padding: '4px 10px', fontSize: 12.5 }} disabled={nacitava === v.verzia} data-vw-pozriet={v.verzia}
                      onClick={async () => {
                        if (!token) return;
                        setNacitava(v.verzia);
                        try {
                          const cela = await nacitajVerziu(token, v.verzia);
                          k.nastavNahladVerzie(cela);
                          onZavri();
                          naPlatne({ druh: 'domov' }, null);
                        } catch (e) { setChyba((e as Error)?.message || 'Verziu sa nepodarilo načítať.'); }
                        finally { setNacitava(null); }
                      }}>Pozrieť</button>
              <button className="abtn" style={{ padding: '4px 10px', fontSize: 12.5 }} data-vw-obnovit={v.verzia}
                      onClick={async () => {
                        if (k.neulozene) {
                          const ok = await ui.potvrd({ nadpis: 'Obnoviť verziu?', text: 'V koncepte máte neuložené zmeny — obnovením verzie sa stratia (koncept sa nahradí touto verziou).', tlacidlo: 'Obnoviť', nebezpecne: true });
                          if (!ok) return;
                        }
                        await k.obnovitVerziu(v.verzia);
                      }}>Obnoviť do konceptu</button>
            </div>
          ))}
        </div>
      )}
    </Okno>
  );
}
