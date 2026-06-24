'use client';

import React from 'react';
import { motion } from 'motion/react';
import { ZoomIn } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { QuoteBlock } from './QuoteBlock';
import { BlogMedia, BlogMediaAspectRatio, BlogMediaWidth } from './BlogMedia';
import { getStrapiImageUrl, StrapiImage } from '../lib/strapi';

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

type DynamicBlock = RichTextBlock | ImageBlock | QuoteBlockType | ImageGalleryBlock | SourcesBlock;

interface DynamicZoneRendererProps {
  blocks: DynamicBlock[];
}

// =============================================================================
// HELPER: Check if positions are opposite (for pairing)
// =============================================================================

function arePositionsOpposite(pos1?: string, pos2?: string): boolean {
  return (pos1 === 'left' && pos2 === 'right') || (pos1 === 'right' && pos2 === 'left');
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

function PairedImageRow({ leftBlock, rightBlock }: PairedImageRowProps) {
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

    const paddingBottom = aspectRatio === 'auto'
      ? (block.image?.width && block.image?.height
          ? `${((block.image.height / block.image.width) * 100).toFixed(2)}%`
          : '66.67%')
      : ASPECT_RATIO_PADDING[aspectRatio] || '66.67%';

    const imageUrl = getStrapiImageUrl(block.image);
    return (
      <>
        <button
          onClick={() => openGalleryWithImage(imageUrl)}
          className={`relative overflow-hidden ${rounded ? 'rounded-lg' : ''} ${shadow ? 'shadow-lg' : ''} w-full cursor-pointer group`}
          style={{ paddingBottom }}
          title="Kliknutím zobraziť v galérii"
        >
          <ImageWithFallback
            src={getStrapiImageUrl(block.image)}
            alt={altText}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
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
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
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
// RICH TEXT RENDERER with clear-before-heading pattern
// =============================================================================

function renderRichText(body: any[], isFirstRichTextBlock: boolean = false, hasPrecedingFloat: boolean = false) {
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
      const renderInline = (children: any[] = []): React.ReactNode[] =>
        children.map((child: any, ci: number) => {
          if (child.type === 'link') {
            const linkText = child.children?.map((c: any) => c.text).join('') || child.url;
            return (
              <a
                key={ci}
                href={child.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-700 dark:text-amber-400 underline hover:text-amber-900 dark:hover:text-amber-300 break-all"
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
        const firstLetter = plainText.charAt(0);
        const restOfText = plainText.slice(1);
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
            {restOfText}
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
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
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
          style={{ listStyle: 'none', paddingLeft: '1.25rem', marginLeft: 0 }}
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
                  background: '#a87437',
                }}
              />
              {item.children?.map((child: any) => child.text).join('')}
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
  return <div className="mb-6">{renderRichText(block.body, isFirstRichTextBlock, hasPrecedingFloat)}</div>;
}

function ImageBlockRenderer({ block }: { block: ImageBlock }) {
  const position = getPosition(block);
  const variant = positionToVariant(position);
  const altText = block.alt || block.image?.alternativeText || block.caption || 'Obrázok';

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
    />
  );
}

function QuoteBlockRenderer({ block, needsClearBefore }: { block: QuoteBlockType; needsClearBefore?: boolean }) {
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
  const items = block.items || [];
  if (items.length === 0 && !block.intro) return null;
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
        <ul className="list-none p-0 m-0 space-y-1.5">
          {items.map((it, j) => {
            const text = (it.text || '').trim();
            const url = (it.url || '').trim();
            return (
              <li key={it.id || j} className="text-stone-700 leading-relaxed">
                {url ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-700 hover:text-amber-900 hover:underline break-all"
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

function ImageGalleryRenderer({ block, needsClearBefore }: { block: ImageGalleryBlock; needsClearBefore?: boolean }) {
  const columns = block.columns || '3';
  const gridCols = {
    '2': 'grid-cols-2',
    '3': 'grid-cols-2 md:grid-cols-3',
    '4': 'grid-cols-2 md:grid-cols-4',
  };

  return (
    <>
      {needsClearBefore && <div className="clear-both" />}
      <motion.div
        className={`grid ${gridCols[columns]} gap-4 my-6 clear-both`}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        {block.images?.map((image, idx) => (
          <motion.div
            key={image.id || idx}
            className="rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: idx * 0.1 }}
          >
            <ImageWithFallback
              src={getStrapiImageUrl(image)}
              alt={image.alternativeText || image.caption || ''}
              className="w-full h-48 object-cover"
            />
          </motion.div>
        ))}
      </motion.div>
    </>
  );
}

// =============================================================================
// MAIN RENDERER with pairing logic
// =============================================================================

export function DynamicZoneRenderer({ blocks }: DynamicZoneRendererProps) {
  if (!blocks || blocks.length === 0) return null;

  // Find the index of the first rich-text block (for drop cap)
  const firstRichTextIndex = blocks.findIndex(b => b.__component === 'content.rich-text');

  const renderedElements: React.ReactNode[] = [];
  const skipIndices = new Set<number>();

  for (let idx = 0; idx < blocks.length; idx++) {
    // Skip if this block was already rendered as part of a pair
    if (skipIndices.has(idx)) continue;

    const block = blocks[idx];
    const isPrevFloat = isPreviousBlockFloat(blocks, idx);

    // =======================================================================
    // PAIRING LOGIC: Check if this image block should pair with next
    // =======================================================================
    if (block.__component === 'content.image-block') {
      const imgBlock = block as ImageBlock;
      const nextBlock = blocks[idx + 1];

      // Check pairing conditions:
      // 1. Current block has pairWithNext=true
      // 2. Next block exists and is an image-block
      // 3. Positions are opposite (left+right or right+left)
      if (
        imgBlock.pairWithNext &&
        nextBlock &&
        nextBlock.__component === 'content.image-block'
      ) {
        const nextImgBlock = nextBlock as ImageBlock;
        const currentPos = getPosition(imgBlock);
        const nextPos = getPosition(nextImgBlock);

        if (arePositionsOpposite(currentPos, nextPos)) {
          // Render as paired row
          const leftBlock = currentPos === 'left' ? imgBlock : nextImgBlock;
          const rightBlock = currentPos === 'right' ? imgBlock : nextImgBlock;

          renderedElements.push(
            <PairedImageRow
              key={`pair-${imgBlock.id || idx}-${nextImgBlock.id || idx + 1}`}
              leftBlock={leftBlock}
              rightBlock={rightBlock}
            />
          );

          // Skip the next block since it's already rendered
          skipIndices.add(idx + 1);
          continue;
        }
      }

      // Render single image block
      renderedElements.push(
        <ImageBlockRenderer
          key={`${block.__component}-${imgBlock.id || idx}`}
          block={imgBlock}
        />
      );
      continue;
    }

    // =======================================================================
    // OTHER BLOCK TYPES
    // =======================================================================
    switch (block.__component) {
      case 'content.rich-text':
        renderedElements.push(
          <RichTextRenderer
            key={`${block.__component}-${block.id || idx}`}
            block={block as RichTextBlock}
            isFirstRichTextBlock={idx === firstRichTextIndex}
            hasPrecedingFloat={isPrevFloat}
          />
        );
        break;

      case 'content.quote-block':
        renderedElements.push(
          <QuoteBlockRenderer
            key={`${block.__component}-${block.id || idx}`}
            block={block as QuoteBlockType}
            needsClearBefore={isPrevFloat}
          />
        );
        break;

      case 'content.image-gallery':
        renderedElements.push(
          <ImageGalleryRenderer
            key={`${block.__component}-${block.id || idx}`}
            block={block as ImageGalleryBlock}
            needsClearBefore={isPrevFloat}
          />
        );
        break;

      case 'content.sources':
        renderedElements.push(
          <SourcesRenderer
            key={`${block.__component}-${block.id || idx}`}
            block={block as SourcesBlock}
            needsClearBefore={isPrevFloat}
          />
        );
        break;

      default:
        break;
    }
  }

  return (
    <div className="dynamic-zone-content">
      {renderedElements}
      {/* Final clearfix for any trailing floats */}
      <div className="clear-both" />
    </div>
  );
}
