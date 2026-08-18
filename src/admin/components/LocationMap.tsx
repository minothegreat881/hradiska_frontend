'use client';

import { slovakiaBorderDetailed } from '../../data/slovakia-border';

/**
 * Mini-mapa na výber súradníc klikom.
 *
 * Vykresľuje sa z toho istého obrysu, aký používa web (`data/slovakia-border`),
 * takže nepribúda žiadna závislosť ani tile server. Prepočet je lineárny
 * v rámci bounding boxu — na výber miesta v rámci SR to stačí, na kartografickú
 * presnosť nie (Mercator sa neuplatňuje).
 */

const BBOX = { minLon: 16.8, maxLon: 22.6, minLat: 47.7, maxLat: 49.7 };
const W = 720;
const H = 248;

const PATH = (() => {
  const lonSpan = BBOX.maxLon - BBOX.minLon;
  const latSpan = BBOX.maxLat - BBOX.minLat;
  return slovakiaBorderDetailed
    .map(([lon, lat]: [number, number], i: number) => {
      const x = ((lon - BBOX.minLon) / lonSpan) * W;
      const y = H - ((lat - BBOX.minLat) / latSpan) * H;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ') + ' Z';
})();

export function LocationMap({
  lat, lng, onPick,
}: { lat: string; lng: string; onPick: (lat: number, lng: number) => void }) {
  const latN = parseFloat(lat);
  const lngN = parseFloat(lng);
  const hasPin = Number.isFinite(latN) && Number.isFinite(lngN);

  const pinX = hasPin ? ((lngN - BBOX.minLon) / (BBOX.maxLon - BBOX.minLon)) * W : 0;
  const pinY = hasPin ? H - ((latN - BBOX.minLat) / (BBOX.maxLat - BBOX.minLat)) * H : 0;

  const handle = (e: React.MouseEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    // Pomer v rámci viewBoxu — funguje pri akejkoľvek vykreslenej veľkosti.
    const fx = (e.clientX - r.left) / r.width;
    const fy = (e.clientY - r.top) / r.height;
    const lon = BBOX.minLon + fx * (BBOX.maxLon - BBOX.minLon);
    const la = BBOX.maxLat - fy * (BBOX.maxLat - BBOX.minLat);
    onPick(Number(la.toFixed(5)), Number(lon.toFixed(5)));
  };

  return (
    <div style={{ marginBottom: 10 }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        onClick={handle}
        role="button"
        aria-label="Kliknutím umiestnite značku"
        style={{
          width: '100%', height: 'auto', display: 'block', cursor: 'crosshair',
          background: 'var(--hr-wash-4)', border: '1px solid var(--ad-line)', borderRadius: 9,
        }}
      >
        <path d={PATH} fill="var(--hr-line-soft)" stroke="var(--hr-accent)" strokeWidth="2" strokeLinejoin="round" />
        {hasPin && (
          <g transform={`translate(${pinX.toFixed(1)} ${pinY.toFixed(1)})`}>
            <circle cx="0" cy="3" r="5" fill="rgba(0,0,0,.25)" />
            <circle cx="0" cy="0" r="10" fill="#c44561" stroke="#fff" strokeWidth="3" />
          </g>
        )}
      </svg>
      <div style={{ fontSize: 11, color: 'var(--ad-muted)', marginTop: 4 }}>
        {hasPin ? `${latN.toFixed(5)}, ${lngN.toFixed(5)} — kliknutím presuniete` : 'Kliknutím do mapy zadáte súradnice'}
      </div>
    </div>
  );
}
