'use client';

/**
 * Záchranná sieť pre rozpísaný článok.
 *
 * Každých pár sekúnd sa rozrobený stav odloží do prehliadača. Keď spadne
 * prehliadač, vypne sa počítač alebo sa omylom zavrie karta, po návrate sa
 * ponúkne obnova. NIE JE to ukladanie do Strapi — na webe sa bez tlačidla
 * „Uložiť koncept" nezmení nič.
 *
 * Odložené je len to, čo sa nedá vyčítať zo servera: texty, polia a poradie
 * blokov. Po úspešnom uložení sa záznam maže, aby pri ďalšom otvorení
 * nestrašila ponuka obnovy.
 */

const PREFIX = 'hradiska.editor.draft.';
/** Staršie zvyšky sa neponúkajú — po týždni sú na obtiaž, nie na pomoc. */
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export interface DraftSnapshot {
  savedAt: number;
  data: any;
}

/** Jedna rozpracovaná práca v zozname článkov. */
export interface DraftInfo {
  /** `null` = rozpísaný nový článok, inak documentId existujúceho. */
  articleId: string | null;
  savedAt: number;
  title: string;
}

const keyFor = (articleId: string | null) => PREFIX + (articleId || 'novy-clanok');

export function saveDraft(articleId: string | null, data: any): void {
  try {
    const snap: DraftSnapshot = { savedAt: Date.now(), data };
    localStorage.setItem(keyFor(articleId), JSON.stringify(snap));
  } catch {
    /* plná alebo zakázaná pamäť prehliadača — editor musí fungovať aj tak */
  }
}

export function readDraft(articleId: string | null): DraftSnapshot | null {
  try {
    const raw = localStorage.getItem(keyFor(articleId));
    if (!raw) return null;
    const snap = JSON.parse(raw) as DraftSnapshot;
    if (!snap?.savedAt || !snap?.data) return null;
    if (Date.now() - snap.savedAt > MAX_AGE_MS) { clearDraft(articleId); return null; }
    return snap;
  } catch {
    return null;
  }
}

export function clearDraft(articleId: string | null): void {
  try { localStorage.removeItem(keyFor(articleId)); } catch { /* nevadí */ }
}

/**
 * Všetka rozpracovaná práca odložená v tomto prehliadači.
 *
 * Používa ju zoznam článkov: kým sa práca neuloží do Strapi, nikde inde ju
 * vidieť nie je a po zavretí karty si na ňu nikto nespomenie. Zoznam je
 * zoradený od najnovšej.
 */
export function listDrafts(): DraftInfo[] {
  const out: DraftInfo[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(PREFIX)) continue;
      const id = key.slice(PREFIX.length);
      const snap = readDraft(id === 'novy-clanok' ? null : id);
      if (!snap) continue;
      out.push({
        articleId: id === 'novy-clanok' ? null : id,
        savedAt: snap.savedAt,
        title: String(snap.data?.title || '').trim() || 'Bez názvu',
      });
    }
  } catch { /* zakázaná pamäť prehliadača */ }
  return out.sort((a, b) => b.savedAt - a.savedAt);
}

/** „14:32" — čas poslednej zálohy pre hlášku používateľovi. */
export function timeOf(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** „dnes 14:32" / „22. 9. 14:32" — pre zoznam rozpracovaných. */
export function whenOf(ts: number): string {
  const d = new Date(ts);
  const dnes = new Date();
  const rovnakyDen = d.toDateString() === dnes.toDateString();
  return rovnakyDen ? `dnes ${timeOf(ts)}` : `${d.getDate()}. ${d.getMonth() + 1}. ${timeOf(ts)}`;
}
