'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, MapPin } from 'lucide-react';
import {
  searchArticles, makeSnippet, highlightTerm, coverToUrl, type SearchHit,
} from '../lib/searchIndex';

const T = {
  bg: 'var(--hr-surface)',
  panelBg: 'var(--hr-surface)',
  border: 'var(--hr-line)',
  amber: 'var(--hr-accent)',
  amberSoft: 'var(--hr-accent-soft)',
  textMain: 'var(--hr-ink-3)',
  textSub: 'var(--hr-muted)',
  markText: 'var(--hr-mark-text)',
} as const;

interface SearchResultsPageProps {
  /** Dopyt z ?q= (App ho podáva cez params). */
  query?: string;
}

function Row({ hit, query }: { hit: SearchHit; query: string }) {
  const h = highlightTerm(hit.title, query);
  const snip = makeSnippet(hit.text, query, 90);
  const thumb = coverToUrl(hit.cover);
  return (
    <a
      href={`/blog/${hit.slug}`}
      style={{
        display: 'flex', gap: 16, alignItems: 'flex-start', textDecoration: 'none',
        background: T.panelBg, border: `1px solid ${T.border}`, borderRadius: 12,
        padding: 16, transition: 'border-color .15s, box-shadow .15s',
      }}
      className="search-page-row"
    >
      <span
        style={{
          flexShrink: 0, width: 92, height: 68, borderRadius: 8, backgroundColor: 'var(--hr-chip-bg)',
          backgroundImage: thumb ? `url(${thumb})` : 'repeating-linear-gradient(135deg,var(--hr-line-strong) 0 6px,var(--hr-chip-bg) 6px 12px)',
          backgroundSize: 'cover', backgroundPosition: 'center', border: `1px solid ${T.border}`,
        }}
      />
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
          {hit.hasLocation && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, color: T.amber, textTransform: 'uppercase', letterSpacing: '.06em' }}>
              <MapPin style={{ width: 12, height: 12 }} /> {hit.place || 'Lokalita'}
            </span>
          )}
          {hit.categoryName && (
            <span style={{ fontSize: 11, color: T.textSub, textTransform: 'uppercase', letterSpacing: '.06em' }}>
              {hit.categoryName}
            </span>
          )}
        </span>
        <span style={{ display: 'block', fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 600, color: T.textMain, lineHeight: 1.25 }}>
          {h.matched ? (<>{h.pre}<mark style={{ background: 'transparent', color: T.markText, padding: 0 }}>{h.mid}</mark>{h.post}</>) : hit.title}
        </span>
        <span style={{ display: 'block', marginTop: 5, fontFamily: 'var(--font-serif)', fontSize: 14.5, color: T.textSub, lineHeight: 1.5 }}>
          {snip.matched ? (
            <>{snip.pre}<mark style={{ background: 'transparent', color: T.amber, fontWeight: 600, padding: 0 }}>{snip.mid}</mark>{snip.post}</>
          ) : (hit.excerpt || '')}
        </span>
      </span>
    </a>
  );
}

export function SearchResultsPage({ query = '' }: SearchResultsPageProps) {
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const q = query.trim();

  useEffect(() => {
    if (!q) { setHits([]); return; }
    let cancelled = false;
    setLoading(true);
    searchArticles(q, 200)
      .then((res) => { if (!cancelled) setHits(res); })
      .catch(() => { if (!cancelled) setHits([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [q]);

  const locations = useMemo(() => hits.filter((h) => h.hasLocation), [hits]);
  const articles = useMemo(() => hits.filter((h) => !h.hasLocation), [hits]);

  return (
    <div id="main-content" style={{ minHeight: '100vh', background: T.bg }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 20px 80px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <Search style={{ width: 22, height: 22, color: T.amber }} />
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 600, color: T.textMain, margin: 0 }}>
            Výsledky vyhľadávania
          </h1>
        </div>
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: T.textSub, margin: '0 0 28px' }}>
          {q ? (
            <>Pre „<strong style={{ color: T.amber }}>{q}</strong>" — {loading ? 'hľadám…' : `${hits.length} ${hits.length === 1 ? 'výsledok' : hits.length < 5 ? 'výsledky' : 'výsledkov'}`}</>
          ) : (
            'Zadajte hľadaný výraz v poli vyhľadávania.'
          )}
        </p>

        {!loading && q && hits.length === 0 && (
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: T.textSub, fontStyle: 'italic' }}>
            Nič sme nenašli. Skúste iné alebo všeobecnejšie slovo.
          </p>
        )}

        {locations.length > 0 && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 12, letterSpacing: '.14em', textTransform: 'uppercase', color: T.amber, margin: '0 0 12px' }}>
              Lokality a hradiská · {locations.length}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {locations.map((h) => <Row key={h.slug} hit={h} query={q} />)}
            </div>
          </section>
        )}

        {articles.length > 0 && (
          <section>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 12, letterSpacing: '.14em', textTransform: 'uppercase', color: T.amber, margin: '0 0 12px' }}>
              Články · {articles.length}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {articles.map((h) => <Row key={h.slug} hit={h} query={q} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
