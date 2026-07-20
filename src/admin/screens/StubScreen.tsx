'use client';

import { Construction } from 'lucide-react';

/** Zástupná obrazovka — vizuálny systém sedí, obsah príde neskôr. */
export function StubScreen({ title, note }: { title: string; note: string }) {
  return (
    <>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 20px' }}>{title}</h1>
      <div className="acard" style={{ padding: 40, textAlign: 'center' }}>
        <Construction className="w-9 h-9" style={{ color: 'var(--ad-muted)', margin: '0 auto 14px' }} />
        <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 8 }}>Obrazovka sa pripravuje</div>
        <p style={{ fontSize: 13.5, color: 'var(--ad-secondary)', maxWidth: 460, margin: '0 auto', lineHeight: 1.6 }}>
          {note}
        </p>
      </div>
    </>
  );
}
