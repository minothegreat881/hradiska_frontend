/**
 * Cesta k poľu (z kontroly údajov, napr. `domov.dlazdice.skupiny[1].polozky[0].kategoria`)
 * → stránka editora a prvok plátna (`data-vw`), na ktorý sa dá preskočiť.
 */

import type { Vzhlad, Rozriesene } from '../../lib/vzhlad/typy';
import type { Stranka } from './stav/KonceptKontext';
import { slugOdkazu } from './stav/operacie';

export interface MiestoNaPlatne {
  stranka: Stranka;
  /** Prvok so značkou `data-vw` (null = len stránka). */
  nazov: string | null;
  /** Obal, keď prvok sám na plátne nie je (zmazaná kategória sa nekreslí). */
  obal: string | null;
}

const cislo = (m: RegExpMatchArray | null, i: number) => (m ? Number(m[i]) : -1);

export function miestoZCesty(cesta: string, v: Vzhlad, r: Rozriesene): MiestoNaPlatne | null {
  const domov: Stranka = { druh: 'domov' };
  const menu: Stranka = { druh: 'menu' };
  let m: RegExpMatchArray | null;

  if (cesta.startsWith('domov.uvod.')) {
    const p = cesta.split('.')[2]?.replace(/\[.*$/, '') ?? '';
    return { stranka: domov, nazov: ['nadtitulok', 'nadpis', 'znak'].includes(p) ? `uvod:${p}` : null, obal: null };
  }
  if ((m = cesta.match(/^domov\.dlazdice\.skupiny\[(\d+)\](?:\.(nadpis|polozky\[(\d+)\]))?/))) {
    const s = v.domov.dlazdice.skupiny[cislo(m, 1)];
    if (!s) return { stranka: domov, nazov: 'dlazdice', obal: null };
    if (m[2] === 'nadpis') return { stranka: domov, nazov: `skupina-nadpis:${s.id}`, obal: `skupina:${s.id}` };
    const p = m[3] !== undefined ? s.polozky[Number(m[3])] : null;
    return { stranka: domov, nazov: p ? `dlazdica:${s.id}:${p.id}` : `skupina:${s.id}`, obal: `skupina:${s.id}` };
  }
  if (cesta.startsWith('domov.dlazdice')) return { stranka: domov, nazov: 'dlazdice', obal: null };
  if (cesta.startsWith('domov.hladanie.vyzva')) return { stranka: domov, nazov: 'hladanie:vyzva', obal: null };
  if (cesta.startsWith('domov.hladanie')) return { stranka: domov, nazov: 'popularne', obal: 'hladanie:pole' };
  if ((m = cesta.match(/^domov\.sekcie\[(\d+)\](?:\.(\w+))?(?:\[(\d+)\])?/))) {
    const s = v.domov.sekcie[cislo(m, 1)];
    if (!s) return { stranka: domov, nazov: null, obal: null };
    const pole = m[2];
    if (s.typ === 'dalsi-obsah') {
      if (pole === 'nadpis') return { stranka: domov, nazov: `dalsi-obsah:nadpis:${s.id}`, obal: `sekcia:${s.id}` };
      if (pole === 'riadky' && m[3] !== undefined) {
        const rr = s.riadky[Number(m[3])];
        return { stranka: domov, nazov: rr ? `riadok:${s.id}:${rr.id}` : `sekcia:${s.id}`, obal: `sekcia:${s.id}` };
      }
    }
    if (s.typ === 'kronika') {
      if (pole === 'uvodnyClanok') return { stranka: domov, nazov: 'kronika:uvod', obal: `sekcia:${s.id}` };
      if (pole === 'obrazok') return { stranka: domov, nazov: 'kronika:obrazok', obal: `sekcia:${s.id}` };
    }
    return { stranka: domov, nazov: `sekcia:${s.id}`, obal: null };
  }
  if (cesta.startsWith('domov.fotogaleria')) return { stranka: domov, nazov: 'kronika:fotogaleria', obal: null };
  if ((m = cesta.match(/^domov\.pridajteSa\.prosby\[(\d+)\]/))) return { stranka: domov, nazov: `pridajte-sa:prosba:${m[1]}`, obal: 'pridajte-sa' };
  if ((m = cesta.match(/^domov\.pridajteSa\.(\w+)/))) {
    return { stranka: domov, nazov: ['nadtitulok', 'nadpis', 'citat', 'uvod', 'email'].includes(m[1]) ? `pridajte-sa:${m[1]}` : 'pridajte-sa', obal: 'pridajte-sa' };
  }
  if ((m = cesta.match(/^kategorie\[(\d+)\](?:\.(\w+))?/))) {
    const k = v.kategorie[cislo(m, 1)];
    if (!k) return null;
    const slug = slugOdkazu(k.kategoria, r);
    const pole = m[2];
    const nazov = pole === 'obrazok' ? 'kategoria:obrazok' : pole === 'nazov' ? 'kategoria:nazov' : pole === 'popis' ? 'kategoria:popis' : null;
    return { stranka: { druh: 'kategoria', slug }, nazov, obal: null };
  }
  if ((m = cesta.match(/^cinnost\.polozky\[(\d+)\]/))) {
    const p = v.cinnost.polozky[cislo(m, 1)];
    return { stranka: domov, nazov: p ? `cinnost:${p.kluc}` : 'cinnost:nadpis', obal: null };
  }
  if (cesta.startsWith('cinnost')) return { stranka: domov, nazov: 'cinnost:nadpis', obal: null };
  if (cesta.startsWith('menu')) return { stranka: menu, nazov: 'menu:hlavny', obal: null };
  if ((m = cesta.match(/^pata\.stlpce\[(\d+)\]/))) {
    const s = v.pata.stlpce[cislo(m, 1)];
    return { stranka: menu, nazov: s ? `pata:stlpec:${s.id}` : null, obal: null };
  }
  if ((m = cesta.match(/^pata\.siete\[(\d+)\]/))) {
    const s = v.pata.siete[cislo(m, 1)];
    return { stranka: menu, nazov: s ? `pata:siet:${s.druh}` : null, obal: null };
  }
  return null;
}

/** Krátky popis stránky editora. */
export const nazovStranky = (s: Stranka, kategorie: { slug: string; name: string }[]): string =>
  s.druh === 'domov' ? 'Domovská' : s.druh === 'menu' ? 'Hlavička a päta' : `Kategória ${kategorie.find((k) => k.slug === s.slug)?.name ?? s.slug}`;
