'use client';

/**
 * STRÁNKA ČLÁNKU v novom šate. Otvára sa na `/design/blog/<slug>`.
 * Produkčná `ArticlePage.tsx` sa nedotýka.
 *
 * ROZSAH ZÁSAHU — zámerne úzky:
 *   KOMPOZÍCIA OSTÁVA PRODUKČNÁ. Tie isté komponenty v tom istom poradí:
 *   omrvinky → telo (`DynamicZoneRenderer`) → pobočný stĺpec
 *   (`ArticleSidebar`: kľúčové slová, kľúčové fakty, časová os, poloha,
 *   súvisiace) → zdieľanie → fotogaléria → diskusia → súvisiace články.
 *   Zarovnanie textu, obtekanie obrázkov aj sadzba sú produkčné.
 *
 *   MENÍ SA IBA:
 *     1. FARBA — celá stránka ide cez tokeny šatu (prekladová vrstva
 *        v `theme.css`, lebo produkčné komponenty majú farby natvrdo).
 *     2. TITULNÁ FOTOGRAFIA — na plnú šírku a 58 % výšky okna namiesto
 *        prúžku 224–256 px, v ktorom bol nadpis orezaný na tri riadky.
 *     3. ZDIEĽANIE AJ NA ZAČIATKU — hneď pod hlavičkou, nielen na konci.
 *     4. FOTOGALÉRIA je murovaná (fotky si držia svoj pomer strán, nič sa
 *        neoreže). Svetelný box po kliknutí ostáva ten produkčný, len
 *        prefarbený — vrátane komentárov a lajkov pod fotkou.
 *
 * Prvý skúšaný článok: `mikulcice-kopcany`.
 */

import { useEffect, useState } from 'react';
import { useBlogPost } from '../hooks/useStrapi';
import { getStrapiImageUrl, convertStrapiPostToArticle } from '../lib/strapi';
import { getRelated, type RelatedCard } from '../lib/related';
import { DynamicZoneRenderer } from '../components/DynamicZoneRenderer';
import { ArticleSidebar, KeyFactsCard, TimelineCard } from '../components/ArticleSidebar';
import { HistoricalGallery } from '../components/HistoricalGallery';
import { CommentSection } from '../components/CommentSection';
import { SocialShare } from '../components/SocialShare';
import { ArticleCard } from '../components/ArticleCard';

function skDate(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const m = ['januára','februára','marca','apríla','mája','júna','júla','augusta','septembra','októbra','novembra','decembra'];
  return `${d.getDate()}. ${m[d.getMonth()]} ${d.getFullYear()}`;
}

export function LabArticle({ slug }: { slug: string }) {
  const { post, loading } = useBlogPost(slug);
  const [related, setRelated] = useState<RelatedCard[]>([]);

  useEffect(() => {
    let alive = true;
    setRelated([]);
    if (slug) getRelated(slug, 6).then(r => { if (alive) setRelated(r); }).catch(() => {});
    return () => { alive = false; };
  }, [slug]);

  if (loading) return <div className="lart-wait">Načítavam článok…</div>;
  if (!post) return <div className="lart-wait">Článok sa nenašiel.</div>;

  const article = convertStrapiPostToArticle(post);
  const cover = post.coverImage ? getStrapiImageUrl(post.coverImage) : null;

  const timelineData = (post.timeline || []).map(t => ({
    year: t.year, title: t.title, description: t.description, type: 'local' as const,
  }));
  const keyFactsData = post.keyFacts?.map((f, i) => ({ number: i + 1, title: f.label, description: f.value }));
  const coordinates =
    post.location && typeof post.location.latitude === 'number' && typeof post.location.longitude === 'number'
      ? { lat: post.location.latitude, lng: post.location.longitude }
      : undefined;

  const gallery = (post.gallery || []).map((img: any) => ({
    url: getStrapiImageUrl(img),
    caption: img.caption || img.alternativeText || '',
    alt: img.alternativeText || img.caption || '',
    fileId: img.id,
  }));

  return (
    <div className="lart">
      {/* ── Titulná fotografia ───────────────────────────────────────────
          Jediná prestavaná časť rozvrhu. Predtým prúžok 224–256 px s tmavým
          prechodom, v ktorom bol nadpis orezaný na tri riadky; z fotografie
          hradiska nebolo vidno nič. Závoj je hore takmer priehľadný — fotka
          je dôvod, prečo je hlavička taká vysoká. */}
      <header className={cover ? 'lart-hero' : 'lart-hero lart-hero-plain'}>
        {cover && <img className="lart-hero-img" src={cover} alt="" aria-hidden="true" fetchPriority="high" decoding="async" />}
        <div className="lart-hero-veil" aria-hidden="true" />
        <div className="lart-hero-in">
          <nav className="lart-crumbs" aria-label="Omrvinky">
            <a href="/">Domov</a>
            <span aria-hidden="true">›</span>
            {post.category && <a href={`/category/${post.category.slug}`}>{post.category.name}</a>}
          </nav>
          <h1 className="lart-title">{post.title}</h1>
          {post.excerpt && post.excerpt.trim() !== post.title.trim() && (
            <p className="lart-excerpt">{post.excerpt}</p>
          )}
          <div className="lart-meta">
            <span>{post.authorName || 'Hradiská.sk'}</span>
            <span className="lart-meta-dot" aria-hidden="true" />
            <span>{skDate(post.originalPublishedDate || post.publishedAt)}</span>
            <span className="lart-meta-dot" aria-hidden="true" />
            <span>{post.readingTime} min čítania</span>
          </div>
        </div>
      </header>

      <section className="py-8 md:py-12 container mx-auto px-4 relative z-10">
        {/* Zdieľanie hneď na začiatku — na konci ho nájde len ten, kto dočíta. */}
        <div className="lart-topshare">
          <SocialShare title={post.title} postDocumentId={post.documentId} />
        </div>

        {/* Odtiaľto nižšie je rozvrh produkčný. */}
        <article className="lart-card rounded-xl overflow-hidden">
          <div className="grid-layout article-grid">
            <div className="p-6 md:p-8 article-main-col">
              {/* 720 px pri 18 px písme je ~85 znakov na riadok; 668 px dá ~72,
                  čo je horná hranica pohodlného čítania. Rozvrh sa nemení. */}
              <div className="article-body-wrapper" lang="sk" style={{ maxWidth: 668, margin: '0 auto' }}>
                {post.blocks && post.blocks.length > 0 ? (
                  <div className="prose prose-stone max-w-none article-content" style={{ display: 'flow-root' }}>
                    <DynamicZoneRenderer blocks={post.blocks} />
                  </div>
                ) : (
                  <p className="lart-empty">Obsah článku zatiaľ nebol pridaný.</p>
                )}

                {/* Na mobile pod textom, na počítači v pobočnom stĺpci — ako v produkcii. */}
                <div className="only-mobile-1024 clear-both" style={{ marginTop: 24 }}>
                  <KeyFactsCard facts={keyFactsData || []} />
                  <TimelineCard timeline={timelineData} />
                </div>

                <div className="clear-both" />

                <div className="clear-both">
                  <SocialShare title={post.title} postDocumentId={post.documentId} />
                </div>

                {gallery.length > 0 && (
                  <HistoricalGallery
                    images={gallery as { url: string; caption?: string; alt?: string }[]}
                    title="Fotogaléria"
                  />
                )}

                <CommentSection postDocumentId={post.documentId} />
              </div>
            </div>

            <div className="p-6 md:p-8 article-sidebar-col lart-side">
              <div className="lg:sticky lg:top-6">
                <ArticleSidebar
                  article={{
                    title: article.title,
                    content: (post as any).content,
                    tags: article.tags,
                    keywords: (article as any).keywords,
                    bibliography: [],
                    quotes: post.quotes || [],
                    publishedAt: article.publishedAt,
                    category: article.category,
                  }}
                  relatedArticles={related}
                  coordinates={coordinates}
                  locationName={post.location?.name}
                  timeline={timelineData}
                  keyFacts={keyFactsData}
                />
              </div>
            </div>
          </div>
        </article>
      </section>

      {related.length > 0 && (
        <section className="lart-more">
          <div className="container">
            <h2 className="lart-more-h">Mohlo by vás zaujímať</h2>
            <p className="lart-more-s">Vybrali sme články súvisiace s touto témou</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {related.map(r => <ArticleCard key={r.id} article={r as any} />)}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default LabArticle;
