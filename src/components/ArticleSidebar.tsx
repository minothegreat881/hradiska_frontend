'use client';

import React, { useEffect, useRef } from 'react';
import { ChevronRight } from 'lucide-react';
import { Suspense, useState } from 'react';
import { lazyStale } from '../lib/lazyStale';

/* Mini-mapa si so sebou nesie MapLibre (274 kB). Ťahala sa pri každom
   otvorení článku, hoci na telefóne je bočný stĺpec až pod celým textom —
   teda pod prehybom. Modul sa preto dotiahne až vtedy, keď sa k mape
   čitateľ priblíži. */
const MiniMap = lazyStale(() => import('./MiniMapaLokality'));

/**
 * Obal, ktorý pustí mapu, až keď je na dohľad.
 * Miesto si drží rovnako vysoká prázdna plocha, takže sa nič nepreskupuje.
 */
function MiniMapaAzNaDohlad(props: { coordinates: { lat: number; lng: number }; locationName: string }) {
  const [zobrazit, setZobrazit] = useState(false);
  const kotva = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (zobrazit) return;
    const el = kotva.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') { setZobrazit(true); return; }
    const io = new IntersectionObserver(
      (z) => { if (z.some((x) => x.isIntersecting)) { setZobrazit(true); io.disconnect(); } },
      { rootMargin: '300px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [zobrazit]);

  return (
    <div ref={kotva}>
      {zobrazit ? (
        <Suspense fallback={null}>
          <MiniMap {...props} />
        </Suspense>
      ) : null}
    </div>
  );
}

// Types
interface TimelineEvent {
  year: string;
  title: string;
  description?: string;
  type?: 'local' | 'global';
}

interface KeyFact {
  number?: number;
  title: string;
  description: string;
}

interface ArticleSidebarProps {
  article: {
    title: string;
    content: string;
    tags?: string[];
    keywords?: string[];
    bibliography?: string[];
    quotes?: Array<{ text: string; author: string }>;
    publishedAt?: string;
    category?: string;
  };
  relatedArticles?: Array<{
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    coverImage: string;
  }>;
  coordinates?: { lat: number; lng: number };
  locationName?: string;
  timeline?: TimelineEvent[];
  keyFacts?: KeyFact[];
}

// Mini Map Component - Same as main map with 3D relief

// Shared design tokens for sidebar cards
const cardStyle: React.CSSProperties = {
  background: '#fffdf8',
  border: '1px solid var(--hr-line)',
  borderRadius: 12,
  boxShadow: '0 1px 2px rgba(70,40,20,0.06), 0 4px 12px rgba(70,40,20,0.05)',
  padding: 16,
  marginBottom: 20,
};

const cardTitleStyle: React.CSSProperties = {
  fontFamily: 'Georgia, serif',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--hr-accent-soft)',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  marginBottom: 12,
  marginTop: 0,
};

// ── Vyčlenené karty ─────────────────────────────────────────────────────
// KeyFacts + Časová os sú samostatné komponenty, aby sa dali vykresliť aj v
// sidebare (desktop) aj pod textom článku (mobil) – bez duplikovania JSX.

export function KeyFactsCard({ facts }: { facts: KeyFact[] }) {
  if (!facts || facts.length === 0) return null;
  return (
    <div style={cardStyle}>
      <h3 style={cardTitleStyle}>Kľúčové fakty</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {facts.map((fact, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
            }}
          >
            <div
              style={{
                flexShrink: 0,
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--hr-accent-soft) 0%, #7d4f1d 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontFamily: 'Georgia, serif',
                fontSize: 12,
                fontWeight: 700,
                boxShadow: '0 1px 2px rgba(70,40,20,0.15)',
              }}
            >
              {fact.number || index + 1}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--hr-accent-soft)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                {fact.title}
              </div>
              <div
                style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: 14,
                  color: '#2d2418',
                  marginTop: 2,
                  lineHeight: 1.45,
                }}
              >
                {fact.description}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TimelineCard({ timeline }: { timeline: TimelineEvent[] }) {
  if (!timeline || timeline.length === 0) return null;
  return (
    <div style={cardStyle}>
      <h3 style={cardTitleStyle}>Časová os</h3>
      <div>
        {timeline.map((item, index) => (
          <div key={index} style={{ display: 'flex', gap: 12 }}>
            <div
              style={{
                width: 48,
                flexShrink: 0,
                textAlign: 'right',
                fontFamily: 'Georgia, serif',
                fontSize: 13,
                fontWeight: 700,
                color: '#7d4f1d',
                paddingTop: 1,
              }}
            >
              {item.year}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: 'var(--hr-accent-soft)',
                  marginTop: 5,
                  flexShrink: 0,
                }}
              />
              {index < timeline.length - 1 && (
                <div
                  style={{
                    width: 2,
                    flex: 1,
                    minHeight: '2rem',
                    background: 'var(--hr-line)',
                  }}
                />
              )}
            </div>

            <div style={{ flex: 1, paddingBottom: 12 }}>
              <div
                style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: 14,
                  color: '#2d2418',
                  fontWeight: 600,
                }}
              >
                {item.title}
              </div>
              {item.description && (
                <div
                  style={{
                    fontFamily: 'Georgia, serif',
                    fontSize: 12,
                    color: '#6b5d4d',
                    marginTop: 2,
                    lineHeight: 1.4,
                  }}
                >
                  {item.description}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ArticleSidebar({
  article,
  relatedArticles = [],
  timeline = [],
  keyFacts,
  coordinates,
  locationName,
}: ArticleSidebarProps) {
  // Key facts — NO default fallback. If empty, card is hidden.
  const facts: KeyFact[] = keyFacts || [];

  // Show location card only if we have both coordinates AND a name
  const hasLocation = !!coordinates && !!locationName && locationName.trim().length > 0;
  // Strapi location.name je už správne zapísaný (vlastné mená, veľké písmená) — nemeniť.
  // Predošlý "capitalize prvé písmeno + lowercase zvyšok" rozbíjal viacslovné názvy
  // (napr. "Mys Arkona, Rujana" -> "Mys arkona, rujana").
  const capitalizedName = hasLocation ? locationName!.trim() : '';

  return (
    <div>
      {/* Location Card — only shown if coordinates + name are provided */}
      {hasLocation && (
        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>Lokalita</h3>
          <MiniMapaAzNaDohlad coordinates={coordinates!} locationName={capitalizedName} />
          <div style={{ marginTop: 10 }}>
            <h4
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: 18,
                color: '#2d1810',
                fontWeight: 600,
                margin: 0,
              }}
            >
              {capitalizedName}
            </h4>
            <p
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: 13,
                color: '#8b7a5e',
                margin: 0,
                marginTop: 4,
              }}
            >
              {coordinates!.lat.toFixed(4)}° N · {coordinates!.lng.toFixed(4)}° E
            </p>
          </div>
        </div>
      )}

      {/* Kľúčové fakty + časová os — LEN na desktope (v sidebare).
          Na mobile sa vykresľujú pod textom článku (ArticlePage), lebo v úzkom
          zalomenom sidebare pod komentármi rozbíjali čítanie. */}
      <div className="only-desktop-1024">
        <KeyFactsCard facts={facts} />
        <TimelineCard timeline={timeline} />
      </div>

      {/* Tags */}
      {article.tags && article.tags.length > 0 && (
        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>Témy</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {article.tags.slice(0, 8).map((tag, index) => (
              <a
                key={index}
                href={`/?search=${encodeURIComponent(tag)}`}
                style={{
                  display: 'inline-block',
                  padding: '5px 12px',
                  background: 'var(--hr-line)',
                  border: '1px solid var(--hr-line)',
                  color: '#7d4f1d',
                  fontFamily: 'Georgia, serif',
                  fontSize: 12,
                  fontWeight: 500,
                  borderRadius: 999,
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.background = 'var(--hr-line)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.background = 'var(--hr-line)';
                }}
              >
                {tag}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>Súvisiace články</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {relatedArticles.slice(0, 5).map((related) => (
              <a
                key={related.id}
                href={`/blog/${related.slug}`}
                className="group"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: 8,
                  borderRadius: 10,
                  border: '1px solid var(--hr-line)',
                  textDecoration: 'none',
                  background: '#fffdf8',
                  transition: 'all 0.2s',
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 8,
                    overflow: 'hidden',
                    flexShrink: 0,
                    background: 'var(--hr-line)',
                  }}
                >
                  <img
                    src={related.coverImage}
                    alt={related.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    className="group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4
                    style={{
                      fontFamily: 'Georgia, serif',
                      fontSize: 14,
                      color: '#2d2418',
                      fontWeight: 600,
                      lineHeight: 1.35,
                      margin: 0,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                    className="group-hover:text-amber-800"
                  >
                    {related.title}
                  </h4>
                </div>
                <ChevronRight
                  className="group-hover:translate-x-1 transition-all"
                  style={{ width: 16, height: 16, color: 'var(--hr-accent-soft)', flexShrink: 0 }}
                />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ArticleSidebar;
