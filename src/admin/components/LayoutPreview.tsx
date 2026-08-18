'use client';

/**
 * Živý náhľad rozloženia obrázkového bloku.
 *
 * `image-block` má 11 polí a bez náhľadu je nečitateľný — miniatúra stránky
 * ukazuje, kde obrázok v texte skončí. Linky = text, zlatý obdĺžnik = obrázok.
 */
export function LayoutPreview({
  position, width, pairWithNext,
}: { position: string; width: string; pairWithNext: boolean }) {
  const w = Number(width) || 50;

  const line = (key: number, pct = 100) => (
    <div key={key} style={{ height: 3, borderRadius: 2, background: 'var(--hr-line-strong)', width: `${pct}%` }} />
  );

  const imgBox = (style: React.CSSProperties = {}) => (
    <div
      style={{
        background: 'linear-gradient(135deg,var(--hr-on-photo-3),var(--hr-accent-soft))',
        borderRadius: 3,
        border: '1px solid var(--hr-accent-soft)',
        ...style,
      }}
    />
  );

  const isFloat = position === 'left' || position === 'right';

  return (
    <div>
      <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--ad-panel-head)', marginBottom: 6 }}>
        Náhľad rozloženia
      </div>
      <div
        style={{
          background: '#fff',
          border: '1px solid var(--ad-line)',
          borderRadius: 9,
          padding: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 5,
          minHeight: 190,
        }}
        aria-hidden="true"
      >
        {[0, 1].map(i => line(i))}

        {isFloat ? (
          <div style={{ display: 'flex', gap: 7, alignItems: 'flex-start', margin: '3px 0' }}>
            {position === 'left' && imgBox({ width: `${w}%`, height: 52, flexShrink: 0 })}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
              {[0, 1, 2, 3, 4].map(i => line(i, i === 4 ? 70 : 100))}
            </div>
            {position === 'right' && imgBox({ width: `${w}%`, height: 52, flexShrink: 0 })}
          </div>
        ) : pairWithNext ? (
          <div style={{ display: 'flex', gap: 5, margin: '3px 0' }}>
            {imgBox({ flex: 1, height: 46 })}
            {imgBox({ flex: 1, height: 46, opacity: 0.55 })}
          </div>
        ) : (
          <div
            style={{
              margin: position === 'breakout' ? '3px -12px' : '3px 0',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            {imgBox({
              width: position === 'full' || position === 'breakout' ? '100%' : `${w}%`,
              height: 50,
            })}
          </div>
        )}

        {[0, 1, 2].map(i => line(i, i === 2 ? 55 : 100))}
      </div>
      <div style={{ fontSize: 11, color: 'var(--ad-muted)', marginTop: 6, lineHeight: 1.45 }}>
        {position === 'breakout'
          ? 'Presahuje šírku textového stĺpca.'
          : position === 'full'
          ? 'Plná šírka stĺpca.'
          : pairWithNext
          ? 'Spojí sa s nasledujúcim obrázkom.'
          : isFloat
          ? `Text obteká, obrázok ${w} % šírky.`
          : `Vycentrovaný, ${w} % šírky.`}
      </div>
    </div>
  );
}
