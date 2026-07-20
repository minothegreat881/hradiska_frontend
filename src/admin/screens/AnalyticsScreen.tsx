'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown, ExternalLink, Pencil, AlertCircle } from 'lucide-react';
import { STAT_TILES, CHART_DAYS, TOP_ARTICLES, TRAFFIC_SOURCES, CATEGORIES } from '../data';

const PERIODS = ['24 h', '7 dní', '30 dní', '12 mes.'] as const;

export function AnalyticsScreen({ onEdit }: { onEdit: (id: string) => void }) {
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>('30 dní');

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Návštevnosť</h1>
          <p style={{ fontSize: 13.5, color: 'var(--ad-secondary)', margin: '6px 0 0' }}>
            Ukážkové dáta · zdroj sa určí pri napojení
          </p>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: 4, background: 'var(--ad-card)', border: '1px solid var(--ad-border)', borderRadius: 9, padding: 3 }}>
          {PERIODS.map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="abtn"
              style={{
                border: 'none', padding: '6px 12px', fontSize: 13,
                background: period === p ? 'linear-gradient(180deg,#b0813a,#8a5316)' : 'transparent',
                color: period === p ? '#fff' : 'var(--ad-secondary)',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Upozornenie — meranie zatiaľ nebeží */}
      <div
        className="acard"
        style={{ padding: '12px 16px', marginBottom: 18, display: 'flex', gap: 10, alignItems: 'flex-start', background: '#f6ead0', borderColor: 'var(--ad-draft-br)' }}
      >
        <AlertCircle className="w-4 h-4" style={{ color: 'var(--ad-draft-fg)', flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: 13, color: 'var(--ad-draft-fg)', lineHeight: 1.55 }}>
          <strong>Meranie zatiaľ nie je zapnuté.</strong> Čísla nižšie sú ukážkové.
          Vercel Web Analytics nemá API na sťahovanie štatistík — dáta bude treba brať
          z Umami/Plausible alebo z vlastného počítadla v Strapi.
        </div>
      </div>

      {/* Dlaždice */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(178px, 1fr))', gap: 14, marginBottom: 18 }}>
        {STAT_TILES.map(t => (
          <div key={t.label} className="acard" style={{ padding: 15 }}>
            <div style={{ fontSize: 12, color: 'var(--ad-secondary)', marginBottom: 7 }}>{t.label}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 25, fontWeight: 700, letterSpacing: '-.01em' }}>{t.value}</span>
              <span
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 12, fontWeight: 600,
                  color: t.trend >= 0 ? 'var(--ad-pub-fg)' : 'var(--ad-danger)',
                }}
              >
                {t.trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(t.trend)} %
              </span>
            </div>
            <Sparkline points={t.spark} />
          </div>
        ))}
      </div>

      {/* Hlavný graf */}
      <div className="acard" style={{ padding: 18, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 14 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Zobrazenia a návštevníci</h2>
          <div style={{ flex: 1 }} />
          <Legend color="#c8862f" label="Zobrazenia" />
          <Legend color="#7c1f24" label="Návštevníci" />
        </div>
        <MainChart />
      </div>

      {/* Spodná mriežka */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 18 }} className="ad-analytics-grid">
        <div className="acard" style={{ overflow: 'hidden' }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0, padding: '15px 16px 12px' }}>Najčítanejšie články</h2>
          <div style={{ overflowX: 'auto' }}>
            <table className="atable" style={{ minWidth: 560 }}>
              <thead>
                <tr>
                  <th>Článok</th>
                  <th style={{ textAlign: 'right' }}>Zobrazenia</th>
                  <th style={{ width: 90 }}></th>
                </tr>
              </thead>
              <tbody>
                {TOP_ARTICLES.map(a => (
                  <tr key={a.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{a.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--ad-muted)' }}>
                        {CATEGORIES.find(c => c.slug === a.categorySlug)?.name}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{a.views30d.toLocaleString('sk-SK')}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end' }}>
                        <a className="abtn abtn-icon" href={`/blog/${a.slug}`} target="_blank" rel="noreferrer" title="Zobraziť na webe">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button className="abtn abtn-icon" title="Upraviť" onClick={() => onEdit(a.id)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="acard" style={{ padding: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 13px' }}>Výkonnosť kategórií</h2>
            {CATEGORIES.slice(0, 5).map(c => {
              const pct = Math.min(100, Math.round((c.count / 68) * 100));
              return (
                <div key={c.slug} style={{ marginBottom: 11 }}>
                  <div style={{ display: 'flex', fontSize: 12.5, marginBottom: 4 }}>
                    <span style={{ color: 'var(--ad-secondary)' }}>{c.name}</span>
                    <span style={{ marginLeft: 'auto', fontWeight: 600 }}>{c.count}</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--ad-line)', borderRadius: 999 }}>
                    <div style={{ width: `${pct}%`, height: '100%', borderRadius: 999, background: 'linear-gradient(90deg,#e6c98a,#c8862f)' }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="acard" style={{ padding: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 13px' }}>Zdroje návštev</h2>
            {TRAFFIC_SOURCES.map(s => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9, fontSize: 13 }}>
                <span style={{ color: 'var(--ad-secondary)', flex: 1 }}>{s.label}</span>
                <div style={{ width: 76, height: 6, background: 'var(--ad-line)', borderRadius: 999 }}>
                  <div style={{ width: `${s.pct}%`, height: '100%', borderRadius: 999, background: '#c8862f' }} />
                </div>
                <span style={{ fontWeight: 600, width: 34, textAlign: 'right' }}>{s.pct} %</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--ad-secondary)' }}>
      <span style={{ width: 10, height: 3, borderRadius: 2, background: color }} />
      {label}
    </span>
  );
}

function Sparkline({ points }: { points: number[] }) {
  const max = Math.max(...points), min = Math.min(...points);
  const span = max - min || 1;
  const d = points.map((p, i) => `${(i / (points.length - 1)) * 100},${28 - ((p - min) / span) * 24}`).join(' ');
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" style={{ width: '100%', height: 30, marginTop: 9, display: 'block' }} aria-hidden="true">
      <polyline points={d} fill="none" stroke="#c8862f" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function MainChart() {
  const W = 760, H = 220, PAD = 8;
  const maxV = Math.max(...CHART_DAYS.map(d => d.views)) * 1.1;
  const x = (i: number) => (i / (CHART_DAYS.length - 1)) * (W - PAD * 2) + PAD;
  const y = (v: number) => H - PAD - (v / maxV) * (H - PAD * 2);

  const views = CHART_DAYS.map((d, i) => `${x(i)},${y(d.views)}`).join(' ');
  const visitors = CHART_DAYS.map((d, i) => `${x(i)},${y(d.visitors)}`).join(' ');
  const area = `${PAD},${H - PAD} ${views} ${W - PAD},${H - PAD}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 220, display: 'block' }} role="img" aria-label="Graf návštevnosti">
      {[0.25, 0.5, 0.75, 1].map(f => (
        <line key={f} x1={PAD} x2={W - PAD} y1={y(maxV * f)} y2={y(maxV * f)} stroke="#efe6d0" strokeWidth="1" />
      ))}
      <polygon points={area} fill="rgba(200,134,47,.12)" />
      <polyline points={views} fill="none" stroke="#c8862f" strokeWidth="2" />
      <polyline points={visitors} fill="none" stroke="#7c1f24" strokeWidth="2" />
      <circle cx={x(CHART_DAYS.length - 1)} cy={y(CHART_DAYS[CHART_DAYS.length - 1].views)} r="3.5" fill="#c8862f" />
      <circle cx={x(CHART_DAYS.length - 1)} cy={y(CHART_DAYS[CHART_DAYS.length - 1].visitors)} r="3.5" fill="#7c1f24" />
    </svg>
  );
}
