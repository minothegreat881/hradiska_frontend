'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Zbaliteľný panel v pravom stĺpci editora.
 *
 * Zbalená sekcia ukazuje v hlavičke SÚHRN — aby sa nemuselo otvárať všetko
 * dokola len preto, aby človek zistil, čo v sekcii je (napr. „Titulok 57/70 ·
 * Popis 150/160"). Šípka sa otáča o 180°.
 */
export function Panel({
  title, summary, status, children, defaultOpen = false,
}: {
  title: string;
  /** Text pod názvom, keď je sekcia zbalená. */
  summary?: React.ReactNode;
  /** Malá značka vpravo (napr. zelená fajka pri vyplnenom SEO). */
  status?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="apanel">
      <button className="apanel-head" aria-expanded={open} onClick={() => setOpen(o => !o)}>
        <span className="apanel-head-text">
          {title}
          {!open && summary && <span className="apanel-sum">{summary}</span>}
        </span>
        {!open && status}
        <ChevronDown className="w-4 h-4 apanel-arrow" />
      </button>
      {open && <div className="apanel-body">{children}</div>}
    </div>
  );
}
