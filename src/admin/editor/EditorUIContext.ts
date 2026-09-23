'use client';

import React, { createContext, useContext } from 'react';

/**
 * Spojenie medzi plátnom a obalom bloku (`BlockShell`).
 *
 * Kontext, nie propy: `BlockShell` vykresľuje `DynamicZoneRenderer`, ktorý patrí
 * webu a nemá o editore vedieť nič nad rámec `editMode`.
 */
export interface EditorUI {
  selectedUid: string | null;
  hoverUid: string | null;
  select: (uid: string | null) => void;
  hover: (uid: string | null) => void;
  /** Blok, do ktorého sa práve píše (len `content.rich-text`). */
  editingUid: string | null;
  /** Vykreslí inline editor namiesto obsahu bloku.
   *  `minHeight` drží výšku, akú mal vykreslený blok — bez nej článok pri
   *  prepnutí na písanie poskočí (TipTap sadzí o kúsok inak). */
  renderInline?: (uid: string, minHeight?: number) => React.ReactNode;
}

const NOOP: EditorUI = {
  selectedUid: null,
  hoverUid: null,
  select: () => {},
  hover: () => {},
  editingUid: null,
};

export const EditorUIContext = createContext<EditorUI>(NOOP);
export const useEditorUI = () => useContext(EditorUIContext);
