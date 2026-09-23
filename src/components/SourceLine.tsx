'use client';

/**
 * JEDEN RIADOK ZOZNAMU ZDROJOV.
 *
 * Schéma má na zdroj jedno textové pole a nepovinný odkaz — to sa nemení.
 * Mení sa len sadzba, aby sa v zozname dalo očami nájsť, kto, čo a kedy:
 *
 *   autor        polotučne
 *   dielo        kurzívou
 *   vydavateľ    normálne, jemnejšie
 *   rok          najjemnejšie, na konci
 *   odkaz        samostatná značka na konci riadka, nie celý text ako odkaz
 *
 * Delí sa NA MIESTA V PÔVODNOM REŤAZCI, nie skladaním nového: časti sú jeho
 * výseky za sebou, takže na obrazovke je vždy presne to, čo je uložené — aj
 * so zátvorkami a bodkami. Čo sa nerozpozná, vykreslí sa ako predtým.
 */

import React from 'react';
import { ExternalLink } from 'lucide-react';

/** „Foto:", „Zdroj:" a spol. nie sú autor — za nimi sa nekurzívuje. */
const LABELS = /^(foto|fotografie|fotky|zdroj|zdroje|text|mapa|mapy|preklad|autor|autora|kresba|video)$/i;

interface Parts { head?: string; work: string; rest?: string; tail?: string; plainHead?: boolean }

export function parseSourceLine(raw: string): Parts | null {
  const text = (raw || '').trim();
  if (!text || /^https?:\/\//i.test(text)) return null;

  // Rok na konci aj s tým, čo ho oddeľuje či obopína — „ 1988", „, 1995", „ (1999)".
  const y = text.match(/[\s,(]((?:1[0-9]|20)\d{2})\.?\)?$/);
  const yearAt = y && y.index !== undefined ? y.index : -1;
  const body = yearAt >= 0 ? text.slice(0, yearAt) : text;
  const tail = yearAt >= 0 ? text.slice(yearAt) : undefined;

  // Autor pred prvou dvojbodkou, ak je to krátke a nie je to adresa.
  const c = body.indexOf(':');
  const hasHead = c > 1 && c <= 60 && !/https?$/i.test(body.slice(0, c));
  const head = hasHead ? body.slice(0, c + 1) : undefined;
  const middle = hasHead ? body.slice(c + 1) : body;
  const plainHead = hasHead && LABELS.test(body.slice(0, c).trim());

  let work = middle;
  let rest: string | undefined;
  if (hasHead && !plainHead) {
    /* Koniec názvu: buď „In:" (nasleduje zborník či časopis), alebo prvá
       čiarka. Zo 1238 zdrojov je jedno aj druhé bežné; čo príde skôr, platí. */
    const inAt = middle.search(/[\s,.]\s*[Ii]n[:.]\s/);
    const comma = middle.indexOf(',');
    const cut = [inAt, comma].filter((k) => k > 2).sort((a, b) => a - b)[0];
    if (cut !== undefined) { work = middle.slice(0, cut); rest = middle.slice(cut); }
  }
  if (!head && !tail) return null;
  return { head, work, rest, tail, plainHead };
}

/** Adresa na čítanie: doména a skrátená cesta namiesto celého odkazu. */
export function shortUrl(u: string): string {
  try {
    const x = new URL(u);
    const host = x.hostname.replace(/^www\./i, '');
    const path = (x.pathname + x.search).replace(/\/$/, '');
    const cely = path && path !== '/' ? host + path : host;
    return cely.length > 44 ? `${cely.slice(0, 43)}…` : cely;
  } catch {
    return u.length > 44 ? `${u.slice(0, 43)}…` : u;
  }
}

export function SourceLine({ text, url }: { text: string; url?: string }) {
  const p = parseSourceLine(text);
  const odkaz = (url || '').trim();

  const citacia = p ? (
    <>
      {p.head && <span style={{ fontWeight: 600 }}>{p.head}</span>}
      <span style={p.head && !p.plainHead ? { fontStyle: 'italic' } : undefined}>{p.work}</span>
      {p.rest && <span style={{ opacity: 0.85 }}>{p.rest}</span>}
      {p.tail && (
        <span style={{ opacity: 0.75, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{p.tail}</span>
      )}
    </>
  ) : (
    <>{text}</>
  );

  /* Zdroj, z ktorého ostala len adresa — buď v poli odkazu, alebo (po
     migrácii je ich tak vyše sto) priamo v texte. Ukáž ju raz a čitateľne,
     nie dvakrát a celú. */
  const holaAdresa = /^https?:\/\/\S+$/i.test(text.trim()) ? text.trim() : '';
  if ((!text.trim() || holaAdresa) && (odkaz || holaAdresa)) {
    const href = odkaz || holaAdresa;
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="source-link" title={href}>
        <ExternalLink aria-hidden="true" style={{ width: 13, height: 13, flexShrink: 0 }} />
        {shortUrl(href)}
      </a>
    );
  }

  /* Text zdroja NIE JE celý odkazom. Podčiarknutá veta cez tri riadky sa zle
     číta a stratí sa v nej autor aj názov; odkaz je preto samostatná značka
     za citáciou. */
  return (
    <>
      {citacia}
      {odkaz && (
        <>
          {' '}
          <a href={odkaz} target="_blank" rel="noopener noreferrer" className="source-link" title={odkaz}>
            <ExternalLink aria-hidden="true" style={{ width: 13, height: 13, flexShrink: 0 }} />
            {shortUrl(odkaz)}
          </a>
        </>
      )}
    </>
  );
}
