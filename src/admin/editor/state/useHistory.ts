'use client';

import { useCallback, useRef, useState } from 'react';

/**
 * História zmien pre vrátenie späť (Ctrl+Z) a znovu (Ctrl+Y).
 *
 * Drží nemenné snímky celého poľa — pole blokov má aj pri dlhom článku rádovo
 * stovky položiek, takže sto snímok je pamäťovo zanedbateľných a kód je oproti
 * zoznamu operácií neporovnateľne jednoduchší (netreba vedieť každú zmenu
 * „odrobiť" naspäť).
 *
 *   set(next, 'popis')  … zmena, ktorá sa má dať vrátiť
 *   replace(next)       … zmena bez zápisu do histórie (načítanie článku)
 */

export const HISTORY_LIMIT = 100;

export interface History<T> {
  state: T;
  /** Zmena zapísaná do histórie. `next` môže byť hodnota alebo funkcia. */
  set: (next: T | ((prev: T) => T), label?: string) => void;
  /** Nahradenie bez zápisu do histórie (a s jej vyprázdnením). */
  reset: (next: T) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  /** Popis kroku, ktorý sa vráti — pre hlášku používateľovi. */
  undoLabel: string | null;
  redoLabel: string | null;
}

export function useHistory<T>(initial: T): History<T> {
  const [state, setState] = useState<T>(initial);
  // Minulosť a budúcnosť sú v ref-och: nevykresľujú sa, menia sa spolu so stavom.
  const past = useRef<{ value: T; label: string }[]>([]);
  const future = useRef<{ value: T; label: string }[]>([]);
  const [, bump] = useState(0);

  const set = useCallback((next: T | ((prev: T) => T), label = 'zmena') => {
    setState((prev) => {
      const value = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
      if (value === prev) return prev;
      past.current.push({ value: prev, label });
      if (past.current.length > HISTORY_LIMIT) past.current.shift();
      future.current = [];
      return value;
    });
    bump((n) => n + 1);
  }, []);

  const reset = useCallback((next: T) => {
    past.current = [];
    future.current = [];
    setState(next);
    bump((n) => n + 1);
  }, []);

  const undo = useCallback(() => {
    setState((prev) => {
      const step = past.current.pop();
      if (!step) return prev;
      future.current.push({ value: prev, label: step.label });
      return step.value;
    });
    bump((n) => n + 1);
  }, []);

  const redo = useCallback(() => {
    setState((prev) => {
      const step = future.current.pop();
      if (!step) return prev;
      past.current.push({ value: prev, label: step.label });
      return step.value;
    });
    bump((n) => n + 1);
  }, []);

  return {
    state,
    set,
    reset,
    undo,
    redo,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
    undoLabel: past.current.length ? past.current[past.current.length - 1].label : null,
    redoLabel: future.current.length ? future.current[future.current.length - 1].label : null,
  };
}
