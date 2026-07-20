'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

/** Zbaliteľný panel v pravom stĺpci editora. Šípka sa otáča o 180°. */
export function Panel({
  title, children, defaultOpen = false,
}: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="apanel">
      <button className="apanel-head" aria-expanded={open} onClick={() => setOpen(o => !o)}>
        {title}
        <ChevronDown className="w-4 h-4 apanel-arrow" />
      </button>
      {open && <div className="apanel-body">{children}</div>}
    </div>
  );
}
