'use client';

/**
 * Písanie priamo do stránky.
 *
 * TipTap sa vykreslí NA MIESTE bloku a dostane tie isté triedy, aké dáva
 * odsekom, nadpisom a zoznamom `DynamicZoneRenderer`. Vďaka tomu vyzerá text
 * počas písania rovnako ako po kliknutí mimo.
 *
 * ── Ochrana pôvodného obsahu ───────────────────────────────────────────────
 * `onChange` sa volá LEN pri skutočnej zmene obsahu (`onUpdate` TipTapu), nie
 * pri kliknutí ani pri označení textu. Blok, ktorého sa nikto nedotkol, sa
 * ukladá späť bajt po bajte v pôvodnom JSON (`original` v savePost.ts), takže
 * prevod cez TipTap sa naň vôbec nespustí. Je to to isté pravidlo, na akom
 * stojí formulárový `richtext/RichTextEditor.tsx`.
 */

import { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { mergeAttributes } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Heading from '@tiptap/extension-heading';
import Link from '@tiptap/extension-link';
import { Bold, Italic, Link2, List, ListOrdered, Unlink, Heading2, Heading3 } from 'lucide-react';
import { strapiToTiptap, tiptapToStrapi } from '../../richtext/convert';

/* Triedy sú odpísané z `DynamicZoneRenderer` — nie vymyslené. Keby sa tam
   zmenili, text by počas písania vyzeral inak než po kliknutí mimo. */
const P_CLASS = 'text-base md:text-lg leading-relaxed mb-4 text-stone-700 dark:text-stone-300';
const H2_CLASS = 'text-xl md:text-2xl font-bold mb-4 mt-8 text-amber-900 dark:text-amber-100 clear-both';
const H3_CLASS = 'text-lg md:text-xl font-semibold mb-3 mt-6 text-amber-800 dark:text-amber-200 clear-both';
const UL_CLASS = 'space-y-2 my-4 text-stone-700 dark:text-stone-300';
const A_CLASS = 'text-amber-700 dark:text-amber-400 underline hover:text-amber-900 dark:hover:text-amber-300 break-words';

/**
 * Nadpis s triedou podľa úrovne.
 *
 * Trieda MUSÍ ísť cez `renderHTML`, nie dodatočným zápisom do DOM. Prvý pokus
 * dopĺňal triedy sledovačom zmien — ProseMirror ich pri každej zmene vrátil
 * späť, sledovač ich znova prepísal a stránka zamrzla v nekonečnej slučke
 * (prejavilo sa na článku, ktorého blok obsahuje iba nadpis).
 */
const LeveledHeading = Heading.extend({
  renderHTML({ node, HTMLAttributes }) {
    const level = (this.options.levels as number[]).includes(node.attrs.level) ? node.attrs.level : 2;
    return [`h${level}`, mergeAttributes(HTMLAttributes, { class: level === 2 ? H2_CLASS : H3_CLASS }), 0];
  },
});

export function RichTextInline({
  body,
  onChange,
  onDone,
  dropCap,
  minHeight,
}: {
  body: any;
  onChange: (next: any[]) => void;
  /** Klik mimo textu — editor sa zavrie a blok sa vráti do bežného zobrazenia. */
  onDone: () => void;
  /**
   * Prvý textový blok článku — počas písania kreslí veľkú červenú iniciálku
   * CSS (`::first-letter`). Vykreslený článok ju robí zvlášť vloženým
   * `<span>`-om; ten sa sem dať nedá, ProseMirror si obsah spravuje sám a
   * písalo by sa „za" iniciálku.
   */
  dropCap?: boolean;
  /** Výška vykresleného bloku — drží miesto, nech článok pod ním neposkočí. */
  minHeight?: number;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  /* Lištička s formátovaním. Ukazuje sa po celý čas písania, nie až pri
     označení textu — kto chce začať tučným, nemá čo označiť.

     POZOR na súradnice: `.ed-inline` má `position: relative`, takže lištička
     sa umiestňuje voči BLOKU, nie voči plátnu. Predtým sa počítala voči
     `[data-canvas-body]` a o tú istú vzdialenosť sa aj posunula — pri bloku
     v polovici článku skončila tisíce pixelov pod obrazovkou, takže vyzerala,
     že formátovanie v editore vôbec nie je. */

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Korpus obsahuje len odsek, H2, odrážky a marky bold/italic.
        // Citát je vypnutý zámerne — web ho vnútri rich-textu nevykresľuje.
        codeBlock: false,
        horizontalRule: false,
        blockquote: false,
        strike: false,
        code: false,
        heading: false, // nahradené `LeveledHeading` nižšie
        paragraph: { HTMLAttributes: { class: P_CLASS } },
        bulletList: { HTMLAttributes: { class: UL_CLASS } },
      }),
      LeveledHeading.configure({ levels: [2, 3, 4] }),
      Link.configure({ openOnClick: false, autolink: false, HTMLAttributes: { class: A_CLASS } }),
    ],
    content: strapiToTiptap(body),
    autofocus: 'end',
    onUpdate: ({ editor }) => onChange(tiptapToStrapi(editor.getJSON())),
  });

  // Klik mimo bloku ukončí písanie.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const doc = el.ownerDocument;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!el.contains(t) && !(t as HTMLElement)?.closest?.('.ed-textbar')) onDone();
    };
    doc.addEventListener('mousedown', onDown);
    return () => doc.removeEventListener('mousedown', onDown);
  }, [onDone]);

  if (!editor) return null;

  const link = () => {
    const prev = editor.getAttributes('link').href || '';
    const url = window.prompt('Adresa odkazu:', prev);
    if (url === null) return;
    if (url === '') editor.chain().focus().unsetLink().run();
    else editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const B = ({ on, act, title, children }: any) => (
    <button
      type="button"
      className={on ? 'is-on' : ''}
      title={title}
      aria-label={title}
      onMouseDown={(e) => { e.preventDefault(); act(); }}
    >
      {children}
    </button>
  );

  return (
    <div
      ref={wrapRef}
      className={`ed-inline mb-6${dropCap ? ' is-first' : ''}`}
      style={minHeight ? { minHeight } : undefined}
    >
      <EditorContent editor={editor} />
      <div className="ed-textbar">
          <B on={editor.isActive('bold')} act={() => editor.chain().focus().toggleBold().run()} title="Tučné">
            <Bold className="w-3.5 h-3.5" />
          </B>
          <B on={editor.isActive('italic')} act={() => editor.chain().focus().toggleItalic().run()} title="Kurzíva">
            <Italic className="w-3.5 h-3.5" />
          </B>
          <span className="ed-textbar-sep" />
          <B on={editor.isActive('heading', { level: 2 })} act={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Nadpis 2">
            <Heading2 className="w-3.5 h-3.5" />
          </B>
          <B on={editor.isActive('heading', { level: 3 })} act={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Nadpis 3">
            <Heading3 className="w-3.5 h-3.5" />
          </B>
          <span className="ed-textbar-sep" />
          <B on={editor.isActive('bulletList')} act={() => editor.chain().focus().toggleBulletList().run()} title="Odrážky">
            <List className="w-3.5 h-3.5" />
          </B>
          <B on={editor.isActive('orderedList')} act={() => editor.chain().focus().toggleOrderedList().run()} title="Číslovaný zoznam">
            <ListOrdered className="w-3.5 h-3.5" />
          </B>
          <span className="ed-textbar-sep" />
          <B on={editor.isActive('link')} act={link} title="Odkaz">
            <Link2 className="w-3.5 h-3.5" />
          </B>
          {editor.isActive('link') && (
            <B on={false} act={() => editor.chain().focus().unsetLink().run()} title="Zrušiť odkaz">
              <Unlink className="w-3.5 h-3.5" />
            </B>
          )}
      </div>
    </div>
  );
}
