'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import LightGallery from 'lightgallery/react';
import type { LightGallery as LightGalleryType } from 'lightgallery/lightgallery';

// Plugins
import lgZoom from 'lightgallery/plugins/zoom';
import lgThumbnail from 'lightgallery/plugins/thumbnail';
import lgFullscreen from 'lightgallery/plugins/fullscreen';
import lgRotate from 'lightgallery/plugins/rotate';
import lgShare from 'lightgallery/plugins/share';

// Styles
import 'lightgallery/css/lightgallery.css';
import 'lightgallery/css/lg-zoom.css';
import 'lightgallery/css/lg-thumbnail.css';
import 'lightgallery/css/lg-fullscreen.css';
import 'lightgallery/css/lg-rotate.css';
import 'lightgallery/css/lg-share.css';

import { Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

export interface GalleryImage {
  url: string;
  caption?: string;
  alt?: string;
}

interface HistoricalGalleryProps {
  images: GalleryImage[];
  title?: string;
}

export function HistoricalGallery({ images, title = 'Galéria' }: HistoricalGalleryProps) {
  const lightGalleryRef = useRef<LightGalleryType | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const onInit = useCallback((detail: { instance: LightGalleryType }) => {
    lightGalleryRef.current = detail.instance;
  }, []);

  const checkScrollability = useCallback(() => {
    const container = scrollContainerRef.current;
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 10
      );
    }
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollability);
      checkScrollability();
      return () => container.removeEventListener('scroll', checkScrollability);
    }
  }, [checkScrollability]);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = 400;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (!images || images.length === 0) return null;

  return (
    <div className="historical-gallery relative my-16">
      {/* Decorative Header */}
      <div className="flex items-center justify-center gap-4 mb-10 relative">
        <div className="absolute inset-0 flex items-center pointer-events-none">
          <div className="w-full h-px bg-gradient-to-r from-transparent via-amber-600/30 to-transparent"></div>
        </div>
        <div className="relative px-6 py-3 bg-gradient-to-br from-amber-100 via-amber-50 to-stone-50 dark:from-amber-950/40 dark:via-stone-900 dark:to-stone-950 border-4 border-double border-amber-600/40 rounded-lg shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-600 dark:bg-amber-700 rounded-full">
              <ImageIcon className="w-5 h-5 text-white" />
            </div>
            <h2
              className="text-2xl uppercase tracking-widest"
              style={{
                fontFamily: 'var(--font-heading)',
                letterSpacing: '0.15em',
                color: '#1f1a12'
              }}
            >
              {title}
            </h2>
            <span
              className="px-3 py-1 bg-amber-600 dark:bg-amber-700 text-white rounded-full text-sm"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              {images.length}
            </span>
          </div>
        </div>
      </div>

      {/* Horizontal Carousel with LightGallery */}
      <div className="relative group">
        {/* Parchment Background */}
        <div className="absolute inset-0 -m-4 bg-gradient-to-br from-amber-50/50 via-stone-50/30 to-amber-50/50 dark:from-stone-900/50 dark:via-amber-950/20 dark:to-stone-900/50 rounded-2xl border-2 border-amber-800/20 pointer-events-none"></div>

        {/* Navigation Arrows */}
        <button
          onClick={() => scroll('left')}
          className={`absolute left-2 top-1/2 -translate-y-1/2 z-30 p-3 bg-white/90 dark:bg-stone-900/90 backdrop-blur-sm border-2 border-amber-600/30 rounded-full shadow-xl transition-all ${
            !canScrollLeft
              ? 'opacity-30 cursor-not-allowed'
              : 'hover:bg-amber-50 dark:hover:bg-amber-950/50 hover:border-amber-600/60 hover:scale-110'
          }`}
          disabled={!canScrollLeft}
          aria-label="Predchádzajúci obrázok"
        >
          <ChevronLeft className="w-6 h-6 text-amber-800 dark:text-amber-400" />
        </button>

        <button
          onClick={() => scroll('right')}
          className={`absolute right-2 top-1/2 -translate-y-1/2 z-30 p-3 bg-white/90 dark:bg-stone-900/90 backdrop-blur-sm border-2 border-amber-600/30 rounded-full shadow-xl transition-all ${
            !canScrollRight
              ? 'opacity-30 cursor-not-allowed'
              : 'hover:bg-amber-50 dark:hover:bg-amber-950/50 hover:border-amber-600/60 hover:scale-110'
          }`}
          disabled={!canScrollRight}
          aria-label="Nasledujúci obrázok"
        >
          <ChevronRight className="w-6 h-6 text-amber-800 dark:text-amber-400" />
        </button>

        {/* Horizontal Scroll Container */}
        <div
          ref={scrollContainerRef}
          className="gallery-scroll-container overflow-x-auto overflow-y-hidden py-6 px-4 scrollbar-thin scrollbar-thumb-amber-600/50 scrollbar-track-transparent"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(180, 83, 9, 0.5) transparent'
          }}
        >
          <LightGallery
            onInit={onInit}
            speed={500}
            plugins={[lgZoom, lgThumbnail, lgFullscreen, lgRotate, lgShare]}
            mode="lg-fade"
            thumbnail={true}
            animateThumb={true}
            zoomFromOrigin={false}
            allowMediaOverlap={true}
            toggleThumb={true}
            download={true}
            counter={true}
            rotate={true}
            flipHorizontal={true}
            flipVertical={true}
            fullScreen={true}
            share={true}
            facebook={true}
            twitter={true}
            pinterest={false}
            actualSize={true}
            showZoomInOutIcons={true}
            mobileSettings={{
              controls: true,
              showCloseIcon: true,
              download: true,
              rotate: false
            }}
            licenseKey="0000-0000-000-0000"
            elementClassNames="gallery-horizontal"
          >
            {images.map((image, index) => (
              <a
                key={index}
                href={image.url}
                data-sub-html={`<h4 style="color: #fef3c7; font-family: Georgia, serif; font-style: italic; margin-bottom: 4px;">${image.caption || ''}</h4>`}
                data-lg-size="1600-1200"
                className="gallery-item group relative block flex-shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-amber-100 via-stone-100 to-amber-50 dark:from-stone-800 dark:via-amber-950/30 dark:to-stone-900 border-4 border-amber-800/20 shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:border-amber-600/40"
                style={{ width: '320px' }}
              >
                {/* Decorative Corners */}
                <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-amber-600/50 rounded-tl-md z-10 pointer-events-none"></div>
                <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-amber-600/50 rounded-tr-md z-10 pointer-events-none"></div>
                <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-amber-600/50 rounded-bl-md z-10 pointer-events-none"></div>
                <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-amber-600/50 rounded-br-md z-10 pointer-events-none"></div>

                {/* Image Container */}
                <div className="aspect-[4/3] relative overflow-hidden">
                  <ImageWithFallback
                    src={image.url}
                    alt={image.alt || `Obrázok ${index + 1}`}
                    className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
                    style={{
                      filter: 'sepia(0.1) brightness(0.98)',
                    }}
                  />

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-amber-950/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                  {/* Image Number Badge */}
                  <div className="absolute top-4 right-4 px-3 py-1 bg-amber-900/80 text-amber-100 text-sm rounded-full backdrop-blur-sm border border-amber-600/30">
                    <span style={{ fontFamily: 'var(--font-serif)' }}>{index + 1}/{images.length}</span>
                  </div>
                </div>

                {/* Caption */}
                {image.caption && (
                  <div className="p-4 bg-gradient-to-b from-transparent to-amber-50/50 dark:to-stone-900/50">
                    <p
                      className="text-sm leading-relaxed line-clamp-2"
                      style={{
                        fontFamily: 'var(--font-serif)',
                        color: '#3a3024',
                        fontStyle: 'italic',
                      }}
                    >
                      {image.caption}
                    </p>
                  </div>
                )}

                {/* Parchment Texture Overlay */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-20 mix-blend-overlay"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                  }}
                />
              </a>
            ))}
          </LightGallery>
        </div>

        {/* Scroll Indicator Bar */}
        <div className="flex justify-center mt-4 gap-1">
          {images.length > 4 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-100/50 dark:bg-stone-800/50 rounded-full">
              <span className="text-xs text-amber-800 dark:text-amber-400" style={{ fontFamily: 'var(--font-serif)' }}>
                Posúvajte pre ďalšie obrázky
              </span>
              <div className="flex gap-1">
                <ChevronLeft className="w-4 h-4 text-amber-600 dark:text-amber-500" />
                <ChevronRight className="w-4 h-4 text-amber-600 dark:text-amber-500" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Custom Styles for lightGallery */}
      <style>{`
        .gallery-horizontal {
          display: flex;
          gap: 1.5rem;
          padding: 0.5rem;
          position: relative;
          z-index: 10;
        }

        .gallery-scroll-container {
          -webkit-overflow-scrolling: touch;
        }

        .gallery-scroll-container::-webkit-scrollbar {
          height: 8px;
        }

        .gallery-scroll-container::-webkit-scrollbar-track {
          background: rgba(180, 83, 9, 0.1);
          border-radius: 4px;
        }

        .gallery-scroll-container::-webkit-scrollbar-thumb {
          background: rgba(180, 83, 9, 0.4);
          border-radius: 4px;
        }

        .gallery-scroll-container::-webkit-scrollbar-thumb:hover {
          background: rgba(180, 83, 9, 0.6);
        }

        /* LightGallery Custom Theme - Historical Style */
        .lg-container {
          font-family: Georgia, 'Times New Roman', serif;
        }

        .lg-backdrop {
          background-color: rgba(15, 14, 11, 0.97);
        }

        .lg-toolbar,
        .lg-actions {
          background: linear-gradient(to bottom, rgba(15, 14, 11, 0.9), transparent);
        }

        .lg-toolbar .lg-icon,
        .lg-actions .lg-icon {
          color: #fef3c7;
          transition: all 0.3s ease;
        }

        .lg-toolbar .lg-icon:hover,
        .lg-actions .lg-icon:hover {
          color: #fbbf24;
          transform: scale(1.1);
        }

        .lg-counter {
          color: #fef3c7;
          font-family: Georgia, 'Times New Roman', serif;
          font-style: italic;
          padding: 8px 16px;
          background: rgba(180, 83, 9, 0.3);
          border-radius: 9999px;
          border: 1px solid rgba(251, 191, 36, 0.3);
        }

        .lg-sub-html {
          background: linear-gradient(to top, rgba(15, 14, 11, 0.95), rgba(15, 14, 11, 0.8), transparent);
          padding: 20px 40px 30px;
        }

        .lg-sub-html h4 {
          font-size: 1.125rem;
          line-height: 1.6;
          max-width: 800px;
          margin: 0 auto;
          text-align: center;
        }

        /* Thumbnails */
        .lg-thumb-outer {
          background: linear-gradient(to top, rgba(15, 14, 11, 0.98), rgba(15, 14, 11, 0.9));
          border-top: 1px solid rgba(180, 83, 9, 0.3);
        }

        .lg-thumb-item {
          border-radius: 8px;
          overflow: hidden;
          border: 2px solid transparent;
          transition: all 0.3s ease;
        }

        .lg-thumb-item:hover {
          border-color: rgba(251, 191, 36, 0.5);
        }

        .lg-thumb-item.active {
          border-color: #fbbf24;
          box-shadow: 0 0 10px rgba(251, 191, 36, 0.4);
        }

        /* Navigation arrows */
        .lg-prev,
        .lg-next {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(4px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          transition: all 0.3s ease;
        }

        .lg-prev:hover,
        .lg-next:hover {
          background: rgba(180, 83, 9, 0.4);
          border-color: rgba(251, 191, 36, 0.5);
        }

        /* Close button */
        .lg-close {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(4px);
          border-radius: 50%;
          transition: all 0.3s ease;
        }

        .lg-close:hover {
          background: rgba(220, 38, 38, 0.4);
        }

        /* Zoom controls */
        .lg-zoom-in,
        .lg-zoom-out,
        .lg-actual-size {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          transition: all 0.3s ease;
        }

        .lg-zoom-in:hover,
        .lg-zoom-out:hover,
        .lg-actual-size:hover {
          background: rgba(180, 83, 9, 0.4);
        }

        /* Fullscreen */
        .lg-fullscreen:hover {
          color: #fbbf24;
        }

        /* Share */
        .lg-share:hover {
          color: #fbbf24;
        }

        /* Rotate buttons */
        .lg-rotate-left:hover,
        .lg-rotate-right:hover,
        .lg-flip-hor:hover,
        .lg-flip-ver:hover {
          color: #fbbf24;
        }

        /* Download button */
        .lg-download:hover {
          color: #fbbf24;
        }

        /* Progress bar during loading */
        .lg-progress-bar {
          background: rgba(180, 83, 9, 0.3);
        }

        .lg-progress-bar .lg-progress {
          background: linear-gradient(to right, #b45309, #fbbf24);
        }

        /* Image container */
        .lg-img-wrap {
          padding: 20px;
        }

        .lg-image {
          border-radius: 8px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        /* Share dropdown */
        .lg-dropdown {
          background: rgba(15, 14, 11, 0.95);
          border: 1px solid rgba(180, 83, 9, 0.3);
          border-radius: 12px;
          backdrop-filter: blur(8px);
        }

        .lg-dropdown a {
          color: #fef3c7;
          transition: all 0.2s ease;
        }

        .lg-dropdown a:hover {
          background: rgba(180, 83, 9, 0.3);
          color: #fbbf24;
        }

        /* Loading spinner */
        .lg-outer .lg-item.lg-loading::after {
          border-color: rgba(180, 83, 9, 0.3);
          border-top-color: #fbbf24;
        }

        /* Animation for gallery items on page */
        .gallery-item {
          animation: fadeInRight 0.5s ease forwards;
          opacity: 0;
        }

        .gallery-item:nth-child(1) { animation-delay: 0.1s; }
        .gallery-item:nth-child(2) { animation-delay: 0.15s; }
        .gallery-item:nth-child(3) { animation-delay: 0.2s; }
        .gallery-item:nth-child(4) { animation-delay: 0.25s; }
        .gallery-item:nth-child(5) { animation-delay: 0.3s; }
        .gallery-item:nth-child(6) { animation-delay: 0.35s; }
        .gallery-item:nth-child(7) { animation-delay: 0.4s; }
        .gallery-item:nth-child(8) { animation-delay: 0.45s; }
        .gallery-item:nth-child(n+9) { animation-delay: 0.5s; }

        @keyframes fadeInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}

// Export types for external use
export type { GalleryImage, HistoricalGalleryProps };
