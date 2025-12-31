'use client';

import { motion } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';

// =============================================================================
// TYPES
// =============================================================================

export type BlogMediaVariant =
  | 'left-float'
  | 'right-float'
  | 'side-by-side'
  | 'full-width'
  | 'breakout'
  | 'center';

export type BlogMediaSize = 'small' | 'medium' | 'large';
export type BlogMediaWidth = '30' | '40' | '50' | '60' | '100';
export type BlogMediaAspectRatio = '3:2' | '16:9' | '4:3' | '1:1' | '2:3' | '9:16' | '3:4' | 'auto';

export interface BlogMediaProps {
  // Layout
  variant?: BlogMediaVariant;
  size?: BlogMediaSize;
  widthPercent?: BlogMediaWidth;
  aspectRatio?: BlogMediaAspectRatio;
  objectPosition?: string;

  // Primary image (required)
  src: string;
  alt: string;
  width?: number;
  height?: number;

  // Second image (for side-by-side)
  secondSrc?: string;
  secondAlt?: string;
  secondWidth?: number;
  secondHeight?: number;

  // Captions
  caption?: string;
  captions?: [string?, string?];
  credit?: string;
  sourceUrl?: string;

  // Display options
  showCaption?: boolean;
  rounded?: boolean;
  shadow?: boolean;

  // Behavior
  priority?: boolean;
  decorative?: boolean;
  className?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

// Size → Width fallback mapping (backward compatibility)
const SIZE_TO_WIDTH: Record<BlogMediaSize, BlogMediaWidth> = {
  small: '30',
  medium: '50',
  large: '60',
};

// Width → CSS percentage
const WIDTH_PERCENT: Record<BlogMediaWidth, string> = {
  '30': '30%',
  '40': '40%',
  '50': '50%',
  '60': '60%',
  '100': '100%',
};

// Aspect ratio → padding-bottom percentage (for padding-bottom trick)
const ASPECT_RATIO_PADDING: Record<BlogMediaAspectRatio, string | null> = {
  '3:2': '66.67%',
  '16:9': '56.25%',
  '4:3': '75%',
  '1:1': '100%',
  '2:3': '150%',
  '9:16': '177.78%',
  '3:4': '133.33%',
  'auto': null, // Use natural dimensions
};

// =============================================================================
// HELPER: Get effective width
// =============================================================================

function getEffectiveWidth(widthPercent?: BlogMediaWidth, size?: BlogMediaSize): string {
  if (widthPercent) {
    return WIDTH_PERCENT[widthPercent];
  }
  if (size) {
    return WIDTH_PERCENT[SIZE_TO_WIDTH[size]];
  }
  return WIDTH_PERCENT['50']; // default 50%
}

// =============================================================================
// HELPER: Get aspect ratio from dimensions (fallback for auto)
// =============================================================================

function getAutoAspectRatio(width?: number, height?: number): string | null {
  if (width && height) {
    return `${((height / width) * 100).toFixed(2)}%`;
  }
  return '66.67%'; // Default to 3:2
}

// =============================================================================
// HELPER: Caption component
// =============================================================================

interface FigcaptionProps {
  caption?: string;
  credit?: string;
  sourceUrl?: string;
  align?: 'left' | 'center' | 'right';
  show?: boolean;
}

function Figcaption({ caption, credit, sourceUrl, align = 'center', show = true }: FigcaptionProps) {
  if (!show || (!caption && !credit)) return null;

  const alignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[align];

  return (
    <figcaption
      className={`mt-2 text-sm text-stone-500 dark:text-stone-400 ${alignClass}`}
      style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
    >
      {caption && <span className="italic">{caption}</span>}
      {caption && credit && <span className="mx-1">—</span>}
      {credit && (
        sourceUrl ? (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-700 dark:text-amber-500 hover:underline"
          >
            {credit}
          </a>
        ) : (
          <span className="text-stone-600 dark:text-stone-500">{credit}</span>
        )
      )}
    </figcaption>
  );
}

// =============================================================================
// HELPER: Image wrapper with aspect ratio (padding-bottom trick)
// =============================================================================

interface ImageWrapperProps {
  src: string;
  alt: string;
  aspectRatio?: BlogMediaAspectRatio;
  objectPosition?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  decorative?: boolean;
  rounded?: boolean;
  shadow?: boolean;
  className?: string;
}

function ImageWrapper({
  src,
  alt,
  aspectRatio = 'auto',
  objectPosition = 'center center',
  width,
  height,
  priority = false,
  decorative = false,
  rounded = true,
  shadow = true,
  className = ''
}: ImageWrapperProps) {
  const imgProps = decorative
    ? { alt: '', 'aria-hidden': true as const, role: 'presentation' as const }
    : { alt };

  // Calculate padding-bottom for aspect ratio
  const paddingBottom = aspectRatio === 'auto'
    ? getAutoAspectRatio(width, height)
    : ASPECT_RATIO_PADDING[aspectRatio];

  const roundedClass = rounded ? 'rounded-lg' : '';
  const shadowClass = shadow ? 'shadow-lg' : '';

  return (
    <div
      className={`relative overflow-hidden ${roundedClass} ${shadowClass} ${className}`}
      style={{ paddingBottom: paddingBottom || '66.67%' }}
    >
      <ImageWithFallback
        src={src}
        {...imgProps}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ objectPosition }}
        loading={priority ? 'eager' : 'lazy'}
      />
    </div>
  );
}

// =============================================================================
// VARIANT: Float Left/Right (text wrapping)
// =============================================================================

function FloatLayout({
  variant,
  src,
  alt,
  widthPercent,
  size = 'medium',
  aspectRatio = 'auto',
  objectPosition = 'center center',
  width,
  height,
  caption,
  credit,
  sourceUrl,
  showCaption = true,
  rounded = true,
  shadow = true,
  priority,
  decorative,
}: BlogMediaProps & { variant: 'left-float' | 'right-float' }) {
  const isLeft = variant === 'left-float';
  const captionAlign = isLeft ? 'left' : 'right';
  const effectiveWidth = getEffectiveWidth(widthPercent, size);

  return (
    <motion.figure
      className="blog-media-float mb-4"
      style={{
        float: isLeft ? 'left' : 'right',
        width: effectiveWidth,
        minWidth: '220px',
        maxWidth: '100%',
        marginRight: isLeft ? '1.5rem' : '0',
        marginLeft: isLeft ? '0' : '1.5rem',
        marginBottom: '1rem',
      }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <ImageWrapper
        src={src}
        alt={alt}
        aspectRatio={aspectRatio}
        objectPosition={objectPosition}
        width={width}
        height={height}
        priority={priority}
        decorative={decorative}
        rounded={rounded}
        shadow={shadow}
      />
      <Figcaption
        caption={caption}
        credit={credit}
        sourceUrl={sourceUrl}
        align={captionAlign}
        show={showCaption}
      />
    </motion.figure>
  );
}

// =============================================================================
// VARIANT: Side by Side (two images)
// =============================================================================

function SideBySideLayout({
  src,
  alt,
  secondSrc,
  secondAlt,
  aspectRatio = 'auto',
  objectPosition = 'center center',
  width,
  height,
  secondWidth,
  secondHeight,
  caption,
  captions,
  credit,
  sourceUrl,
  showCaption = true,
  rounded = true,
  shadow = true,
  priority,
  decorative,
}: BlogMediaProps) {
  const [caption1, caption2] = captions || [undefined, undefined];

  return (
    <motion.figure
      className="w-full mb-6 clear-both"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* First image */}
        <div>
          <ImageWrapper
            src={src}
            alt={alt}
            aspectRatio={aspectRatio}
            objectPosition={objectPosition}
            width={width}
            height={height}
            priority={priority}
            decorative={decorative}
            rounded={rounded}
            shadow={shadow}
          />
          {caption1 && showCaption && (
            <Figcaption caption={caption1} align="center" show={showCaption} />
          )}
        </div>

        {/* Second image */}
        {secondSrc && (
          <div>
            <ImageWrapper
              src={secondSrc}
              alt={secondAlt || alt}
              aspectRatio={aspectRatio}
              objectPosition={objectPosition}
              width={secondWidth}
              height={secondHeight}
              priority={priority}
              decorative={decorative}
              rounded={rounded}
              shadow={shadow}
            />
            {caption2 && showCaption && (
              <Figcaption caption={caption2} align="center" show={showCaption} />
            )}
          </div>
        )}
      </div>

      {/* Shared caption (if no per-image captions) */}
      {caption && !captions && (
        <Figcaption
          caption={caption}
          credit={credit}
          sourceUrl={sourceUrl}
          align="center"
          show={showCaption}
        />
      )}
    </motion.figure>
  );
}

// =============================================================================
// VARIANT: Full Width
// =============================================================================

function FullWidthLayout({
  src,
  alt,
  aspectRatio = 'auto',
  objectPosition = 'center center',
  width,
  height,
  caption,
  credit,
  sourceUrl,
  showCaption = true,
  rounded = true,
  shadow = true,
  priority,
  decorative,
}: BlogMediaProps) {
  return (
    <motion.figure
      className="w-full mb-6 clear-both"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <ImageWrapper
        src={src}
        alt={alt}
        aspectRatio={aspectRatio}
        objectPosition={objectPosition}
        width={width}
        height={height}
        priority={priority}
        decorative={decorative}
        rounded={rounded}
        shadow={shadow}
      />
      <Figcaption
        caption={caption}
        credit={credit}
        sourceUrl={sourceUrl}
        align="center"
        show={showCaption}
      />
    </motion.figure>
  );
}

// =============================================================================
// VARIANT: Breakout (extends beyond content column)
// =============================================================================

function BreakoutLayout({
  src,
  alt,
  aspectRatio = 'auto',
  objectPosition = 'center center',
  width,
  height,
  caption,
  credit,
  sourceUrl,
  showCaption = true,
  rounded = true,
  shadow = true,
  priority,
  decorative,
}: BlogMediaProps) {
  return (
    <motion.figure
      className="mb-6 clear-both"
      style={{
        maxWidth: 'min(1200px, 100vw)',
        width: '100vw',
        position: 'relative',
        left: '50%',
        right: '50%',
        marginLeft: 'max(calc(-50vw + 50%), calc(-600px + 50%))',
        marginRight: 'max(calc(-50vw + 50%), calc(-600px + 50%))',
        paddingLeft: '1rem',
        paddingRight: '1rem',
      }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <ImageWrapper
        src={src}
        alt={alt}
        aspectRatio={aspectRatio}
        objectPosition={objectPosition}
        width={width}
        height={height}
        priority={priority}
        decorative={decorative}
        rounded={rounded}
        shadow={shadow}
      />
      <Figcaption
        caption={caption}
        credit={credit}
        sourceUrl={sourceUrl}
        align="center"
        show={showCaption}
      />
    </motion.figure>
  );
}

// =============================================================================
// VARIANT: Center (centered within column, respects width)
// =============================================================================

function CenterLayout({
  src,
  alt,
  widthPercent,
  size = 'medium',
  aspectRatio = 'auto',
  objectPosition = 'center center',
  width,
  height,
  caption,
  credit,
  sourceUrl,
  showCaption = true,
  rounded = true,
  shadow = true,
  priority,
  decorative,
}: BlogMediaProps) {
  const effectiveWidth = getEffectiveWidth(widthPercent, size);

  // Map width to max-width classes
  const maxWidthClass = {
    '30%': 'max-w-xs',
    '40%': 'max-w-sm',
    '50%': 'max-w-md',
    '60%': 'max-w-lg',
    '100%': 'max-w-full',
  }[effectiveWidth] || 'max-w-md';

  return (
    <motion.figure
      className={`mb-6 clear-both mx-auto ${maxWidthClass}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <ImageWrapper
        src={src}
        alt={alt}
        aspectRatio={aspectRatio}
        objectPosition={objectPosition}
        width={width}
        height={height}
        priority={priority}
        decorative={decorative}
        rounded={rounded}
        shadow={shadow}
      />
      <Figcaption
        caption={caption}
        credit={credit}
        sourceUrl={sourceUrl}
        align="center"
        show={showCaption}
      />
    </motion.figure>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function BlogMedia(props: BlogMediaProps) {
  const {
    variant = 'full-width',
    src,
    alt,
    decorative,
    showCaption = true,
    rounded = true,
    shadow = true,
  } = props;

  // Accessibility: Fail loudly in dev if alt is missing and not decorative
  if (process.env.NODE_ENV === 'development' && !alt && !decorative) {
    console.error(
      '[BlogMedia] Missing alt text for image:',
      src,
      '\nEither provide alt text or set decorative={true}'
    );
  }

  // Production fallback for missing alt
  const safeAlt = alt || (decorative ? '' : 'Obrázok');
  const safeProps = { ...props, alt: safeAlt, showCaption, rounded, shadow };

  switch (variant) {
    case 'left-float':
    case 'right-float':
      return <FloatLayout {...safeProps} variant={variant} />;

    case 'side-by-side':
      return <SideBySideLayout {...safeProps} />;

    case 'breakout':
      return <BreakoutLayout {...safeProps} />;

    case 'center':
      return <CenterLayout {...safeProps} />;

    case 'full-width':
    default:
      return <FullWidthLayout {...safeProps} />;
  }
}

// =============================================================================
// STRAPI MAPPING HELPER
// =============================================================================

import { StrapiImage, getStrapiImageUrl } from '../lib/strapi';

export interface StrapiImageBlock {
  __component: 'content.image-block';
  id: number;
  image: StrapiImage;
  secondImage?: StrapiImage;
  alt?: string;
  caption?: string;
  layout?: 'full-width' | 'left-float' | 'right-float' | 'center' | 'side-by-side' | 'breakout';
  size?: 'small' | 'medium' | 'large';
  width?: '30' | '40' | '50' | '60' | '100';
  aspectRatio?: '3:2' | '16:9' | '4:3' | '1:1' | '2:3' | '9:16' | '3:4' | 'auto';
  objectPosition?: string;
  showCaption?: boolean;
  rounded?: boolean;
  shadow?: boolean;
}

/**
 * Maps a Strapi image block to BlogMedia props
 * Handles backward compatibility with old size enum
 */
export function mapStrapiImageToProps(block: StrapiImageBlock): BlogMediaProps {
  const {
    image,
    secondImage,
    alt,
    caption,
    layout,
    size,
    width,
    aspectRatio,
    objectPosition,
    showCaption,
    rounded,
    shadow,
  } = block;

  return {
    variant: layout || 'full-width',
    size: size || 'medium',
    widthPercent: width,
    aspectRatio: aspectRatio || 'auto',
    objectPosition: objectPosition || 'center center',
    src: getStrapiImageUrl(image),
    alt: alt || image.alternativeText || image.caption || caption || '',
    width: image.width,
    height: image.height,
    caption,
    showCaption: showCaption ?? true,
    rounded: rounded ?? true,
    shadow: shadow ?? true,
    // Second image for side-by-side
    ...(secondImage && {
      secondSrc: getStrapiImageUrl(secondImage),
      secondAlt: secondImage.alternativeText || secondImage.caption || '',
      secondWidth: secondImage.width,
      secondHeight: secondImage.height,
    }),
  };
}

