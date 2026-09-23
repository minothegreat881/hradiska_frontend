/**
 * Číselníky administrácie.
 *
 * Hodnoty sú opísané zo schém v `hradiska-strapi/src/components/**` — nikdy
 * nevymýšľať vlastné, Strapi by zápis odmietol.
 *
 * Ukážkové dáta (články, dlaždice návštevnosti, graf, zdroje návštev) tu boli
 * do septembra 2026. Analytika na nich stavala a ukazovala vymyslené čísla,
 * takže sú zmazané — obrazovka teraz ráta skutočné počty cez `api/stats.ts`.
 */

// ── Enumy zo Strapi ──────────────────────────────────────────────────────────
export const BLOCK_TYPES = [
  { id: 'content.rich-text', label: 'Text', accent: 'var(--ad-blk-rich)' },
  { id: 'content.image-block', label: 'Obrázok', accent: 'var(--ad-blk-image)' },
  { id: 'content.quote-block', label: 'Citát', accent: 'var(--ad-blk-quote)' },
  { id: 'content.sources', label: 'Zdroje', accent: '#6b5a3a' },
  { id: 'content.embed', label: 'Vložené video', accent: '#3f6b7a' },
  { id: 'content.poem', label: 'Báseň', accent: '#7a5c8a' },
  { id: 'content.image-gallery', label: 'Galéria', accent: '#5c7a52' },
] as const;

export const IMAGE_POSITIONS = ['left', 'right', 'center', 'full', 'breakout'] as const;
export const IMAGE_WIDTHS = ['30', '40', '50', '60', '100'] as const;
export const ASPECT_RATIOS = ['3:2', '16:9', '4:3', '1:1', '2:3', '9:16', '3:4', 'auto'] as const;
export const EMBED_PROVIDERS = ['youtube', 'sketchfab', 'vimeo', 'blogger'] as const;

export const KEY_FACT_ICONS = [
  'calendar', 'users', 'map', 'building', 'crown', 'sword', 'shield', 'scroll',
  'book', 'star', 'flag', 'mountain', 'tree', 'water', 'fire', 'custom',
] as const;

export const TIMELINE_TYPES = [
  'founding', 'battle', 'construction', 'destruction', 'discovery', 'event', 'era',
] as const;

export const TIMELINE_TYPE_LABELS: Record<string, string> = {
  founding: 'Založenie', battle: 'Bitka', construction: 'Stavba',
  destruction: 'Zánik', discovery: 'Objav', event: 'Udalosť', era: 'Obdobie',
};
