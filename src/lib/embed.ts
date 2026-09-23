/**
 * Vložené videá — rozpoznanie adresy a zostavenie vkladacieho odkazu.
 *
 * Redaktor kopíruje adresu z prehliadača („.../watch?v=XYZ"), nie vkladaciu
 * („.../embed/XYZ"). Doteraz sa jeho adresa použila tak, ako ju vložil, a
 * identifikátor ostal prázdny — z toho vzniklo `youtube.com/embed/` bez
 * identifikátora a prehrávač hlásil „Vyskytla sa chyba. Skúste to neskôr".
 *
 * Preto: adresa sa rozoberie tu, na jednom mieste. Editor si po vložení
 * adresy doplní poskytovateľa aj identifikátor, vykresľovanie si to isté
 * ešte overí (staršie články majú v poliach všeličo).
 */

export interface EmbedRef {
  provider: string;
  embedId: string;
}

/** Rozpozná YouTube / Vimeo / Sketchfab. Vráti `null`, ak adresa nesedí ani na jedno. */
export function parseEmbedUrl(raw: string | null | undefined): EmbedRef | null {
  const url = String(raw || '').trim();
  if (!url) return null;

  const y =
    url.match(/[?&]v=([\w-]{6,})/) ||             // watch?v=ID
    url.match(/youtu\.be\/([\w-]{6,})/) ||         // youtu.be/ID
    url.match(/youtube\.com\/embed\/([\w-]{6,})/) ||
    url.match(/youtube\.com\/shorts\/([\w-]{6,})/) ||
    url.match(/youtube\.com\/live\/([\w-]{6,})/);
  if (y) return { provider: 'youtube', embedId: y[1] };

  const v = url.match(/vimeo\.com\/(?:video\/)?(\d{6,})/);
  if (v) return { provider: 'vimeo', embedId: v[1] };

  const s = url.match(/sketchfab\.com\/(?:models|3d-models)\/(?:[^/]*-)?([0-9a-f]{20,})/i);
  if (s) return { provider: 'sketchfab', embedId: s[1] };

  return null;
}

/**
 * Vkladací odkaz pre `<iframe>`. `null` znamená, že blok ešte nemá čo prehrať —
 * volajúci má namiesto prehrávača ukázať výzvu na doplnenie adresy.
 */
export function embedSrc(block: { provider?: string; embedId?: string; url?: string }): string | null {
  const provider = String(block.provider || '').trim();
  // Identifikátor z poľa, inak z adresy — staršie články mávajú vyplnené len jedno.
  const id = String(block.embedId || '').trim() || parseEmbedUrl(block.url)?.embedId || '';
  const url = String(block.url || '').trim();

  if (provider === 'youtube') return id ? `https://www.youtube.com/embed/${id}` : null;
  if (provider === 'vimeo') return id ? `https://player.vimeo.com/video/${id}` : null;
  if (provider === 'sketchfab') return id ? `https://sketchfab.com/models/${id}/embed` : null;
  // Blogger a ostatné: adresa sa používa tak, ako je uložená.
  return url || null;
}
