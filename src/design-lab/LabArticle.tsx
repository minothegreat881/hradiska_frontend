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
import { Nacitavanie } from './Nacitavanie';
import { useBlogPost } from '../hooks/useStrapi';
import { getStrapiImageUrl, convertStrapiPostToArticle } from '../lib/strapi';
import { getRelated, type RelatedCard } from '../lib/related';
import { DynamicZoneRenderer } from '../components/DynamicZoneRenderer';
import { ArticleSidebar, KeyFactsCard, TimelineCard } from '../components/ArticleSidebar';
import { t, datum as datumJazyka, odkaz, poAnglicky, kategoria, jazyk } from '../lib/jazyk';
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
 * ČAKANIE NA ČLÁNOK.
 *
 * Kým nie je pohromade všetko, z čoho stránka vzniká — text aj titulná
 * fotografia — nemá zmysel ukazovať polovičný článok. Namiesto toho tu
 * stojí točiaca sa ikona cez celú výšku okna, takže sa nevysunie do obrazu
 * pätička a po dotiahnutí sa článok objaví naraz a hotový.
 */
function CakanieNaClanok() {
  return (
    <Nacitavanie celaVyska velkost="velke" text="Načítavam článok…" />
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
  /* Poistka pre prípad, že sa fotografia nestihne — viď `.lart-hero-mini`. */
  const [ostraTu, setOstraTu] = useState(false);
  useEffect(() => { setOstraTu(false); }, [slug]);

  const cover = post?.coverImage ? getStrapiImageUrl(post.coverImage) : null;
  const miniatura = post?.coverImage?.formats?.thumbnail?.url
    ? getStrapiImageUrl(post.coverImage, 'thumbnail')
    : null;
  const coverSada = cover ? sadaZdrojov(post.coverImage, cover) : undefined;

  /* Titulná fotografia sa sťahuje EŠTE PRED vykreslením článku, nie až
     počas neho. Prehliadač ju potom v hlavičke berie z vyrovnávacej pamäte,
     takže stránka nabehne naraz a hotová — nie po častiach.
     Sťahuje sa presne tá veľkosť, ktorú si prehliadač vyberie aj v samotnej
     hlavičke (`srcset` + `sizes`), aby sa neťahala dvakrát.
     Poistka: po štyroch sekundách ide článok von tak či tak. Fotografia sa
     môže ťahať aj desať sekúnd a dovtedy držať čitateľa pri točiacej sa
     ikone by bolo horšie než ju dokresliť. */
  const [fotkaPripravena, setFotkaPripravena] = useState(false);
  useEffect(() => {
    setFotkaPripravena(false);
    if (!post) return;
    if (!cover) { setFotkaPripravena(true); return; }
    let zive = true;
    const hotovo = () => { if (zive) setFotkaPripravena(true); };
    const i = new Image();
    if (coverSada) { i.sizes = '100vw'; i.srcset = coverSada; }
    i.src = cover;
    if (i.complete) hotovo(); else { i.onload = hotovo; i.onerror = hotovo; }
    const poistka = setTimeout(hotovo, 4000);
    return () => { zive = false; clearTimeout(poistka); i.onload = null; i.onerror = null; };
  }, [post?.documentId, cover, coverSada]);

  useEffect(() => {
    let alive = true;
    setRelated([]);
    if (slug) getRelated(slug, 6).then(r => { if (alive) setRelated(r); }).catch(() => {});
    return () => { alive = false; };
  }, [slug]);

  if (loading || (post && !fotkaPripravena)) return <CakanieNaClanok />;
  if (!post) return <div className="lart-wait">{t('Článok sa nenašiel.')}</div>;

  const article = convertStrapiPostToArticle(post);

  const timelineData = (post.timeline || []).map(t => ({
    year: t.year, title: t.title, description: t.description, type: 'local' as const,
  }));
  const keyFactsData = post.keyFacts?.map((f, i) => ({ number: i + 1, title: f.label, description: f.value }));
  const coordinates =
    post.location && typeof post.location.latitude === 'number' && typeof post.location.longitude === 'number'
      ? { lat: post.location.latitude, lng: post.location.longitude }
      : undefined;

  /* POPISY FOTIEK V GALÉRII.
     Popis sa inak berie z knižnice médií, a ten je jeden pre celý web —
     na anglickej stránke by teda pod fotkami stál slovenský text. Tá istá
     fotografia však väčšinou stojí aj v tele článku, kde popis patrí bloku,
     a ten preklad má. Preto sa najprv hľadá popis bloku pre to isté médium
     a až potom sa použije ten z knižnice. V slovenčine sú oba rovnaké,
     takže sa nemení nič. */
  const popisyZBlokov = new Map<number, { caption: string; alt: string }>();
  for (const b of (post.blocks || []) as any[]) {
    if (b.__component !== 'content.image-block' || !b.image) continue;
    const id = b.image.id ?? b.image;
    if (typeof id === 'number' && (b.caption || b.alt)) {
      popisyZBlokov.set(id, { caption: b.caption || '', alt: b.alt || '' });
    }
  }

  const gallery = (post.gallery || []).map((img: any) => {
    const zBloku = popisyZBlokov.get(img.id);
    return {
      url: getStrapiImageUrl(img),
      caption: zBloku?.caption || img.caption || img.alternativeText || '',
      alt: zBloku?.alt || img.alternativeText || img.caption || '',
      fileId: img.id,
    };
  });

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

      {/* ── Titulka článku (handoff „text pod fotkou", 09/2026) ─────────
          Nadpis, perex aj údaje stáli PRIAMO NA fotografii pod tmavým
          závojom. Na oblohe a na suchej tráve sa aj tak strácali a závoj
          zároveň zhoršoval samotnú fotografiu. Fotografia je odteraz čistá
          — bez textu aj bez závoja — a text stojí pod ňou na papieri
          v stĺpci širokom 780 px, kde je kontrast vždy rovnaký.
          Článok bez obálky fotografiu jednoducho nevykreslí a text začína
          hneď pod lištou kategórií. */}
      <header className="lart-hero">
        {cover && (
          <div className="lart-hero-media">
            {/* Rozmazaná miniatúra pod ostrou fotografiou. Bez nej bolo na jej
                mieste niekoľko sekúnd prázdno (pri Mikulčiciach 2,4 s).
                Miniatúra má pár desiatok kilobajtov a je tam prakticky hneď. */}
            {miniatura && !ostraTu && (
              <img
                className="lart-hero-mini"
                src={miniatura}
                alt=""
                aria-hidden="true"
                decoding="async"
                style={{ objectPosition: post.coverPosition || 'center center' }}
              />
            )}
            <img
              className={ostraTu ? 'lart-hero-img' : 'lart-hero-img caka'}
              src={cover}
              srcSet={coverSada}
              sizes={coverSada ? '100vw' : undefined}
              /* Fotografia už nie je podklad pod textom, ale obsah — patrí jej
                 zmysluplný popis. */
              alt={(post.coverImage as any)?.alternativeText || post.title}
              /* Malým písmom zámerne: React 18 camelCase `fetchPriority`
                 nepozná, ohlási ho ako neznámu vlastnosť a na prvok ho
                 nedá — prednosť pri sťahovaní by sa tým stratila. */
              {...{ fetchpriority: 'high' }}
              decoding="async"
              onLoad={() => setOstraTu(true)}
              /* Keď sa fotografia nestiahne, nech ostane vidieť aspoň to, čo
                 je — inak by ostala priehľadná navždy. */
              onError={() => setOstraTu(true)}
              /* Fotografia z vyrovnávacej pamäte býva hotová skôr, než sa stihne
                 pripojiť `onLoad`. */
              ref={(el) => { if (el && el.complete && el.naturalWidth > 0) setOstraTu(true); }}
              /* Výrez titulnej fotografie — nastavuje sa ťahaním v editore.
                 Staršie články pole nemajú, tie ostávajú vycentrované. */
              style={{ objectPosition: post.coverPosition || 'center center' }}
            />
          </div>
        )}

        {/* Text titulky ide cez TEN ISTÝ rozvrh ako telo článku: rovnaký
            kontajner, rovnaký 12-stĺpcový grid, rovnaký stĺpec aj rovnako
            široký obal. Kým bol len vycentrovaný na šírku okna, nadpis
            začínal o 173 px vpravo od textu článku (namerané pri 1440 px).
            Žiadny prepočet — o zarovnanie sa stará ten istý rozvrh. */}
        <div className="lart-hero-textwrap container mx-auto px-4">
          <div className="grid-layout article-grid">
            <div className="article-main-col lart-hero-textcol">
        <div className="lart-hero-text">
          {/* Prepínač jazyka — ukáže sa len vtedy, keď druhá jazyková verzia
              článku naozaj existuje. Bez toho by odkaz viedol na 404. */}
          {(() => {
            const druhy = (post.localizations || []).find((x) => x.locale !== (post.locale || 'sk'));
            if (!druhy) return null;
            const doAnglictiny = druhy.locale === 'en';
            return (
              <a className="lart-jazyk" href={doAnglictiny ? `/en/blog/${druhy.slug}` : `/blog/${druhy.slug}`}
                 hrefLang={druhy.locale} lang={druhy.locale}>
                {doAnglictiny ? 'English' : 'Slovensky'}
              </a>
            );
          })()}
          <nav className="lart-crumbs" aria-label="Omrvinky">
            <a href={odkaz('/')}>{t('Domov')}</a>
            <span aria-hidden="true">›</span>
            {post.category && (
              <a className="je-tu" href={odkaz(`/category/${post.category.slug}`)}>{kategoria(post.category.name)}</a>
            )}
          </nav>
          <h1 className="lart-title">{post.title}</h1>
          {post.excerpt && post.excerpt.trim() !== post.title.trim() && (
            <p className="lart-excerpt">{post.excerpt}</p>
          )}
          <div className="lart-meta">
            <span>{post.authorName || 'Hradiská.sk'}</span>
            <span className="lart-meta-dot" aria-hidden="true" />
            <time dateTime={(post.originalPublishedDate || post.publishedAt || '').slice(0, 10)}>
              {poAnglicky() ? datumJazyka(post.originalPublishedDate || post.publishedAt) : skDate(post.originalPublishedDate || post.publishedAt)}
            </time>
            <span className="lart-meta-dot" aria-hidden="true" />
            <span>{post.readingTime} {t('min čítania')}</span>
          </div>
        </div>
            </div>
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
              <div className="article-body-wrapper" lang={jazyk()} style={{ maxWidth: 668, margin: '0 auto' }}>
                {post.blocks && post.blocks.length > 0 ? (
                  <div className="prose prose-stone max-w-none article-content" style={{ display: 'flow-root' }}>
                    <DynamicZoneRenderer blocks={post.blocks} />
                  </div>
                ) : (
                  <p className="lart-empty">{t('Obsah článku zatiaľ nebol pridaný.')}</p>
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
                    columns={(post as any).galleryColumns || 3}
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
      {/* Mapa dostane slug článku: ak má článok lokalitu, jej značka bude
          v mape červená a s menovkou, takže čitateľ hneď vidí, kde to je. */}
      <MapaAzKedTreba zvyraznene={post.slug} />

      {related.length > 0 && (
        <section className="lart-more">
          <div className="container">
            <h2 className="lart-more-h">{t('Mohlo by vás zaujímať')}</h2>
            <p className="lart-more-s">{t('Vybrali sme články súvisiace s touto témou')}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Bez štítku kategórie: v dlaždici pod článkom len prekrýval
                  fotografiu a čitateľovi nič nepovedal — meno kategórie je
                  o riadok vyššie v omrvinkách aj v ponuke. */}
              {related.map(r => <ArticleCard key={r.id} article={r as any} stitok={false} />)}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default LabArticle;
