'use client';

import { motion } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { QuoteBlock } from './QuoteBlock';
import { BlogMedia, BlogMediaAspectRatio, BlogMediaWidth } from './BlogMedia';
import { getStrapiImageUrl, StrapiImage } from '../lib/strapi';

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
  // NEW: SCEAR-style position and pairing
  position?: 'left' | 'right' | 'center' | 'full';
  pairWithNext?: boolean;
  width?: '30' | '40' | '50' | '60' | '100';
  aspectRatio?: '3:2' | '16:9' | '4:3' | '1:1' | '2:3' | '9:16' | '3:4' | 'auto';
  objectPosition?: string;
  showCaption?: boolean;
  rounded?: boolean;
  shadow?: boolean;
  // LEGACY fields (backward compatibility)
  secondImage?: StrapiImage;
  layout?: 'full-width' | 'left-float' | 'right-float' | 'center' | 'side-by-side' | 'breakout';
  size?: 'small' | 'medium' | 'large';
  alignment?: 'left' | 'center' | 'right' | 'full';
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

type DynamicBlock = RichTextBlock | ImageBlock | QuoteBlockType | ImageGalleryBlock;

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
// HELPER: Get effective position from block (supports legacy layout field)
// =============================================================================

function getEffectivePosition(block: ImageBlock): 'left' | 'right' | 'center' | 'full' {
  // New position field takes priority
  if (block.position) return block.position;

  // Legacy layout field mapping
  if (block.layout) {
    switch (block.layout) {
      case 'left-float': return 'left';
      case 'right-float': return 'right';
      case 'full-width':
      case 'breakout': return 'full';
      default: return 'center';
    }
  }

  // Legacy alignment field
  if (block.alignment) {
    switch (block.alignment) {
      case 'left': return 'left';
      case 'right': return 'right';
      case 'full': return 'full';
      default: return 'center';
    }
  }

  return 'center';
}

// =============================================================================
// HELPER: Map position to BlogMedia variant
// =============================================================================

function positionToVariant(position: 'left' | 'right' | 'center' | 'full'): string {
  switch (position) {
    case 'left': return 'left-float';
    case 'right': return 'right-float';
    case 'full': return 'full-width';
    default: return 'center';
  }
}

// =============================================================================
// HELPER: Check if block is a float (for clear-float logic)
// =============================================================================

function isFloatPosition(block: ImageBlock): boolean {
  const pos = getEffectivePosition(block);
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

    return (
      <>
        <div
          className={`relative overflow-hidden ${rounded ? 'rounded-lg' : ''} ${shadow ? 'shadow-lg' : ''}`}
          style={{ paddingBottom }}
        >
          <ImageWithFallback
            src={getStrapiImageUrl(block.image)}
            alt={altText}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition }}
          />
        </div>
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

function renderRichText(body: any[], isFirstBlock: boolean = false, hasPrecedingFloat: boolean = false) {
  if (!body) return null;

  let isFirstParagraph = isFirstBlock;
  const elements: React.ReactNode[] = [];

  body.forEach((block, idx) => {
    // Clear before headings if there was a preceding float
    if (block.type === 'heading' && hasPrecedingFloat) {
      elements.push(<div key={`clear-${idx}`} className="clear-both" />);
    }

    if (block.type === 'paragraph') {
      const text = block.children?.map((child: any) => child.text).join('') || '';
      if (!text.trim()) return;

      const shouldDropCap = isFirstParagraph && text.length > 0;
      if (isFirstParagraph) isFirstParagraph = false;

      if (shouldDropCap) {
        const firstLetter = text.charAt(0);
        const restOfText = text.slice(1);
        elements.push(
          <p
            key={idx}
            className="text-base md:text-lg leading-relaxed mb-4 text-stone-700 dark:text-stone-300"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            <span
              className="float-left text-5xl md:text-6xl font-bold text-amber-700 dark:text-amber-500 mr-2 mt-1"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif', lineHeight: '0.8' }}
            >
              {firstLetter}
            </span>
            {restOfText}
          </p>
        );
        return;
      }

      elements.push(
        <p
          key={idx}
          className="text-base md:text-lg leading-relaxed mb-4 text-stone-700 dark:text-stone-300"
          style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
        >
          {text}
        </p>
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
        <ul key={idx} className="list-disc list-inside space-y-2 my-4 text-stone-700 dark:text-stone-300">
          {block.children?.map((item: any, i: number) => (
            <li key={i} style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
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
  isFirstBlock = false,
  hasPrecedingFloat = false
}: {
  block: RichTextBlock;
  isFirstBlock?: boolean;
  hasPrecedingFloat?: boolean;
}) {
  return <div className="mb-6">{renderRichText(block.body, isFirstBlock, hasPrecedingFloat)}</div>;
}

function ImageBlockRenderer({ block }: { block: ImageBlock }) {
  const position = getEffectivePosition(block);
  const variant = positionToVariant(position);
  const altText = block.alt || block.image?.alternativeText || block.caption || 'Obrázok';

  // LEGACY: Handle old secondImage + side-by-side layout
  if (block.secondImage && block.layout === 'side-by-side') {
    return (
      <BlogMedia
        variant="side-by-side"
        size={block.size || 'medium'}
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
        secondSrc={getStrapiImageUrl(block.secondImage)}
        secondAlt={block.secondImage?.alternativeText || block.secondImage?.caption || altText}
        secondWidth={block.secondImage?.width}
        secondHeight={block.secondImage?.height}
      />
    );
  }

  return (
    <BlogMedia
      variant={variant as any}
      size={block.size || 'medium'}
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
        const currentPos = getEffectivePosition(imgBlock);
        const nextPos = getEffectivePosition(nextImgBlock);

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
            isFirstBlock={idx === firstRichTextIndex}
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
