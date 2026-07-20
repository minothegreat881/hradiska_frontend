/**
 * Zápis článkov do Strapi.
 *
 * ── PRAVIDLO, KTORÉ TU ROZHODUJE O VŠETKOM (overené pokusom) ────────────────
 *   PUT bez poľa       → pole sa ZACHOVÁ
 *   PUT s poľom        → pole sa PREPÍŠE CELÉ
 *
 * Pri `blocks` to znamená, že sa musí poslať KOMPLETNÉ pole blokov. Odoslanie
 * jedného bloku zmaže ostatné — otestované: 3 bloky → PUT s jedným → ostal 1.
 * Preto `buildPayload` posiela bloky len vtedy, keď ich má naozaj všetky.
 *
 * ── Tvary, ktoré Strapi prijíma (overené) ──────────────────────────────────
 *   category   { set: [documentId] }
 *   coverImage <číselné id súboru>          (NIE objekt z GET-u)
 *   blocks     [{ __component, …polia }]    (image ako číselné id)
 *   location   { name, latitude, longitude, … }
 *   keyFacts   [{ label, value, icon }]
 *
 * ── Publikovanie ───────────────────────────────────────────────────────────
 *   `/actions/publish` NEEXISTUJE (vracia 405). Publikuje sa cez
 *   PUT ?status=published, koncept cez PUT ?status=draft.
 */

import { strapiFetch } from './client';
import { invalidatePublishedIndex } from './posts';

export interface EditorState {
  title: string;
  slug: string;
  excerpt: string;
  authorName: string;
  readingTime: number;
  originalPublishedDate: string;
  featured: boolean;
  metaTitle: string;
  metaDescription: string;
  categoryDocumentId: string | null;
  tagDocumentIds?: string[];
  location: { name: string; latitude: string; longitude: string; region: string; country: string };
  keyFacts: { label: string; value: string; icon: string }[];
  timeline: { year: string; title: string; description: string; type: string }[];
  blocks: { type: string; data: any; original?: any }[];
  /** Objekt z GET-u alebo číselné id; pri zápise sa prevedie na id. */
  coverImage?: any | null;
}

/** Média z GET-u prídu ako objekt — Strapi pri zápise čaká číselné id. */
const mediaId = (v: any): number | null =>
  v == null ? null : typeof v === 'number' ? v : typeof v?.id === 'number' ? v.id : null;

/**
 * Blok z GET-u pripravený na spätný zápis.
 *
 * Strapi pri zápise odmieta `id` komponentov („Invalid key id") a médiá chce
 * ako číselné id, nie ako celý objekt. Preto sa `id` odstraňuje aj z vnorených
 * štruktúr (napr. `items` v zdrojoch) a media polia sa splošťujú.
 * Textové polia (vrátane `body` rich-textu) ostávajú nedotknuté.
 */
function sanitizeOriginal(o: any): any {
  const MEDIA_KEYS = new Set(['image', 'secondImage', 'images']);
  const walk = (v: any, key?: string): any => {
    if (Array.isArray(v)) {
      if (key && MEDIA_KEYS.has(key)) return v.map(mediaId).filter((x: any) => x != null);
      return v.map(x => walk(x));
    }
    if (v && typeof v === 'object') {
      if (key && MEDIA_KEYS.has(key)) return mediaId(v);
      const out: any = {};
      for (const [k, val] of Object.entries(v)) {
        if (k === 'id') continue;                 // id komponentu Strapi neprijme
        if (k === 'body') { out[k] = val; continue; } // rich-text sa nesmie prehrabávať
        out[k] = walk(val, k);
      }
      return out;
    }
    return v;
  };
  return walk(o);
}

/** Formulárový blok → tvar pre Strapi. */
function toStrapiBlock(b: { type: string; data: any; original?: any }): any {
  const d = b.data ?? {};

  // Blok, ktorého sa používateľ nedotkol, ide späť VERBATIM. Prevod cez TipTap
  // sa naň vôbec nespustí, takže sa nemá čo znormalizovať ani stratiť.
  // Týka sa to drvivej väčšiny blokov pri bežnej úprave článku.
  if (b.original) return sanitizeOriginal(b.original);

  switch (b.type) {
    case 'content.rich-text':
      // Prišlo z editora — Blocks JSON vyrobený prevodom z TipTapu.
      return { __component: b.type, body: Array.isArray(d.body) ? d.body : [] };

    case 'content.image-block':
      return {
        __component: b.type,
        image: mediaId(d.image),
        alt: d.alt ?? '',
        caption: d.caption ?? '',
        position: d.position ?? 'center',
        width: d.width ?? '50',
        aspectRatio: d.aspectRatio ?? 'auto',
        objectPosition: d.objectPosition ?? 'center center',
        pairWithNext: !!d.pairWithNext,
        showCaption: d.showCaption !== false,
        rounded: d.rounded !== false,
        shadow: d.shadow !== false,
      };

    case 'content.quote-block':
      return { __component: b.type, text: d.text ?? '', author: d.author || null, source: d.source || null };

    case 'content.poem':
      return { __component: b.type, text: d.text ?? '', title: d.title || null, author: d.author || null, source: d.source || null };

    case 'content.embed':
      return { __component: b.type, provider: d.provider ?? 'youtube', url: d.url ?? '', embedId: d.embedId || null, caption: d.caption || null };

    case 'content.sources':
      return {
        __component: b.type,
        title: d.title ?? 'Zdroje a literatúra',
        intro: d.intro || null,
        items: (d.items ?? []).map((i: any) => ({ text: i.text ?? '', url: i.url || null })),
      };

    case 'content.image-gallery':
      return {
        __component: b.type,
        images: (d.images ?? []).map(mediaId).filter(Boolean),
        columns: d.columns ?? '3',
      };

    default:
      return { __component: b.type, ...d };
  }
}

export function buildPayload(s: EditorState, opts: { includeBlocks: boolean }) {
  const data: any = {
    title: s.title,
    slug: s.slug,
    excerpt: s.excerpt || null,
    authorName: s.authorName || null,
    readingTime: s.readingTime || null,
    featured: !!s.featured,
    metaTitle: s.metaTitle || null,
    metaDescription: s.metaDescription || null,
  };

  if (s.originalPublishedDate) {
    data.originalPublishedDate = new Date(s.originalPublishedDate).toISOString();
  }
  if (s.categoryDocumentId) {
    data.category = { set: [s.categoryDocumentId] };
  }

  // `set` prepíše zoznam štítkov na presne tento — odobratie tak funguje
  // rovnako ako pridanie. Prázdne pole = článok bez štítkov.
  if (s.tagDocumentIds) {
    data.tags = { set: s.tagDocumentIds };
  }

  // `undefined` = nechaj tak; `null` = zmaž cover. Rozdiel je podstatný —
  // vynechané pole si Strapi ponechá, poslané null ho vyprázdni.
  if (s.coverImage !== undefined) {
    data.coverImage = s.coverImage === null ? null : mediaId(s.coverImage);
  }

  // Lokalita sa zapisuje len ak má povinné polia — inak by Strapi vrátil 400.
  const lat = parseFloat(s.location.latitude);
  const lng = parseFloat(s.location.longitude);
  if (s.location.name && Number.isFinite(lat) && Number.isFinite(lng)) {
    data.location = {
      name: s.location.name, latitude: lat, longitude: lng,
      region: s.location.region || null, country: s.location.country || 'Slovensko',
    };
  }

  data.keyFacts = s.keyFacts
    .filter(f => f.label.trim() && f.value.trim())
    .map(f => ({ label: f.label, value: f.value, icon: f.icon || 'star' }));

  data.timeline = s.timeline
    .filter(t => t.year.trim() && t.title.trim())
    .map(t => ({ year: t.year, title: t.title, description: t.description || null, type: t.type || 'event' }));

  // Bloky idú do payloadu LEN keď ich máme kompletné — inak by sa zvyšok zmazal.
  if (opts.includeBlocks) {
    data.blocks = s.blocks.map(toStrapiBlock);
  }

  return { data };
}

// ── Operácie ─────────────────────────────────────────────────────────────────

export async function createPost(token: string, s: EditorState) {
  const r = await strapiFetch<any>('/api/blog-posts?status=draft', {
    method: 'POST', token, body: buildPayload(s, { includeBlocks: true }),
  });
  invalidatePublishedIndex();
  return r.data;
}

export async function updatePost(
  token: string, documentId: string, s: EditorState,
  opts: { publish?: boolean; includeBlocks: boolean }
) {
  const status = opts.publish ? 'published' : 'draft';
  const r = await strapiFetch<any>(`/api/blog-posts/${documentId}?status=${status}`, {
    method: 'PUT', token, body: buildPayload(s, { includeBlocks: opts.includeBlocks }),
  });
  invalidatePublishedIndex();
  return r.data;
}

/**
 * ⚠️ ZRUŠENIE PUBLIKOVANIA SA CEZ CONTENT API NEDÁ. Otestované, všetky tri cesty:
 *
 *   DELETE /api/blog-posts/<id>?status=published
 *       → 204, ale ZMAŽE CELÝ DOKUMENT vrátane konceptu. Overené na teste:
 *         po zavolaní nezostal v DB ani draft riadok. Používať sa NESMIE.
 *   POST   /api/blog-posts/<id>/actions/unpublish   → 405, endpoint neexistuje
 *   PUT    /api/blog-posts/<id>?status=draft {publishedAt:null}
 *       → 200, ale článok zostane verejne dostupný
 *
 * Kým sa nenájde bezpečná cesta, stiahnutie článku z webu treba spraviť
 * v Strapi admin paneli (Content Manager → Unpublish).
 */


export async function deletePost(token: string, documentId: string) {
  await strapiFetch(`/api/blog-posts/${documentId}`, { method: 'DELETE', token });
  invalidatePublishedIndex();
}

/** Je slug voľný? Kontroluje sa pred uložením, nech PUT nespadne na 400. */
export async function isSlugFree(token: string, slug: string, exceptDocumentId?: string) {
  const r = await strapiFetch<any>(
    `/api/blog-posts?status=draft&filters[slug][$eq]=${encodeURIComponent(slug)}&fields[0]=id&pagination[pageSize]=5`,
    { token }
  );
  const hits = (r.data ?? []).filter((d: any) => d.documentId !== exceptDocumentId);
  return hits.length === 0;
}

/**
 * Poistka proti tichej strate blokov.
 * Po uložení sa znovu načíta počet blokov a porovná s tým, čo sme poslali.
 */
export async function verifyBlockCount(token: string, documentId: string, expected: number) {
  const r = await strapiFetch<any>(
    `/api/blog-posts/${documentId}?status=draft&populate[0]=blocks`, { token }
  );
  const actual = (r?.data?.blocks ?? []).length;
  return { ok: actual === expected, actual, expected };
}
