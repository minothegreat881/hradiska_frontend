'use client';

/**
 * VRSTVA NAD PLÁTNOM — výber, rám a štítok, lišta prvku, ťahanie, miesta
 * vloženia, „+" na konci zoznamov, upozornenia a písanie priamo v stránke.
 *
 * Žije v okne plátna (iframe) ako absolútne umiestnená vrstva nad stránkou
 * a nič v rozvrhu webu neposúva (vzor `editor/BlockOverlay.tsx`). Prvky webu
 * nesú `data-vw` (len v režime úprav); vrstva ich meria a pýta sa `prvky.ts`,
 * čo sa s nimi dá robiť.
 *
 * Udalosti: poslucháči na dokumente plátna vo fáze zachytávania. Klik na
 * prvok webu ho VYBERIE a nič iné — odkazy, tlačidlá a ponuky webu sú na
 * plátne vypnuté (`click` sa zastaví skôr, než ho dostane React webu).
 * Ťahanie je na ukazovateľových udalostiach (žiadna knižnica): stlačiť na
 * prvku zo zoznamu a potiahnuť o viac ako 5 px.
 *
 * Písanie: text prvku sa na chvíľu nahradí jedným `contenteditable` spanom
 * (len text, bez formátovania); React o ňom nevie a jeho textové uzly ostanú
 * nedotknuté. Enter potvrdí, Esc vráti — vtedy sa pôvodné uzly vrátia na
 * miesto a zmenu zapíše editor do vzhľadu. Po potvrdení teda plátno kreslí
 * zas len web, žiadne písmo ani okraje úprav.
 */

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  GripVertical, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Eye, EyeOff, Trash2, Image as ImageIcon,
  Type, Pin, CornerLeftUp, FileEdit, ExternalLink, Plus,
} from 'lucide-react';
import type { Jazyk, Vzhlad } from '../../lib/vzhlad/typy';
import { opisPrvku, presunPrvku, obalZoznamu, type KontextPrvku, type OpisPrvku, type TextPrvku, type Smer } from './prvky';
import { stavPrekladu, jeVyhrada, POPIS_STAVU } from './stav/preklady';
import { klucOdkazu } from './stav/operacie';

export type AkciaVrstvy =
  | { druh: 'obrazok'; opis: OpisPrvku }
  | { druh: 'odstranit'; opis: OpisPrvku }
  | { druh: 'clanok'; dokument: string }
  | { druh: 'kategoria'; slug: string }
  | { druh: 'pridat'; opis: OpisPrvku }
  | { druh: 'pripnut'; opis: OpisPrvku }
  | { druh: 'text'; opis: OpisPrvku; text: TextPrvku; jazyk: Jazyk; hodnota: string };

export interface UpozornenieNaPlatne { farba: 'zlta' | 'cervena' | 'siva' | 'modra'; text: string }

interface Obdlznik { x: number; y: number; w: number; h: number }

const obdlznik = (el: Element): Obdlznik | null => {
  const r = el.getBoundingClientRect();
  if (!r.width && !r.height) return null;
  const okno = el.ownerDocument.defaultView;
  return { x: r.left + (okno?.scrollX ?? 0), y: r.top + (okno?.scrollY ?? 0), w: r.width, h: r.height };
};

const VIDITELNY = (el: Element) => {
  const r = el.getBoundingClientRect();
  return r.width > 0 || r.height > 0;
};

/** Prvý viditeľný prvok so značkou (tá istá značka môže byť aj v skrytej mobilnej ponuke). */
export function najdiPrvok(doc: Document, nazov: string): HTMLElement | null {
  const vsetky = doc.querySelectorAll(`[data-vw="${nazov.replace(/"/g, '\\"')}"]`);
  for (const el of vsetky) if (VIDITELNY(el)) return el as HTMLElement;
  return null;
}

/** Všetky viditeľné prvky so značkou v poradí dokumentu (šípky menia výber po nich). */
export function viditelnePrvky(doc: Document): HTMLElement[] {
  return [...doc.querySelectorAll('[data-vw]')].filter(VIDITELNY) as HTMLElement[];
}

/** Miesto, kam pustený prvok spadne. */
interface Ciel { zoznam: string; slot: number; ciara: Obdlznik; smer: Smer }

interface Tahanie {
  opis: OpisPrvku;
  x: number;
  y: number;
  ciel: Ciel | null;
  zoznamy: Map<string, { smer: Smer; polozky: { index: number; r: Obdlznik }[]; obal: Obdlznik | null }>;
}

interface Pisanie {
  nazov: string;
  text: TextPrvku;
  jazyk: Jazyk;
  ciel: HTMLElement;
  span: HTMLSpanElement;
  uzly: ChildNode[];
  povodny: string;
  dlzka: number;
}

export interface VrstvaProps {
  doc: Document;
  kontext: Omit<KontextPrvku, 'el'>;
  vyber: string | null;
  onVyber: (nazov: string | null) => void;
  lenNaCitanie: boolean;
  onZmena: (popis: string, fn: (v: Vzhlad) => void) => void;
  onAkcia: (a: AkciaVrstvy) => void;
  /** Upozornenia z kontroly (neplatné odkazy) podľa prvku. */
  upozornenia: Map<string, UpozornenieNaPlatne[]>;
  /** Požiadavka zvonka: začni písať do vybraného prvku (Enter, tlačidlo v paneli). */
  pisatTeraz: number;
}

export function Vrstva({ doc, kontext, vyber, onVyber, lenNaCitanie, onZmena, onAkcia, upozornenia, pisatTeraz }: VrstvaProps) {
  const [nad, setNad] = useState<string | null>(null);
  const [, setTik] = useState(0);
  const [tahanie, setTahanie] = useState<Tahanie | null>(null);
  const [pisanie, setPisanie] = useState<Pisanie | null>(null);
  const [dlzkaPisania, setDlzkaPisania] = useState(0);
  const tahRef = useRef<Tahanie | null>(null);
  tahRef.current = tahanie;
  const pisRef = useRef<Pisanie | null>(null);
  pisRef.current = pisanie;

  /* Najnovšie hodnoty pre poslucháčov dokumentu (registrujú sa raz). */
  const stav = useRef({ kontext, vyber, lenNaCitanie, onVyber, onZmena, onAkcia });
  stav.current = { kontext, vyber, lenNaCitanie, onVyber, onZmena, onAkcia };

  const opis = useCallback((el: Element | null): OpisPrvku | null => {
    const n = el?.getAttribute('data-vw');
    return n ? opisPrvku(n, { ...stav.current.kontext, el }) : null;
  }, []);

  /* ── Meranie: prekresli pri každej zmene stránky (výška, obsah, obrázky) ── */
  useEffect(() => {
    const okno = doc.defaultView!;
    let caka = 0;
    const tik = () => { if (caka) return; caka = okno.requestAnimationFrame(() => { caka = 0; setTik((n) => n + 1); }); };
    const ro = new ResizeObserver(tik);
    ro.observe(doc.body);
    const mo = new MutationObserver(tik);
    mo.observe(doc.body, { childList: true, subtree: true, characterData: true });
    doc.addEventListener('load', tik, true);
    const t = okno.setInterval(tik, 1000);
    return () => { ro.disconnect(); mo.disconnect(); doc.removeEventListener('load', tik, true); okno.clearInterval(t); if (caka) okno.cancelAnimationFrame(caka); };
  }, [doc]);

  /* ── Písanie priamo v stránke ── */
  const ukonciPisanie = useCallback((potvrdit: boolean) => {
    const p = pisRef.current;
    if (!p) return;
    pisRef.current = null;
    setPisanie(null);
    const hodnota = (p.span.textContent ?? '').replace(/[\r\n]+/g, ' ').replace(/\s+$/g, '').replace(/^\s+/g, '');
    /* Pôvodné uzly Reactu späť presne na miesto spanu. */
    if (p.span.isConnected) {
      for (const u of p.uzly) p.span.parentNode?.insertBefore(u, p.span);
      p.span.remove();
    }
    if (potvrdit && hodnota !== p.povodny) {
      const o = opisPrvku(p.nazov, { ...stav.current.kontext, el: najdiPrvok(doc, p.nazov) });
      if (o) stav.current.onAkcia({ druh: 'text', opis: o, text: p.text, jazyk: p.jazyk, hodnota });
    }
  }, [doc]);

  const zacniPisanie = useCallback((el: HTMLElement, t: TextPrvku) => {
    if (stav.current.lenNaCitanie || pisRef.current) return;
    const nazov = el.getAttribute('data-vw');
    if (!nazov) return;
    const ciel = (t.selektor ? el.querySelector(t.selektor) : el) as HTMLElement | null;
    if (!ciel) return;
    const uzly = [...ciel.childNodes].filter((u) => u.nodeType === 3);
    const povodny = uzly.map((u) => (u as globalThis.Text).data).join('').trim();
    const span = doc.createElement('span');
    span.className = 'vw-pise';
    span.setAttribute('contenteditable', 'plaintext-only');
    span.setAttribute('data-vw-pise', '1');
    span.setAttribute('spellcheck', 'true');
    span.textContent = povodny;
    if (uzly.length) ciel.insertBefore(span, uzly[0]);
    else ciel.appendChild(span);
    for (const u of uzly) u.remove();
    const p: Pisanie = { nazov, text: t, jazyk: stav.current.kontext.j, ciel, span, uzly, povodny, dlzka: povodny.length };
    pisRef.current = p;
    setPisanie(p);
    setDlzkaPisania(povodny.length);
    span.focus();
    const sel = doc.defaultView?.getSelection();
    if (sel) { const rng = doc.createRange(); rng.selectNodeContents(span); sel.removeAllRanges(); sel.addRange(rng); }
    span.addEventListener('input', () => setDlzkaPisania((span.textContent ?? '').length));
    span.addEventListener('beforeinput', (e: InputEvent) => {
      if (e.inputType.startsWith('delete') || e.inputType === 'historyUndo' || e.inputType === 'historyRedo') return;
      if (e.inputType === 'insertParagraph' || e.inputType === 'insertLineBreak') { e.preventDefault(); return; }
      const sel2 = doc.defaultView?.getSelection();
      const oznacene = sel2 && sel2.rangeCount ? sel2.toString().length : 0;
      const pribudne = (e.data ?? e.dataTransfer?.getData('text/plain') ?? '').length;
      if ((span.textContent ?? '').length - oznacene + pribudne > t.limit) e.preventDefault();
    });
    span.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); ukonciPisanie(true); }
      else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); ukonciPisanie(false); }
    });
    span.addEventListener('blur', () => { if (pisRef.current?.span === span) ukonciPisanie(true); });
  }, [doc, ukonciPisanie]);

  /* Zvonka (Enter v editore, tlačidlo „Upraviť text"). */
  const pisatPosledne = useRef(pisatTeraz);
  useEffect(() => {
    if (pisatTeraz === pisatPosledne.current) return;
    pisatPosledne.current = pisatTeraz;
    const n = stav.current.vyber;
    const el = n ? najdiPrvok(doc, n) : null;
    const o = opis(el);
    if (el && o?.texty[0]) zacniPisanie(el, o.texty[0]);
  }, [pisatTeraz, doc, opis, zacniPisanie]);

  /* Výber iného prvku alebo zmena jazyka ukončí písanie (potvrdí ho). */
  useEffect(() => { if (pisRef.current && pisRef.current.nazov !== vyber) ukonciPisanie(true); }, [vyber, ukonciPisanie]);
  useEffect(() => () => { if (pisRef.current) ukonciPisanie(false); }, [ukonciPisanie]);

  /* ── Ťahanie ── */
  const pripravCiele = useCallback((o: OpisPrvku): Tahanie['zoznamy'] => {
    const zoznamy: Tahanie['zoznamy'] = new Map();
    const rodina = o.zoznam!.rodina;
    for (const el of viditelnePrvky(doc)) {
      const p = opis(el);
      if (!p?.zoznam || p.zoznam.rodina !== rodina) continue;
      const r = obdlznik(el);
      if (!r) continue;
      let z = zoznamy.get(p.zoznam.zoznam);
      if (!z) { z = { smer: p.zoznam.smer, polozky: [], obal: null }; zoznamy.set(p.zoznam.zoznam, z); }
      z.polozky.push({ index: p.zoznam.index, r });
    }
    /* Prázdne zoznamy tej istej rodiny (druhý riadok menu bez kategórií). */
    if (rodina === 'menu') {
      for (const zn of ['menu:hlavny', 'menu:dalsi']) {
        const el = najdiPrvok(doc, zn);
        const r = el && obdlznik(el);
        if (!r) continue;
        const z = zoznamy.get(zn) ?? { smer: o.zoznam!.smer, polozky: [], obal: null };
        z.obal = r;
        zoznamy.set(zn, z);
      }
    }
    for (const z of zoznamy.values()) z.polozky.sort((a, b) => a.index - b.index);
    return zoznamy;
  }, [doc, opis]);

  const najdiCiel = (t: Tahanie, x: number, y: number): Ciel | null => {
    let najlepsi: { d: number; c: Ciel } | null = null;
    for (const [zoznam, z] of t.zoznamy) {
      const vod = z.smer === 'vodorovne';
      if (!z.polozky.length) {
        if (z.obal && x >= z.obal.x && x <= z.obal.x + z.obal.w && y >= z.obal.y && y <= z.obal.y + z.obal.h) {
          const c: Ciel = { zoznam, slot: 0, smer: z.smer, ciara: vod ? { x: z.obal.x + 4, y: z.obal.y, w: 3, h: z.obal.h } : { x: z.obal.x, y: z.obal.y + 2, w: z.obal.w, h: 3 } };
          return c;
        }
        continue;
      }
      for (let k = 0; k < z.polozky.length; k++) {
        const { index, r } = z.polozky[k];
        const dx = x < r.x ? r.x - x : x > r.x + r.w ? x - r.x - r.w : 0;
        const dy = y < r.y ? r.y - y : y > r.y + r.h ? y - r.y - r.h : 0;
        const d = Math.hypot(dx, dy * (vod ? 2 : 1));
        const za = vod ? x > r.x + r.w / 2 : y > r.y + r.h / 2;
        const slot = za ? index + 1 : index;
        const ciara = vod
          ? { x: za ? r.x + r.w + 3 : r.x - 6, y: r.y, w: 3, h: r.h }
          : { x: r.x, y: za ? r.y + r.h + 3 : r.y - 6, w: r.w, h: 3 };
        if (!najlepsi || d < najlepsi.d) najlepsi = { d, c: { zoznam, slot, ciara, smer: z.smer } };
      }
    }
    return najlepsi && najlepsi.d < 260 ? najlepsi.c : null;
  };

  const pustit = useCallback((t: Tahanie) => {
    const o = t.opis;
    const c = t.ciel;
    if (!o.zoznam || !c) return;
    const { zoznam, index, rodina } = o.zoznam;
    if (c.zoznam === zoznam && (c.slot === index || c.slot === index + 1)) return;
    const { r, db } = stav.current.kontext;
    stav.current.onZmena(`presun: ${o.stitok}`, (v) => presunPrvku(v, rodina, zoznam, index, c.zoznam, c.slot, { r, db }));
    /* Výber ide s prvkom (značka dlaždice nesie skupinu, zoznamové značky index). */
    const casti = o.nazov.split(':');
    const novyIndex = c.zoznam === zoznam && c.slot > index ? c.slot - 1 : c.slot;
    if (casti[0] === 'dlazdica') stav.current.onVyber(`dlazdica:${c.zoznam.split(':')[1]}:${casti[2]}`);
    else if (['popularne', 'kronika'].includes(casti[0]) || (casti[0] === 'pridajte-sa' && casti[1] === 'prosba')) {
      stav.current.onVyber([...casti.slice(0, -1), String(novyIndex)].join(':'));
    } else if (casti[0] === 'pata' && casti[1] === 'odkaz') stav.current.onVyber(`pata:odkaz:${c.zoznam.split(':')[1]}:${novyIndex}`);
  }, []);

  /* ── Poslucháči dokumentu plátna ── */
  useEffect(() => {
    let cakajuce: { el: HTMLElement; x: number; y: number; id: number } | null = null;
    const vVrstve = (t: EventTarget | null) => !!(t as Element | null)?.closest?.('.vw-vrstva');
    const vPisani = (t: EventTarget | null) => !!(t as Element | null)?.closest?.('[data-vw-pise]');
    const prvok = (t: EventTarget | null) => (t as Element | null)?.closest?.('[data-vw]') as HTMLElement | null;

    const pohyb = (e: MouseEvent) => {
      if (tahRef.current) return;
      const el = vVrstve(e.target) ? null : prvok(e.target);
      setNad(el?.getAttribute('data-vw') ?? null);
    };
    const odchod = () => setNad(null);

    const dole = (e: PointerEvent) => {
      if (vVrstve(e.target) || vPisani(e.target)) return;
      if (e.button !== 0) return;
      if (pisRef.current) ukonciPisanie(true);
      const el = prvok(e.target);
      cakajuce = el ? { el, x: e.clientX, y: e.clientY, id: e.pointerId } : null;
      if (!el) stav.current.onVyber(null);
    };
    const tah = (e: PointerEvent) => {
      const t = tahRef.current;
      if (t) {
        const okno = doc.defaultView!;
        const x = e.clientX + okno.scrollX, y = e.clientY + okno.scrollY;
        const n: Tahanie = { ...t, x, y, ciel: najdiCiel(t, x, y) };
        tahRef.current = n;
        setTahanie(n);
        return;
      }
      if (!cakajuce || stav.current.lenNaCitanie) return;
      if (Math.hypot(e.clientX - cakajuce.x, e.clientY - cakajuce.y) < 6) return;
      const o = opis(cakajuce.el);
      if (!o?.zoznam) { cakajuce = null; return; }
      stav.current.onVyber(o.nazov);
      const okno = doc.defaultView!;
      const n: Tahanie = { opis: o, x: e.clientX + okno.scrollX, y: e.clientY + okno.scrollY, ciel: null, zoznamy: pripravCiele(o) };
      n.ciel = najdiCiel(n, n.x, n.y);
      tahRef.current = n;
      setTahanie(n);
      cakajuce = null;
    };
    const hore = (e: PointerEvent) => {
      const t = tahRef.current;
      if (t) {
        tahRef.current = null;
        setTahanie(null);
        pustit(t);
        e.preventDefault();
        return;
      }
      if (cakajuce) {
        const n = cakajuce.el.getAttribute('data-vw');
        stav.current.onVyber(n);
        cakajuce = null;
      }
    };
    const klik = (e: MouseEvent) => {
      if (vVrstve(e.target) || vPisani(e.target)) return;
      e.preventDefault();
      e.stopPropagation();
    };
    const dvojklik = (e: MouseEvent) => {
      if (vVrstve(e.target) || vPisani(e.target)) return;
      e.preventDefault();
      e.stopPropagation();
      const el = prvok(e.target);
      const o = opis(el);
      if (!el || !o?.texty.length) return;
      const ciel = e.target as Element;
      const t = o.texty.find((x) => x.selektor && ciel.closest?.(x.selektor)) ?? o.texty[0];
      stav.current.onVyber(o.nazov);
      zacniPisanie(el, t);
    };
    const zakaz = (e: Event) => { if (!vPisani(e.target)) e.preventDefault(); };
    /* Bez označovania textu a bez zamerania odkazov a polí webu (klik len vyberá). */
    const mysDole = (e: MouseEvent) => { if (!vVrstve(e.target) && !vPisani(e.target)) e.preventDefault(); };

    doc.addEventListener('mousemove', pohyb, true);
    doc.addEventListener('mouseleave', odchod, true);
    doc.addEventListener('pointerdown', dole, true);
    doc.addEventListener('pointermove', tah, true);
    doc.addEventListener('pointerup', hore, true);
    doc.addEventListener('click', klik, true);
    doc.addEventListener('auxclick', klik, true);
    doc.addEventListener('dblclick', dvojklik, true);
    doc.addEventListener('dragstart', zakaz, true);
    doc.addEventListener('submit', zakaz, true);
    doc.addEventListener('selectstart', zakaz, true);
    doc.addEventListener('mousedown', mysDole, true);
    return () => {
      doc.removeEventListener('selectstart', zakaz, true);
      doc.removeEventListener('mousedown', mysDole, true);
      doc.removeEventListener('mousemove', pohyb, true);
      doc.removeEventListener('mouseleave', odchod, true);
      doc.removeEventListener('pointerdown', dole, true);
      doc.removeEventListener('pointermove', tah, true);
      doc.removeEventListener('pointerup', hore, true);
      doc.removeEventListener('click', klik, true);
      doc.removeEventListener('auxclick', klik, true);
      doc.removeEventListener('dblclick', dvojklik, true);
      doc.removeEventListener('dragstart', zakaz, true);
      doc.removeEventListener('submit', zakaz, true);
    };
  }, [doc, opis, pripravCiele, pustit, ukonciPisanie, zacniPisanie]);

  /* Úchyt v lište: ťahanie začne hneď (bez prahu 6 px). */
  const zacniTahanieZUchytu = (o: OpisPrvku) => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!o.zoznam || lenNaCitanie) return;
    const okno = doc.defaultView!;
    const n: Tahanie = { opis: o, x: e.clientX + okno.scrollX, y: e.clientY + okno.scrollY, ciel: null, zoznamy: pripravCiele(o) };
    tahRef.current = n;
    setTahanie(n);
  };

  /* ── Kreslenie ── */
  const elVyber = vyber ? najdiPrvok(doc, vyber) : null;
  const opVyber = opis(elVyber);
  const rVyber = elVyber ? obdlznik(elVyber) : null;
  const elNad = nad && nad !== vyber ? najdiPrvok(doc, nad) : null;
  const opNad = opis(elNad);
  const rNad = elNad ? obdlznik(elNad) : null;
  const sirka = doc.documentElement.clientWidth;
  const j = kontext.j;
  /* Plátno počítača je zmenšené (CSS mierka okna) — ovládanie vrstvy sa
     zväčší naspäť, aby lišta a štítky mali na obrazovke stále tú istú veľkosť. */
  const ram = doc.defaultView?.frameElement as HTMLElement | null;
  const mierkaOkna = ram ? ram.getBoundingClientRect().width / (ram.offsetWidth || 1) : 1;
  const m = mierkaOkna > 0.05 && mierkaOkna < 1 ? 1 / mierkaOkna : 1;

  /* Prvok s rodičom so značkou — „vybrať nadradený". */
  const rodic = elVyber?.parentElement?.closest('[data-vw]')?.getAttribute('data-vw') ?? null;

  /* Upozornenia a „+" pre všetky viditeľné prvky. */
  const znacky: React.ReactNode[] = [];
  const plusy: React.ReactNode[] = [];
  const prvky = viditelnePrvky(doc);
  const vZoznamoch = new Map<string, Obdlznik[]>();
  const opisy = new Map<HTMLElement, OpisPrvku>();
  for (const el of prvky) {
    const o = opis(el);
    if (!o) continue;
    opisy.set(el, o);
    if (o.zoznam) {
      const r = obdlznik(el);
      if (r) vZoznamoch.set(o.zoznam.zoznam, [...(vZoznamoch.get(o.zoznam.zoznam) ?? []), r]);
    }
  }
  for (const [el, o] of opisy) {
    const r = obdlznik(el);
    if (!r) continue;
    const zoznam: UpozornenieNaPlatne[] = [...(upozornenia.get(o.nazov) ?? [])];
    if (o.neplatny) zoznam.push({ farba: 'cervena', text: o.neplatny });
    if (o.obrazok && (o.druh === 'dlazdica' || o.druh === 'lista')) {
      const ob = o.obrazok.ziskaj(kontext.v);
      if (!ob || ('id' in ob && !kontext.r.subory[String(ob.id)])) zoznam.push({ farba: 'siva', text: 'bez obrázka' });
    }
    if (o.druh === 'menu' && o.kategoria) {
      const d = kontext.db.find((k) => k.slug === o.kategoria);
      if (d && !kontext.v.kategorie.some((k) => klucOdkazu(k.kategoria) === d.documentId || k.kategoria.slug === d.slug)) {
        zoznam.push({ farba: 'modra', text: 'bez vzhľadu — pridať' });
      }
    }
    let prekladVyhrada = false;
    if (j !== 'sk') {
      for (const t of o.texty) {
        if (t.druh === 'retazec') continue;
        const s = stavPrekladu(t.ziskaj(kontext.v) as never, j, t.druh === 'volitelny');
        if (jeVyhrada(s)) prekladVyhrada = true;
      }
    }
    zoznam.forEach((u, i) => {
      znacky.push(
        <span key={`${o.nazov}-z-${i}`} className={`vw-znacka vw-znacka-${u.farba} pointer-events-none`} style={{ left: Math.min(r.x + 4, sirka - 140 * m), top: r.y + 4 + i * 20 * m }}>
          {u.text}
        </span>,
      );
    });
    if (prekladVyhrada) {
      znacky.push(<span key={`${o.nazov}-p`} className="vw-bodka vw-bodka-zlta pointer-events-none" title="chýbajúci alebo zastaraný preklad" style={{ left: Math.min(r.x + r.w - 6, sirka - 14), top: r.y - 5 }} />);
    }
    if (o.pridat && !lenNaCitanie) {
      const polozky = o.pridat.zaZoznamom ? vZoznamoch.get(o.pridat.zaZoznamom) ?? [] : [];
      const posledny = polozky.length ? polozky.reduce((a, b) => (b.y > a.y + 4 || (Math.abs(b.y - a.y) <= 4 && b.x > a.x) ? b : a)) : null;
      const zvisle = o.pridat.zaZoznamom?.startsWith('pata-odkazy') || o.pridat.zaZoznamom?.startsWith('riadky');
      /* Vedľa posledného prvku; keď vpravo nie je miesto (rad cez celú šírku), pod neho. */
      const sirkaPlusu = 130 * m;
      const pozicia = !posledny
        ? { left: r.x + 6, top: r.y + r.h - 32 * m }
        : zvisle ? { left: posledny.x, top: posledny.y + posledny.h + 6 }
        : posledny.x + posledny.w + 14 + sirkaPlusu <= sirka
          ? { left: posledny.x + posledny.w + 14, top: posledny.y + Math.max(0, posledny.h / 2 - 13 * m) }
          : { left: Math.max(0, posledny.x + posledny.w - sirkaPlusu), top: posledny.y + posledny.h + 6 };
      plusy.push(
        <button key={`${o.nazov}-plus`} type="button" className="vw-plus" style={pozicia} title={o.pridat.popis}
                aria-label={o.pridat.popis} data-vw-plus={o.nazov}
                onClick={(e) => { e.stopPropagation(); onAkcia({ druh: 'pridat', opis: o }); }}>
          <Plus /> {o.pridat.popis.replace(/^Pridať /, '')}
        </button>,
      );
    }
  }

  /* Lišta vybraného prvku. */
  const lista = (() => {
    if (!opVyber || !rVyber || pisanie || lenNaCitanie) return null;
    const o = opVyber;
    const z = o.zoznam;
    const vod = z?.smer === 'vodorovne';
    const posun = (d: -1 | 1) => () => {
      if (!z) return;
      onZmena(`presun: ${o.stitok}`, (v) => { posunOJedno(o, d, kontext, v); });
      const casti = o.nazov.split(':');
      if (casti[0] === 'dlazdica') {
        const skupiny = kontext.v.domov.dlazdice.skupiny;
        const si = skupiny.findIndex((s) => s.id === casti[1]);
        if (d < 0 && z.index === 0 && si > 0) onVyber(`dlazdica:${skupiny[si - 1].id}:${casti[2]}`);
        if (d > 0 && z.index === z.dlzka - 1 && si < skupiny.length - 1) onVyber(`dlazdica:${skupiny[si + 1].id}:${casti[2]}`);
      }
      if (['popularne', 'kronika'].includes(casti[0]) || (casti[0] === 'pridajte-sa' && casti[1] === 'prosba')) onVyber([...casti.slice(0, -1), String(z.index + d)].join(':'));
      else if (casti[0] === 'pata' && casti[1] === 'odkaz') onVyber(`pata:odkaz:${casti[2]}:${z.index + d}`);
    };
    const hore = rVyber.y > 44 * m;
    const styl: React.CSSProperties = { left: Math.max(0, Math.min(rVyber.x, sirka - 440 * m)), top: hore ? rVyber.y - 8 : rVyber.y + rVyber.h + 8 };
    if (tahanie) return null;
    return (
      <div className={`vw-lista pointer-events-none${hore ? ' je-hore' : ''}`} style={styl} data-vw-lista={o.nazov}>
        {z && (
          <>
            <button type="button" className="vw-uchyt" title="Potiahnutím presuniete" aria-label="Presunúť ťahaním" onPointerDown={zacniTahanieZUchytu(o)}><GripVertical /></button>
            <button type="button" title={vod ? 'Posunúť doľava (Alt+←)' : 'Posunúť vyššie (Alt+↑)'} aria-label="Posunúť dopredu" disabled={z.index <= 0 && o.druh !== 'dlazdica'} onClick={posun(-1)}>{vod ? <ArrowLeft /> : <ArrowUp />}</button>
            <button type="button" title={vod ? 'Posunúť doprava (Alt+→)' : 'Posunúť nižšie (Alt+↓)'} aria-label="Posunúť dozadu" disabled={z.index >= z.dlzka - 1 && o.druh !== 'dlazdica'} onClick={posun(1)}>{vod ? <ArrowRight /> : <ArrowDown />}</button>
            <span className="vw-lista-sep pointer-events-none" />
          </>
        )}
        {o.skryt && (
          <button type="button" className={o.skryt.skryty ? 'is-on' : ''} title={o.skryt.skryty ? `Zobraziť ${o.skryt.popis} na webe` : `Skryť ${o.skryt.popis} na webe`}
                  aria-label={o.skryt.skryty ? 'Zobraziť na webe' : 'Skryť na webe'} data-vw-akcia="skryt"
                  onClick={() => onZmena(o.skryt!.skryty ? `zobrazenie: ${o.stitok}` : `skrytie: ${o.stitok}`, o.skryt!.prepni)}>
            {o.skryt.skryty ? <EyeOff /> : <Eye />}
          </button>
        )}
        {o.texty.length > 0 && (
          <button type="button" title="Upraviť text priamo v stránke (Enter)" aria-label="Upraviť text" data-vw-akcia="text"
                  onClick={() => elVyber && zacniPisanie(elVyber, o.texty[0])}><Type /></button>
        )}
        {o.obrazok && (
          <button type="button" title="Vymeniť obrázok" aria-label="Vymeniť obrázok" data-vw-akcia="obrazok" onClick={() => onAkcia({ druh: 'obrazok', opis: o })}><ImageIcon /></button>
        )}
        {o.pripnut && (
          <button type="button" title={o.pripnut.popis} aria-label={o.pripnut.popis} data-vw-akcia="pripnut" onClick={() => onAkcia({ druh: 'pripnut', opis: o })}><Pin /></button>
        )}
        {o.clanok && (
          <button type="button" title="Upraviť článok v editore článkov" aria-label="Upraviť článok" data-vw-akcia="clanok" onClick={() => onAkcia({ druh: 'clanok', dokument: o.clanok! })}><FileEdit /></button>
        )}
        {o.kategoria && kontext.stranka.druh !== 'kategoria' && (
          <button type="button" title="Otvoriť stránku kategórie v editore" aria-label="Otvoriť stránku kategórie" data-vw-akcia="kategoria" onClick={() => onAkcia({ druh: 'kategoria', slug: o.kategoria! })}><ExternalLink /></button>
        )}
        {rodic && (
          <button type="button" title="Vybrať nadradený prvok" aria-label="Vybrať nadradený prvok" onClick={() => onVyber(rodic)}><CornerLeftUp /></button>
        )}
        {o.odstranit && (
          <>
            <span className="vw-lista-sep pointer-events-none" />
            <button type="button" className="vw-nebezpecne" title={`Odstrániť ${o.odstranit.popis} (Delete)`} aria-label="Odstrániť" data-vw-akcia="odstranit" onClick={() => onAkcia({ druh: 'odstranit', opis: o })}><Trash2 /></button>
          </>
        )}
      </div>
    );
  })();

  /* Slovník a preklad pri vybranom alebo nabehnutom prvku. */
  const stitokPrekladu = (o: OpisPrvku | null) => {
    if (!o || j === 'sk') return '';
    const stavy = o.texty.filter((t) => t.druh !== 'retazec').map((t) => stavPrekladu(t.ziskaj(kontext.v) as never, j, t.druh === 'volitelny'));
    const s = stavy.find(jeVyhrada) ?? stavy.find((x) => x === 'slovnik');
    return s ? ` · ${POPIS_STAVU[s]}` : '';
  };

  const ciara = tahanie?.ciel?.ciara;
  return (
    <div className="vw-vrstva pointer-events-none" aria-hidden={false} style={{ ['--vw-m' as string]: String(m) }}>
      {znacky}
      {rNad && opNad && !tahanie && (
        <div className="vw-ram vw-ram-nad pointer-events-none" style={{ left: rNad.x, top: rNad.y, width: rNad.w, height: rNad.h }}>
          <span className={`vw-stitok pointer-events-none${rNad.y < 26 * m ? ' vw-stitok-dole' : ''}`}>{opNad.stitok}{stitokPrekladu(opNad)}</span>
        </div>
      )}
      {rVyber && opVyber && (
        <div className={`vw-ram ${pisanie ? 'vw-ram-pise' : tahanie ? 'vw-ram-tahany' : 'vw-ram-vybrany'} pointer-events-none`} style={{ left: rVyber.x, top: rVyber.y, width: rVyber.w, height: rVyber.h }} data-vw-vybrane={opVyber.nazov}>
          {!lista && <span className={`vw-stitok pointer-events-none${rVyber.y < 26 * m ? ' vw-stitok-dole' : ''}`}>{opVyber.stitok}{stitokPrekladu(opVyber)}</span>}
        </div>
      )}
      {lista}
      {plusy}
      {pisanie && rVyber && (
        <span className={`vw-pocitadlo pointer-events-none${dlzkaPisania >= pisanie.text.limit ? ' je-plne' : ''}`} style={{ left: rVyber.x, top: rVyber.y + rVyber.h + 8 }}>
          {pisanie.jazyk.toUpperCase()} · {dlzkaPisania} / {pisanie.text.limit} · Enter potvrdí, Esc vráti
        </span>
      )}
      {ciara && <div className={`vw-ciara ${ciara.w > ciara.h ? 'vw-ciara-vodorovne' : 'vw-ciara-zvisle'} pointer-events-none`} style={{ left: ciara.x, top: ciara.y, width: ciara.w, height: ciara.h }} />}
      {tahanie && <span className="vw-tahany-duch pointer-events-none" style={{ left: tahanie.x, top: tahanie.y }}>{tahanie.opis.stitok}</span>}
    </div>
  );
}

/** Pre klávesy: presun vybraného prvku o jedno miesto (Alt+šípky). */
export function posunOJedno(o: OpisPrvku, d: -1 | 1, kontext: Omit<KontextPrvku, 'el'>, v: Vzhlad): boolean {
  const z = o.zoznam;
  if (!z) return false;
  if (o.druh === 'dlazdica') {
    const skupiny = v.domov.dlazdice.skupiny;
    const si = skupiny.findIndex((s) => `dlazdice:${s.id}` === z.zoznam);
    if (d < 0 && z.index === 0 && si > 0) { presunPrvku(v, z.rodina, z.zoznam, z.index, `dlazdice:${skupiny[si - 1].id}`, skupiny[si - 1].polozky.length, kontext); return true; }
    if (d > 0 && z.index === z.dlzka - 1 && si < skupiny.length - 1) { presunPrvku(v, z.rodina, z.zoznam, z.index, `dlazdice:${skupiny[si + 1].id}`, 0, kontext); return true; }
  }
  if ((d < 0 && z.index <= 0) || (d > 0 && z.index >= z.dlzka - 1)) return false;
  presunPrvku(v, z.rodina, z.zoznam, z.index, z.zoznam, d < 0 ? z.index - 1 : z.index + 2, kontext);
  return true;
}

export { obalZoznamu };

/** Pre plátno: pri meraní okna ho spustiť znova (napr. po zmene vybraného prvku). */
export function useTikPriZmene(dep: unknown) {
  const [, set] = useState(0);
  useLayoutEffect(() => { set((n) => n + 1); }, [dep]);
}
