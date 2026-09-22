'use client';

import { createContext, useContext } from 'react';

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
}

const NOOP: EditorUI = {
  selectedUid: null,
  hoverUid: null,
  select: () => {},
  hover: () => {},
};

export const EditorUIContext = createContext<EditorUI>(NOOP);
export const useEditorUI = () => useContext(EditorUIContext);
