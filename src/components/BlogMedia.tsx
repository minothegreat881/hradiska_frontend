'use client';

import { motion } from 'motion/react';
import { ZoomIn } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

// Helper: open gallery modal with specific image
function openGalleryWithImage(imageUrl: string) {
  // Dispatch custom event that HistoricalGallery listens to
  window.dispatchEvent(new CustomEvent('openGalleryModal', { detail: { imageUrl } }));
}

// =============================================================================
// TYPES
// =============================================================================

export type BlogMediaVariant =
  | 'left-float'
  | 'right-float'
  | 'full-width'
  | 'breakout'
  | 'center';
export type BlogMediaWidth = '30' | '40' | '50' | '60' | '100';
export type BlogMediaAspectRatio = '3:2' | '16:9' | '4:3' | '1:1' | '2:3' | '9:16' | '3:4' | 'auto';

export interface BlogMediaProps {
  // Layout
  variant?: BlogMediaVariant;
  widthPercent?: BlogMediaWidth;
  aspectRatio?: BlogMediaAspectRatio;
  objectPosition?: string;

  // Primary image (required)
  src: string;
  alt: string;
  width?: number;
  height?: number;

  // Captions
  caption?: string;
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

function getEffectiveWidth(widthPercent?: BlogMediaWidth): string {
  if (widthPercent) {
    return WIDTH_PERCENT[widthPercent];
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
    <button
      onClick={() => openGalleryWithImage(src)}
      className={`relative overflow-hidden ${roundedClass} ${shadowClass} ${className} cursor-pointer group block w-full text-left`}
      style={{ paddingBottom: paddingBottom || '66.67%' }}
      title="Kliknutím zobraziť v galérii"
    >
      <ImageWithFallback
        src={src}
        {...imgProps}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        style={{ objectPosition }}
        loading={priority ? 'eager' : 'lazy'}
      />
      {/* Hover overlay with zoom icon */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-3 bg-white/30 backdrop-blur-sm rounded-full">
          <ZoomIn className="w-6 h-6 text-white drop-shadow-lg" />
        </div>
      </div>
    </button>
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
  const effectiveWidth = getEffectiveWidth(widthPercent);

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
  const effectiveWidth = getEffectiveWidth(widthPercent);

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

    case 'breakout':
      return <BreakoutLayout {...safeProps} />;

    case 'center':
      return <CenterLayout {...safeProps} />;

    case 'full-width':
    default:
      return <FullWidthLayout {...safeProps} />;
  }
}


