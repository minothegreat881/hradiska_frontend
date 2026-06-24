'use client';

import { ArrowLeft, Feather, Quote, ZoomIn, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { mockArticles } from '../data/mock-data';
import { ArticleCard } from '../components/ArticleCard';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { InkEffect } from '../components/InkEffect';
import { ScrollReveal } from '../components/ScrollReveal';
import { SocialShare } from '../components/SocialShare';
import { CommentSection } from '../components/CommentSection';
import { HistoricalGallery } from '../components/HistoricalGallery';
import { ArticleSidebar } from '../components/ArticleSidebar';
import { useBlogPost, useBlogPosts } from '../hooks/useStrapi';
import { getStrapiImageUrl, convertStrapiPostToArticle, StrapiQuote } from '../lib/strapi';
import { QuoteBlock } from '../components/QuoteBlock';
import { DynamicZoneRenderer } from '../components/DynamicZoneRenderer';

interface ArticlePageProps {
  articleSlug: string;
}

export function ArticlePage({ articleSlug }: ArticlePageProps) {
  // Try to fetch from Strapi first
  const { post: strapiPost, loading, error } = useBlogPost(articleSlug);

  // Always check mock data first for full template experience
  const mockArticle = mockArticles.find((a) => a.slug === articleSlug);

  // Use mock article if available (for full template with images, quotes, etc.)
  // Only use Strapi if no mock exists for this slug
  const article = mockArticle || (strapiPost
    ? {
        ...convertStrapiPostToArticle(strapiPost),
        content: strapiPost.content, // Keep original blocks content
        author: { name: strapiPost.authorName || 'Hradiská.sk', avatar: '/avatar.jpg' },
        images: strapiPost.gallery?.map(img => ({
          url: getStrapiImageUrl(img),
          caption: img.caption || img.alternativeText || ''
        })) || [],
        gallery: (strapiPost.gallery || []).map((img: any) => ({
          url: getStrapiImageUrl(img),
          caption: img.caption || img.alternativeText || '',
          alt: img.alternativeText || img.caption || '',
        })),
        quotes: strapiPost.quotes || [],
        blocks: strapiPost.blocks || [], // Dynamic zone blocks
        bibliography: [],
      }
    : null);

  // Get Strapi quotes separately for rendering
  const strapiQuotes: StrapiQuote[] = strapiPost?.quotes || [];

  // Loading state - only show if no mock article available
  if (loading && !mockArticle) {
    return (
      <div className="min-h-screen parchment flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="w-12 h-12 text-amber-700 mx-auto mb-4" />
          </motion.div>
          <p className="text-amber-800 dark:text-amber-200">Načítavam článok...</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen parchment flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-amber-950 dark:text-amber-100 mb-4" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            Článok nenájdený
          </h1>
          <a
            href="/blog"
            className="text-amber-700 dark:text-amber-400 hover:underline"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            Späť na blog →
          </a>
        </div>
      </div>
    );
  }

  const relatedArticles = mockArticles
    .filter((a) => a.id !== article.id && a.category === article.category)
    .slice(0, 3);

  const categoryLabels: Record<string, string> = {
    vyskum: 'Výskum',
    historia: 'História',
    metodika: 'Metodika',
    aktuality: 'Aktuality',
  };

  // Timeline data - use Strapi data if available
  const timelineData = strapiPost?.timeline?.length
    ? strapiPost.timeline.map(t => ({
        year: t.year,
        title: t.title,
        description: t.description,
        type: 'local' as const
      }))
    : [
        { year: '800', title: 'Založenie hradiska', description: 'Prvé osídlenie lokality', type: 'local' as const },
        { year: '833', title: 'Pribinovo kniežatstvo', description: 'Vznik prvého štátneho útvaru', type: 'global' as const },
        { year: '863', title: 'Príchod Cyrila a Metoda', description: 'Začiatok christianizácie', type: 'global' as const },
        { year: '894', title: 'Smrť Svätopluka', description: 'Koniec zlatého veku Veľkej Moravy', type: 'global' as const },
        { year: '~906', title: 'Zánik hradiska', description: 'Zničenie pri maďarských nájazdoch', type: 'local' as const },
      ];

  // Coordinates - use Strapi location if available (NO default fallback)
  const articleCoordinates =
    strapiPost?.location && typeof strapiPost.location.latitude === 'number' && typeof strapiPost.location.longitude === 'number'
      ? { lat: strapiPost.location.latitude, lng: strapiPost.location.longitude }
      : undefined;

  // Location name from Strapi (only meaningful if coordinates exist)
  const locationName = strapiPost?.location?.name;

  // Key facts from Strapi
  const keyFactsData = strapiPost?.keyFacts?.map((f, i) => ({
    number: i + 1,
    title: f.label,
    description: f.value
  }));

  // Helper function to render Strapi blocks content
  const renderStrapiBlocks = (blocks: any[]) => {
    let paragraphCount = 0; // Track first paragraph for drop cap
    return blocks.map((block, idx) => {
      if (block.type === 'paragraph') {
        const text = block.children?.map((child: any) => child.text).join('') || '';
        const isFirstParagraph = paragraphCount === 0;
        paragraphCount++;
        return (
          <p
            key={idx}
            className={`article-paragraph text-lg leading-relaxed mb-6 ${isFirstParagraph ? 'article-first-paragraph' : ''}`}
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            {text}
          </p>
        );
      }
      if (block.type === 'heading') {
        const text = block.children?.map((child: any) => child.text).join('') || '';
        const level = block.level || 2;
        if (level === 2) {
          return (
            <motion.h2
              key={idx}
              className="mb-6 mt-12 flex items-center gap-3 text-2xl"
              style={{
                fontFamily: 'var(--font-heading)',
                color: '#1f1a12',
                letterSpacing: '0.05em',
                textTransform: 'uppercase'
              }}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="w-1 h-8 bg-gradient-to-b from-amber-600 to-transparent rounded-full"></div>
              {text}
            </motion.h2>
          );
        }
        return <h3 key={idx} className="mb-4 mt-8 text-xl" style={{ fontFamily: 'var(--font-heading)', color: '#2d2418' }}>{text}</h3>;
      }
      if (block.type === 'list') {
        return (
          <ul key={idx} className="space-y-4 my-8 ml-6">
            {block.children?.map((item: any, i: number) => (
              <li key={i} className="leading-relaxed relative pl-6 text-lg" style={{ fontFamily: 'var(--font-serif)', color: '#2d2418' }}>
                <span className="absolute left-0 top-2.5 w-2 h-2 bg-amber-600 rounded-full"></span>
                {item.children?.map((child: any) => child.text).join('')}
              </li>
            ))}
          </ul>
        );
      }
      return null;
    });
  };

  // Helper function to render content with images and quotes (for string content)
  const renderContent = (content: string | any[]) => {
    // If content is Strapi blocks array
    if (Array.isArray(content)) {
      return renderStrapiBlocks(content);
    }

    // Otherwise treat as string (mock data)
    const paragraphs = (content as string).split('\n\n');
    let paragraphCount = 0; // Track actual text paragraphs for drop cap

    return paragraphs.map((paragraph, idx) => {
      // Check for image placeholder
      if (paragraph.match(/\[IMAGE:(\d+)\]/)) {
        const imageIndex = parseInt(paragraph.match(/\[IMAGE:(\d+)\]/)![1]);
        const image = article.images?.[imageIndex];

        if (image) {
          // Alternate between right and left based on image index
          const isRight = imageIndex % 2 === 0;

          return (
            <figure
              key={idx}
              style={{
                float: isRight ? 'right' : 'left',
                width: '50%',
                margin: isRight ? '0.5rem 0 1.5rem 1.5rem' : '0.5rem 1.5rem 1.5rem 0',
                clear: 'both'
              }}
            >
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('openGalleryModal', { detail: { imageUrl: image.url } }))}
                className="block relative group cursor-zoom-in w-full p-0 border-0 bg-transparent text-left"
              >
                <div className="rounded-lg overflow-hidden shadow-lg border border-stone-200 transition-all duration-300 group-hover:shadow-xl group-hover:border-amber-500/50">
                  <ImageWithFallback
                    src={image.url}
                    alt={image.caption}
                    className="w-full h-auto transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                    <ZoomIn className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 drop-shadow-lg" />
                  </div>
                </div>
              </button>
              <figcaption className={`mt-2 text-xs italic text-stone-500 dark:text-stone-400 ${isRight ? 'text-right pr-1' : 'text-left pl-1'}`}>
                {image.caption}
              </figcaption>
            </figure>
          );
        }
      }
      
      // Check for quote placeholder
      if (paragraph.match(/\[QUOTE:(\d+)\]/)) {
        const quoteIndex = parseInt(paragraph.match(/\[QUOTE:(\d+)\]/)![1]);
        const quote = article.quotes?.[quoteIndex];
        
        if (quote) {
          return (
            <motion.div
              key={idx}
              className="my-12 relative"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <blockquote className="relative p-8 bg-gradient-to-br from-amber-50 to-stone-50 dark:from-amber-950/30 dark:to-stone-900/50 border-l-4 border-amber-600 dark:border-amber-500 rounded-r-xl shadow-lg">
                <Quote className="w-6 h-6 text-amber-600 dark:text-amber-500 mb-4" />

                <p
                  className="text-xl italic leading-relaxed mb-6"
                  style={{
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    color: '#3a3024' /* WCAG AAA - 9.2:1 */
                  }}
                >
                  {quote.text}
                </p>
                
                <div className="flex items-center gap-3 pt-4 border-t border-amber-600/30">
                  <Feather className="w-5 h-5 text-amber-700 dark:text-amber-500" />
                  <cite 
                    className="text-sm text-amber-900 dark:text-amber-300 not-italic font-semibold"
                    style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                  >
                    {quote.author}
                  </cite>
                </div>
              </blockquote>
            </motion.div>
          );
        }
      }

      // Regular content rendering
      if (paragraph.startsWith('## ')) {
        return (
          <motion.h2
            key={idx}
            className="mb-6 mt-12 flex items-center gap-3 text-2xl"
            style={{
              fontFamily: 'var(--font-heading)',
              color: '#1f1a12', /* WCAG AAA - 13.5:1 */
              letterSpacing: '0.05em',
              textTransform: 'uppercase'
            }}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="w-1 h-8 bg-gradient-to-b from-amber-600 to-transparent rounded-full"></div>
            {paragraph.replace('## ', '')}
          </motion.h2>
        );
      }
      if (paragraph.startsWith('### ')) {
        return (
          <h3
            key={idx}
            className="mb-4 mt-8 text-xl"
            style={{
              fontFamily: 'var(--font-heading)',
              color: '#2d2418', /* WCAG AAA - 11.2:1 */
              letterSpacing: '0.03em'
            }}
          >
            {paragraph.replace('### ', '')}
          </h3>
        );
      }
      if (paragraph.startsWith('- ') || paragraph.startsWith('* ')) {
        const items = paragraph.split('\n').filter((line) => line.trim());
        return (
          <ul key={idx} className="space-y-4 my-8 ml-6">
            {items.map((item, i) => (
              <motion.li
                key={i}
                className="leading-relaxed relative pl-6 text-lg"
                style={{
                  fontFamily: 'var(--font-serif)',
                  color: '#2d2418' /* WCAG AAA - 11.2:1 */
                }}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <span className="absolute left-0 top-2.5 w-2 h-2 bg-amber-600 rounded-full"></span>
                {item.replace(/^[*-]\s/, '').replace(/^\*\*/, '').replace(/\*\*$/, '')}
              </motion.li>
            ))}
          </ul>
        );
      }
      if (paragraph.trim() === '---') {
        return (
          <div key={idx} className="my-12 flex items-center justify-center">
            <svg width="200" height="24" viewBox="0 0 200 24" className="text-amber-700/40 dark:text-amber-600/40">
              <path d="M0 12 L200 12" stroke="currentColor" strokeWidth="1" fill="none"/>
              <circle cx="100" cy="12" r="6" stroke="currentColor" strokeWidth="1" fill="none"/>
              <circle cx="60" cy="12" r="3" stroke="currentColor" strokeWidth="1" fill="none"/>
              <circle cx="140" cy="12" r="3" stroke="currentColor" strokeWidth="1" fill="none"/>
              <circle cx="30" cy="12" r="2" stroke="currentColor" strokeWidth="1" fill="none"/>
              <circle cx="170" cy="12" r="2" stroke="currentColor" strokeWidth="1" fill="none"/>
            </svg>
          </div>
        );
      }
      if (paragraph.trim()) {
        const isFirstParagraph = paragraphCount === 0;
        paragraphCount++;

        return (
          <p
            key={idx}
            className={`article-paragraph text-lg leading-relaxed mb-6 ${isFirstParagraph ? 'article-first-paragraph' : ''}`}
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            {paragraph}
          </p>
        );
      }
      return null;
    });
  };

  return (
    <div
      className="min-h-screen parchment relative overflow-hidden"
      style={{ pointerEvents: 'auto', userSelect: 'text' }}
    >
      {/* SVG Filters */}
      <InkEffect />
      
      {/* Decorative background elements odstránené — InkSplotch SVG kosoštvorce
          rušili čítanie a vyzerali ako rendering chyba (sivohnedé tvary v dark mode). */}

      {/* Decorative header border */}
      <div className="w-full h-3 bg-repeat-x relative z-10" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='12' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 6 L25 0 L50 6 L75 0 L100 6' stroke='%237d4f1d' stroke-width='2' fill='none'/%3E%3C/svg%3E")`,
        opacity: 0.3
      }}></div>

      {/* Back link — decentný textový odkaz, zarovnaný s container okrajom hero karty */}
      <div className="container pt-8 pb-5 relative z-10">
        <a
          href="/blog"
          className="back-to-blog"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: 14,
            color: '#7d4f1d',
            textDecoration: 'none',
            transition: 'color 0.15s',
            background: 'transparent',
            padding: 0,
            margin: 0,
          }}
        >
          <ArrowLeft className="back-to-blog-arrow" style={{ width: 16, height: 16, transition: 'transform 0.15s' }} />
          <span>Späť na blog</span>
        </a>
        <style>{`
          .back-to-blog:hover {
            color: #5d3a14 !important;
          }
          .back-to-blog:hover .back-to-blog-arrow {
            transform: translateX(-2px);
          }
          .back-to-blog:hover span {
            text-decoration: underline;
            text-underline-offset: 3px;
          }
        `}</style>
      </div>

      {/* SCEAR Layout Pattern - Everything inside one article container */}
      <section className="py-8 md:py-12 container mx-auto px-4 relative z-10">
        <article
          className="rounded-xl shadow-lg overflow-hidden"
          style={{ background: '#faf7f1', color: '#2d2418' }}
        >
          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: 0 }}
            className="grid-layout article-grid"
          >

            {/* Hero Image - Full Width (12 columns) - SMALLER */}
            <div style={{ gridColumn: 'span 12' }} className="relative h-48 md:h-64">
              <ImageWithFallback
                src={article.coverImage}
                alt={article.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white">
                <div className="text-sm text-white/80 mb-2" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                  {[
                    new Date(article.publishedAt).toLocaleDateString('sk-SK', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    }),
                    article.author?.name && `Autor: ${article.author.name}`,
                    (article as any).readTime && `${(article as any).readTime} min čítania`,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </div>
                <h1 className="text-2xl md:text-3xl font-bold mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
                  {article.title}
                </h1>
                {article.excerpt && article.excerpt.trim() !== article.title.trim() && (
                  <p className="text-lg text-white/90 max-w-3xl">{article.excerpt}</p>
                )}
              </div>
            </div>

            {/* Main Content - 8 columns (full width on mobile) */}
            <div className="p-6 md:p-8 article-main-col">
              <div
                className="article-body-wrapper"
                lang="sk"
                style={{ maxWidth: 720, margin: '0 auto' }}
              >
              {/* Dynamic Zone Blocks - full control over content order */}
              {(article as any).blocks && (article as any).blocks.length > 0 ? (
                <div className="prose prose-stone max-w-none article-content" style={{ display: 'flow-root' }}>
                  <DynamicZoneRenderer blocks={(article as any).blocks} />
                </div>
              ) : article.content ? (
                <div className="prose prose-stone max-w-none article-content" style={{ display: 'flow-root' }}>
                  {renderContent(article.content)}
                  <div className="clear-both"></div>
                </div>
              ) : (
                /* No content available */
                <div className="prose prose-stone dark:prose-invert max-w-none">
                  <p className="text-stone-500 dark:text-stone-400 italic">Obsah článku zatiaľ nebol pridaný.</p>
                </div>
              )}

              {/* Strapi Quotes (legacy - for posts without dynamic zone) */}
              {strapiQuotes.length > 0 && !(article as any).blocks?.length && (
                <div className="my-8">
                  {strapiQuotes.map((quote, idx) => (
                    <QuoteBlock
                      key={quote.id || idx}
                      text={quote.text}
                      author={quote.author}
                      source={quote.source}
                      variant={quote.text.includes('\n') ? 'poem' : 'default'}
                    />
                  ))}
                </div>
              )}

              {/* Bibliography - flat redesign */}
              {article.bibliography && article.bibliography.length > 0 && (
                <>
                <div className="clear-both" />
                <section style={{ margin: '48px 0', scrollMarginTop: 32 }}>
                  {/* Nadpis sekcie */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <h2 style={{
                      fontFamily: 'Georgia, "Times New Roman", serif',
                      fontSize: 22,
                      fontWeight: 600,
                      color: '#2d1810',
                      margin: 0,
                    }}>
                      Bibliografia
                    </h2>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: 24,
                      height: 24,
                      padding: '0 8px',
                      borderRadius: 9999,
                      background: '#a87437',
                      color: '#fffdf8',
                      fontFamily: 'Georgia, serif',
                      fontSize: 12,
                      fontWeight: 600,
                    }}>
                      {article.bibliography.length}
                    </span>
                  </div>
                  <hr style={{
                    height: 1,
                    background: 'linear-gradient(90deg, #c4a574 0%, rgba(196,165,116,0) 100%)',
                    margin: '8px 0 24px',
                    border: 0,
                  }} />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {article.bibliography.map((ref, idx) => (
                      <motion.div
                        key={idx}
                        style={{
                          display: 'flex',
                          gap: 12,
                          alignItems: 'flex-start',
                          background: '#fffdf8',
                          border: '1px solid rgba(196,165,116,0.4)',
                          borderRadius: 10,
                          padding: 14,
                        }}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: Math.min(idx, 6) * 0.05 }}
                      >
                        <span style={{
                          flexShrink: 0,
                          width: 26,
                          height: 26,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: '#a87437',
                          color: '#fffdf8',
                          borderRadius: 9999,
                          fontFamily: 'Georgia, serif',
                          fontSize: 12,
                          fontWeight: 600,
                        }}>
                          {idx + 1}
                        </span>
                        <p style={{
                          fontFamily: 'Georgia, "Times New Roman", serif',
                          fontSize: 14,
                          lineHeight: 1.6,
                          color: '#2d2418',
                          margin: 0,
                        }}>
                          {ref}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </section>
                </>
              )}

              {/* Clearfix before ornament */}
              <div className="clear-both" />

              {/* Decorative bottom ornament */}
              <motion.div
                className="flex justify-center my-8 clear-both"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <svg width="200" height="40" viewBox="0 0 200 40" className="text-amber-700/40 dark:text-amber-600/40">
                  <path d="M0 20 L200 20" stroke="currentColor" strokeWidth="1" fill="none"/>
                  <circle cx="100" cy="20" r="8" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <circle cx="60" cy="20" r="5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                  <circle cx="140" cy="20" r="5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                  <path d="M85 20 L90 15 L95 20 L90 25 Z" stroke="currentColor" strokeWidth="1" fill="currentColor" opacity="0.3"/>
                  <path d="M105 20 L110 15 L115 20 L110 25 Z" stroke="currentColor" strokeWidth="1" fill="currentColor" opacity="0.3"/>
                </svg>
              </motion.div>

              {/* Clearfix to prevent floating images from overlapping */}
              <div className="clear-both" />

              {/* Social Share */}
              <div className="clear-both">
                <SocialShare title={article.title} />
              </div>

              {/* Historical Gallery — len top-level `gallery` field zo Strapi.
                  Obsahuje obrázky bez popisu (no-caption images) ktoré extract.mjs
                  odložil sem namiesto vkladania do tela. Captioned obrázky v tele
                  článku tu NEsú duplikovaní — sú už vo svojom kontexte. */}
              {(article.gallery || []).length > 0 && (
                <HistoricalGallery
                  images={article.gallery as { url: string; caption?: string; alt?: string }[]}
                  title="Fotogaléria"
                />
              )}

              {/* Comments — Strapi-backed (visitor POST allowed, admin moderation) */}
              <CommentSection postDocumentId={strapiPost?.documentId} />
              </div>
            </div>

            {/* Sidebar - 4 columns (SCEAR pattern) */}
            <div
              className="p-6 md:p-8 article-sidebar-col"
              style={{ background: '#f5efe3' }}
            >
              <div className="lg:sticky lg:top-6">
                <ArticleSidebar
                  article={{
                    title: article.title,
                    content: article.content,
                    tags: article.tags,
                    keywords: (article as any).keywords,
                    bibliography: article.bibliography,
                    quotes: article.quotes,
                    publishedAt: article.publishedAt,
                    category: article.category
                  }}
                  relatedArticles={relatedArticles}
                  coordinates={articleCoordinates}
                  locationName={locationName}
                  timeline={timelineData}
                  keyFacts={keyFactsData}
                />
              </div>
            </div>

          </div>
        </article>
      </section>

      {/* Related articles */}
      {relatedArticles.length > 0 && (
        <section className="bg-gradient-to-b from-stone-100 to-amber-50/30 dark:from-stone-900 dark:to-amber-950/20 py-16 md:py-24 border-t-4 border-double border-amber-800/30 relative overflow-hidden">
          {/* InkSplotch dekorácie odstránené (sivohnedé kosoštvorce rušili obsah) */}
          
          <div className="container relative z-10">
            <ScrollReveal direction="up">
              <div className="text-center mb-16">
                {/* Decorative header */}
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, type: "spring" }}
                  className="inline-block mb-8"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-amber-600/20 blur-xl rounded-full pointer-events-none"></div>
                    <div className="relative px-8 py-4 bg-gradient-to-r from-amber-100 via-amber-50 to-amber-100 dark:from-amber-900/30 dark:via-amber-950/20 dark:to-amber-900/30 border-4 border-double border-amber-600/40 rounded-full">
                      <h2
                        className="text-2xl md:text-3xl uppercase tracking-widest"
                        style={{
                          fontFamily: 'var(--font-heading)',
                          letterSpacing: '0.15em',
                          color: '#1f1a12'
                        }}
                      >
                        Mohlo by vás zaujímať
                      </h2>
                    </div>
                  </div>
                </motion.div>
                
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: 0.2 }}
                  className="h-1 w-64 bg-gradient-to-r from-transparent via-amber-600 to-transparent rounded-full mb-6 mx-auto"
                />
                
                <p
                  className="text-lg italic"
                  style={{
                    fontFamily: 'var(--font-serif)',
                    color: '#4a3f2f' /* WCAG AAA - 7.1:1 */
                  }}
                >
                  Ďalšie články z kategórie {categoryLabels[article.category!]}
                </p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {relatedArticles.map((related, idx) => (
                <motion.div
                  key={related.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.15 }}
                >
                  <ArticleCard article={related} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Decorative footer border */}
      <div className="w-full h-3 bg-repeat-x" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='12' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 6 L25 12 L50 6 L75 12 L100 6' stroke='%237d4f1d' stroke-width='2' fill='none'/%3E%3C/svg%3E")`,
        opacity: 0.3
      }}></div>
    </div>
  );
}
