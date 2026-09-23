'use client';

/**
 * FOTKY V TELE ČLÁNKU — otváranie svetelného boxu.
 *
 * Doteraz klik na obrázok v texte iba vyslal udalosť `openGalleryModal`, na
 * ktorú počúvala fotogaléria na konci článku. Článok bez fotogalérie teda
 * nemal komu tú udalosť doručiť a obrázky v texte sa nedali otvoriť vôbec —
 * týkalo sa to štyroch článkov, medzi nimi príspevkov v Aktualitách. A keď
 * fotka v spodnej galérii nebola, otvorila sa namiesto nej prvá.
 *
 * Telo článku si preto drží vlastný zoznam fotiek a vlastný svetelný box.
 * Kto kontext nemá (obrázok mimo tela článku), spadne na pôvodnú udalosť.
 *
 * Vlastný modul preto, aby sa `DynamicZoneRenderer` a `BlogMedia` nemuseli
 * importovať navzájom.
 */

import { createContext, useContext } from 'react';

export interface BodyPhoto {
  url: string;
  caption?: string;
  alt?: string;
  /** id súboru v knižnici — viažu sa naň lajky a komentáre k fotke. */
  fileId?: number;
}

/** Pôvodná cesta: požiada fotogalériu na konci článku, nech fotku otvorí. */
export function openGalleryWithImage(imageUrl: string) {
  window.dispatchEvent(new CustomEvent('openGalleryModal', { detail: { imageUrl } }));
}

export const BodyPhotosContext = createContext<((url: string) => void) | null>(null);

/** Klik na fotku v texte: svetelný box tela článku, inak pôvodná udalosť. */
export function useOpenBodyPhoto(): (url: string) => void {
  return useContext(BodyPhotosContext) || openGalleryWithImage;
}
