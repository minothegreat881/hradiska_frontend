'use client';

/**
 * Polia zvyšných typov blokov (Fáza 5).
 *
 * Kreslia sa do panela pod vybraným blokom na plátne, nie do formulára —
 * článok tak ostáva vidieť celý a úprava je na mieste. Tvary polí presne
 * kopírujú schémy v `hradiska-strapi/src/components/content/`; žiadne pole
 * navyše, žiadna zmena schémy.
 */

import React from 'react';
import { Plus, X, ArrowUp, ArrowDown, Images } from 'lucide-react';
import { parseEmbedUrl } from '../../../lib/embed';

const EMBED_PROVIDERS: { id: string; label: string }[] = [
  { id: 'youtube', label: 'YouTube' },
  { id: 'vimeo', label: 'Vimeo' },
  { id: 'sketchfab', label: 'Sketchfab' },
  { id: 'blogger', label: 'Blogger' },
];

export interface BlockFieldsProps {
  type: string;
  data: any;
  onPatch: (patch: any) => void;
  /** Otvorí knižnicu médií; `multiple` pre galériu. */
  onPickMedia: (multiple: boolean) => void;
}

export function BlockFields({ type, data, onPatch, onPickMedia }: BlockFieldsProps) {
  switch (type) {
    case 'content.image-block':
      return <ImageFields data={data} onPatch={onPatch} onPickMedia={onPickMedia} />;

    case 'content.quote-block':
      return (
        <Panel title="Citát" hint="Používa sa na dobové pramene — kroniky a listiny, nie modernú literatúru.">
          <Area label="Text citátu" required value={data.text} onChange={(v) => onPatch({ text: v })} rows={3} />
          <Row>
            <Field label="Autor" value={data.author} onChange={(v) => onPatch({ author: v })} />
            <Field label="Zdroj" value={data.source} onChange={(v) => onPatch({ source: v })} />
          </Row>
        </Panel>
      );

    case 'content.poem':
      return (
        <Panel title="Báseň" hint="Zalomenie riadkov a prázdny riadok medzi strofami sa zachováva.">
          <Area label="Verše" required value={data.text} onChange={(v) => onPatch({ text: v })} rows={5} mono />
          <Row>
            <Field label="Názov" value={data.title} onChange={(v) => onPatch({ title: v })} />
            <Field label="Autor" value={data.author} onChange={(v) => onPatch({ author: v })} />
          </Row>
          <Field label="Zdroj" value={data.source} onChange={(v) => onPatch({ source: v })} />
        </Panel>
      );

    case 'content.embed': {
      // Rozpoznaná adresa si sama doplní poskytovateľa aj identifikátor —
      // bez identifikátora vracia YouTube chybovú stránku namiesto videa.
      const known = parseEmbedUrl(data.url);
      const pasted = String(data.url || '').trim();
      return (
        <Panel title="Vložené video" hint="Stačí skopírovať odkaz z prehliadača, napríklad „youtube.com/watch?v=…“. Vkladaciu adresu si editor odvodí sám.">
          <Field
            label="Adresa" required value={data.url}
            placeholder="https://www.youtube.com/watch?v=…"
            onChange={(v) => {
              const ref = parseEmbedUrl(v);
              onPatch(ref ? { url: v, provider: ref.provider, embedId: ref.embedId } : { url: v });
            }}
          />
          <Row>
            <label className="edf-field">
              <span>Poskytovateľ</span>
              <select value={data.provider || 'youtube'} onChange={(e) => onPatch({ provider: e.target.value })}>
                {EMBED_PROVIDERS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </label>
            <Field label="Identifikátor" value={data.embedId} onChange={(v) => onPatch({ embedId: v })} />
          </Row>
          <Field label="Popis pod videom" value={data.caption} onChange={(v) => onPatch({ caption: v })} />
          {pasted && !known && !String(data.embedId || '').trim() && (
            <p className="edf-hint">
              Z tejto adresy sa nepodarilo prečítať identifikátor videa. Vložte odkaz na stránku videa
              (YouTube, Vimeo, Sketchfab) alebo identifikátor doplňte ručne.
            </p>
          )}
        </Panel>
      );
    }

    case 'content.sources':
      return <SourcesFields data={data} onPatch={onPatch} />;

    case 'content.image-gallery':
      return (
        <Panel title="Galéria" hint="Fotografie sa poukladajú do radov; poradie určuje zoznam nižšie.">
          <label className="edf-field">
            <span>Koľko fotografií v rade</span>
            {/* Namiesto rozbaľovacieho zoznamu s číslami — na tlačidle je vidieť,
                ako bude rad vyzerať. */}
            <div className="edf-seg" role="group" aria-label="Počet fotografií v rade">
              {['2', '3', '4'].map((c) => (
                <button
                  key={c}
                  className={String(data.columns || '3') === c ? 'is-on' : ''}
                  aria-pressed={String(data.columns || '3') === c}
                  onClick={() => onPatch({ columns: c })}
                >
                  <i style={{ gridTemplateColumns: `repeat(${c}, 1fr)` }}>
                    {Array.from({ length: Number(c) }, (_, k) => <span key={k} />)}
                  </i>
                  {c}
                </button>
              ))}
            </div>
          </label>
          <div className="edf-gallery">
            {(data.images || []).map((img: any, i: number) => (
              <div key={img.id || i} className="edf-thumb">
                <img src={thumb(img)} alt="" />
                <div className="edf-item-btns">
                  <button title="Vľavo" disabled={i === 0} onClick={() => onPatch({ images: move(data.images, i, i - 1) })}>
                    <ArrowUp className="w-3 h-3" style={{ transform: 'rotate(-90deg)' }} />
                  </button>
                  <button title="Vpravo" disabled={i === (data.images || []).length - 1}
                          onClick={() => onPatch({ images: move(data.images, i, i + 1) })}>
                    <ArrowDown className="w-3 h-3" style={{ transform: 'rotate(-90deg)' }} />
                  </button>
                  <button title="Odobrať" className="edf-danger"
                          onClick={() => onPatch({ images: (data.images || []).filter((_: any, k: number) => k !== i) })}>
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button className="edf-add" onClick={() => onPickMedia(true)}>
            <Images className="w-3.5 h-3.5" /> Pridať obrázky z knižnice
          </button>
        </Panel>
      );

    default:
      return null;
  }
}

// ── pomocné ──────────────────────────────────────────────────────────────────

const replace = (arr: any[], i: number, v: any) => (arr || []).map((x, k) => (k === i ? v : x));
const move = (arr: any[], from: number, to: number) => {
  const next = [...(arr || [])];
  if (to < 0 || to >= next.length) return next;
  const [m] = next.splice(from, 1);
  next.splice(to, 0, m);
  return next;
};
const thumb = (img: any) =>
  (img?.formats?.thumbnail?.url || img?.url || '').startsWith('http')
    ? img.formats?.thumbnail?.url || img.url
    : `${(import.meta as any).env?.VITE_STRAPI_URL || 'http://localhost:1337'}${img?.formats?.thumbnail?.url || img?.url || ''}`;

/**
 * ZDROJE A LITERATÚRA.
 *
 * Pridávanie bolo zdĺhavé: na každý zdroj sa muselo kliknúť „Pridať zdroj",
 * potom myšou do políčka, a dlhší bibliografický záznam sa nezmestil do dvoch
 * riadkov textového poľa — zvyšok zmizol. Preto:
 *   • pole rastie s textom, záznam je vidieť celý,
 *   • Enter posúva ďalej: záznam → odkaz → nový zdroj (s kurzorom v ňom),
 *     rovnako ako v kľúčových faktoch,
 *   • zdroje sú očíslované tak, ako ich uvidí čitateľ.
 */
function SourcesFields({ data, onPatch }: { data: any; onPatch: (p: any) => void }) {
  const items: any[] = data.items || [];
  const urlRefs = React.useRef<Record<number, HTMLInputElement | null>>({});
  const textRefs = React.useRef<Record<number, HTMLTextAreaElement | null>>({});
  const [focusAt, setFocusAt] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (focusAt === null) return;
    textRefs.current[focusAt]?.focus();
    setFocusAt(null);
  }, [focusAt, items.length]);

  const patchItem = (i: number, p: any) => onPatch({ items: replace(items, i, { ...items[i], ...p }) });
  const addItem = () => { onPatch({ items: [...items, { text: '', url: '' }] }); setFocusAt(items.length); };
  const removeItem = (i: number) => onPatch({ items: items.filter((_: any, k: number) => k !== i) });

  return (
    <Panel
      title="Zdroje a literatúra"
      hint="Jeden zdroj = jeden riadok textu (plus odkaz, ak je). Na webe je zvykom „Autor: Názov, vydavateľ miesto rok“ — tak je napísaná väčšina z 1238 zdrojov v článkoch. Enter vás posunie na odkaz a potom na ďalší zdroj."
    >
      <Field label="Nadpis" value={data.title} onChange={(v) => onPatch({ title: v })} />
      <Area label="Úvodná veta" value={data.intro} onChange={(v) => onPatch({ intro: v })} rows={2} />

      <div className="edf-list">
        {items.map((it: any, i: number) => (
          <div key={i} className="edf-item edf-item-src">
            <span className="edf-item-n" aria-hidden="true">{i + 1}.</span>
            <GrowArea
              inputRef={(el) => { textRefs.current[i] = el; }}
              value={it.text || ''}
              placeholder="Bialeková, D.: Pramene k dejinám osídlenia Slovenska II. Nitra 1989"
              rows={2}
              onChange={(v) => patchItem(i, { text: v })}
              onEnter={() => urlRefs.current[i]?.focus()}
            />
            <input
              ref={(el) => { urlRefs.current[i] = el; }}
              value={it.url || ''}
              placeholder="Odkaz (nepovinné)"
              onChange={(e) => patchItem(i, { url: e.target.value })}
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return;
                e.preventDefault();
                // Prázdny posledný zdroj neduplikuj — len potvrď.
                if (String(it.text || '').trim()) addItem();
              }}
            />
            <div className="edf-item-btns">
              <button title="Vyššie" disabled={i === 0} onClick={() => onPatch({ items: move(items, i, i - 1) })}>
                <ArrowUp className="w-3 h-3" />
              </button>
              <button title="Nižšie" disabled={i === items.length - 1} onClick={() => onPatch({ items: move(items, i, i + 1) })}>
                <ArrowDown className="w-3 h-3" />
              </button>
              <button title="Odobrať" className="edf-danger" onClick={() => removeItem(i)}>
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
        {!items.length && <p className="edf-hint" style={{ margin: 0 }}>Zatiaľ žiadny zdroj.</p>}
      </div>

      <button className="edf-add" onClick={addItem}>
        <Plus className="w-3.5 h-3.5" /> Pridať zdroj
      </button>
    </Panel>
  );
}

/**
 * Textové pole s výškou podľa obsahu. `onEnter` (ak je) prevezme Enter —
 * nezalomí riadok, ale posunie na ďalšie pole.
 */
function GrowArea({
  value, placeholder, rows = 2, onChange, onEnter, inputRef, mono,
}: {
  value: string; placeholder?: string; rows?: number;
  onChange: (v: string) => void; onEnter?: () => void;
  inputRef?: (el: HTMLTextAreaElement | null) => void; mono?: boolean;
}) {
  const own = React.useRef<HTMLTextAreaElement | null>(null);
  const grow = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = 'auto';
    // K obsahu prirátaj rámik — pole je `border-box`, inak ostanú 2 px skryté.
    el.style.height = `${el.scrollHeight + (el.offsetHeight - el.clientHeight)}px`;
  };
  React.useEffect(() => { grow(own.current); }, [value]);
  return (
    <textarea
      ref={(el) => { own.current = el; grow(el); inputRef?.(el); }}
      rows={rows}
      value={value}
      placeholder={placeholder}
      style={{ resize: 'none', overflow: 'hidden', ...(mono ? { fontFamily: 'var(--font-serif, Georgia, serif)', whiteSpace: 'pre-wrap' } : {}) }}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => { if (onEnter && e.key === 'Enter') { e.preventDefault(); onEnter(); } }}
    />
  );
}

/**
 * OBRÁZOK — popisy.
 *
 * Doteraz sa popis pod obrázkom (`caption`) v editore nedal upraviť vôbec a
 * popis pre čítačky (`alt`) sa písal do prúžka s upozornením, ktorý po prvom
 * písmene zmizol — podmienka na jeho zobrazenie znela „alt je prázdny".
 * Obe polia sú teraz tu, v paneli, ktorý pri písaní nikam neutečie.
 * Enter posúva ďalej: popis → alt, a v alte pole potvrdí (rozloženie a
 * veľkosť sa nastavujú ťahaním priamo na obrázku).
 */
function ImageFields({ data, onPatch, onPickMedia }: { data: any; onPatch: (p: any) => void; onPickMedia: (m: boolean) => void }) {
  const altRef = React.useRef<HTMLInputElement | null>(null);
  return (
    <Panel title="Obrázok" hint="Popis pod obrázkom uvidí čitateľ. Popis pre čítačky (alt) číta hlasový čítač a vyhľadávače — bez neho sa článok neuloží.">
      <label className="edf-field">
        <span>Popis pod obrázkom</span>
        <GrowArea
          value={data.caption || ''}
          placeholder="Napríklad: Pohľad na val od juhu."
          rows={2}
          onChange={(v) => onPatch({ caption: v })}
          onEnter={() => altRef.current?.focus()}
        />
      </label>
      <Field
        label="Popis pre čítačky (alt)" required value={data.alt}
        inputRef={altRef}
        placeholder="Čo je na obrázku"
        onChange={(v) => onPatch({ alt: v })}
        onEnter={() => altRef.current?.blur()}
      />
      <label className="edf-check">
        <input
          type="checkbox"
          checked={data.showCaption !== false}
          onChange={(e) => onPatch({ showCaption: e.target.checked })}
        />
        Zobraziť popis pod obrázkom
      </label>
      <button className="edf-add" onClick={() => onPickMedia(false)}>
        <Images className="w-3.5 h-3.5" /> Vymeniť obrázok
      </button>
    </Panel>
  );
}

function Panel({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="edf">
      <div className="edf-head">{title}</div>
      {children}
      {hint && <p className="edf-hint">{hint}</p>}
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="edf-row">{children}</div>;
}

function Field({ label, value, onChange, required, placeholder, onEnter, inputRef }: any) {
  return (
    <label className="edf-field">
      <span>{label}{required && <b> *</b>}</span>
      <input
        ref={inputRef}
        value={value || ''}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (onEnter && e.key === 'Enter') { e.preventDefault(); onEnter(); } }}
        aria-invalid={required && !value}
      />
    </label>
  );
}

/* Aj tu pole rastie s textom — dlhý citát či báseň sa inak schová za okraj.
   Enter tu ZALAMUJE (v básni sú verše, v citáte odseky), preto bez `onEnter`. */
function Area({ label, value, onChange, rows = 3, required, mono }: any) {
  return (
    <label className="edf-field">
      <span>{label}{required && <b> *</b>}</span>
      <GrowArea value={value || ''} rows={rows} mono={mono} onChange={onChange} />
    </label>
  );
}
