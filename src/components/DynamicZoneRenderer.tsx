'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import { ZoomIn } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Lightbox } from './HistoricalGallery';
import { QuoteBlock } from './QuoteBlock';
import { BlogMedia, BlogMediaAspectRatio, BlogMediaWidth } from './BlogMedia';
import { getStrapiImageUrl, StrapiImage } from '../lib/strapi';
/* Pravidlá rozloženia (párovanie, mobil) sú v jednom module, aby web a editor
   nikdy nepovedali o tom istom článku niečo iné. Modul je čisté funkcie bez
   závislostí, takže z neho do balíka webu nepríde nič z adminu. */
import { canPair } from '../admin/editor/snapping/positionZones';
import { BlockShell } from '../admin/editor/BlockShell';
import { EditModeContext, useEditMode } from './EditModeContext';
import { embedSrc } from '../lib/embed';

// Helper: open gallery modal with specific image
function openGalleryWithImage(imageUrl: string) {
  window.dispatchEvent(new CustomEvent('openGalleryModal', { detail: { imageUrl } }));
}

// =============================================================================
// TYPES
// =============================================================================

interface RichTextBlock {
  __component: 'content.rich-text';
  id: number;
  body: any[];
}

interface ImageBlock {
  __component: 'content.image-block';
  id: number;
  image: StrapiImage;
  alt?: string;
  caption?: string;
  position?: 'left' | 'right' | 'center' | 'full' | 'breakout';
  pairWithNext?: boolean;
  width?: '30' | '40' | '50' | '60' | '100';
  aspectRatio?: '3:2' | '16:9' | '4:3' | '1:1' | '2:3' | '9:16' | '3:4' | 'auto';
  objectPosition?: string;
  showCaption?: boolean;
  rounded?: boolean;
  shadow?: boolean;
}

interface QuoteBlockType {
  __component: 'content.quote-block';
  id: number;
  text: string;
  author?: string;
  source?: string;
}

interface ImageGalleryBlock {
  __component: 'content.image-gallery';
  id: number;
  images: StrapiImage[];
  columns?: '2' | '3' | '4';
}

interface SourceItem {
  id?: number;
  text?: string | null;
  url?: string | null;
}

interface SourcesBlock {
  __component: 'content.sources';
  id: number;
  title?: string | null;
  intro?: string | null;
  items: SourceItem[];
}

interface EmbedBlock {
  __component: 'content.embed';
  id: number;
  provider: 'youtube' | 'sketchfab' | 'vimeo' | 'blogger';
  embedId?: string;
  url: string;
  caption?: string;
}

interface PoemBlock {
  __component: 'content.poem';
  id: number;
  text: string;        // verše: '\n' = riadok, '\n\n' = predel strofy
  title?: string;
  author?: string;
  source?: string;
}

type DynamicBlock = RichTextBlock | ImageBlock | QuoteBlockType | ImageGalleryBlock | SourcesBlock | EmbedBlock | PoemBlock;

interface DynamicZoneRendererProps {
  blocks: DynamicBlock[];
  /** Editor: každý blok sa obalí do `BlockShell` (rámik, menovka typu).
   *  Na webe je `false` a renderer sa správa presne ako doteraz. */
  editMode?: boolean;
}

/** Zjavovanie pri scrollovaní — na plátne editora sa vypína (viď EditModeContext). */
function reveal(editMode: boolean, from: any, to: any, transition?: any) {
  return editMode ? {} : { initial: from, whileInView: to, viewport: { once: true }, ...(transition ? { transition } : {}) };
}

/** Ľudské názvy typov blokov pre menovku v editore. */
const BLOCK_LABELS: Record<string, string> = {
  'content.rich-text': 'Text',
  'content.image-block': 'Obrázok',
  'content.quote-block': 'Citát',
  'content.sources': 'Zdroje',
  'content.embed': 'Vložené video',
  'content.poem': 'Báseň',
  'content.image-gallery': 'Galéria',
};

// =============================================================================
// RENDERER: content.embed — responzívny prehrávač (YouTube / Vimeo / Sketchfab / Blogger)
// =============================================================================

/**
 * PRÁZDNY BLOK V EDITORE.
 *
 * Blok bez obsahu — čerstvo vložená báseň, citát, zoznam zdrojov, galéria —
 * sa na webe nevykresľuje vôbec. V editore to znamenalo, že po vložení nebolo
 * VIDNO NIČ: blok sa nedal vybrať (nemá box, teda ani nameraný obdĺžnik),
 * nedal sa vyplniť ani zmazať, a pritom bránil publikovaniu („Báseň v bloku
 * č. 3 je prázdna“). Preto má každý taký blok v editore aspoň túto výzvu.
 * Na webe sa nezobrazí — tam sa prázdny blok naďalej preskočí.
 */
function EmptyBlockNotice({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="ed-block-empty not-prose">
      <b>{title}</b>
      <span>{hint}</span>
    </div>
  );
}

function EmbedRenderer({ block }: { block: EmbedBlock }) {
  const { url, caption } = block;
  const editMode = useEditMode();
  // Prázdny blok nesmie dostať vkladací odkaz bez identifikátora — YouTube
  // na taký odpovedá chybovou stránkou („Vyskytla sa chyba. Skúste to neskôr").
  const src = embedSrc(block);

  if (!src) {
    // Na webe sa nenastavené video nezobrazí vôbec; v editore výzva, čo doplniť.
    if (!editMode) return null;
    return (
      <figure className="my-8 clear-both not-prose">
        <EmptyBlockNotice
          title="Video zatiaľ nemá adresu"
          hint="Vložte odkaz na YouTube, Vimeo alebo Sketchfab do poľa „Adresa“ pod článkom."
        />
        {caption && (
          <figcaption style={{ fontFamily: 'Georgia, serif', fontSize: 13, color: '#8b7a5e', textAlign: 'center', marginTop: 8 }}>
            {caption}
          </figcaption>
        )}
      </figure>
    );
  }

  // Facebook post plugin má fixnú šírku a obsah zarovnaný vľavo hore — vynútený
  // pomer 16:9 by nechal väčšinu rámu prázdnu. Vykresli ho vycentrovane, prirodzenou výškou.
  const isFacebook = /facebook\.com\/plugins/.test(url);
  if (isFacebook) {
    return (
      <figure className="my-8 clear-both not-prose" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <iframe
          src={src}
          title={caption || 'Facebook'}
          loading="lazy"
          scrolling="no"
          style={{
            width: '100%',
            maxWidth: 500,
            height: 320,
            border: 0,
            borderRadius: 12,
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(70,40,20,.12)',
          }}
          allow="encrypted-media; picture-in-picture; clipboard-write"
          allowFullScreen
        />
        {caption && (
          <figcaption style={{ fontFamily: 'Georgia, serif', fontSize: 13, color: '#8b7a5e', textAlign: 'center', marginTop: 8 }}>
            {caption}
          </figcaption>
        )}
      </figure>
    );
  }

  return (
    <figure className="my-8 clear-both not-prose">
      <div
        style={{
          position: 'relative',
          width: '100%',
          paddingBottom: '56.25%',
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(70,40,20,.12)',
        }}
      >
        <iframe
          src={src}
          title={caption || 'Video'}
          loading="lazy"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      {caption && (
        <figcaption
          style={{ fontFamily: 'Georgia, serif', fontSize: 13, color: '#8b7a5e', textAlign: 'center', marginTop: 8 }}
        >
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

// =============================================================================
// HELPER: Get position from block
// =============================================================================

function getPosition(block: ImageBlock): 'left' | 'right' | 'center' | 'full' | 'breakout' {
  return block.position || 'center';
}

// =============================================================================
// HELPER: Map position to BlogMedia variant
// =============================================================================

function positionToVariant(position: 'left' | 'right' | 'center' | 'full' | 'breakout'): string {
  switch (position) {
    case 'left': return 'left-float';
    case 'right': return 'right-float';
    case 'full': return 'full-width';
    case 'breakout': return 'breakout';
    default: return 'center';
  }
}

// =============================================================================
// HELPER: Check if block is a float (for clear-float logic)
// =============================================================================

function isFloatPosition(block: ImageBlock): boolean {
  const pos = getPosition(block);
  return pos === 'left' || pos === 'right';
}

function isPreviousBlockFloat(blocks: DynamicBlock[], currentIndex: number): boolean {
  if (currentIndex === 0) return false;
  const prevBlock = blocks[currentIndex - 1];
  if (prevBlock.__component === 'content.image-block') {
    return isFloatPosition(prevBlock as ImageBlock);
  }
  return false;
}

// =============================================================================
// PAIRED IMAGE ROW (flex layout for two images side-by-side)
// =============================================================================

interface PairedImageRowProps {
  leftBlock: ImageBlock;
  rightBlock: ImageBlock;
}

function PairedImageRow({ leftBlock, rightBlock, editMode }: PairedImageRowProps & { editMode?: boolean }) {
  const renderImage = (block: ImageBlock, position: 'left' | 'right') => {
    const altText = block.alt || block.image?.alternativeText || block.caption || 'Obrázok';
    const aspectRatio = block.aspectRatio || 'auto';
    const objectPosition = block.objectPosition || 'center center';
    const showCaption = block.showCaption ?? true;
    const rounded = block.rounded ?? true;
    const shadow = block.shadow ?? true;

    // Calculate padding-bottom for aspect ratio
    const ASPECT_RATIO_PADDING: Record<string, string> = {
      '3:2': '66.67%',
      '16:9': '56.25%',
      '4:3': '75%',
      '1:1': '100%',
      '2:3': '150%',
      '9:16': '177.78%',
      '3:4': '133.33%',
    };

    // ── STROP VÝŠKY PRE OBRÁZKY NA VÝŠKU ────────────────────────────────────
    // Predtým: pri `auto` sa paddingBottom rovnal presnému pomeru obrázka BEZ
    // stropu. Obrázok 161x786 tak dostal padding-bottom 488 % → v 700 px stĺpci
    // 3417 px vysoký blok, teda ~4 obrazovky scrollovania na jeden obrázok.
    // Týkalo sa to 472 z 2138 obrázkov v telách (22 % vyšších než 800 px).
    //
    // Teraz: pomer sa zastropuje na MAX_AUTO_RATIO. Obrázok sa NEOREZÁVA —
    // vyššie než strop prepneme na object-contain, takže sa zobrazí celý,
    // len úzky a vycentrovaný. Zároveň sa prestane upscalovať do šírky stĺpca.
    const MAX_AUTO_RATIO = 1.25; // 5:4 na výšku; zvýš = povolíš vyššie obrázky
    const naturalRatio =
      block.image?.width && block.image?.height
        ? block.image.height / block.image.width
        : null;
    const isTallCapped =
      aspectRatio === 'auto' && naturalRatio !== null && naturalRatio > MAX_AUTO_RATIO;

    const paddingBottom = aspectRatio === 'auto'
      ? (naturalRatio
          ? `${(Math.min(naturalRatio, MAX_AUTO_RATIO) * 100).toFixed(2)}%`
          : '66.67%')
      : ASPECT_RATIO_PADDING[aspectRatio] || '66.67%';

    const imageUrl = getStrapiImageUrl(block.image);
    return (
      <>
        <button
          onClick={() => openGalleryWithImage(imageUrl)}
          className={`relative overflow-hidden ${rounded ? 'rounded-lg' : ''} ${shadow ? 'shadow-lg' : ''} w-full cursor-pointer group`}
          style={{
            paddingBottom,
            // Pri zastropovanom vysokom obrázku ostane po stranách voľné miesto
            // (object-contain) — podfarbíme ho pergamenom, nech to pôsobí zámerne.
            ...(isTallCapped ? { background: '#f0e9dc' } : {}),
          }}
          title="Kliknutím zobraziť v galérii"
        >
          <ImageWithFallback
            src={getStrapiImageUrl(block.image)}
            alt={altText}
            loading={editMode ? 'eager' : 'lazy'}
            decoding="async"
            className={`absolute inset-0 w-full h-full ${isTallCapped ? 'object-contain' : 'object-cover'} transition-transform duration-300 group-hover:scale-105`}
            style={{ objectPosition }}
          />
          {/* Hover overlay with zoom icon */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-3 bg-white/30 backdrop-blur-sm rounded-full">
              <ZoomIn className="w-6 h-6 text-white drop-shadow-lg" />
            </div>
          </div>
        </button>
        {showCaption && block.caption && (
          <p
            className="mt-2 text-sm text-stone-500 dark:text-stone-400 text-center italic"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            {block.caption}
          </p>
        )}
      </>
    );
  };

  return (
    <motion.figure
      className="paired-image-row w-full mb-6 clear-both"
      {...reveal(!!editMode, { opacity: 0, y: 20 }, { opacity: 1, y: 0 }, { duration: 0.5 })}
    >
      {/* Desktop: side-by-side, Mobile: stacked */}
      <div
        className="paired-images-container"
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: '1.5rem',
          alignItems: 'stretch',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          {renderImage(leftBlock, 'left')}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {renderImage(rightBlock, 'right')}
        </div>
      </div>
    </motion.figure>
  );
}

// =============================================================================
// INLINE CHILDREN (text/link s bold/italic/underline) — spoločné pre paragraph aj list
// =============================================================================

function renderInlineChildren(children: any[] = []): React.ReactNode[] {
  return children.map((child: any, ci: number) => {
    if (child.type === 'link') {
      const linkText = child.children?.map((c: any) => c.text).join('') || child.url;
      return (
        <a
          key={ci}
          href={child.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-amber-700 dark:text-amber-400 underline hover:text-amber-900 dark:hover:text-amber-300 break-words"
        >
          {linkText}
        </a>
      );
    }
    // type === 'text' (môže mať bold/italic/underline)
    let node: React.ReactNode = child.text || '';
    if (child.bold) node = <strong key={ci}>{node}</strong>;
    if (child.italic) node = <em key={ci}>{node}</em>;
    if (child.underline) node = <u key={ci}>{node}</u>;
    return <React.Fragment key={ci}>{node}</React.Fragment>;
  });
}

// =============================================================================
// RICH TEXT RENDERER with clear-before-heading pattern
// =============================================================================

function renderRichText(body: any[], isFirstRichTextBlock: boolean = false, hasPrecedingFloat: boolean = false, editMode: boolean = false) {
  if (!body) return null;

  let isFirstParagraphInBlock = true; // First paragraph of THIS block (for indent)
  const elements: React.ReactNode[] = [];

  body.forEach((block, idx) => {
    // Clear before headings if there was a preceding float
    if (block.type === 'heading' && hasPrecedingFloat) {
      elements.push(<div key={`clear-${idx}`} className="clear-both" />);
    }

    if (block.type === 'paragraph') {
      // Inline children môžu byť `text` ALEBO `link` (so vnoreným text child-om).
      // Predtým mapovanie len `child.text` stratilo paragraphy s len `link` — napríklad
      // celú sekciu "Zdroje a literatúra" v ktorej sú URL ako <link> elementy.
      const renderInline = renderInlineChildren;

      const plainText = (block.children || [])
        .map((c: any) =>
          c.type === 'link' ? c.children?.map((x: any) => x.text).join('') || c.url : c.text || '',
        )
        .join('');
      if (!plainText.trim()) return;

      // Drop cap ONLY for the very first paragraph of the very first Rich Text block
      const shouldDropCap = isFirstRichTextBlock && isFirstParagraphInBlock && plainText.length > 0;
      const shouldIndent = isFirstParagraphInBlock;
      if (isFirstParagraphInBlock) isFirstParagraphInBlock = false;

      if (shouldDropCap) {
        // Iniciálku odober z prvého textového uzla, ZVYŠOK vykresli cez renderInline,
        // aby sa zachovali inline odkazy (link) aj bold/italic v prvom odseku.
        let firstLetter = '';
        let dropped = false;
        const restChildren = (block.children || []).map((c: any) => {
          if (!dropped && c.type !== 'link' && typeof c.text === 'string' && c.text.length > 0) {
            firstLetter = c.text.charAt(0);
            dropped = true;
            return { ...c, text: c.text.slice(1) };
          }
          return c;
        });
        if (!dropped) firstLetter = plainText.charAt(0);
        elements.push(
          <p
            key={idx}
            className="text-base md:text-lg leading-relaxed mb-4 text-stone-700 dark:text-stone-300"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            <span
              className="float-left text-6xl md:text-7xl font-bold text-amber-700 dark:text-amber-500 mr-3 leading-none"
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                lineHeight: '0.75',
                marginTop: '0.1em',
              }}
            >
              {firstLetter}
            </span>
            {renderInline(restChildren)}
          </p>,
        );
        return;
      }

      elements.push(
        <p
          key={idx}
          className="text-base md:text-lg leading-relaxed mb-4 text-stone-700 dark:text-stone-300"
          style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            textIndent: shouldIndent ? '2em' : undefined,
          }}
        >
          {renderInline(block.children)}
        </p>,
      );
      return;
    }

    if (block.type === 'heading') {
      const text = block.children?.map((child: any) => child.text).join('') || '';
      const level = block.level || 2;
      if (level === 2) {
        elements.push(
          <motion.h2
            key={idx}
            className="text-xl md:text-2xl font-bold mb-4 mt-8 text-amber-900 dark:text-amber-100 clear-both"
            style={{ fontFamily: 'var(--font-heading)' }}
            {...reveal(editMode, { opacity: 0, y: 10 }, { opacity: 1, y: 0 })}
          >
            {text}
          </motion.h2>
        );
        return;
      }
      elements.push(
        <h3 key={idx} className="text-lg md:text-xl font-semibold mb-3 mt-6 text-amber-800 dark:text-amber-200 clear-both">
          {text}
        </h3>
      );
      return;
    }

    if (block.type === 'list') {
      elements.push(
        <ul
          key={idx}
          className="space-y-2 my-4 text-stone-700 dark:text-stone-300"
          // clear:both — zoznam nikdy nezalamovať okolo plávajúceho obrázka
          // (odrážky s absolútnou pozíciou sa inak prekrývajú s fotkou naľavo/napravo)
          style={{ listStyle: 'none', paddingLeft: '1.25rem', marginLeft: 0, clear: 'both' }}
        >
          {block.children?.map((item: any, i: number) => (
            <li
              key={i}
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                position: 'relative',
                paddingLeft: '1rem',
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  left: 0,
                  top: '0.75em',
                  width: 6,
                  height: 6,
                  borderRadius: 9999,
                  background: 'var(--hr-accent-soft)',
                }}
              />
              {renderInlineChildren(item.children)}
            </li>
          ))}
        </ul>
      );
      return;
    }
  });

  return elements;
}

// =============================================================================
// COMPONENT RENDERERS
// =============================================================================

function RichTextRenderer({
  block,
  isFirstRichTextBlock = false,
  hasPrecedingFloat = false
}: {
  block: RichTextBlock;
  isFirstRichTextBlock?: boolean;
  hasPrecedingFloat?: boolean;
}) {
  const editMode = useEditMode();
  const elements = renderRichText(block.body, isFirstRichTextBlock, hasPrecedingFloat, editMode);
  // Čerstvo vložený textový blok nemá ešte ani písmeno — bez tejto výzvy by
  // po kliknutí mimo zmizol z obrazovky a už sa nedal ani vybrať, ani zmazať.
  const empty = !elements || (Array.isArray(elements) && elements.length === 0);
  return (
    <div className="mb-6">
      {empty && editMode
        ? <EmptyBlockNotice title="Prázdny odsek" hint="Kliknite sem a píšte." />
        : elements}
    </div>
  );
}

function ImageBlockRenderer({ block, editMode }: { block: ImageBlock; editMode?: boolean }) {
  const position = getPosition(block);
  const variant = positionToVariant(position);
  const altText = block.alt || block.image?.alternativeText || block.caption || 'Obrázok';

  // Blok bez vybranej fotografie — inak by tu bol prázdny rám bez rozmeru.
  if (!block.image) {
    if (!editMode) return null;
    return (
      <div className="my-8 clear-both">
        <EmptyBlockNotice
          title="Obrázok nie je vybraný"
          hint="Vyberte ho z knižnice tlačidlom v lište bloku."
        />
      </div>
    );
  }

  return (
    <BlogMedia
      variant={variant as any}
      widthPercent={block.width as BlogMediaWidth}
      aspectRatio={(block.aspectRatio || 'auto') as BlogMediaAspectRatio}
      objectPosition={block.objectPosition || 'center center'}
      src={getStrapiImageUrl(block.image)}
      alt={altText}
      width={block.image?.width}
      height={block.image?.height}
      caption={block.caption}
      showCaption={block.showCaption ?? true}
      rounded={block.rounded ?? true}
      shadow={block.shadow ?? true}
      editMode={editMode}
    />
  );
}

function QuoteBlockRenderer({ block, needsClearBefore }: { block: QuoteBlockType; needsClearBefore?: boolean }) {
  const editMode = useEditMode();
  if (!String(block.text || '').trim()) {
    if (!editMode) return null;
    return (
      <div className={needsClearBefore ? 'my-8 clear-both' : 'my-8'}>
        <EmptyBlockNotice
          title="Citát zatiaľ nemá text"
          hint="Napíšte ho do poľa „Text citátu“ v paneli pod článkom. Úvodzovky doplní sadzba sama."
        />
      </div>
    );
  }
  return (
    <>
      {needsClearBefore && <div className="clear-both" />}
      <QuoteBlock
        text={block.text}
        author={block.author}
        source={block.source}
      />
    </>
  );
}

function SourcesRenderer({ block, needsClearBefore }: { block: SourcesBlock; needsClearBefore?: boolean }) {
  const editMode = useEditMode();
  const items = block.items || [];
  if (items.length === 0 && !block.intro) {
    if (!editMode) return null;
    return (
      <div className={needsClearBefore ? 'my-8 clear-both' : 'my-8'}>
        <EmptyBlockNotice
          title="Zoznam zdrojov je prázdny"
          hint="Pridajte prvú položku tlačidlom „Pridať zdroj“ v paneli pod článkom."
        />
      </div>
    );
  }
  return (
    <>
      {needsClearBefore && <div className="clear-both" />}
      <section className="sources-block my-8 clear-both not-prose">
        {block.title && (
          <h2 className="text-2xl font-serif text-stone-900 mb-3">{block.title}</h2>
        )}
        {block.intro && (
          <p className="text-stone-700 mb-3 leading-relaxed">{block.intro}</p>
        )}
        <ul className="list-none p-0 m-0 space-y-3">
          {items.map((it, j) => {
            const text = (it.text || '').trim();
            const url = (it.url || '').trim();
            return (
              <li key={it.id || j} className="text-stone-700 leading-relaxed" style={{ overflowWrap: 'anywhere', minWidth: 0 }}>
                {url ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-700 hover:text-amber-900 hover:underline break-all"
                    style={{ overflowWrap: 'anywhere' }}
                  >
                    {text || url}
                  </a>
                ) : (
                  <span>{text}</span>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}

/**
 * GALÉRIA V TELE ČLÁNKU.
 *
 * Po kliknutí otvára ten istý svetelný box ako fotogaléria na konci článku
 * (`Lightbox` z `HistoricalGallery`) — vrátane popisu, lajkov a komentárov
 * k fotke. Predtým boli fotky z tohto bloku jediné na stránke, ktoré sa
 * otvoriť nedali, a navyše boli orezané na iný pomer než všade inde.
 * Miniatúry sú preto rovnaké ako v spodnej galérii: pomer 4:3, rámik,
 * popis pod fotkou.
 */
function ImageGalleryRenderer({ block, needsClearBefore }: { block: ImageGalleryBlock; needsClearBefore?: boolean }) {
  const editMode = useEditMode();
  const [openIdx, setOpenIdx] = React.useState<number | null>(null);
  const columns = block.columns || '3';
  const gridCols = {
    '2': 'grid-cols-2',
    '3': 'grid-cols-2 md:grid-cols-3',
    '4': 'grid-cols-2 md:grid-cols-4',
  };

  if (!(block.images || []).length) {
    if (!editMode) return null;
    return (
      <div className={needsClearBefore ? 'my-8 clear-both' : 'my-8'}>
        <EmptyBlockNotice
          title="Galéria zatiaľ nemá fotografie"
          hint="Vyberte ich z knižnice tlačidlom v paneli pod článkom."
        />
      </div>
    );
  }

  /* Tvar, ktorému rozumie svetelný box. `fileId` je id súboru v knižnici —
     na to sa viažu lajky a komentáre k fotke, takže fungujú aj tu. */
  const photos = (block.images || []).map((image: any, idx: number) => ({
    url: getStrapiImageUrl(image),
    caption: image.caption || image.alternativeText || '',
    alt: image.alternativeText || image.caption || `Obrázok ${idx + 1}`,
    fileId: image.id,
  }));

  return (
    <>
      {needsClearBefore && <div className="clear-both" />}
      <motion.div
        className={`grid ${gridCols[columns]} gap-4 my-6 clear-both`}
        {...reveal(editMode, { opacity: 0 }, { opacity: 1 }, { duration: 0.5 })}
      >
        {photos.map((photo, idx) => (
          <motion.button
            type="button"
            key={block.images?.[idx]?.id || idx}
            onClick={(e) => {
              if (editMode) return; // v editore klik vyberá blok, neotvára fotku
              e.preventDefault();
              e.stopPropagation();
              setOpenIdx(idx);
            }}
            aria-label={photo.caption ? `Otvoriť fotografiu: ${photo.caption}` : `Otvoriť obrázok ${idx + 1}`}
            style={{
              background: 'transparent', border: 0, padding: 0, font: 'inherit', color: 'inherit',
              textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 8,
              cursor: editMode ? 'inherit' : 'zoom-in',
            }}
            {...reveal(editMode, { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1 }, { duration: 0.3, delay: idx * 0.1 })}
          >
            <span
              style={{
                position: 'relative', width: '100%', aspectRatio: '4 / 3', overflow: 'hidden',
                borderRadius: 8, border: '1px solid var(--hr-line)', display: 'block', pointerEvents: 'none',
              }}
            >
              <ImageWithFallback
                src={photo.url}
                alt={photo.alt}
                loading={editMode ? 'eager' : 'lazy'}
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </span>
            {photo.caption && (
              <span
                style={{
                  fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 13, lineHeight: 1.5,
                  color: '#7a6b56', display: '-webkit-box', WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical', overflow: 'hidden', pointerEvents: 'none',
                }}
              >
                {photo.caption}
              </span>
            )}
          </motion.button>
        ))}
      </motion.div>

      {/* Svetelný box je ten istý komponent ako v spodnej fotogalérii. */}
      {!editMode && typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {openIdx !== null && (
              <Lightbox
                images={photos}
                index={openIdx}
                onClose={() => setOpenIdx(null)}
                onPrev={() => setOpenIdx((i) => (i === null ? i : (i - 1 + photos.length) % photos.length))}
                onNext={() => setOpenIdx((i) => (i === null ? i : (i + 1) % photos.length))}
              />
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}

// =============================================================================
// RENDERER: content.poem — literárna báseň (centrovaná, kurzíva, verše po riadkoch)
// =============================================================================

function PoemRenderer({ block, needsClearBefore }: { block: PoemBlock; needsClearBefore?: boolean }) {
  const editMode = useEditMode();
  const stanzas = (block.text || '').split(/\n\s*\n/).map(s => s.split('\n').filter(l => l.trim().length > 0)).filter(st => st.length > 0);
  if (stanzas.length === 0) {
    if (!editMode) return null;
    return (
      <div className={needsClearBefore ? 'my-8 clear-both' : 'my-8'}>
        <EmptyBlockNotice
          title="Báseň zatiaľ nemá verše"
          hint="Napíšte ich do poľa „Verše“ v paneli pod článkom. Prázdny riadok oddelí strofu."
        />
      </div>
    );
  }
  return (
    <div
      className="poem-block not-prose"
      style={{
        clear: needsClearBefore ? 'both' : undefined,
        margin: '2.4rem auto',
        maxWidth: 520,
        background: 'var(--hr-line)',
        border: '1px solid var(--hr-accent-border)',
        borderRadius: 10,
        padding: '2.1rem 2.4rem 1.8rem',
        textAlign: 'center',
      }}
    >
      {/* Ornament: line - diamond - line */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: '1.1rem' }}>
        <span style={{ height: 1, width: 34, background: 'var(--hr-accent-border)' }} />
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--hr-accent-soft)', transform: 'rotate(45deg)' }} />
        <span style={{ height: 1, width: 34, background: 'var(--hr-accent-border)' }} />
      </div>
      {block.title && (
        <div
          style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontStyle: 'normal',
            fontWeight: 600,
            fontSize: '1.05em',
            color: '#3d3020',
            marginBottom: '0.9rem',
            letterSpacing: '0.02em',
          }}
        >
          {block.title}
        </div>
      )}
      <div
        style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontStyle: 'italic',
          color: '#3d3020',
          lineHeight: 1.85,
          fontSize: '15.5px',
        }}
      >
        {stanzas.map((lines, i) => (
          <div key={i} style={{ marginBottom: i < stanzas.length - 1 ? '1rem' : 0 }}>
            {lines.map((line, j) => (
              <div key={j}>{line.trim()}</div>
            ))}
          </div>
        ))}
      </div>
      {block.author && (
        <div
          style={{
            marginTop: '1.2rem',
            paddingTop: '0.9rem',
            borderTop: '1px solid var(--hr-accent-border)',
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontStyle: 'normal',
            fontSize: '12.5px',
            color: '#7d4f1d',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            fontWeight: 600,
          }}
        >
          {block.author}{block.source ? ` – ${block.source}` : ''}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// MAIN RENDERER with pairing logic
// =============================================================================

/**
 * Má blok textu aspoň jeden naozajstný odsek? Podľa toho sa vyberá blok
 * s iniciálkou. Používa to aj editor, aby počas písania kreslil iniciálku
 * v tom istom bloku ako hotový článok — preto je to tu, nie dvakrát.
 */
export const hasRealParagraph = (b: any) =>
  b?.__component === 'content.rich-text' &&
  (b.body || []).some((n: any) =>
    n.type === 'paragraph' &&
    (n.children || []).some((c: any) => ((c.text ?? c.children?.map((x: any) => x.text).join('')) || '').trim())
  );

export function DynamicZoneRenderer({ blocks, editMode }: DynamicZoneRendererProps) {
  if (!blocks || blocks.length === 0) return null;

  // Find the index of the first rich-text block that actually contains a real
  // paragraph (for drop cap). A plain "first content.rich-text block" check is not
  // enough — a block can be empty ({body:[]}), a heading-only block, or a stray short
  // citation paragraph left over from migration. renderRichText only applies the
  // drop-cap to `type:'paragraph'` nodes, so pointing isFirstRichTextBlock at a block
  // with no real paragraph silently drops the initial letter for the whole article.
  const firstRichTextIndex = blocks.findIndex(hasRealParagraph);

  const renderedElements: React.ReactNode[] = [];
  const skipIndices = new Set<number>();

  /* Obalenie do `BlockShell` rieši jedno miesto, nie každý `push` zvlášť.
     `current` drží blok, ktorý sa práve vykresľuje (nastavuje sa v cykle). */
  let current: { type: string; index: number; uid: string } = { type: '', index: 0, uid: '' };
  const pushNode = (node: React.ReactNode) => {
    renderedElements.push(
      editMode ? (
        <BlockShell
          key={`shell-${current.uid || current.index}`}
          index={current.index}
          uid={current.uid}
          type={current.type}
          label={BLOCK_LABELS[current.type] || 'Blok'}
        >
          {node}
        </BlockShell>
      ) : (
        node
      )
    );
  };

  for (let idx = 0; idx < blocks.length; idx++) {
    // Skip if this block was already rendered as part of a pair
    if (skipIndices.has(idx)) continue;

    const block = blocks[idx];
    // `__uid` pridáva editor; na webe tam nie je a `current.uid` ostane prázdne.
    current = { type: block.__component, index: idx, uid: (block as any).__uid || String(idx) };
    const isPrevFloat = isPreviousBlockFloat(blocks, idx);

    // =======================================================================
    // PAIRING LOGIC: Check if this image block should pair with next
    // =======================================================================
    if (block.__component === 'content.image-block') {
      const imgBlock = block as ImageBlock;
      const nextBlock = blocks[idx + 1];

      // Podmienky párovania drží `canPair` (snapping/positionZones.ts):
      // pairWithNext + nasledujúci blok je obrázok + opačné pozície.
      if (canPair(imgBlock, nextBlock)) {
        const nextImgBlock = nextBlock as ImageBlock;
        const currentPos = getPosition(imgBlock);
        // Render as paired row
        const leftBlock = currentPos === 'left' ? imgBlock : nextImgBlock;
        const rightBlock = currentPos === 'right' ? imgBlock : nextImgBlock;

        pushNode(
          <PairedImageRow
            key={`pair-${imgBlock.id || idx}-${nextImgBlock.id || idx + 1}`}
            leftBlock={leftBlock}
            rightBlock={rightBlock}
            editMode={editMode}
          />
        );

        // Skip the next block since it's already rendered
        skipIndices.add(idx + 1);
        continue;
      }

      // Render single image block
      pushNode(
        <ImageBlockRenderer
          key={`${block.__component}-${imgBlock.id || idx}`}
          block={imgBlock}
          editMode={editMode}
        />
      );
      continue;
    }

    // =======================================================================
    // OTHER BLOCK TYPES
    // =======================================================================
    switch (block.__component) {
      case 'content.rich-text':
        pushNode(
          <RichTextRenderer
            key={`${block.__component}-${block.id || idx}`}
            block={block as RichTextBlock}
            isFirstRichTextBlock={idx === firstRichTextIndex}
            hasPrecedingFloat={isPrevFloat}
          />
        );
        break;

      case 'content.quote-block':
        pushNode(
          <QuoteBlockRenderer
            key={`${block.__component}-${block.id || idx}`}
            block={block as QuoteBlockType}
            needsClearBefore={isPrevFloat}
          />
        );
        break;

      case 'content.image-gallery':
        pushNode(
          <ImageGalleryRenderer
            key={`${block.__component}-${block.id || idx}`}
            block={block as ImageGalleryBlock}
            needsClearBefore={isPrevFloat}
          />
        );
        break;

      case 'content.sources':
        pushNode(
          <SourcesRenderer
            key={`${block.__component}-${block.id || idx}`}
            block={block as SourcesBlock}
            needsClearBefore={isPrevFloat}
          />
        );
        break;

      case 'content.embed':
        pushNode(
          <EmbedRenderer
            key={`${block.__component}-${block.id || idx}`}
            block={block as EmbedBlock}
          />
        );
        break;

      case 'content.poem':
        pushNode(
          <PoemRenderer
            key={`${block.__component}-${block.id || idx}`}
            block={block as PoemBlock}
            needsClearBefore={isPrevFloat}
          />
        );
        break;

      default:
        break;
    }
  }

  return (
    <EditModeContext.Provider value={!!editMode}>
      <div className="dynamic-zone-content">
        {renderedElements}
        {/* Final clearfix for any trailing floats */}
        <div className="clear-both" />
      </div>
    </EditModeContext.Provider>
  );
}
