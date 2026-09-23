'use client';

/**
 * Pobočný stĺpec článku — upravuje sa priamo na plátne, na mieste, kde ho
 * uvidí čitateľ.
 *
 * Predtým boli kľúčové fakty a časová os v pravom paneli širokom 330 px, kde
 * na dve textové polia zostávalo po ~70 px a popis udalosti v rozhraní vôbec
 * nebol, hoci ho schéma má. Preto sa presunuli sem.
 *
 * Názvy polí sú overené proti schéme Strapi
 * (`hradiska-strapi/src/components/sidebar/`):
 *   kľúčový fakt   label* (100), value* (255), icon (16 hodnôt)
 *   udalosť        year* (50), title* (255), description (500), type (7 hodnôt)
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  GripVertical, Trash2, Plus, ChevronDown,
  Calendar, Users, Map, Building, Crown, Sword, Shield, Scroll,
  BookOpen, Star, Flag, Mountain, Trees, Droplets, Flame, Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { KEY_FACT_ICONS, TIMELINE_TYPES, TIMELINE_TYPE_LABELS } from '../data';

/** Ikony presne pre enum zo schémy — 16 hodnôt, nič navyše. */
export const FACT_ICONS: Record<string, LucideIcon> = {
  calendar: Calendar, users: Users, map: Map, building: Building,
  crown: Crown, sword: Sword, shield: Shield, scroll: Scroll,
  book: BookOpen, star: Star, flag: Flag, mountain: Mountain,
  tree: Trees, water: Droplets, fire: Flame, custom: Sparkles,
};

/** Limity zo schémy — polia sa orezávajú, nech Strapi nevráti 400. */
const MAX = { label: 100, value: 255, year: 50, title: 255, description: 500 };

const newUid = () => Math.random().toString(36).slice(2, 9);

export interface Fact { uid: string; label: string; value: string; icon: string; cmpId?: number }
export interface Event { uid: string; year: string; title: string; description: string; type: string; cmpId?: number }

export function SideColumnEditor({
  facts, onFactsChange, timeline, onTimelineChange,
}: {
  facts: Fact[];
  onFactsChange: (next: Fact[]) => void;
  timeline: Event[];
  onTimelineChange: (next: Event[]) => void;
}) {
  return (
    /* `admin` je tu kvôli tomu, že plátno je vlastné okno — bez neho by
       neplatili ani premenné `--ad-*`, ani pravidlá `.admin .ad-*`. */
    <div className="admin ad-side-editor">
      <TimelineBox items={timeline} onChange={onTimelineChange} />
      <FactsBox items={facts} onChange={onFactsChange} />
    </div>
  );
}

/** Preusporiadanie ťahaním za úchyt (ukazovateľové udalosti, funguje aj v iframe). */
function useReorder<T extends { uid: string }>(items: T[], onChange: (n: T[]) => void) {
  const state = useRef<{ uid: string; over: number } | null>(null);
  const [dragUid, setDragUid] = useState<string | null>(null);
  const [over, setOver] = useState<number | null>(null);

  const start = (uid: string) => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const list = (e.currentTarget as HTMLElement).closest('[data-reorder-list]') as HTMLElement | null;
    if (!list) return;
    const doc = list.ownerDocument;
    setDragUid(uid);
    state.current = { uid, over: items.findIndex((i) => i.uid === uid) };

    const move = (ev: PointerEvent) => {
      const rows = [...list.querySelectorAll('[data-reorder-item]')] as HTMLElement[];
      let idx = rows.length;
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i].getBoundingClientRect();
        if (ev.clientY < r.top + r.height / 2) { idx = i; break; }
      }
      if (state.current) state.current.over = idx;
      setOver(idx);
    };
    const up = () => {
      doc.removeEventListener('pointermove', move);
      doc.removeEventListener('pointerup', up);
      const st = state.current;
      state.current = null;
      setDragUid(null);
      setOver(null);
      if (!st) return;
      const from = items.findIndex((i) => i.uid === st.uid);
      let to = st.over;
      if (to > from) to -= 1;
      if (from < 0 || to < 0 || to === from) return;
      const next = [...items];
      const [m] = next.splice(from, 1);
      next.splice(to, 0, m);
      onChange(next);
    };
    doc.addEventListener('pointermove', move);
    doc.addEventListener('pointerup', up);
  };

  return { start, dragUid, over };
}

/**
 * Textové pole, ktoré rastie s textom a Enterom potvrdzuje.
 *
 * Bol tam obyčajný jednoriadkový `<input>`: dlhší fakt sa v ňom stratil za
 * okrajom (namerané 502 px textu mimo viditeľnej časti) a Enter neurobil nič,
 * hoci na webe sa hodnota zalamuje do viacerých riadkov. Textarea s výškou
 * podľa obsahu ukáže celý text a správa sa ako riadok: Enter nezalamuje,
 * ale posúva ďalej (`onEnter`).
 */
/** Kurzor na KONIEC poľa — po skoku Enterom sa inak píše pred text. */
function focusEnd(el?: HTMLTextAreaElement | null) {
  if (!el) return;
  el.focus();
  const n = el.value.length;
  try { el.setSelectionRange(n, n); } catch { /* staršie prehliadače */ }
}

function GrowField({
  className, value, placeholder, maxLength, title, onChange, onEnter, inputRef, autoFocus,
}: {
  className: string; value: string; placeholder: string; maxLength: number;
  title?: string; onChange: (v: string) => void; onEnter?: () => void;
  inputRef?: React.RefObject<HTMLTextAreaElement>;
  autoFocus?: boolean;
}) {
  const own = useRef<HTMLTextAreaElement>(null);
  const ref = inputRef || own;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = '0px';
    el.style.height = `${el.scrollHeight + (el.offsetHeight - el.clientHeight)}px`;
  }, [value, ref]);
  return (
    <textarea
      ref={ref}
      rows={1}
      autoFocus={autoFocus}
      className={className}
      value={value}
      placeholder={placeholder}
      title={title}
      maxLength={maxLength}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') { e.preventDefault(); onEnter?.(); }
      }}
    />
  );
}

// ── Kľúčové fakty ────────────────────────────────────────────────────────────

function FactsBox({ items, onChange }: { items: Fact[]; onChange: (n: Fact[]) => void }) {
  const [active, setActive] = useState<string | null>(null);
  const [iconMenu, setIconMenu] = useState(false);
  const { start, dragUid, over } = useReorder(items, onChange);

  const patch = (uid: string, p: Partial<Fact>) =>
    onChange(items.map((f) => (f.uid === uid ? { ...f, ...p } : f)));

  /* Odkazy na polia hodnoty — Enter v popise skáče na hodnotu a nový fakt
     dostane kurzor rovno do popisu, nech sa dá písať bez myši. */
  const valueRefs = useRef<Record<string, React.RefObject<HTMLTextAreaElement>>>({});
  const [focusUid, setFocusUid] = useState<string | null>(null);

  const add = () => {
    const f: Fact = { uid: newUid(), icon: 'star', label: '', value: '' };
    onChange([...items, f]);
    setActive(f.uid);
    setFocusUid(f.uid);
  };

  return (
    <div className="ad-aside-box" data-reorder-list>
      <div className="ad-aside-title">
        Kľúčové fakty {items.length > 0 && <span>{items.length}</span>}
      </div>

      {items.map((f, i) => {
        const Icon = FACT_ICONS[f.icon] || Star;
        const on = active === f.uid;
        return (
          <div
            key={f.uid}
            data-reorder-item
            className={`ad-fact${on ? ' is-active' : ''}${dragUid === f.uid ? ' is-dragging' : ''}${over === i ? ' is-over' : ''}`}
            onMouseDown={() => setActive(f.uid)}
          >
            {on && (
              <div className="ad-floatbar" onMouseDown={(e) => e.stopPropagation()}>
                <button type="button" title="Zmeniť ikonu" onClick={() => setIconMenu((v) => !v)}>
                  <Icon className="w-3.5 h-3.5" /><ChevronDown className="w-3 h-3" />
                </button>
                <button type="button" title="Potiahnutím zmeníte poradie" className="ad-floatbar-grip"
                        onPointerDown={start(f.uid)}>
                  <GripVertical className="w-3.5 h-3.5" />
                </button>
                <button type="button" title="Vymazať fakt" className="is-danger"
                        onClick={() => { onChange(items.filter((x) => x.uid !== f.uid)); setActive(null); }}>
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                {iconMenu && (
                  <div className="ad-iconmenu">
                    {KEY_FACT_ICONS.map((k) => {
                      const I = FACT_ICONS[k] || Star;
                      return (
                        <button key={k} type="button" title={k}
                                className={f.icon === k ? 'is-on' : ''}
                                onClick={() => { patch(f.uid, { icon: k }); setIconMenu(false); }}>
                          <I className="w-3.5 h-3.5" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <Icon className="ad-fact-icon w-4 h-4" />
            {/* Strapi chce popis AJ hodnotu. Chýbajúcu polovicu podčiarkni hneď
                pri písaní — neúplný fakt sa do článku neuloží a pred touto
                značkou sa to dalo zistiť až pri ukladaní. */}
            <div className="ad-fact-fields">
              <GrowField
                className={`ad-fact-label${!f.label.trim() && f.value.trim() ? ' is-missing' : ''}`}
                value={f.label}
                placeholder="Popis — napr. Rozloha"
                title={!f.label.trim() && f.value.trim() ? 'Doplňte popis — bez neho sa fakt neuloží.' : undefined}
                maxLength={MAX.label}
                autoFocus={focusUid === f.uid}
                onChange={(v) => patch(f.uid, { label: v })}
                /* Enter v popise preskočí na hodnotu — píše sa zhora nadol. */
                onEnter={() => focusEnd(valueRefs.current[f.uid]?.current)}
              />
              <GrowField
                inputRef={(valueRefs.current[f.uid] ||= React.createRef<HTMLTextAreaElement>())}
                className={`ad-fact-value${!f.value.trim() && f.label.trim() ? ' is-missing' : ''}`}
                value={f.value}
                placeholder="Hodnota — napr. 7,4 ha"
                title={!f.value.trim() && f.label.trim() ? 'Doplňte hodnotu — bez nej sa fakt neuloží.' : undefined}
                maxLength={MAX.value}
                onChange={(v) => patch(f.uid, { value: v })}
                /* Enter v hodnote fakt potvrdí a rovno otvorí ďalší. */
                onEnter={() => { if (f.label.trim() && f.value.trim()) add(); }}
              />
            </div>
          </div>
        );
      })}

      <button type="button" className="ad-add" onClick={add}>
        <Plus className="w-3.5 h-3.5" /> Pridať fakt
      </button>
      {/* Bez tejto vety nebolo z dvoch riadkov jasné, ktorý je ktorý —
          horný vyzeral ako nadpis, nie ako pole na písanie. */}
      <p className="ad-aside-hint">
        Každý fakt má dva riadky: <b>popis</b> (názov údaja) a pod ním <b>hodnotu</b>.
        Enter vás posunie z popisu na hodnotu a potom na ďalší fakt.
      </p>
    </div>
  );
}

// ── Časová os ────────────────────────────────────────────────────────────────

function TimelineBox({ items, onChange }: { items: Event[]; onChange: (n: Event[]) => void }) {
  const [active, setActive] = useState<string | null>(null);
  const [focusUid, setFocusUid] = useState<string | null>(null);
  const { start, dragUid, over } = useReorder(items, onChange);

  /* Polia sa píšu PRIAMO v časovej osi, nie v plávajúcom okne.
     Okno stálo absolútne vedľa riadka, prekrývalo článok a keď sa mu čokoľvek
     stalo so štýlmi, ostal z neho rám s tlačidlami a nebolo do čoho písať.
     Riadok, do ktorého sa píše na mieste, nemá ako zmiznúť — rovnako to
     funguje v kľúčových faktoch. */
  const titleRefs = useRef<Record<string, React.RefObject<HTMLTextAreaElement>>>({});
  const descRefs = useRef<Record<string, React.RefObject<HTMLTextAreaElement>>>({});
  const refFor = (
    mapa: React.MutableRefObject<Record<string, React.RefObject<HTMLTextAreaElement>>>,
    uid: string,
  ) => (mapa.current[uid] ||= React.createRef<HTMLTextAreaElement>());

  const patch = (uid: string, p: Partial<Event>) =>
    onChange(items.map((e) => (e.uid === uid ? { ...e, ...p } : e)));

  const add = () => {
    const e: Event = { uid: newUid(), year: '', title: '', description: '', type: 'event' };
    onChange([...items, e]);
    setActive(e.uid);
    setFocusUid(e.uid);
  };

  return (
    <div className="ad-aside-box" data-reorder-list>
      <div className="ad-aside-title">
        Časová os {items.length > 0 && <span>{items.length}</span>}
      </div>

      {items.map((ev, i) => {
        const on = active === ev.uid;
        return (
          <div
            key={ev.uid}
            data-reorder-item
            className={`ad-event${on ? ' is-active' : ''}${dragUid === ev.uid ? ' is-dragging' : ''}${over === i ? ' is-over' : ''}`}
            onMouseDown={() => setActive(ev.uid)}
          >
            <div className="ad-event-rail" aria-hidden="true">
              <span className="ad-event-dot" />
              {i < items.length - 1 && <span className="ad-event-line" />}
            </div>

            <div className="ad-event-body">
              {on && (
                <div className="ad-floatbar" onMouseDown={(e) => e.stopPropagation()}>
                  <select
                    className="ad-floatbar-select"
                    value={ev.type}
                    title="Druh udalosti"
                    onChange={(e) => patch(ev.uid, { type: e.target.value })}
                  >
                    {TIMELINE_TYPES.map((t) => (
                      <option key={t} value={t}>{TIMELINE_TYPE_LABELS[t] || t}</option>
                    ))}
                  </select>
                  <button
                    type="button" title="Potiahnutím zmeníte poradie" className="ad-floatbar-grip"
                    onPointerDown={start(ev.uid)}
                  >
                    <GripVertical className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button" title="Vymazať udalosť" className="is-danger"
                    onClick={() => { onChange(items.filter((x) => x.uid !== ev.uid)); setActive(null); }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <GrowField
                className="ad-event-year"
                value={ev.year}
                placeholder="Rok — napr. 9. storočie"
                maxLength={MAX.year}
                autoFocus={focusUid === ev.uid}
                onChange={(v) => patch(ev.uid, { year: v })}
                onEnter={() => focusEnd(refFor(titleRefs, ev.uid).current)}
              />
              <GrowField
                inputRef={refFor(titleRefs, ev.uid)}
                className="ad-event-name"
                value={ev.title}
                placeholder="Názov — napr. Opevnenie valmi"
                maxLength={MAX.title}
                onChange={(v) => patch(ev.uid, { title: v })}
                onEnter={() => focusEnd(refFor(descRefs, ev.uid).current)}
              />
              {(on || ev.description) && (
                <GrowField
                  inputRef={refFor(descRefs, ev.uid)}
                  className="ad-event-desc"
                  value={ev.description}
                  placeholder="Popis — nepovinný, na webe sa ukáže po rozkliknutí"
                  maxLength={MAX.description}
                  onChange={(v) => patch(ev.uid, { description: v })}
                  onEnter={() => { if (ev.year.trim() && ev.title.trim()) add(); }}
                />
              )}
            </div>
          </div>
        );
      })}

      <button type="button" className="ad-add" onClick={add}>
        <Plus className="w-3.5 h-3.5" /> Pridať udalosť
      </button>
      <p className="ad-aside-hint">
        Udalosť má <b>rok</b>, <b>názov</b> a nepovinný <b>popis</b>. Enter vás posunie na ďalšie
        pole a z popisu rovno na novú udalosť; druh udalosti sa mení v lište nad ňou.
      </p>
    </div>
  );
}
