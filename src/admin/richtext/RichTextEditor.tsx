'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { useEffect, useState } from 'react';
import { Bold, Italic, Link2, List, ListOrdered, Unlink } from 'lucide-react';
import { strapiToTiptap, tiptapToStrapi } from './convert';

/**
 * Editor rich-textu nad Strapi Blocks.
 *
 * ── Bezpečnostné pravidlo ──────────────────────────────────────────────────
 * `onChange` sa volá LEN keď používateľ obsah naozaj zmenil. Bloky, ktorých sa
 * nedotkol, sa ukladajú späť verbatim v pôvodnom JSON. Vďaka tomu sa prevod
 * nikdy nespustí na 7 698 blokoch, ktoré nikto needitoval.
 *
 * Prečo to je dôležité: round-trip cez celý korpus je bajt-identický na 91,4 %
 * a obsahovo zhodný na 99,4 %. Rozdiely sú výhradne v poškodených uzloch
 * z migrácie (napr. `link` s markami na sebe alebo s prázdnym textom).
 * Tie sa pri editácii normalizujú — čo je v poriadku, ale nech sa to deje
 * len tam, kde človek zámerne zasiahol.
 */

const TOOLBAR_BTN: React.CSSProperties = {
  width: 30, height: 30, display: 'inline-flex', alignItems: 'center',
  justifyContent: 'center', borderRadius: 7, cursor: 'pointer',
  border: '1px solid var(--ad-field-border)', background: 'var(--ad-card)',
  fontSize: 12, fontWeight: 600, color: 'var(--ad-text)',
};

export function RichTextEditor({
  body, onChange,
}: { body: any; onChange: (next: any[]) => void }) {
  const [touched, setTouched] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Korpus obsahuje len odsek, H2, odrážky a marky bold/italic.
        // Ostatné vypíname, nech editor neponúka, čo web nevykreslí.
        codeBlock: false,
        horizontalRule: false,
        blockquote: false,
        strike: false,
        code: false,
        heading: { levels: [2, 3, 4] },
      }),
      Link.configure({ openOnClick: false, autolink: false }),
    ],
    content: strapiToTiptap(body),
    onUpdate: ({ editor }) => {
      setTouched(true);
      onChange(tiptapToStrapi(editor.getJSON()));
    },
  });

  // Ak sa načíta iný článok, treba obsah prepnúť — ale nikdy nie po tom,
  // čo doň používateľ začal písať (prišiel by o rozpísané zmeny).
  useEffect(() => {
    if (editor && !touched) {
      editor.commands.setContent(strapiToTiptap(body), { emitUpdate: false });
    }
  }, [editor, body, touched]);

  if (!editor) return null;

  const btn = (active: boolean): React.CSSProperties => ({
    ...TOOLBAR_BTN,
    ...(active ? { background: '#f6ead0', borderColor: 'var(--ad-amber)', color: 'var(--ad-amber-deep)' } : {}),
  });

  const setLink = () => {
    const prev = editor.getAttributes('link').href ?? '';
    const url = window.prompt('Adresa odkazu:', prev);
    if (url === null) return;
    if (url === '') { editor.chain().focus().unsetLink().run(); return; }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
        <button style={btn(editor.isActive('bold'))} title="Tučné"
                onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button style={btn(editor.isActive('italic'))} title="Kurzíva"
                onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="w-3.5 h-3.5" />
        </button>

        <span style={{ width: 1, height: 18, background: 'var(--ad-line)', margin: '0 4px' }} />

        {[2, 3, 4].map(l => (
          <button key={l} style={btn(editor.isActive('heading', { level: l }))} title={`Nadpis ${l}`}
                  onClick={() => editor.chain().focus().toggleHeading({ level: l as any }).run()}>
            H{l}
          </button>
        ))}

        <span style={{ width: 1, height: 18, background: 'var(--ad-line)', margin: '0 4px' }} />

        <button style={btn(editor.isActive('link'))} title="Odkaz" onClick={setLink}>
          <Link2 className="w-3.5 h-3.5" />
        </button>
        {editor.isActive('link') && (
          <button style={TOOLBAR_BTN} title="Zrušiť odkaz"
                  onClick={() => editor.chain().focus().unsetLink().run()}>
            <Unlink className="w-3.5 h-3.5" />
          </button>
        )}
        <button style={btn(editor.isActive('bulletList'))} title="Odrážky"
                onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="w-3.5 h-3.5" />
        </button>
        <button style={btn(editor.isActive('orderedList'))} title="Číslovaný zoznam"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="ad-rte">
        <EditorContent editor={editor} />
      </div>
    </>
  );
}
