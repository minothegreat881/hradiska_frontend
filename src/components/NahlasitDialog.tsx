'use client';

/**
 * NAHLÁSENIE PRÍSPEVKU.
 *
 * Nahlásenie príspevok neskryje — o tom rozhoduje redakcia. Okienko to aj
 * hovorí nahlas, aby človek nečakal, že komentár okamžite zmizne, a
 * nenahlasoval ho znova.
 *
 * Nahlásiť môže len prihlásený člen. Anonymné nahlasovanie je pozvánka pre
 * toho, kto chce niekomu uškodiť; server to odmieta tak či tak.
 */

import { t } from '../lib/jazyk';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Flag, X } from 'lucide-react';
import { STRAPI_URL } from '../lib/api-adresa';
import { zablokuj } from '../lib/blokovania';

export type DruhPrispevku = 'komentar' | 'fotokomentar';

const DOVODY: { id: string; popis: string }[] = [
  { id: 'spam', popis: 'Spam alebo reklama' },
  { id: 'urazka', popis: 'Urážka alebo útok na človeka' },
  { id: 'nevhodne', popis: 'Nevhodný obsah' },
  { id: 'nepravda', popis: 'Nepravdivé tvrdenie' },
  { id: 'ine', popis: 'Iné' },
];

export function NahlasitDialog({
  druh, cielDocumentId, autor, autorId, token, onZavri, onZablokovane,
}: {
  druh: DruhPrispevku;
  cielDocumentId: string;
  autor?: string;
  /** Číslo účtu autora — bez neho sa blokovanie neponúka. */
  autorId?: number | null;
  token: string;
  onZavri: () => void;
  /** Zavolá sa po zablokovaní, nech si zoznam komentárov obnoví filter. */
  onZablokovane?: () => void;
}) {
  const [dovod, setDovod] = useState('spam');
  const [blokovat, setBlokovat] = useState(false);
  const [poznamka, setPoznamka] = useState('');
  const [posielam, setPosielam] = useState(false);
  const [hotovo, setHotovo] = useState<string | null>(null);
  const [chyba, setChyba] = useState('');
  const prveRef = useRef<HTMLInputElement>(null);

  // Escape zavrie, ohnisko ide na prvú možnosť — okienko sa ovláda aj klávesnicou.
  useEffect(() => {
    prveRef.current?.focus();
    const naKlavesu = (e: KeyboardEvent) => { if (e.key === 'Escape') onZavri(); };
    document.addEventListener('keydown', naKlavesu);
    return () => document.removeEventListener('keydown', naKlavesu);
  }, [onZavri]);

  const posli = async () => {
    setPosielam(true);
    setChyba('');
    try {
      const r = await fetch(`${STRAPI_URL}/api/nahlasenia`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          data: {
            druh,
            cielDocumentId,
            dovod,
            poznamka: poznamka.trim() || undefined,
            url: typeof window !== 'undefined' ? window.location.href : undefined,
          },
        }),
      });
      if (!r.ok) throw new Error(String(r.status));
      const odpoved = await r.json().catch(() => ({}));

      /* Blokovanie je samostatný úkon — keď zlyhá, nahlásenie tým neprepadne;
         človeku sa o tom povie rovno vo vete, ktorú číta. */
      let blokovanieHlaska = '';
      if (blokovat && autorId) {
        try {
          await zablokuj(token, autorId);
          onZablokovane?.();
          blokovanieHlaska = autor
            ? ` ${t('Príspevky od')} ${autor} ${t('vám už nebudeme zobrazovať.')}`
            : ' ' + t('Príspevky tohto člena vám už nebudeme zobrazovať.');
        } catch {
          blokovanieHlaska = ' ' + t('Zablokovať sa ho nepodarilo — skúste to v nastaveniach účtu.');
        }
      }

      setHotovo((odpoved?.uzNahlasene
        ? t('Tento príspevok ste už nahlásili. Redakcia o ňom vie.')
        : t('Ďakujeme. Redakcia sa na príspevok pozrie.')) + blokovanieHlaska);
    } catch {
      setChyba(t('Nahlásenie sa nepodarilo odoslať. Skúste to prosím o chvíľu.'));
    } finally {
      setPosielam(false);
    }
  };

  /* Portál do `body` je nutný, nie kozmetický: okienko sa vykresľuje vnútri
     karty diskusie, ktorá má vlastný vrstvový kontext (transform z animácie).
     Vnútri neho by `z-index: 10010` platil len voči jej súrodencom a plávajúce
     tlačidlo pripomienok by okienko prekrylo — namerané na telefóne. */
  return createPortal(
    <div className="nahl-vrstva" role="dialog" aria-modal="true" aria-label={t('Nahlásiť príspevok')}>
      <div className="nahl-okno">
        <button type="button" className="nahl-zavri" onClick={onZavri} aria-label={t('Zavrieť')}>
          <X style={{ width: 16, height: 16 }} />
        </button>

        {hotovo ? (
          <>
            <h2 className="nahl-nadpis">{t('Nahlásené')}</h2>
            <p className="nahl-text">{hotovo}</p>
            <div className="nahl-ukony">
              <button type="button" className="nahl-hlavne" onClick={onZavri}>{t('Zavrieť')}</button>
            </div>
          </>
        ) : (
          <>
            <h2 className="nahl-nadpis">
              <Flag style={{ width: 17, height: 17 }} aria-hidden="true" />
              {t('Nahlásiť príspevok')}
            </h2>
            <p className="nahl-text">
              {autor ? <>{t('Príspevok od')} <strong>{autor}</strong>. </> : null}
              {t('Nahlásenie príspevok neskryje — pozrie sa naň redakcia.')}
            </p>

            <fieldset className="nahl-dovody">
              <legend className="nahl-legenda">{t('Čo mu vyčítate?')}</legend>
              {DOVODY.map((d, i) => (
                <label key={d.id} className="nahl-dovod">
                  <input
                    ref={i === 0 ? prveRef : undefined}
                    type="radio"
                    name="dovod"
                    value={d.id}
                    checked={dovod === d.id}
                    onChange={() => setDovod(d.id)}
                  />
                  <span>{t(d.popis)}</span>
                </label>
              ))}
            </fieldset>

            <label className="nahl-legenda" htmlFor="nahl-poznamka">{t('Chcete niečo doplniť? (nepovinné)')}</label>
            <textarea
              id="nahl-poznamka"
              className="nahl-pole"
              rows={3}
              maxLength={1000}
              value={poznamka}
              onChange={(e) => setPoznamka(e.target.value)}
              placeholder={t('Napríklad čím presne príspevok prekáža.')}
            />

            {/* Blokovanie sa ponúka len vtedy, keď vieme, o čí účet ide —
                pri starých komentároch z pôvodného blogu účet neexistuje. */}
            {autorId ? (
              <label className="nahl-blokovat">
                <input type="checkbox" checked={blokovat} onChange={(e) => setBlokovat(e.target.checked)} />
                <span>
                  {t('Zároveň')} {autor ? <strong>{autor}</strong> : t('tohto člena')}{' '}
                  {t('zablokovať — jeho príspevky sa mi prestanú zobrazovať. Zrušiť sa to dá v nastaveniach účtu.')}
                </span>
              </label>
            ) : null}

            {chyba && <p className="nahl-chyba" role="alert">{chyba}</p>}

            <div className="nahl-ukony">
              <button type="button" className="nahl-vedlajsie" onClick={onZavri}>{t('Zrušiť')}</button>
              <button type="button" className="nahl-hlavne" onClick={posli} disabled={posielam}>
                {posielam ? t('Odosielam…') : t('Nahlásiť')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}

export default NahlasitDialog;
