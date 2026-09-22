'use client';

import { useRef, useState } from 'react';

/**
 * Preusporiadanie riadkov ťahaním za úchyt (kľúčové fakty, časová os).
 *
 * Riadky musia mať `data-row-uid` a spoločného rodiča `data-row-list`.
 * Poradie sa počíta z ich skutočných obdĺžnikov, takže funguje pri ľubovoľnej
 * výške riadka.
 */
export function useRowDrag<T extends { uid: string }>(
  items: T[],
  apply: (next: T[]) => void
) {
  const [dragUid, setDragUid] = useState<string | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const state = useRef<{ uid: string; over: number } | null>(null);

  const startDrag = (uid: string) => (e: React.PointerEvent) => {
    e.preventDefault();
    const list = (e.currentTarget as HTMLElement).closest('[data-row-list]') as HTMLElement | null;
    if (!list) return;
    const doc = list.ownerDocument;
    setDragUid(uid);
    state.current = { uid, over: items.findIndex((i) => i.uid === uid) };

    const move = (ev: PointerEvent) => {
      const rows = [...list.querySelectorAll('[data-row-uid]')] as HTMLElement[];
      let over = rows.length;
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i].getBoundingClientRect();
        if (ev.clientY < r.top + r.height / 2) { over = i; break; }
      }
      if (state.current) state.current.over = over;
      setOverIndex(over);
    };

    const up = () => {
      doc.removeEventListener('pointermove', move);
      doc.removeEventListener('pointerup', up);
      const st = state.current;
      state.current = null;
      setDragUid(null);
      setOverIndex(null);
      if (!st) return;
      const from = items.findIndex((i) => i.uid === st.uid);
      let to = st.over;
      if (to > from) to -= 1;
      if (from < 0 || to < 0 || to === from) return;
      const next = [...items];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      apply(next);
    };

    doc.addEventListener('pointermove', move);
    doc.addEventListener('pointerup', up);
  };

  return { startDrag, dragUid, overIndex };
}
