'use client';

/**
 * NÁSTROJ NA PRIPOMIENKY — kliknem na prvok, napíšem poznámku.
 *
 * Napísať pripomienku môže KTOKOĽVEK, kto má odkaz na stránku. Prihlásený
 * redaktor má navyše zmenu stavu, mazanie a odkaz do administrácie — a keby
 * si niekto ten príznak v prehliadači podvrhol, server mu tie akcie odmietne.
 * Nástroj sa načíta až po kliknutí na plávajúce tlačidlo (`PripomienkyDock`).
 *
 * Tri časti:
 *   • REŽIM VÝBERU — prvok pod kurzorom sa orámuje, klik otvorí bublinu.
 *   • ŠPENDLÍKY — očíslované body existujúcich pripomienok na tejto stránke.
 *   • PANEL — zoznam vpravo, zmena stavu, mazanie a export pre vývojára.
 *
 * Vrstva je nad všetkým ostatným (z-index 10000, nad cookie lištou 9999).
 * Pozor: `globals.css` vynucuje `pointer-events: auto` na každom `div`, preto
 * všetko, cez čo sa musí dať kliknúť, nosí triedu `pointer-events-none`.
 */

import { t } from '../lib/jazyk';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { X, MousePointerClick, Check, Trash2, Copy, MapPin, AlertTriangle, FileText } from 'lucide-react';
import { kotvaPre, kotvaVolna, najdiPodlaKotvy, popisPrvku, type Kotva } from './kotva';
import { preStranku, jedna, pridaj, zmenStav, zmaz, jeRedaktor, type Druh, type Pripomienka, type Stav } from './api';
import '../styles/pripomienky.css';

interface Ramik { top: number; left: number; width: number; height: number }

/** Adresa stránky bez parametra `pripomienka` — pod ňou sa pripomienky ukladajú. */
const cestaStranky = () => {
  const u = new URL(window.location.href);
  u.searchParams.delete('pripomienka');
  return u.pathname + (u.search || '');
};

/** Obdĺžnik prvku v súradniciach DOKUMENTU, nie okna — špendlík sa potom
 *  neposúva pri rolovaní. */
const ramikPre = (el: Element): Ramik => {
  const r = el.getBoundingClientRect();
  return { top: r.top + window.scrollY, left: r.left + window.scrollX, width: r.width, height: r.height };
};

/* Mená stavov sa prekladajú pri vykreslení (`t`), nie tu — modul sa
   vyhodnotí raz, ešte kým je známy jazyk stránky. */
const STAVY: Record<Stav, string> = {
  nova: 'Nová',
  'riesi-sa': 'Rieši sa',
  hotova: 'Hotová',
  zamietnuta: 'Zamietnutá',
};

export function Nastroj({ onZavri }: { onZavri: () => void }) {
  const [zoznam, setZoznam] = useState<Pripomienka[]>([]);
  const [rezim, setRezim] = useState(false);
  const [hover, setHover] = useState<{ ramik: Ramik; popis: string; volne?: boolean } | null>(null);
  const [koncept, setKoncept] = useState<{ kotva: Kotva; ramik: Ramik; text: string; druh: Druh } | null>(null);
  const [otvorena, setOtvorena] = useState<string | null>(null);
  const [miesta, setMiesta] = useState<Record<string, Ramik | null>>({});
  const [uklada, setUklada] = useState(false);
  const [sprava, setSprava] = useState('');
  const textRef = useRef<HTMLTextAreaElement>(null);
  /* Len pre rozhranie — čo sa komu ukáže. Práva stráži server. */
  const redaktor = jeRedaktor();

  // ── Načítanie a rozmiestnenie ──────────────────────────────────────────────
  const prepocitaj = useCallback((polozky: Pripomienka[]) => {
    const next: Record<string, Ramik | null> = {};
    for (const p of polozky) {
      const el = najdiPodlaKotvy(p);
      next[p.documentId] = el ? ramikPre(el) : null;
    }
    setMiesta(next);
  }, []);

  useEffect(() => {
    let zive = true;
    preStranku(cestaStranky())
      .then(async (p) => {
        if (!zive) return;
        setZoznam(p);
        prepocitaj(p);
        // Obrázky dorastajú po načítaní — o chvíľu premeraj znova.
        setTimeout(() => { if (zive) prepocitaj(p); }, 900);

        // Odkaz „otvoriť na mieste" z administrácie (?pripomienka=<id>).
        const id = new URLSearchParams(window.location.search).get('pripomienka');
        if (!id) return;
        const uz = p.find((x) => x.documentId === id) || (await jedna(id));
        if (!uz || !zive) return;
        const dalsi = p.some((x) => x.documentId === uz.documentId) ? p : [...p, uz];
        setZoznam(dalsi);
        prepocitaj(dalsi);
        setOtvorena(uz.documentId);
        najdiPodlaKotvy(uz)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      })
      .catch(() => { if (zive) setSprava(t('Pripomienky sa nepodarilo načítať.')); });
    return () => { zive = false; };
  }, [prepocitaj]);

  useEffect(() => {
    const znova = () => prepocitaj(zoznam);
    window.addEventListener('resize', znova);
    return () => window.removeEventListener('resize', znova);
  }, [zoznam, prepocitaj]);

  // ── Režim výberu prvku ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!rezim) { setHover(null); return; }

    const nasUI = (el: Element | null) => !!(el && el.closest && el.closest('.pr-ui'));

    const pohyb = (e: MouseEvent) => {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (!el || nasUI(el)) { setHover(null); return; }
      // Pozadie stránky: rámovať celú stránku nemá zmysel, ukáž terčík na
      // mieste kurzora — pripomienka sa dá pripnúť aj tam.
      if (el === document.body || el === document.documentElement) {
        setHover({
          ramik: { top: e.clientY + window.scrollY - 12, left: e.clientX + window.scrollX - 12, width: 24, height: 24 },
          popis: t('voľné miesto na stránke'),
          volne: true,
        });
        return;
      }
      setHover({ ramik: ramikPre(el), popis: popisPrvku(el) });
    };

    const klik = (e: MouseEvent) => {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (!el || nasUI(el)) return;
      // Klik nesmie prejsť na stránku — inak by odkaz odnavigoval preč.
      e.preventDefault();
      e.stopPropagation();
      const volne = el === document.body || el === document.documentElement;
      setKoncept({
        kotva: volne ? kotvaVolna(e.clientX, e.clientY) : kotvaPre(el, { x: e.clientX, y: e.clientY }),
        ramik: volne ? ramikPre(document.body) : ramikPre(el),
        text: '',
        druh: 'chyba',
      });
      setRezim(false);
      setTimeout(() => textRef.current?.focus(), 30);
    };

    const klavesa = (e: KeyboardEvent) => { if (e.key === 'Escape') setRezim(false); };

    document.addEventListener('mousemove', pohyb, true);
    document.addEventListener('click', klik, true);
    document.addEventListener('keydown', klavesa, true);
    document.body.classList.add('pr-vyber');
    return () => {
      document.removeEventListener('mousemove', pohyb, true);
      document.removeEventListener('click', klik, true);
      document.removeEventListener('keydown', klavesa, true);
      document.body.classList.remove('pr-vyber');
    };
  }, [rezim]);

  // ── Akcie ──────────────────────────────────────────────────────────────────
  const uloz = async () => {
    if (!koncept || !koncept.text.trim() || uklada) return;
    setUklada(true);
    setSprava('');
    try {
      const nova = await pridaj({
        text: koncept.text.trim(),
        druh: koncept.druh,
        url: cestaStranky(),
        nadpisStranky: document.title.slice(0, 255),
        selektor: koncept.kotva.selektor,
        popisPrvku: koncept.kotva.popisPrvku,
        otisokTextu: koncept.kotva.otisokTextu,
        x: koncept.kotva.x,
        y: koncept.kotva.y,
        sirkaOkna: window.innerWidth,
      });
      setZoznam((z) => [...z, nova]);
      setMiesta((m) => ({ ...m, [nova.documentId]: koncept.ramik }));
      setKoncept(null);
    } catch (e: any) {
      setSprava(e?.status === 429 ? t('Priveľa pripomienok za chvíľu. Skúste o minútu.') : t('Uloženie zlyhalo.'));
    } finally {
      setUklada(false);
    }
  };

  const zmen = async (p: Pripomienka, stav: Stav) => {
    const povodne = zoznam;
    setZoznam((z) => z.map((x) => (x.documentId === p.documentId ? { ...x, stav } : x)));
    try {
      await zmenStav(p.documentId, stav);
      // Vybavené pripomienky sa na webe ďalej nekreslia — ostávajú v admine.
      if (stav === 'hotova' || stav === 'zamietnuta') {
        setZoznam((z) => z.filter((x) => x.documentId !== p.documentId));
        setOtvorena(null);
      }
    } catch {
      setZoznam(povodne);
      setSprava('Zmena stavu zlyhala.');
    }
  };

  const vymaz = async (p: Pripomienka) => {
    if (!window.confirm(t('Zmazať túto pripomienku? Nedá sa to vrátiť.'))) return;
    const povodne = zoznam;
    setZoznam((z) => z.filter((x) => x.documentId !== p.documentId));
    setOtvorena(null);
    try { await zmaz(p.documentId); } catch { setZoznam(povodne); setSprava('Mazanie zlyhalo.'); }
  };

  const prePrenos = useMemo(
    () => zoznam
      .map((p, i) => `${i + 1}. [${p.druh}] ${p.text}\n   ${window.location.origin}${p.url} — ${p.popisPrvku || 'neznámy prvok'}`)
      .join('\n'),
    [zoznam],
  );

  const skopiruj = async () => {
    try {
      await navigator.clipboard.writeText(`Pripomienky — ${document.title}\n\n${prePrenos}`);
      setSprava(t('Skopírované do schránky.'));
      setTimeout(() => setSprava(''), 2500);
    } catch {
      setSprava(t('Kopírovanie zlyhalo.'));
    }
  };

  const otvorenaP = zoznam.find((p) => p.documentId === otvorena) || null;
  const miestoOtvorenej = otvorenaP ? miesta[otvorenaP.documentId] : null;

  return (
    /* `pointer-events-none` je NUTNÉ: bez nej globálne pravidlo v
       `globals.css` vnúti vrstve `pointer-events: auto`, vrstva zakryje celú
       obrazovku a `elementFromPoint` vracia ju samu — klikať sa potom dalo
       len na to, čo bolo POD prvou obrazovkou. Presne tak to aj vyzeralo:
       titulka, zdieľanie a prvý odsek neboli klikateľné. */
    <div className="pr-ui pointer-events-none">
      {/* Zvýraznenie prvku pod kurzorom */}
      {rezim && hover && (
        <div
          className={`pr-hover pointer-events-none${hover.volne ? ' je-volne' : ''}`}
          style={{ top: hover.ramik.top, left: hover.ramik.left, width: hover.ramik.width, height: hover.ramik.height }}
        >
          <span className="pr-hover-menovka">{hover.popis}</span>
        </div>
      )}

      {/* Špendlíky */}
      {zoznam.map((p, i) => {
        const m = miesta[p.documentId];
        if (!m) return null;
        return (
          <button
            key={p.documentId}
            className={`pr-spendlik${p.druh === 'obsah' ? ' je-obsah' : ''}${otvorena === p.documentId ? ' je-otvoreny' : ''}`}
            style={{ top: m.top + (p.y ?? 0.5) * m.height, left: m.left + (p.x ?? 0.5) * m.width }}
            title={p.text}
            onClick={() => setOtvorena(otvorena === p.documentId ? null : p.documentId)}
          >
            {i + 1}
          </button>
        );
      })}

      {/* Bublina existujúcej pripomienky */}
      {otvorenaP && miestoOtvorenej && (
        <div
          className="pr-bublina"
          style={{
            top: miestoOtvorenej.top + (otvorenaP.y ?? 0.5) * miestoOtvorenej.height + 18,
            left: Math.max(
              window.scrollX + 12,
              Math.min(
                miestoOtvorenej.left + (otvorenaP.x ?? 0.5) * miestoOtvorenej.width,
                window.scrollX + window.innerWidth - 352,
              ),
            ),
          }}
        >
          <div className="pr-bublina-hlava">
            <span className={`pr-znacka${otvorenaP.druh === 'obsah' ? ' je-obsah' : ''}`}>
              {otvorenaP.druh === 'obsah' ? t('obsah') : t('chyba')}
            </span>
            <span className="pr-bublina-autor">{otvorenaP.autor || t('hosť')}</span>
            <button className="pr-x" onClick={() => setOtvorena(null)} aria-label={t('Zavrieť')}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="pr-bublina-text">{otvorenaP.text}</p>
          {redaktor ? (
            <div className="pr-bublina-nohy">
              <button className="pr-btn" onClick={() => zmen(otvorenaP, otvorenaP.stav === 'riesi-sa' ? 'nova' : 'riesi-sa')}>
                {otvorenaP.stav === 'riesi-sa' ? t('Späť na novú') : t('Rieši sa')}
              </button>
              <button className="pr-btn je-hlavne" onClick={() => zmen(otvorenaP, 'hotova')}>
                <Check className="w-3.5 h-3.5" /> {t('Hotová')}
              </button>
              <button className="pr-btn je-nebezpecne" onClick={() => vymaz(otvorenaP)} aria-label={t('Zmazať')}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <p className="pr-tip" style={{ margin: 0 }}>
              {otvorenaP.stav === 'riesi-sa' ? t('Redakcia to už rieši.') : t('Čaká na redakciu.')}
            </p>
          )}
        </div>
      )}

      {/* Bublina novej pripomienky */}
      {koncept && (
        <div
          className="pr-bublina"
          style={{
            top: koncept.ramik.top + koncept.kotva.y * koncept.ramik.height + 18,
            left: Math.max(
              window.scrollX + 12,
              Math.min(koncept.ramik.left + koncept.kotva.x * koncept.ramik.width, window.scrollX + window.innerWidth - 352),
            ),
          }}
        >
          <div className="pr-bublina-hlava">
            <span className="pr-bublina-prvok">{koncept.kotva.popisPrvku}</span>
            <button className="pr-x" onClick={() => setKoncept(null)} aria-label={t('Zrušiť')}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="pr-prepinac">
            <button className={koncept.druh === 'chyba' ? 'je-on' : ''} onClick={() => setKoncept({ ...koncept, druh: 'chyba' })}>
              <AlertTriangle className="w-3.5 h-3.5" /> {t('Chyba')}
            </button>
            <button className={koncept.druh === 'obsah' ? 'je-on' : ''} onClick={() => setKoncept({ ...koncept, druh: 'obsah' })}>
              <FileText className="w-3.5 h-3.5" /> {t('Obsah')}
            </button>
          </div>
          <textarea
            ref={textRef}
            className="pr-textarea"
            rows={3}
            maxLength={2000}
            value={koncept.text}
            placeholder={t('Čo je tu zle alebo čo treba zmeniť?')}
            onChange={(e) => setKoncept({ ...koncept, text: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setKoncept(null);
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) uloz();
            }}
          />
          <div className="pr-bublina-nohy">
            <span className="pr-tip">{t('Ctrl+Enter uloží')}</span>
            <button className="pr-btn je-hlavne" disabled={!koncept.text.trim() || uklada} onClick={uloz}>
              {uklada ? t('Ukladám…') : t('Uložiť')}
            </button>
          </div>
        </div>
      )}

      {/* Panel */}
      <div className="pr-panel">
        <div className="pr-panel-hlava">
          <MapPin className="w-4 h-4" />
          <b>{t('Pripomienky')}</b>
          <span className="pr-pocet">{zoznam.length}</span>
          <button className="pr-x" onClick={onZavri} aria-label={t('Zavrieť nástroj')}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <button className={`pr-lov${rezim ? ' je-on' : ''}`} onClick={() => { setRezim(!rezim); setKoncept(null); }}>
          <MousePointerClick className="w-4 h-4" />
          {rezim ? t('Kliknite na prvok… (Esc zruší)') : t('Pridať pripomienku na prvok')}
        </button>

        <div className="pr-zoznam">
          {zoznam.length === 0 && <p className="pr-prazdno">{t('Na tejto stránke zatiaľ nič.')}</p>}
          {zoznam.map((p, i) => (
            <button
              key={p.documentId}
              className={`pr-polozka${otvorena === p.documentId ? ' je-otvorena' : ''}`}
              onClick={() => {
                setOtvorena(p.documentId);
                najdiPodlaKotvy(p)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
              }}
            >
              <span className={`pr-cislo${p.druh === 'obsah' ? ' je-obsah' : ''}`}>{i + 1}</span>
              <span className="pr-polozka-telo">
                <span className="pr-polozka-text">{p.text}</span>
                <span className="pr-polozka-prvok">
                  {miesta[p.documentId] ? (p.popisPrvku || '') : t('prvok sa na stránke nenašiel')}
                </span>
              </span>
              {p.stav !== 'nova' && <span className="pr-stav">{t(STAVY[p.stav])}</span>}
            </button>
          ))}
        </div>

        {sprava && <p className="pr-sprava">{sprava}</p>}

        <div className="pr-panel-nohy">
          <button className="pr-btn" onClick={skopiruj} disabled={!zoznam.length}>
            <Copy className="w-3.5 h-3.5" /> {t('Kopírovať pre vývojára')}
          </button>
          {redaktor && <a className="pr-btn" href="/admin" target="_blank" rel="noreferrer">{t('Všetky v admine')}</a>}
        </div>
        {!redaktor && (
          <p className="pr-tip" style={{ margin: '6px 2px 0' }}>
            {t('Píšete ako hosť — pripomienku uvidí redakcia.')}
          </p>
        )}
      </div>
    </div>
  );
}

export default Nastroj;
