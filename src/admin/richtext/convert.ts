/**
 * Obojsmerný prevod medzi Strapi Blocks a TipTap dokumentom.
 *
 * ── Čo sa v korpuse (7 704 blokov) REÁLNE vyskytuje ────────────────────────
 *   bloky   paragraph 6642 · heading level 2 (1084) · list unordered (18)
 *   inline  text 11816 · link 988 · list-item 60
 *   marky   bold 1428 · italic 1094
 *
 * Iné typy (H3/H4, číslované zoznamy, code, quote vnútri rich-textu) sa
 * nevyskytujú ani raz. Podporené sú napriek tomu, nech sa dá písať aj nový
 * obsah — ale prevod je stavaný tak, aby na neznámom uzle NESPADOL a radšej
 * ho previedol na odsek, než aby ho zahodil.
 *
 * ── Tvary (odpísané z reálnych dát, nie z dokumentácie) ────────────────────
 *   Strapi paragraph : { type:'paragraph', children:[ {type:'text', text, bold?, italic?} ] }
 *   Strapi heading   : { type:'heading', level:2, children:[…] }
 *   Strapi list      : { type:'list', format:'unordered', children:[ {type:'list-item', children:[…]} ] }
 *   Strapi link      : { type:'link', url, children:[ {type:'text', text} ] }
 */

export type StrapiNode = any;
export type TiptapNode = any;

const MARKS = ['bold', 'italic', 'underline', 'strikethrough', 'code'] as const;
const MARK_TO_TIPTAP: Record<string, string> = {
  bold: 'bold', italic: 'italic', underline: 'underline',
  strikethrough: 'strike', code: 'code',
};
const TIPTAP_TO_MARK: Record<string, string> = {
  bold: 'bold', italic: 'italic', underline: 'underline',
  strike: 'strikethrough', code: 'code',
};

// ── Strapi → TipTap ──────────────────────────────────────────────────────────

function inlineToTiptap(n: StrapiNode): TiptapNode[] {
  // Odkaz: v Strapi je to uzol s deťmi, v TipTape je to MARK na texte.
  if (n?.type === 'link') {
    const href = n.url ?? '';

    // Migračný artefakt: niektoré `link` uzly nesú marky priamo na sebe
    // (napr. {type:'link', bold:true}) namiesto na textovom dieťati.
    // Bez tohto by sa formátovanie takých odkazov stratilo.
    const ownMarks = MARKS.filter(m => n[m]).map(m => ({ type: MARK_TO_TIPTAP[m] }));

    const kids = (n.children ?? []).flatMap((c: any) => {
      const inner = inlineToTiptap(c);
      return inner.map(t => ({
        ...t,
        marks: [...(t.marks ?? []), ...ownMarks, { type: 'link', attrs: { href } }],
      }));
    });

    // `link` s prázdnym textom sa na webe aj tak nevykreslí (nemá čo zobraziť).
    // Nahradiť ho URL ako viditeľným textom by pridalo 200-znakový blogger
    // odkaz doprostred odseku — horšie než ho zahodiť. Zahadzujeme vedome.
    return kids;
  }

  const text = n?.text ?? '';
  if (!text) return [];
  const marks = MARKS.filter(m => n[m]).map(m => ({ type: MARK_TO_TIPTAP[m] }));
  return [{ type: 'text', text, ...(marks.length ? { marks } : {}) }];
}

function blockToTiptap(n: StrapiNode): TiptapNode | null {
  const kids = (n?.children ?? []).flatMap(inlineToTiptap);

  switch (n?.type) {
    case 'heading': {
      const level = Math.min(Math.max(Number(n.level) || 2, 2), 4);
      // Prázdny nadpis by TipTap zahodil — radšej ho vynecháme vedome.
      return kids.length ? { type: 'heading', attrs: { level }, content: kids } : null;
    }
    case 'list': {
      const listType = n.format === 'ordered' ? 'orderedList' : 'bulletList';
      const items = (n.children ?? []).map((li: any) => ({
        type: 'listItem',
        content: [{ type: 'paragraph', content: (li.children ?? []).flatMap(inlineToTiptap) }],
      }));
      return items.length ? { type: listType, content: items } : null;
    }
    case 'quote':
      return { type: 'blockquote', content: [{ type: 'paragraph', content: kids }] };
    case 'paragraph':
    default:
      // Prázdny odsek je legitímny (medzera medzi blokmi).
      return { type: 'paragraph', ...(kids.length ? { content: kids } : {}) };
  }
}

export function strapiToTiptap(body: StrapiNode[] | string | null | undefined): TiptapNode {
  if (typeof body === 'string') {
    // Ochrana pre prípad, že by niekde ostal starý plain text.
    return { type: 'doc', content: body.split(/\n{2,}/).map(t => ({ type: 'paragraph', content: t ? [{ type: 'text', text: t }] : [] })) };
  }
  const content = (Array.isArray(body) ? body : []).map(blockToTiptap).filter(Boolean);
  return { type: 'doc', content: content.length ? content : [{ type: 'paragraph' }] };
}

// ── TipTap → Strapi ──────────────────────────────────────────────────────────

function inlineToStrapi(n: TiptapNode): StrapiNode[] {
  if (n?.type !== 'text') return [];
  const text = n.text ?? '';
  if (!text) return [];

  const marks: any[] = n.marks ?? [];
  const link = marks.find(m => m.type === 'link');

  const leaf: any = { type: 'text', text };
  for (const m of marks) {
    const key = TIPTAP_TO_MARK[m.type];
    if (key) leaf[key] = true;
  }

  if (link) {
    // Späť na uzol `link` s deťmi — tak to Strapi ukladá.
    const { type, ...rest } = leaf;
    return [{ type: 'link', url: link.attrs?.href ?? '', children: [{ type: 'text', ...rest }] }];
  }
  return [leaf];
}

function blockToStrapi(n: TiptapNode): StrapiNode | null {
  const kids = (n?.content ?? []).flatMap(inlineToStrapi);
  const orEmpty = (k: any[]) => (k.length ? k : [{ type: 'text', text: '' }]);

  switch (n?.type) {
    case 'heading':
      return { type: 'heading', level: n.attrs?.level ?? 2, children: orEmpty(kids) };

    case 'bulletList':
    case 'orderedList': {
      const items = (n.content ?? []).map((li: any) => ({
        type: 'list-item',
        // listItem obsahuje odseky — ich inline obsah splošťujeme do položky.
        children: orEmpty((li.content ?? []).flatMap((p: any) => (p.content ?? []).flatMap(inlineToStrapi))),
      }));
      return items.length
        ? { type: 'list', format: n.type === 'orderedList' ? 'ordered' : 'unordered', children: items }
        : null;
    }

    case 'blockquote':
      return { type: 'quote', children: orEmpty((n.content ?? []).flatMap((p: any) => (p.content ?? []).flatMap(inlineToStrapi))) };

    case 'paragraph':
      return { type: 'paragraph', children: orEmpty(kids) };

    default:
      // Neznámy uzol nezahadzujeme — spravíme z neho odsek s jeho textom.
      return kids.length ? { type: 'paragraph', children: kids } : null;
  }
}

export function tiptapToStrapi(doc: TiptapNode): StrapiNode[] {
  return (doc?.content ?? []).map(blockToStrapi).filter(Boolean);
}

// ── Kontrola vernosti ────────────────────────────────────────────────────────

/** Spočíta text, odkazy a marky — na porovnanie pred/po prevode. */
export function fingerprint(body: StrapiNode[]): { chars: number; links: number; bold: number; italic: number; blocks: number } {
  let chars = 0, links = 0, bold = 0, italic = 0;
  const walk = (ns: any[]) => {
    for (const n of ns ?? []) {
      if (n.type === 'link') links++;
      if (n.text) {
        chars += n.text.length;
        if (n.bold) bold++;
        if (n.italic) italic++;
      }
      if (n.children) walk(n.children);
    }
  };
  walk(Array.isArray(body) ? body : []);
  return { chars, links, bold, italic, blocks: Array.isArray(body) ? body.length : 0 };
}
