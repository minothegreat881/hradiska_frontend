'use client';

/**
 * KOTVA — ako si pripomienka zapamätá, na ktorom prvku stránky visí.
 *
 * Ukladá sa trojica, nie jedna hodnota, lebo každá sama o sebe raz zlyhá:
 *   1. `selektor` — CSS cesta k prvku (rýchle a presné, kým sa stránka nezmení),
 *   2. `otisokTextu` — začiatok textu prvku (nájde ho aj keď sa poradie posunie),
 *   3. `popisPrvku` — ľudský popis do zoznamu, nech je pripomienka zrozumiteľná
 *      aj vtedy, keď prvok na stránke už vôbec nie je.
 *
 * Poloha kliknutia sa ukladá ako ZLOMOK rozmerov prvku (0–1), takže špendlík
 * drží miesto aj pri inej šírke okna.
 */

export interface Kotva {
  selektor: string;
  otisokTextu: string;
  popisPrvku: string;
  x: number;
  y: number;
}

/** Slovenský názov prvku do popisu — redaktor nečíta značky HTML. */
function nazovPrvku(el: Element): string {
  const t = el.tagName.toLowerCase();
  if (t === 'img') return 'obrázok';
  if (t === 'a') return 'odkaz';
  if (t === 'button') return 'tlačidlo';
  if (t === 'p') return 'odsek';
  if (/^h[1-6]$/.test(t)) return 'nadpis';
  if (t === 'li') return 'položka zoznamu';
  if (t === 'figcaption') return 'popis pod obrázkom';
  if (t === 'figure') return 'obrázok s popisom';
  if (t === 'input' || t === 'textarea') return 'pole';
  if (t === 'section' || t === 'article' || t === 'div') return 'oblasť';
  return t;
}

/** Skrátený text prvku — na odtlačok aj do popisu. */
export function textPrvku(el: Element, dlzka = 120): string {
  const raw = (el instanceof HTMLElement ? el.innerText : el.textContent) || '';
  const t = raw.replace(/\s+/g, ' ').trim();
  return t.slice(0, dlzka);
}

export function popisPrvku(el: Element): string {
  const nazov = nazovPrvku(el);
  if (el.tagName.toLowerCase() === 'img') {
    const alt = (el as HTMLImageElement).alt?.trim();
    const src = (el as HTMLImageElement).src?.split('/').pop() || '';
    return `${nazov} — ${alt || src}`.slice(0, 240);
  }
  const t = textPrvku(el, 60);
  return (t ? `${nazov} — „${t}"` : nazov).slice(0, 240);
}

/**
 * CSS cesta k prvku. Ide zdola nahor, zastaví sa na prvku s `id` (vtedy je
 * cesta krátka aj stabilná) a inak používa poradie medzi súrodencami toho
 * istého druhu. Dlhšie než šesť článkov cesta nebýva užitočná.
 */
export function selektorPre(el: Element): string {
  const cesta: string[] = [];
  let uzol: Element | null = el;

  while (uzol && uzol !== document.body && cesta.length < 6) {
    const znacka = uzol.tagName.toLowerCase();
    if (uzol.id) {
      cesta.unshift(`#${CSS.escape(uzol.id)}`);
      return cesta.join(' > ');
    }
    const rodic: Element | null = uzol.parentElement;
    if (!rodic) break;
    const rovnake = Array.from(rodic.children).filter((s) => s.tagName === uzol!.tagName);
    cesta.unshift(rovnake.length > 1 ? `${znacka}:nth-of-type(${rovnake.indexOf(uzol) + 1})` : znacka);
    uzol = rodic;
  }
  return (cesta.length ? `body ${cesta.join(' > ')}` : 'body').slice(0, 1000);
}

export function kotvaPre(el: Element, klik?: { x: number; y: number }): Kotva {
  const r = el.getBoundingClientRect();
  const x = klik && r.width ? Math.min(1, Math.max(0, (klik.x - r.left) / r.width)) : 0.5;
  const y = klik && r.height ? Math.min(1, Math.max(0, (klik.y - r.top) / r.height)) : 0.5;
  return { selektor: selektorPre(el), otisokTextu: textPrvku(el), popisPrvku: popisPrvku(el), x, y };
}

/**
 * Nájdenie prvku podľa kotvy. Najprv selektor (a overí sa odtlačkom textu),
 * potom hľadanie podľa odtlačku po celej stránke. Keď sa prvok nenájde,
 * pripomienka sa v paneli ukáže ako „prvok sa nenašiel" — nezahodí sa.
 */
export function najdiPodlaKotvy(k: { selektor?: string | null; otisokTextu?: string | null }): Element | null {
  const otisok = (k.otisokTextu || '').trim();

  if (k.selektor) {
    try {
      const el = document.querySelector(k.selektor);
      if (el && (!otisok || textPrvku(el).startsWith(otisok.slice(0, 40)))) return el;
      if (el && !otisok) return el;
    } catch { /* neplatný selektor po zmene stránky */ }
  }

  if (otisok.length >= 10) {
    const zaciatok = otisok.slice(0, 40);
    const kandidati = document.querySelectorAll('p, li, h1, h2, h3, h4, figcaption, a, span, div');
    for (const el of Array.from(kandidati)) {
      if (textPrvku(el).startsWith(zaciatok)) return el;
    }
  }
  return null;
}
