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
      return (
        <Panel title="Zdroje a literatúra">
          <Field label="Nadpis" value={data.title} onChange={(v) => onPatch({ title: v })} />
          <Area label="Úvodná veta" value={data.intro} onChange={(v) => onPatch({ intro: v })} rows={2} />
          <div className="edf-list">
            {(data.items || []).map((it: any, i: number) => (
              <div key={i} className="edf-item">
                <textarea
                  rows={2}
                  value={it.text || ''}
                  placeholder="Autor, názov, rok…"
                  onChange={(e) => onPatch({ items: replace(data.items, i, { ...it, text: e.target.value }) })}
                />
                <input
                  value={it.url || ''}
                  placeholder="Odkaz (nepovinné)"
                  onChange={(e) => onPatch({ items: replace(data.items, i, { ...it, url: e.target.value }) })}
                />
                <div className="edf-item-btns">
                  <button title="Vyššie" disabled={i === 0}
                          onClick={() => onPatch({ items: move(data.items, i, i - 1) })}>
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <button title="Nižšie" disabled={i === (data.items || []).length - 1}
                          onClick={() => onPatch({ items: move(data.items, i, i + 1) })}>
                    <ArrowDown className="w-3 h-3" />
                  </button>
                  <button title="Odobrať" className="edf-danger"
                          onClick={() => onPatch({ items: (data.items || []).filter((_: any, k: number) => k !== i) })}>
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button className="edf-add" onClick={() => onPatch({ items: [...(data.items || []), { text: '', url: '' }] })}>
            <Plus className="w-3.5 h-3.5" /> Pridať zdroj
          </button>
        </Panel>
      );

    case 'content.image-gallery':
      return (
        <Panel title="Galéria" hint="Obrázky sa zobrazia v mriežke; poradie určuje zoznam.">
          <label className="edf-field">
            <span>Stĺpce</span>
            <select value={data.columns || '3'} onChange={(e) => onPatch({ columns: e.target.value })}>
              {['2', '3', '4'].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
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

function Field({ label, value, onChange, required, placeholder }: any) {
  return (
    <label className="edf-field">
      <span>{label}{required && <b> *</b>}</span>
      <input
        value={value || ''}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={required && !value}
      />
    </label>
  );
}

function Area({ label, value, onChange, rows = 3, required, mono }: any) {
  return (
    <label className="edf-field">
      <span>{label}{required && <b> *</b>}</span>
      <textarea
        rows={rows}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={required && !value}
        style={mono ? { fontFamily: 'var(--font-serif, Georgia, serif)', whiteSpace: 'pre-wrap' } : undefined}
      />
    </label>
  );
}
