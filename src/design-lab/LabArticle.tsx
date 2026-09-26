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
import LabKategorieLista from './LabKategorieLista';
import { MapaAzKedTreba } from './MapaAzKedTreba';

function skDate(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const m = ['januára','februára','marca','apríla','mája','júna','júla','augusta','septembra','októbra','novembra','decembra'];
  return `${d.getDate()}. ${m[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * KOSTRA ČLÁNKU počas načítania.
 *
 * Predtým tu bol jeden riadok textu „Načítavam článok…" vysoký 270 px.
 * Stránka mala v tej chvíli 900 px a pätička sedela v strede obrazovky;
 * keď dáta dorazili, dokument narástol na 30 000 px a všetko odskočilo
 * (namerané: pätička na 361 px → 28 609 px za jednu snímku).
 *
 * Kostra preto drží miesto, ktoré článok aj tak zaberie: lištu kategórií,
 * titulnú fotografiu v jej skutočnej výške a začiatok textového stĺpca.
 * Pätička tým ostáva pod okrajom obrazovky a po dotiahnutí článku sa
 * nepohne nič, čo už bolo vidieť.
 */
function KostraClanku() {
  return (
    <div className="lart lart-kostra" aria-busy="true">
      <span className="sr-only">Načítavam článok…</span>
      <LabKategorieLista />
      <div className="lart-kostra-hero" aria-hidden="true">
        <div className="lart-kostra-hero-in">
          <span className="lart-kostra-pruh lart-kostra-pruh--omrvinky" />
          <span className="lart-kostra-pruh lart-kostra-pruh--nadpis" />
          <span className="lart-kostra-pruh lart-kostra-pruh--nadpis2" />
        </div>
      </div>
      <div className="lart-kostra-telo" aria-hidden="true">
        {[100, 96, 99, 92, 97, 62].map((sirka, i) => (
          <span key={i} className="lart-kostra-riadok" style={{ width: `${sirka}%` }} />
        ))}
      </div>
    </div>
  );
}

/**
 * Titulná fotografia v niekoľkých veľkostiach.
 *
 * Doteraz sa všade ťahal originál: pri článku o Mikulčiciach 2 497 kB PNG
 * (2712 × 1536) na plochu 1440 × 522, a na telefóne to isté. Strapi ku
 * každej fotografii generuje menšie formáty, len sa nepoužívali.
 *
 * `sizes="100vw"` — hlavička je cez celú šírku okna, takže prehliadač si
 * vyberie podľa nej a podľa hustoty displeja.
 */
function sadaZdrojov(obrazok: any, original: string): string | undefined {
  const f = obrazok?.formats;
  if (!f) return undefined;
  const kusy: string[] = [];
  for (const k of ['small', 'medium', 'large'] as const) {
    if (f[k]?.url && f[k]?.width) kusy.push(`${getStrapiImageUrl(obrazok, k)} ${f[k].width}w`);
  }
  if (obrazok?.width) kusy.push(`${original} ${obrazok.width}w`);
  return kusy.length > 1 ? kusy.join(', ') : undefined;
}

export function LabArticle({ slug }: { slug: string }) {
  const { post, loading, preview } = useBlogPost(slug);
  const [related, setRelated] = useState<RelatedCard[]>([]);
  /* Kým nie je ostrá fotografia stiahnutá, drží miesto jej rozmazaná
     miniatúra. Pri zmene článku sa príznak vracia na začiatok. */
  const [ostraTu, setOstraTu] = useState(false);
  useEffect(() => { setOstraTu(false); }, [slug]);

  useEffect(() => {
    let alive = true;
    setRelated([]);
    if (slug) getRelated(slug, 6).then(r => { if (alive) setRelated(r); }).catch(() => {});
    return () => { alive = false; };
  }, [slug]);

  if (loading) return <KostraClanku />;
  if (!post) return <div className="lart-wait">Článok sa nenašiel.</div>;

  const article = convertStrapiPostToArticle(post);
  const cover = post.coverImage ? getStrapiImageUrl(post.coverImage) : null;
  const miniatura = post.coverImage?.formats?.thumbnail?.url
    ? getStrapiImageUrl(post.coverImage, 'thumbnail')
    : null;
  const coverSada = cover ? sadaZdrojov(post.coverImage, cover) : undefined;

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
      {/* Náhľad konceptu z administrácie. Bežný návštevník túto lištu nikdy
          neuvidí — objaví sa len pri `?preview=draft` s platným prihlásením. */}
      {preview && (
        <div className="lart-preview-bar" role="status">
          {preview === 'draft'
            ? 'Náhľad konceptu — takto bude článok vyzerať po publikovaní. Verejnosť zatiaľ vidí publikovanú verziu.'
            : 'Náhľad konceptu sa nepodaril: prihlásenie do administrácie vypršalo. Zobrazená je publikovaná verzia.'}
        </div>
      )}
      {/* Lišta kategórií. Tá istá deviatka ako na domovskej, len úzka:
          článok je na webe najčastejšie prvou stránkou z vyhľadávača, takže
          odtiaľto musí viesť cesta ďalej — ale nesmie odtlačiť text pod
          okraj obrazovky. Kategória článku je v nej zvýraznená. */}
      <LabKategorieLista aktivna={post.category?.slug} />

      {/* ── Titulná fotografia ───────────────────────────────────────────
          Jediná prestavaná časť rozvrhu. Predtým prúžok 224–256 px s tmavým
          prechodom, v ktorom bol nadpis orezaný na tri riadky; z fotografie
          hradiska nebolo vidno nič. Závoj je hore takmer priehľadný — fotka
          je dôvod, prečo je hlavička taká vysoká. */}
      <header className={cover ? 'lart-hero' : 'lart-hero lart-hero-plain'}>
        {/* Rozmazaná miniatúra pod ostrou fotografiou. Bez nej bolo na jej
            mieste niekoľko sekúnd tmavé prázdno (pri Mikulčiciach 2,4 s) —
            čitateľ videl vyhradený priestor a text, ale nie obrázok.
            Miniatúra má pár desiatok kilobajtov a je tam prakticky hneď,
            takže priestor od začiatku drží farba samotnej fotografie. */}
        {cover && miniatura && !ostraTu && (
          <img
            className="lart-hero-mini"
            src={miniatura}
            alt=""
            aria-hidden="true"
            decoding="async"
            style={{ objectPosition: post.coverPosition || 'center center' }}
          />
        )}
        {cover && (
          <img
            className={ostraTu ? 'lart-hero-img je-tu' : 'lart-hero-img'}
            src={cover}
            srcSet={coverSada}
            sizes={coverSada ? '100vw' : undefined}
            alt=""
            aria-hidden="true"
            fetchPriority="high"
            decoding="async"
            onLoad={() => setOstraTu(true)}
            /* Keď sa fotografia nestiahne, nech ostane vidieť aspoň to, čo
               je — inak by hlavička zostala priehľadná navždy. */
            onError={() => setOstraTu(true)}
            /* Fotografia z vyrovnávacej pamäte býva hotová skôr, než sa stihne
               pripojiť `onLoad`. */
            ref={(el) => { if (el && el.complete && el.naturalWidth > 0) setOstraTu(true); }}
            /* Výrez titulnej fotografie — nastavuje sa ťahaním v editore.
               Staršie články pole nemajú, tie ostávajú vycentrované. */
            style={{ objectPosition: post.coverPosition || 'center center' }}
          />
        )}
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

      {/* Mapa hradísk pod komentármi — posledná vec, ktorú článok ponúkne:
          „a kde sú ďalšie". Vykreslí sa až vtedy, keď sa k nej čitateľ
          priblíži: mapa si stiahne 44 dlaždíc podkladu (486 kB namerané)
          a väčšina čitateľov k nej nedôjde. */}
      <MapaAzKedTreba />

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
