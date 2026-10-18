'use client';

/**
 * Úkony nad prvkom, spoločné pre plátno (lišta, klávesy, písanie v stránke),
 * pravý panel aj klasickú úpravu: zmena textu (s pravidlom premenovania
 * kategórie), výmena obrázka, odstránenie s potvrdením, „+".
 */

import { useCallback } from 'react';
import { useAuth } from '../AuthContext';
import { clankyPodlaDokumentu } from '../api/vzhlad';
import { useKoncept } from './stav/KonceptKontext';
import { useEditorUI } from './ui';
import { doplnSlugClanku } from './stav/operacie';
import type { OpisPrvku, TextPrvku } from './prvky';
import type { Jazyk, Text, Vzhlad } from '../../lib/vzhlad/typy';

export function useAkciePrvkov() {
  const k = useKoncept();
  const ui = useEditorUI();
  const { token } = useAuth();


  const zmenText = useCallback(async (o: OpisPrvku, t: TextPrvku, j: Jazyk, hodnota: string) => {
    const v = k.koncept;
    if (!v) return;
    const h = hodnota.slice(0, t.limit);
    const stary = t.ziskaj(v);
    /* Premenovanie kategórie: anglický a nemecký web by bez prekladu stratil názov. */
    if (t.premenovanie && j === 'sk') {
      const starySk = (stary && typeof stary === 'object' ? stary.sk : null) ?? t.zaloha ?? '';
      if (h.trim() && h !== starySk) {
        const novy = await ui.premenuj({ stary: (stary as Text | null) ?? null, novySk: h, zaloha: t.zaloha ?? '' });
        if (!novy) return;
        k.zmen(`premenovanie: ${o.stitok}`, (w) => {
          t.nastav(w, 'sk', novy.sk);
          t.nastav(w, 'en', novy.en ?? '');
          t.nastav(w, 'de', novy.de ?? '');
        });
        return;
      }
    }
    k.zmen(`text (${j.toUpperCase()}): ${o.stitok}`, (w) => t.nastav(w, j, h));
  }, [k, ui]);

  /** Článok z plátna (napr. doplnený do riadka automaticky) — slovenský slug a preklady pre odkaz vo vzhľade. */
  const slugClanku = useCallback(async (dokument: string): Promise<string> => {
    const znamy = k.rozriesene.clanky[dokument]?.sk?.slug;
    if (znamy || !token) return znamy ?? '';
    try {
      const [c] = await clankyPodlaDokumentu(token, [dokument]);
      if (c) { k.doplnClanky([c]); return c.slug; }
    } catch { /* server odkaz bez slugu odmietne a editor to ukáže */ }
    return '';
  }, [k, token]);

  const zmenObrazok = useCallback(async (o: OpisPrvku) => {
    const v = k.koncept;
    const p = o.obrazok;
    if (!v || !p) return;
    const vysledok = await ui.otvorObrazok(p, p.ziskaj(v));
    if (vysledok === undefined) return;
    if (vysledok === 'povodny') {
      if (p.povodny) k.zmen(`pôvodný obrázok: ${o.stitok}`, p.povodny.vykonaj);
      return;
    }
    const slug = o.druh === 'riadok-clanok' && o.clanok ? await slugClanku(o.clanok) : '';
    k.zmen(vysledok ? `obrázok: ${o.stitok}` : `bez obrázka: ${o.stitok}`, (w) => {
      p.nastav(w, vysledok);
      if (o.clanok && slug) doplnSlugClanku(w, o.clanok, slug);
    });
  }, [k, ui, slugClanku]);

  const odstran = useCallback(async (o: OpisPrvku): Promise<boolean> => {
    if (!o.odstranit) return false;
    const ok = await ui.potvrd({
      nadpis: 'Odstrániť?',
      text: <>Odstráni sa {o.odstranit.popis}. Vrátiť sa to dá tlačidlom <b>Vrátiť</b> alebo Ctrl+Z — a kým koncept nezverejníte, na webe sa nezmení nič.</>,
      tlacidlo: 'Odstrániť',
      nebezpecne: true,
    });
    if (!ok) return false;
    k.zmen(`odstránenie: ${o.stitok}`, o.odstranit.vykonaj);
    k.nastavVyber(null);
    return true;
  }, [k, ui]);

  const pridaj = useCallback(async (o: OpisPrvku) => {
    const p = o.pridat;
    if (!p) return;
    switch (p.vyber) {
      case 'kategoria': {
        const kat = await ui.vyberKategoriu({ nadpis: p.popis });
        if (kat) k.zmen(p.popis.toLowerCase(), (w) => p.vykonaj(w, { druh: 'kategoria', kategoria: kat }));
        return;
      }
      case 'clanok': {
        const c = await ui.vyberClanok({ nadpis: p.popis, kategoria: p.kategoria });
        if (!c) return;
        k.doplnClanky([c]);
        k.zmen(p.popis.toLowerCase(), (w) => p.vykonaj(w, { druh: 'clanok', clanok: { dokument: c.dokument, slug: c.slug }, nazov: c.nazov }));
        return;
      }
      case 'fotka': {
        const f = await ui.vyberFotku();
        if (f) k.zmen(p.popis.toLowerCase(), (w) => p.vykonaj(w, { druh: 'fotka', id: f.id }));
        return;
      }
      case 'ciel': {
        const c = await ui.vyberCiel({ nadpis: p.popis });
        if (!c) return;
        const id = o.nazov.split(':')[2];
        k.zmen(p.popis.toLowerCase(), (w: Vzhlad) => {
          const s = w.pata.stlpce.find((x) => x.id === id);
          if (s) s.odkazy.push({ text: { sk: c.text }, ciel: c.ciel });
        });
        return;
      }
      default:
        k.zmen(p.popis.toLowerCase(), (w) => p.vykonaj(w, { druh: 'nic' }));
    }
  }, [k, ui]);

  /* Pripnutie článku z plátna: článok (slovenský slug, preklady) sa dotiahne,
     aby ho web vedel nakresliť v každom jazyku a server prijal odkaz. */
  const pripni = useCallback(async (o: OpisPrvku) => {
    const p = o.pripnut;
    if (!p) return;
    const slug = await slugClanku(p.dokument);
    if (!slug) { k.nastavSpravu({ ton: 'chyba', text: 'Článok sa nedá pripnúť — nie je zverejnený v slovenčine.' }); return; }
    k.zmen(`${p.popis.toLowerCase()}: ${o.stitok}`, (w) => p.vykonaj(w, slug));
  }, [k, slugClanku]);

  return { zmenText, zmenObrazok, odstran, pridaj, pripni };
}
