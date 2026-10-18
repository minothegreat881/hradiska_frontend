'use client';

/**
 * OBLASTI VZHĽADU — polia po častiach stránky (úvod, dlaždice, hľadanie,
 * sekcie, ďalší obsah, činnosť, kronika, pridajte sa, kategória, menu, päta).
 *
 * Tie isté komponenty kreslí pravý panel vizuálneho editora (k vybranému
 * prvku) aj klasická úprava (zbalené panely po sekciách) — jedna sada polí,
 * jeden koncept, jedno uloženie. Texty a obrázky idú cez opis prvku
 * (`prvky.ts`), takže panel, plátno aj formulár zapisujú rovnako.
 */

import { useMemo, type ReactNode } from 'react';
import { MapPin, Plus, ExternalLink, FileEdit } from 'lucide-react';
import { LIMITY, KLUCE_CINNOSTI } from '../../lib/vzhlad/typy';
import type { Jazyk, Vzhlad, SekciaDomov, ZoradenieClankov, RiadokClankov } from '../../lib/vzhlad/typy';
import { useKoncept, type Stranka } from './stav/KonceptKontext';
import { useEditorUI } from './ui';
import { useAkciePrvkov } from './akcie';
import { opisPrvku, type KontextPrvku, type OpisPrvku } from './prvky';
import {
  TextovePole, Prepinac, Vyber, VyberKategorie, ZoznamPoloziek, ObrazokPolozky, CielOdkazu, adresaNahladu,
} from './polia';
import {
  presunVPoli, radyMenu, nastavRadyMenu, slugOdkazu, indexZaznamu, zaznamKategorie, klucOdkazu, NAZVY_SEKCII, noveId,
} from './stav/operacie';
import { zaznamNovejKategorie } from '../../lib/vzhlad/prevod';
import { prekladZoSlovnika } from '../../lib/jazyk';

export interface OblastProps {
  jazyk?: Jazyk;
  onJazyk?: (j: Jazyk) => void;
  /** Klasická úprava: „Otvoriť na plátne". */
  naPlatne?: (stranka: Stranka, nazov: string) => void;
}

/** Kontext pre opisy prvkov mimo plátna (bez DOM). */
export function useKontextPrvku(stranka: Stranka, jazyk: Jazyk = 'sk'): KontextPrvku | null {
  const k = useKoncept();
  return useMemo(() => (k.koncept ? { v: k.koncept, r: k.rozriesene, j: jazyk, db: k.kategorieDb, stranka } : null),
    [k.koncept, k.rozriesene, k.kategorieDb, stranka, jazyk]);
}

const DOMOV: Stranka = { druh: 'domov' };
const MENU: Stranka = { druh: 'menu' };

function OtvoritNaPlatne({ naPlatne, stranka, nazov }: { naPlatne?: OblastProps['naPlatne']; stranka: Stranka; nazov: string }) {
  if (!naPlatne) return null;
  return (
    <button type="button" className="abtn vw-otvorit" style={{ padding: '3px 9px', fontSize: 12 }} onClick={() => naPlatne(stranka, nazov)} data-vw-na-platne={nazov}>
      <MapPin className="w-3.5 h-3.5" /> Otvoriť na plátne
    </button>
  );
}

function Skupina({ nadpis, children, akcia }: { nadpis: string; children: ReactNode; akcia?: ReactNode }) {
  return (
    <div className="vw-sekcia-panela">
      <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{nadpis}<span style={{ flex: 1 }} />{akcia}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>
    </div>
  );
}

/* ───────────────────────── Polia prvku (texty, obrázok, viditeľnosť) ───────────────────────── */

export function PoliaPrvku({ opis, jazyk, onJazyk, bezSkrytia }: { opis: OpisPrvku; jazyk?: Jazyk; onJazyk?: (j: Jazyk) => void; bezSkrytia?: boolean }) {
  const k = useKoncept();
  const a = useAkciePrvkov();
  if (!k.koncept) return null;
  const v = k.koncept;
  return (
    <>
      {opis.skryt && !bezSkrytia && (
        <Prepinac popis={`Na webe viditeľné (${opis.skryt.popis})`} hodnota={!opis.skryt.skryty}
                  onZmena={() => k.zmen(opis.skryt!.skryty ? `zobrazenie: ${opis.stitok}` : `skrytie: ${opis.stitok}`, opis.skryt!.prepni)} />
      )}
      {opis.texty.map((t) => (
        <TextovePole key={`${opis.nazov}|${t.pole}`} nazov={t.nazov} text={t.ziskaj(v)} druh={t.druh} limit={t.limit} zaloha={t.zaloha}
                     viacriadkove={t.limit > 200} jazyk={jazyk} onJazyk={onJazyk}
                     onZmena={(j, h) => { void a.zmenText(opis, t, j, h); }} />
      ))}
      {opis.obrazok && (
        <ObrazokPolozky obrazok={opis.obrazok.ziskaj(v)} rozriesene={k.rozriesene} popis={opis.obrazok.nazov}
                        bezObrazka={opis.obrazok.bezObrazka} onVymenit={() => { void a.zmenObrazok(opis); }} />
      )}
    </>
  );
}

/** Polia prvku podľa jeho značky (formulár: rovnaké ako pravý panel). */
function PoliaZnacky({ nazov, stranka, jazyk, onJazyk, naPlatne, nadpis }: OblastProps & { nazov: string; stranka: Stranka; nadpis?: string }) {
  const x = useKontextPrvku(stranka, jazyk);
  const o = x ? opisPrvku(nazov, x) : null;
  if (!o) return null;
  return (
    <div className="vw-formular-prvok">
      <div className="vw-formular-prvok-hlava">{nadpis ?? o.stitok}<OtvoritNaPlatne naPlatne={naPlatne} stranka={stranka} nazov={nazov} /></div>
      <div className="vw-mriezka-poli"><PoliaPrvku opis={o} jazyk={jazyk} onJazyk={onJazyk} /></div>
    </div>
  );
}

/* ───────────────────────── Úvod ───────────────────────── */

export function EditorUvodu(p: OblastProps) {
  return (
    <>
      <PoliaZnacky {...p} stranka={DOMOV} nazov="uvod:nadtitulok" />
      <PoliaZnacky {...p} stranka={DOMOV} nazov="uvod:nadpis" />
      <PoliaZnacky {...p} stranka={DOMOV} nazov="uvod:znak" />
    </>
  );
}

/* ───────────────────────── Dlaždice ───────────────────────── */

export function EditorDlazdic(p: OblastProps & { lenSkupina?: string }) {
  const k = useKoncept();
  const a = useAkciePrvkov();
  const x = useKontextPrvku(DOMOV, p.jazyk);
  if (!k.koncept || !x) return null;
  const v = k.koncept;
  const skupiny = v.domov.dlazdice.skupiny.filter((s) => !p.lenSkupina || s.id === p.lenSkupina);
  return (
    <>
      {!p.lenSkupina && (
        <Prepinac popis="Dlaždice kategórií sú na webe viditeľné" hodnota={v.domov.dlazdice.viditelne}
                  onZmena={(h) => k.zmen(h ? 'zobrazenie dlaždíc' : 'skrytie dlaždíc', (w) => { w.domov.dlazdice.viditelne = h; })} />
      )}
      {skupiny.map((s) => {
        const si = v.domov.dlazdice.skupiny.indexOf(s);
        const opisSkupiny = opisPrvku(`skupina:${s.id}`, x)!;
        return (
          <Skupina key={s.id} nadpis={`Skupina ${si + 1}${s.nadpis?.sk ? ` · ${s.nadpis.sk}` : ''}`}
                   akcia={<OtvoritNaPlatne naPlatne={p.naPlatne} stranka={DOMOV} nazov={`skupina:${s.id}`} />}>
            {si > 0 && (
              <TextovePole nazov="Nadpis skupiny (oddeľovač)" text={s.nadpis} limit={LIMITY.nadpis} jazyk={p.jazyk} onJazyk={p.onJazyk}
                           onZmena={(j, h) => { const t = opisPrvku(`skupina-nadpis:${s.id}`, x)?.texty[0]; if (t) void a.zmenText(opisSkupiny, t, j, h); }} />
            )}
            <ZoznamPoloziek
              polozky={s.polozky.map((d) => {
                const zaz = v.kategorie[indexZaznamu(v, d.kategoria, k.rozriesene)];
                const existuje = !!(d.kategoria.dokument ? k.kategorieDb.some((q) => q.documentId === d.kategoria.dokument) : k.kategorieDb.some((q) => q.slug === d.kategoria.slug));
                return {
                  uid: d.id,
                  nazov: zaz?.popisokDlazdice.sk || slugOdkazu(d.kategoria, k.rozriesene),
                  pod: `/${slugOdkazu(d.kategoria, k.rozriesene)}${d.pocet ? '' : ' · bez počtu'}${existuje ? '' : ' · ZMAZANÁ KATEGÓRIA'}`,
                  obrazok: adresaNahladu(zaz?.obrazok, k.rozriesene, 'thumbnail'),
                  neplatna: !existuje,
                };
              })}
              onPoradie={(z, na) => k.zmen('poradie dlaždíc', (w) => { const q = w.domov.dlazdice.skupiny.find((y) => y.id === s.id); if (q) presunVPoli(q.polozky, z, na); })}
              onOdstranit={(i) => { const o = opisPrvku(`dlazdica:${s.id}:${s.polozky[i].id}`, x); if (o) void a.odstran(o); }}
              onKlik={p.naPlatne ? (i) => p.naPlatne!(DOMOV, `dlazdica:${s.id}:${s.polozky[i].id}`) : undefined}
              akcie={(i) => (
                <button type="button" className="vw-ikona" title={s.polozky[i].pocet ? 'Skryť počet článkov' : 'Ukázať počet článkov'}
                        onClick={() => k.zmen('počet na dlaždici', (w) => { const q = w.domov.dlazdice.skupiny.find((y) => y.id === s.id)?.polozky[i]; if (q) q.pocet = !q.pocet; })}>
                  <span style={{ fontSize: 11, fontWeight: 700 }}>{s.polozky[i].pocet ? '123' : '—'}</span>
                </button>
              )}
            />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" className="vw-pridat" onClick={() => void a.pridaj(opisSkupiny)}><Plus className="w-3.5 h-3.5" /> Pridať dlaždicu</button>
              {opisSkupiny.odstranit && <button type="button" className="vw-pridat" onClick={() => void a.odstran(opisSkupiny)}>Odstrániť skupinu</button>}
            </div>
            {p.naPlatne && s.polozky.map((d) => (
              <PoliaZnacky key={d.id} {...p} stranka={DOMOV} nazov={`dlazdica:${s.id}:${d.id}`} />
            ))}
          </Skupina>
        );
      })}
      {!p.lenSkupina && (
        <button type="button" className="vw-pridat" onClick={() => { const o = opisPrvku('dlazdice', x); if (o) void a.pridaj(o); }}>
          <Plus className="w-3.5 h-3.5" /> Pridať skupinu dlaždíc
        </button>
      )}
    </>
  );
}

/* ───────────────────────── Hľadanie a populárne ───────────────────────── */

export function EditorHladania(p: OblastProps) {
  const k = useKoncept();
  const ui = useEditorUI();
  const a = useAkciePrvkov();
  const x = useKontextPrvku(DOMOV, p.jazyk);
  if (!k.koncept || !x) return null;
  const h = k.koncept.domov.hladanie;
  return (
    <>
      <Prepinac popis="Hľadanie je na webe viditeľné" hodnota={h.viditelne} onZmena={(b) => k.zmen(b ? 'zobrazenie hľadania' : 'skrytie hľadania', (w) => { w.domov.hladanie.viditelne = b; })} />
      <PoliaZnacky {...p} stranka={DOMOV} nazov="hladanie:vyzva" nadpis="Výzva nad hľadaním" />
      <Skupina nadpis="Populárne" akcia={<OtvoritNaPlatne naPlatne={p.naPlatne} stranka={DOMOV} nazov="popularne" />}>
        <Prepinac popis="Populárne sú na webe viditeľné" hodnota={h.popularneViditelne} onZmena={(b) => k.zmen(b ? 'zobrazenie populárnych' : 'skrytie populárnych', (w) => { w.domov.hladanie.popularneViditelne = b; })} />
        <ZoznamPoloziek
          polozky={h.popularne.map((q, i) => ({ uid: `${i}:${klucOdkazu(q.clanok)}`, nazov: q.text.sk, pod: (q.clanok.dokument && k.rozriesene.clanky[q.clanok.dokument]?.sk?.nazov) || q.clanok.slug, neplatna: !!q.clanok.dokument && !k.rozriesene.clanky[q.clanok.dokument]?.sk }))}
          onPoradie={(z, na) => k.zmen('poradie populárnych', (w) => presunVPoli(w.domov.hladanie.popularne, z, na))}
          onOdstranit={(i) => k.zmen('odobratie populárneho', (w) => { w.domov.hladanie.popularne.splice(i, 1); })}
          akcie={(i) => (
            <button type="button" className="vw-ikona" title="Zmeniť článok" onClick={async () => {
              const c = await ui.vyberClanok({ nadpis: 'Kam má odkaz viesť?' });
              if (!c) return;
              k.doplnClanky([c]);
              k.zmen('cieľ populárneho', (w) => { const q = w.domov.hladanie.popularne[i]; if (q) q.clanok = { dokument: c.dokument, slug: c.slug }; });
            }}><FileEdit /></button>
          )}
        />
        {h.popularne.map((q, i) => (
          <TextovePole key={`pop-${i}`} nazov={`Text ${i + 1}. odkazu`} text={q.text} limit={LIMITY.nazov} jazyk={p.jazyk} onJazyk={p.onJazyk}
                       onZmena={(j, hod) => k.zmen(`text populárneho (${j})`, (w) => { const y = w.domov.hladanie.popularne[i]; if (y) y.text = { ...y.text, ...(j === 'sk' ? { sk: hod } : j === 'en' ? { en: hod || null, enZo: hod ? y.text.sk : null } : { de: hod || null, deZo: hod ? y.text.sk : null }) }; })} />
        ))}
        <button type="button" className="vw-pridat" onClick={() => { const o = opisPrvku('popularne', x); if (o) void a.pridaj(o); }}><Plus className="w-3.5 h-3.5" /> Pridať populárne hradisko</button>
      </Skupina>
    </>
  );
}

/* ───────────────────────── Sekcie domovskej ───────────────────────── */

const menoSekcie = (s: SekciaDomov) => (s.typ === 'dalsi-obsah' && s.nadpis?.sk ? s.nadpis.sk : NAZVY_SEKCII[s.typ]);

export function EditorSekcii(p: OblastProps) {
  const k = useKoncept();
  if (!k.koncept) return null;
  const v = k.koncept;
  return (
    <>
      <div className="vw-pomoc">Úvod (nadpis, dlaždice, hľadanie) je vždy prvý a „Pridajte sa k nám“ vždy posledná. Medzi nimi sa sekcie dajú presúvať a skrývať.</div>
      <ZoznamPoloziek
        polozky={v.domov.sekcie.map((s) => ({ uid: s.id, nazov: menoSekcie(s), pod: s.typ === 'dalsi-obsah' ? `${s.riadky.length} riadkov článkov` : s.viditelna ? 'viditeľná' : 'na webe skrytá', skryta: !s.viditelna }))}
        onPoradie={(z, na) => k.zmen(`poradie sekcií`, (w) => presunVPoli(w.domov.sekcie, z, na))}
        onSkryt={(i) => k.zmen(v.domov.sekcie[i].viditelna ? `skrytie sekcie ${menoSekcie(v.domov.sekcie[i])}` : `zobrazenie sekcie ${menoSekcie(v.domov.sekcie[i])}`, (w) => { w.domov.sekcie[i].viditelna = !w.domov.sekcie[i].viditelna; })}
        onKlik={p.naPlatne ? (i) => p.naPlatne!(DOMOV, `sekcia:${v.domov.sekcie[i].id}`) : undefined}
      />
      <Prepinac popis="Sekcia „Pridajte sa k nám“ je na webe viditeľná" hodnota={v.domov.pridajteSa.viditelna}
                onZmena={(b) => k.zmen(b ? 'zobrazenie Pridajte sa' : 'skrytie Pridajte sa', (w) => { w.domov.pridajteSa.viditelna = b; })} />
      {v.domov.sekcie.filter((s) => s.typ === 'dalsi-obsah').length < LIMITY.riadkovClankov && (
        <button type="button" className="vw-pridat" onClick={() => k.zmen('nová sekcia Ďalší obsah', (w) => {
          const id = noveId('dalsi-obsah', w.domov.sekcie.map((s) => s.id));
          w.domov.sekcie.push({ id, typ: 'dalsi-obsah', viditelna: true, nadpis: { sk: 'Ďalší obsah' }, riadky: [] });
        })}><Plus className="w-3.5 h-3.5" /> Pridať sekciu s riadkami článkov</button>
      )}
    </>
  );
}

/* ───────────────────────── Ďalší obsah ───────────────────────── */

const ZORADENIA: { h: ZoradenieClankov; s: string }[] = [
  { h: 'zverejnenie', s: 'podľa zverejnenia na webe (dnes)' },
  { h: 'povodny-datum', s: 'podľa pôvodného dátumu' },
  { h: 'abecedne', s: 'abecedne' },
];

export function EditorDalsiehoObsahu(p: OblastProps & { sekciaId: string; lenRiadok?: string }) {
  const k = useKoncept();
  const ui = useEditorUI();
  const a = useAkciePrvkov();
  const x = useKontextPrvku(DOMOV, p.jazyk);
  if (!k.koncept || !x) return null;
  const v = k.koncept;
  const najdena = v.domov.sekcie.find((q) => q.id === p.sekciaId);
  if (!najdena || najdena.typ !== 'dalsi-obsah') return null;
  const s = najdena;
  const nastavRiadok = (rid: string, popis: string, fn: (rr: RiadokClankov) => void) =>
    k.zmen(popis, (w) => { const q = w.domov.sekcie.find((y) => y.id === s.id); if (q && q.typ === 'dalsi-obsah') { const rr = q.riadky.find((y) => y.id === rid); if (rr) fn(rr); } });
  const riadky = s.riadky.filter((rr) => !p.lenRiadok || rr.id === p.lenRiadok);
  return (
    <>
      {!p.lenRiadok && (
        <>
          <Prepinac popis="Sekcia je na webe viditeľná" hodnota={s.viditelna} onZmena={(b) => k.zmen(b ? 'zobrazenie sekcie' : 'skrytie sekcie', (w) => { const q = w.domov.sekcie.find((y) => y.id === s.id); if (q) q.viditelna = b; })} />
          <PoliaZnacky {...p} stranka={DOMOV} nazov={`dalsi-obsah:nadpis:${s.id}`} nadpis="Nadpis sekcie" />
          <Skupina nadpis="Riadky">
            <ZoznamPoloziek
              polozky={s.riadky.map((rr) => ({ uid: rr.id, nazov: rr.nadpis?.sk || k.kategorieDb.find((q) => q.documentId === rr.kategoria.dokument)?.name || rr.kategoria.slug, pod: `${rr.vyber === 'rucne' ? 'vybrané ručne' : 'najnovšie'} · ${rr.pocet} článkov` }))}
              onPoradie={(z, na) => k.zmen('poradie riadkov', (w) => { const q = w.domov.sekcie.find((y) => y.id === s.id); if (q && q.typ === 'dalsi-obsah') presunVPoli(q.riadky, z, na); })}
              onOdstranit={(i) => { const o = opisPrvku(`riadok:${s.id}:${s.riadky[i].id}`, x); if (o) void a.odstran(o); }}
              onKlik={p.naPlatne ? (i) => p.naPlatne!(DOMOV, `riadok:${s.id}:${s.riadky[i].id}`) : undefined}
            />
            {s.riadky.length < LIMITY.riadkovClankov && (
              <button type="button" className="vw-pridat" onClick={() => { const o = opisPrvku(`sekcia:${s.id}`, x); if (o) void a.pridaj(o); }}><Plus className="w-3.5 h-3.5" /> Pridať riadok článkov</button>
            )}
          </Skupina>
        </>
      )}
      {(p.lenRiadok || p.naPlatne) && riadky.map((rr) => (
        <div key={rr.id} className="vw-formular-prvok" data-vw-riadok-panel={rr.id}>
          <div className="vw-formular-prvok-hlava">Riadok · {rr.nadpis?.sk || rr.kategoria.slug}<OtvoritNaPlatne naPlatne={p.naPlatne} stranka={DOMOV} nazov={`riadok:${s.id}:${rr.id}`} /></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <VyberKategorie popis="Kategória" kategorie={k.kategorieDb} hodnota={rr.kategoria.dokument}
                            onZmena={(kat) => nastavRiadok(rr.id, 'kategória riadka', (y) => { y.kategoria = { dokument: kat.documentId, slug: kat.slug }; y.clanky = []; y.obrazky = []; })} />
            <TextovePole nazov="Nadpis riadka (prázdny = názov kategórie)" text={rr.nadpis} limit={LIMITY.nadpis} jazyk={p.jazyk} onJazyk={p.onJazyk}
                         zaloha={k.kategorieDb.find((q) => q.documentId === rr.kategoria.dokument)?.name}
                         onZmena={(j, h) => { const o = opisPrvku(`riadok-nadpis:${s.id}:${rr.id}`, x); const t = o?.texty[0]; if (o && t) void a.zmenText(o, t, j, h); }} />
            <div className="vw-riadok-poli">
              <Vyber popis="Počet článkov" hodnota={rr.pocet} moznosti={[1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({ h: n, s: String(n) }))}
                     onZmena={(n) => nastavRiadok(rr.id, 'počet článkov', (y) => { y.pocet = n; })} />
              <Vyber popis="Ktoré články" hodnota={rr.vyber} moznosti={[{ h: 'najnovsie', s: 'najnovšie' }, { h: 'rucne', s: 'vybrané ručne' }]}
                     onZmena={(b) => nastavRiadok(rr.id, b === 'rucne' ? 'ručný výber článkov' : 'najnovšie články', (y) => { y.vyber = b; })} />
            </div>
            <Vyber popis="Zoradenie" hodnota={rr.zoradenie} moznosti={ZORADENIA} onZmena={(z) => nastavRiadok(rr.id, 'zoradenie riadka', (y) => { y.zoradenie = z; })} />
            <Prepinac popis="Len články s titulnou fotkou" hodnota={rr.lenSObrazkom} onZmena={(b) => nastavRiadok(rr.id, 'len s obrázkom', (y) => { y.lenSObrazkom = b; })} />
            {rr.vyber === 'rucne' && (
              <Skupina nadpis={`Vybrané články (${rr.clanky.length})`}>
                <ZoznamPoloziek
                  polozky={rr.clanky.map((c) => ({ uid: klucOdkazu(c), nazov: (c.dokument && k.rozriesene.clanky[c.dokument]?.sk?.nazov) || c.slug, neplatna: !!c.dokument && !k.rozriesene.clanky[c.dokument]?.sk }))}
                  prazdny="Zatiaľ nič — riadok ukáže najnovšie články, kým nevyberiete."
                  onPoradie={(z, na) => nastavRiadok(rr.id, 'poradie vybraných článkov', (y) => presunVPoli(y.clanky, z, na))}
                  onOdstranit={(i) => nastavRiadok(rr.id, 'odobratie článku z riadka', (y) => { y.clanky.splice(i, 1); })}
                />
                {rr.clanky.length < LIMITY.clankovVRiadku && (
                  <button type="button" className="vw-pridat" data-vw-pridat-clanok-riadka={rr.id} onClick={async () => {
                    const c = await ui.vyberClanok({ nadpis: 'Pridať článok do riadka', kategoria: slugOdkazu(rr.kategoria, k.rozriesene), vylucit: rr.clanky.map((q) => q.dokument ?? '') });
                    if (!c) return;
                    k.doplnClanky([c]);
                    nastavRiadok(rr.id, 'pridanie článku do riadka', (y) => { if (!y.clanky.some((q) => q.dokument === c.dokument)) y.clanky.push({ dokument: c.dokument, slug: c.slug }); if (y.pocet < y.clanky.length) y.pocet = y.clanky.length; });
                  }}><Plus className="w-3.5 h-3.5" /> Pridať článok</button>
                )}
              </Skupina>
            )}
            {rr.obrazky.length > 0 && (
              <Skupina nadpis="Iné obrázky na dlaždiciach">
                <ZoznamPoloziek polozky={rr.obrazky.map((o) => ({ uid: klucOdkazu(o.clanok), nazov: (o.clanok.dokument && k.rozriesene.clanky[o.clanok.dokument]?.sk?.nazov) || o.clanok.slug, obrazok: adresaNahladu(o.obrazok, k.rozriesene, 'thumbnail') }))}
                                onOdstranit={(i) => nastavRiadok(rr.id, 'pôvodný obrázok článku', (y) => { y.obrazky.splice(i, 1); })} />
              </Skupina>
            )}
          </div>
        </div>
      ))}
    </>
  );
}

/* ───────────────────────── Činnosť ───────────────────────── */

export function EditorCinnosti(p: OblastProps & { lenKluc?: string }) {
  const k = useKoncept();
  if (!k.koncept) return null;
  const c = k.koncept.cinnost;
  const sekcia = k.koncept.domov.sekcie.find((s) => s.typ === 'cinnost');
  const polozky = c.polozky.filter((q) => !p.lenKluc || q.kluc === p.lenKluc);
  const nastav = (kluc: string, popis: string, fn: (q: (typeof c.polozky)[number]) => void) =>
    k.zmen(popis, (w) => { const q = w.cinnost.polozky.find((y) => y.kluc === kluc); if (q) fn(q); });
  return (
    <>
      {!p.lenKluc && (
        <>
          {sekcia && <Prepinac popis="Sekcia je na domovskej viditeľná" hodnota={sekcia.viditelna} onZmena={(b) => k.zmen(b ? 'zobrazenie činnosti' : 'skrytie činnosti', (w) => { const q = w.domov.sekcie.find((y) => y.id === sekcia.id); if (q) q.viditelna = b; })} />}
          <PoliaZnacky {...p} stranka={DOMOV} nazov="cinnost:nadpis" nadpis="Nadpis sekcie" />
          <ZoznamPoloziek
            polozky={c.polozky.map((q) => ({ uid: q.kluc, nazov: q.nazov.sk, pod: !q.viditelna ? 'skrytá všade' : q.naDomovskej ? 'aj na domovskej' : 'len pod článkami a v kronike', skryta: !q.viditelna || !q.naDomovskej, obrazok: adresaNahladu(q.obrazok, k.rozriesene, 'thumbnail') }))}
            onPoradie={(z, na) => k.zmen('poradie činností', (w) => presunVPoli(w.cinnost.polozky, z, na))}
            onSkryt={(i) => nastav(c.polozky[i].kluc, 'činnosť na domovskej', (q) => { q.naDomovskej = !q.naDomovskej; if (q.naDomovskej) q.viditelna = true; })}
            onKlik={p.naPlatne ? (i) => p.naPlatne!(DOMOV, `cinnost:${c.polozky[i].kluc}`) : undefined}
          />
          <div className="vw-pomoc">Očko = viditeľnosť na domovskej. Kľúče činností sú pevné ({KLUCE_CINNOSTI.length}) — triedenie kroniky podľa činnosti ostáva v kóde.</div>
        </>
      )}
      {(p.lenKluc || p.naPlatne) && polozky.map((q) => (
        <div key={q.kluc}>
          <PoliaZnacky {...p} stranka={DOMOV} nazov={`cinnost:${q.kluc}`} />
          <Prepinac popis="Ukázať všade (domovská, pod článkami, aktuality)" hodnota={q.viditelna} onZmena={(b) => nastav(q.kluc, b ? 'zobrazenie činnosti' : 'skrytie činnosti všade', (y) => { y.viditelna = b; })} />
          <Prepinac popis="Ukázať aj na domovskej" hodnota={q.naDomovskej} onZmena={(b) => nastav(q.kluc, 'činnosť na domovskej', (y) => { y.naDomovskej = b; })} />
        </div>
      ))}
    </>
  );
}

/* ───────────────────────── Kronika ───────────────────────── */

export function EditorKroniky(p: OblastProps) {
  const k = useKoncept();
  const ui = useEditorUI();
  const a = useAkciePrvkov();
  const x = useKontextPrvku(DOMOV, p.jazyk);
  if (!k.koncept || !x) return null;
  const v = k.koncept;
  const najdena = v.domov.sekcie.find((q) => q.typ === 'kronika');
  if (!najdena || najdena.typ !== 'kronika') return <div className="vw-pomoc">Kronika na domovskej nie je.</div>;
  const s = najdena;
  const nastav = (popis: string, fn: (q: Extract<SekciaDomov, { typ: 'kronika' }>) => void) => k.zmen(popis, (w) => { const q = w.domov.sekcie.find((y) => y.id === s.id); if (q && q.typ === 'kronika') fn(q); });
  const menoCl = (d: string | null, slug: string) => (d && k.rozriesene.clanky[d]?.sk?.nazov) || slug;
  const fotky = v.domov.fotogaleria?.fotky ?? [];
  return (
    <>
      <Prepinac popis="Sekcia je na webe viditeľná" hodnota={s.viditelna} onZmena={(b) => nastav(b ? 'zobrazenie kroniky' : 'skrytie kroniky', (q) => { q.viditelna = b; })} />
      <Skupina nadpis="Úvodný článok" akcia={<OtvoritNaPlatne naPlatne={p.naPlatne} stranka={DOMOV} nazov="kronika:uvod" />}>
        <div className="vw-pomoc"><b>{s.uvodnyClanok ? menoCl(s.uvodnyClanok.dokument, s.uvodnyClanok.slug) : 'bez úvodného článku'}</b></div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className="vw-pridat" onClick={async () => {
            const c = await ui.vyberClanok({ nadpis: 'Úvodný článok kroniky', kategoria: 'aktuality' });
            if (!c) return;
            k.doplnClanky([c]);
            nastav('úvodný článok kroniky', (q) => { q.uvodnyClanok = { dokument: c.dokument, slug: c.slug }; });
          }}>Zmeniť</button>
          {s.uvodnyClanok && <button type="button" className="vw-pridat" onClick={() => nastav('bez úvodného článku', (q) => { q.uvodnyClanok = null; })}>Bez úvodného článku</button>}
          {s.uvodnyClanok?.dokument && <button type="button" className="vw-pridat" onClick={() => ui.upravitClanok(s.uvodnyClanok!.dokument!)}><ExternalLink className="w-3.5 h-3.5" /> Upraviť článok</button>}
        </div>
      </Skupina>
      <Skupina nadpis={`Pripnuté zápisy (${s.pripnute.length})`}>
        <ZoznamPoloziek
          polozky={s.pripnute.map((c) => ({ uid: klucOdkazu(c), nazov: menoCl(c.dokument, c.slug), neplatna: !!c.dokument && !k.rozriesene.clanky[c.dokument]?.sk }))}
          prazdny="Žiadne — pás ide podľa dátumu."
          onPoradie={(z, na) => nastav('poradie pripnutých', (q) => presunVPoli(q.pripnute, z, na))}
          onOdstranit={(i) => nastav('odopnutie zápisu', (q) => { q.pripnute.splice(i, 1); })}
        />
        {s.pripnute.length < LIMITY.pripnutych && (
          <button type="button" className="vw-pridat" data-vw-pripnut-zapis onClick={async () => {
            const c = await ui.vyberClanok({ nadpis: 'Pripnúť zápis kroniky', kategoria: 'aktuality', vylucit: s.pripnute.map((q) => q.dokument ?? '') });
            if (!c) return;
            k.doplnClanky([c]);
            nastav('pripnutie zápisu', (q) => { if (!q.pripnute.some((y) => y.dokument === c.dokument)) q.pripnute.push({ dokument: c.dokument, slug: c.slug }); });
          }}><Plus className="w-3.5 h-3.5" /> Pripnúť zápis</button>
        )}
      </Skupina>
      <PoliaZnacky {...p} stranka={DOMOV} nazov="kronika:obrazok" nadpis="Obrázok vľavo" />
      <Skupina nadpis="Vybraná fotogaléria" akcia={<OtvoritNaPlatne naPlatne={p.naPlatne} stranka={DOMOV} nazov="kronika:fotogaleria" />}>
        <Prepinac popis="Fotogaléria je na webe viditeľná" hodnota={s.fotogaleriaViditelna} onZmena={(b) => nastav(b ? 'zobrazenie fotogalérie' : 'skrytie fotogalérie', (q) => { q.fotogaleriaViditelna = b; })} />
        {v.domov.fotogaleria ? (
          <>
            <ZoznamPoloziek
              polozky={fotky.map((id, i) => ({ uid: String(id), nazov: `${i + 1}. fotka${i === 0 ? ' (veľká)' : ''}`, pod: `súbor č. ${id}`, obrazok: adresaNahladu({ id }, k.rozriesene, 'thumbnail'), neplatna: !k.rozriesene.subory[String(id)] }))}
              onPoradie={(z, na) => k.zmen('poradie fotiek galérie', (w) => { if (w.domov.fotogaleria) presunVPoli(w.domov.fotogaleria.fotky, z, na); })}
              onOdstranit={(i) => k.zmen('odobratie fotky z galérie', (w) => { w.domov.fotogaleria?.fotky.splice(i, 1); })}
            />
            {fotky.length < LIMITY.fotiekGalerie && (
              <button type="button" className="vw-pridat" onClick={() => { const o = opisPrvku('kronika:fotogaleria', x); if (o) void a.pridaj(o); }}><Plus className="w-3.5 h-3.5" /> Pridať fotku</button>
            )}
            <div className="vw-pomoc">Prvá fotka je veľká. Zverejnenie výber zapíše aj do „Domovskej galérie“ v databáze (vidia ju staré verzie webu).</div>
          </>
        ) : (
          <div className="vw-pomoc">Výber fotiek je v databáze („Domovská galéria“), vzhľad ho nemení.
            {' '}<button type="button" className="vw-pridat" onClick={() => k.zmen('výber fotogalérie vo vzhľade', (w) => { w.domov.fotogaleria = { fotky: [...(k.server?.db.fotogaleria ?? [])] }; })}>Upravovať vo vzhľade</button>
          </div>
        )}
      </Skupina>
    </>
  );
}

/* ───────────────────────── Pridajte sa ───────────────────────── */

export function EditorPridajteSa(p: OblastProps) {
  const k = useKoncept();
  const a = useAkciePrvkov();
  const x = useKontextPrvku(DOMOV, p.jazyk);
  if (!k.koncept || !x) return null;
  const ps = k.koncept.domov.pridajteSa;
  return (
    <>
      <Prepinac popis="Sekcia je na webe viditeľná" hodnota={ps.viditelna} onZmena={(b) => k.zmen(b ? 'zobrazenie Pridajte sa' : 'skrytie Pridajte sa', (w) => { w.domov.pridajteSa.viditelna = b; })} />
      {(['nadtitulok', 'nadpis', 'citat', 'uvod', 'email'] as const).map((pole) => <PoliaZnacky key={pole} {...p} stranka={DOMOV} nazov={`pridajte-sa:${pole}`} />)}
      <Skupina nadpis={`Prosby (${ps.prosby.length})`}>
        <ZoznamPoloziek polozky={ps.prosby.map((q, i) => ({ uid: String(i), nazov: q.nadpis.sk }))}
                        onPoradie={(z, na) => k.zmen('poradie prosieb', (w) => presunVPoli(w.domov.pridajteSa.prosby, z, na))}
                        onOdstranit={(i) => { const o = opisPrvku(`pridajte-sa:prosba:${i}`, x); if (o) void a.odstran(o); }} />
        {ps.prosby.map((_, i) => <PoliaZnacky key={i} {...p} stranka={DOMOV} nazov={`pridajte-sa:prosba:${i}`} />)}
        {ps.prosby.length < LIMITY.prosieb && <button type="button" className="vw-pridat" onClick={() => { const o = opisPrvku('pridajte-sa', x); if (o) void a.pridaj(o); }}><Plus className="w-3.5 h-3.5" /> Pridať prosbu</button>}
      </Skupina>
    </>
  );
}

/* ───────────────────────── Stránka kategórie ───────────────────────── */

export function EditorKategorie(p: OblastProps & { slug: string }) {
  const k = useKoncept();
  const ui = useEditorUI();
  const stranka = useMemo<Stranka>(() => ({ druh: 'kategoria', slug: p.slug }), [p.slug]);
  const x = useKontextPrvku(stranka, p.jazyk);
  if (!k.koncept || !x) return null;
  const v = k.koncept;
  const kat = k.kategorieDb.find((q) => q.slug === p.slug);
  if (!kat) return <div className="vw-upozornenie je-cervene">Kategória /{p.slug} v databáze nie je (zmazaná alebo premenovaný slug).</div>;
  const odkaz = { dokument: kat.documentId, slug: kat.slug };
  const zaz = v.kategorie[indexZaznamu(v, odkaz, k.rozriesene)];
  const nastav = (popis: string, fn: (z: NonNullable<typeof zaz>) => void) => k.zmen(popis, (w) => fn(zaznamKategorie(w, odkaz, k.rozriesene, k.kategorieDb)));
  return (
    <>
      <div className="vw-pomoc">Adresa <b>/category/{kat.slug}</b> — slug sa tu nemení (visia na ňom odkazy, presmerovania, appka); mení sa na obrazovke Kategórie.</div>
      {!zaz && (
        <div className="vw-upozornenie je-modre">
          <span>Kategória ešte nemá záznam vo vzhľade — web berie popisok a obrázok z kódu alebo z databázy.</span>
          <button type="button" className="abtn" onClick={() => k.zmen(`záznam vzhľadu ${kat.name}`, (w) => { if (indexZaznamu(w, odkaz, k.rozriesene) < 0) w.kategorie.push(zaznamNovejKategorie(kat, prekladZoSlovnika) as never); })}>Pridať</button>
        </div>
      )}
      <PoliaZnacky {...p} stranka={stranka} nazov="kategoria:nazov" nadpis="Názov (nadpis stránky, menu, päta)" />
      <PoliaZnacky {...p} stranka={stranka} nazov="kategoria:popis" nadpis="Popis na stránke kategórie" />
      <PoliaZnacky {...p} stranka={stranka} nazov="kategoria:obrazok" nadpis="Obrázok (hlavička, dlaždica, lišta)" />
      <PoliaZnacky {...p} stranka={stranka} nazov={`lista:${kat.slug}`} nadpis="Popisok dlaždice a lišty" />
      {zaz && (
        <>
          <TextovePole nazov="Krátky názov v menu (prázdny = celý názov)" text={zaz.popisokMenu} druh="volitelny" limit={LIMITY.popisokMenu} jazyk={p.jazyk} onJazyk={p.onJazyk}
                       zaloha={zaz.nazov?.sk || kat.name}
                       onZmena={(j, h) => { const o = opisPrvku(`menu:${kat.slug}`, x); const t = o?.texty[0]; if (o && t) k.zmen(`krátky názov (${j})`, (w) => t.nastav(w, j, h)); }} />
          {zaz.tvary && (
            <label className="vw-pole">
              <span className="vw-pole-nazov">Tvary počtu pod dlaždicou (1 · 2–4 · 5+)</span>
              <input className="afld" defaultValue={zaz.tvary.sk.join(', ')} onBlur={(e) => {
                const t = e.target.value.split(',').map((q) => q.trim());
                if (t.length === 3 && t.every(Boolean)) nastav('tvary počtu', (z) => { if (z.tvary) z.tvary.sk = t as [string, string, string]; });
              }} />
            </label>
          )}
          <Vyber popis="Zoradenie článkov na stránke" hodnota={zaz.clanky.zoradenie} moznosti={ZORADENIA} onZmena={(z) => nastav('zoradenie článkov kategórie', (q) => { q.clanky.zoradenie = z; })} />
          <Skupina nadpis={`Pripnuté články (${zaz.clanky.pripnute.length})`}>
            <ZoznamPoloziek
              polozky={zaz.clanky.pripnute.map((c) => ({ uid: klucOdkazu(c), nazov: (c.dokument && k.rozriesene.clanky[c.dokument]?.sk?.nazov) || c.slug }))}
              prazdny="Žiadne — zoznam ide podľa zoradenia."
              onPoradie={(z, na) => nastav('poradie pripnutých článkov', (q) => presunVPoli(q.clanky.pripnute, z, na))}
              onOdstranit={(i) => nastav('odopnutie článku', (q) => { q.clanky.pripnute.splice(i, 1); })}
            />
            {zaz.clanky.pripnute.length < LIMITY.pripnutych && (
              <button type="button" className="vw-pridat" onClick={async () => {
                const c = await ui.vyberClanok({ nadpis: 'Pripnúť článok na začiatok', kategoria: kat.slug, vylucit: zaz.clanky.pripnute.map((q) => q.dokument ?? '') });
                if (!c) return;
                k.doplnClanky([c]);
                nastav('pripnutie článku', (q) => { if (!q.clanky.pripnute.some((y) => y.dokument === c.dokument)) q.clanky.pripnute.push({ dokument: c.dokument, slug: c.slug }); });
              }}><Plus className="w-3.5 h-3.5" /> Pripnúť článok</button>
            )}
          </Skupina>
        </>
      )}
    </>
  );
}

/* ───────────────────────── Menu ───────────────────────── */

export function EditorMenu(p: OblastProps & { lenSlug?: string }) {
  const k = useKoncept();
  if (!k.koncept) return null;
  const v = k.koncept;
  const { hlavny, dalsi } = radyMenu(v, k.rozriesene, k.kategorieDb);
  const skryte = new Set(v.menu.skryte.map((o) => o.dokument ?? o.slug));
  const menoKat = (kat: (typeof hlavny)[number]) => v.kategorie[indexZaznamu(v, { dokument: kat.documentId, slug: kat.slug }, k.rozriesene)]?.nazov?.sk || kat.name;
  const zmenRady = (popis: string, fn: (h: typeof hlavny, d: typeof dalsi) => void) => k.zmen(popis, (w) => {
    const r = radyMenu(w, k.rozriesene, k.kategorieDb);
    fn(r.hlavny, r.dalsi);
    nastavRadyMenu(w, r.hlavny, r.dalsi);
  });
  const rad = (nazov: string, polozky: typeof hlavny, hlavnyRad: boolean) => (
    <Skupina nadpis={nazov} akcia={<OtvoritNaPlatne naPlatne={p.naPlatne} stranka={MENU} nazov={hlavnyRad ? 'menu:hlavny' : 'menu:dalsi'} />}>
      <ZoznamPoloziek
        polozky={polozky.map((kat) => ({ uid: kat.documentId, nazov: menoKat(kat), pod: `/${kat.slug}${skryte.has(kat.documentId) || skryte.has(kat.slug) ? ' · v menu skrytá' : ''}`, skryta: skryte.has(kat.documentId) || skryte.has(kat.slug) }))}
        prazdny="Riadok je prázdny."
        onPoradie={(z, na) => zmenRady(`poradie menu`, (h, d) => presunVPoli(hlavnyRad ? h : d, z, na))}
        onSkryt={(i) => k.zmen('skrytie kategórie v menu', (w) => {
          if (!w.menu.poradie.length) { const r = radyMenu(w, k.rozriesene, k.kategorieDb); nastavRadyMenu(w, r.hlavny, r.dalsi); }
          const kat = polozky[i];
          const je = w.menu.skryte.some((o) => o.dokument === kat.documentId || o.slug === kat.slug);
          w.menu.skryte = je ? w.menu.skryte.filter((o) => o.dokument !== kat.documentId && o.slug !== kat.slug) : [...w.menu.skryte, { dokument: kat.documentId, slug: kat.slug }];
          if (!je) w.menu.hlavnyRiadok = w.menu.hlavnyRiadok.filter((o) => o.dokument !== kat.documentId && o.slug !== kat.slug);
        })}
        onKlik={p.naPlatne ? (i) => p.naPlatne!(MENU, `menu:${polozky[i].slug}`) : undefined}
        akcie={(i) => (
          <button type="button" className="vw-ikona" title={hlavnyRad ? 'Presunúť do druhého riadku' : 'Presunúť do hlavného riadku'} data-vw-menu-rad={polozky[i].slug}
                  onClick={() => zmenRady(hlavnyRad ? 'kategória do druhého riadku' : 'kategória do hlavného riadku', (h, d) => {
                    const [kat] = (hlavnyRad ? h : d).splice(i, 1);
                    if (kat) (hlavnyRad ? d : h).push(kat);
                  })}>
            <span style={{ fontSize: 11, fontWeight: 700 }}>{hlavnyRad ? '2.' : '1.'}</span>
          </button>
        )}
      />
    </Skupina>
  );
  return (
    <>
      <div className="vw-pomoc">Poradie sa pri zverejnení zapíše do databázy (10, 20, 30 …), takže ho uvidia aj staré verzie webu a appka. Krátke názvy sú pri kategórii (pravý panel po kliknutí na kategóriu v menu).</div>
      {rad('Hlavný riadok (typy hradísk)', hlavny, true)}
      {rad('Druhý riadok (ďalší obsah)', dalsi, false)}
      <button type="button" className="vw-pridat" onClick={() => k.zmen('zoradenie menu podľa dlaždíc', (w) => {
        const r = radyMenu(w, k.rozriesene, k.kategorieDb);
        const poradieDlazdic = w.domov.dlazdice.skupiny.flatMap((s) => s.polozky.map((d) => slugOdkazu(d.kategoria, k.rozriesene)));
        const miesto = (slug: string) => { const i = poradieDlazdic.indexOf(slug); return i < 0 ? 999 : i; };
        r.hlavny.sort((a2, b2) => miesto(a2.slug) - miesto(b2.slug));
        r.dalsi.sort((a2, b2) => miesto(a2.slug) - miesto(b2.slug));
        nastavRadyMenu(w, r.hlavny, r.dalsi);
      })}>Zoradiť menu podľa dlaždíc</button>
      {p.lenSlug && <PoliaZnacky {...p} stranka={MENU} nazov={`menu:${p.lenSlug}`} />}
    </>
  );
}

/* ───────────────────────── Päta ───────────────────────── */

export function EditorPaty(p: OblastProps & { lenStlpec?: string }) {
  const k = useKoncept();
  const ui = useEditorUI();
  if (!k.koncept) return null;
  const v = k.koncept;
  const stlpce = v.pata.stlpce.filter((s) => !p.lenStlpec || s.id === p.lenStlpec);
  return (
    <>
      {!p.lenStlpec && (
        <ZoznamPoloziek
          polozky={v.pata.stlpce.map((s) => ({ uid: s.id, nazov: s.nadpis.sk, pod: `${s.odkazy.length} odkazov` }))}
          onPoradie={(z, na) => k.zmen('poradie stĺpcov päty', (w) => presunVPoli(w.pata.stlpce, z, na))}
          onOdstranit={(i) => k.zmen('odstránenie stĺpca päty', (w) => { w.pata.stlpce.splice(i, 1); })}
          onKlik={p.naPlatne ? (i) => p.naPlatne!(MENU, `pata:stlpec:${v.pata.stlpce[i].id}`) : undefined}
        />
      )}
      {stlpce.map((s) => (
        <Skupina key={s.id} nadpis={`Stĺpec · ${s.nadpis.sk}`} akcia={<OtvoritNaPlatne naPlatne={p.naPlatne} stranka={MENU} nazov={`pata:stlpec:${s.id}`} />}>
          <TextovePole nazov="Nadpis stĺpca" text={s.nadpis} limit={LIMITY.nadpis} jazyk={p.jazyk} onJazyk={p.onJazyk}
                       onZmena={(j, h) => k.zmen(`nadpis stĺpca (${j})`, (w) => { const q = w.pata.stlpce.find((y) => y.id === s.id); if (q) q.nadpis = { ...q.nadpis, ...(j === 'sk' ? { sk: h } : j === 'en' ? { en: h || null, enZo: h ? q.nadpis.sk : null } : { de: h || null, deZo: h ? q.nadpis.sk : null }) }; })} />
          <ZoznamPoloziek
            polozky={s.odkazy.map((o, i) => ({ uid: `${i}`, nazov: o.text.sk, pod: o.ciel.druh === 'kategoria' ? `kategória /${slugOdkazu(o.ciel.kategoria, k.rozriesene)}` : o.ciel.druh === 'clanok' ? `článok ${o.ciel.clanok.slug}` : o.ciel.druh === 'cesta' ? o.ciel.cesta : o.ciel.url }))}
            onPoradie={(z, na) => k.zmen('poradie odkazov päty', (w) => { const q = w.pata.stlpce.find((y) => y.id === s.id); if (q) presunVPoli(q.odkazy, z, na); })}
            onOdstranit={(i) => k.zmen('odstránenie odkazu päty', (w) => { w.pata.stlpce.find((y) => y.id === s.id)?.odkazy.splice(i, 1); })}
          />
          {s.odkazy.map((o, i) => (
            <div key={i} className="vw-formular-prvok">
              <TextovePole nazov={`Text ${i + 1}. odkazu`} text={o.text} limit={LIMITY.nazov} jazyk={p.jazyk} onJazyk={p.onJazyk}
                           onZmena={(j, h) => k.zmen(`text odkazu (${j})`, (w) => { const q = w.pata.stlpce.find((y) => y.id === s.id)?.odkazy[i]; if (q) q.text = { ...q.text, ...(j === 'sk' ? { sk: h } : j === 'en' ? { en: h || null, enZo: h ? q.text.sk : null } : { de: h || null, deZo: h ? q.text.sk : null }) }; })} />
              <CielOdkazu ciel={o.ciel} kategorie={k.kategorieDb} rozriesene={k.rozriesene}
                          onZmena={(c) => k.zmen('cieľ odkazu päty', (w) => { const q = w.pata.stlpce.find((y) => y.id === s.id)?.odkazy[i]; if (q) q.ciel = c; })} />
            </div>
          ))}
          {s.odkazy.length < LIMITY.odkazovVStlpci && (
            <button type="button" className="vw-pridat" onClick={async () => {
              const c = await ui.vyberCiel({ nadpis: `Nový odkaz v stĺpci ${s.nadpis.sk}` });
              if (c) k.zmen('nový odkaz v päte', (w) => { w.pata.stlpce.find((y) => y.id === s.id)?.odkazy.push({ text: { sk: c.text }, ciel: c.ciel }); });
            }}><Plus className="w-3.5 h-3.5" /> Pridať odkaz</button>
          )}
        </Skupina>
      ))}
      {!p.lenStlpec && v.pata.stlpce.length < LIMITY.stlpcovPaty && (
        <button type="button" className="vw-pridat" onClick={() => k.zmen('nový stĺpec päty', (w) => {
          w.pata.stlpce.push({ id: noveId('stlpec', w.pata.stlpce.map((s) => s.id)), nadpis: { sk: 'Nový stĺpec' }, odkazy: [] });
        })}><Plus className="w-3.5 h-3.5" /> Pridať stĺpec</button>
      )}
      {!p.lenStlpec && (
        <Skupina nadpis="Siete">
          {v.pata.siete.map((s, i) => (
            <TextovePole key={s.druh} nazov={s.druh} text={s.url} druh="retazec" limit={LIMITY.url}
                         onZmena={(_j, h) => { if (h.trim()) k.zmen(`adresa ${s.druh}`, (w) => { if (w.pata.siete[i]) w.pata.siete[i].url = h.trim(); }); }} />
          ))}
        </Skupina>
      )}
    </>
  );
}

/* ───────────────────────── Pomocné pre panel ───────────────────────── */

export function skupinaZoZnacky(nazov: string, v: Vzhlad): string | null {
  const c = nazov.split(':');
  if (c[0] === 'dlazdica' || c[0] === 'skupina' || c[0] === 'skupina-nadpis') return c[1];
  void v;
  return null;
}
