'use client';

/**
 * Analytika.
 *
 * Predtým tu boli VYMYSLENÉ čísla natvrdo v `admin/data.ts` — návštevy, graf,
 * zdroje návštevnosti. Teraz sú tu len údaje, ktoré sa naozaj dajú spočítať zo
 * Strapi, a poctivý prázdny stav pre návštevnosť, ktorá sa zatiaľ nemeria.
 *
 * Čo sa nepodarí spočítať, zobrazí sa ako „—“, nie ako nula.
 */

import { useEffect, useState } from 'react';
import { Activity, ImageOff, FileSearch, MapPinOff, ChevronRight } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { fetchContentStats, type ContentStats } from '../api/stats';

const SOURCES = [
  {
    id: 'umami',
    name: 'Umami — odporúčané',
    note: 'Otvorený softvér, beží na vlastnom serveri vedľa Strapi. Nezbiera osobné údaje, takže netreba súhlas s cookies.',
  },
  {
    id: 'plausible',
    name: 'Plausible',
    note: 'To isté ako Umami, ale ako platená služba. Jednoduchšie nasadenie, mesačný poplatok.',
  },
  {
    id: 'strapi',
    name: 'Vlastné počítadlo v Strapi',
    note: 'Najmenej práce navyše, ale ukáže len počty zobrazení článkov — žiadne zdroje návštev ani čas na stránke.',
  },
];

export function AnalyticsScreen({ onEdit }: { onEdit?: (id: string | null) => void }) {
  const { token } = useAuth();
  const [stats, setStats] = useState<ContentStats | null>(null);
  const [source, setSource] = useState('umami');

  useEffect(() => {
    if (!token) return;
    let alive = true;
    fetchContentStats(token).then((s) => { if (alive) setStats(s); }).catch(() => {});
    return () => { alive = false; };
  }, [token]);

  const n = (v: number | null | undefined) => (v == null ? '—' : v.toLocaleString('sk-SK'));

  return (
    <div className="ad-page">
      <div className="ad-page-head">
        <div>
          <h1 className="ad-page-title">Analytika</h1>
          <div className="ad-page-sub">Návštevnosť webu a stav obsahu</div>
        </div>
      </div>

      {/* ── Návštevnosť: poctivý prázdny stav ── */}
      <div className="acard ad-empty-analytics">
        <div>
          <div className="ad-empty-icon"><Activity className="w-5 h-5" /></div>
          <h2>Meranie návštevnosti zatiaľ nebeží</h2>
          <p>
            Web nemá zapojený žiadny nástroj na meranie návštev, takže sa nedá povedať,
            koľko ľudí čo číta. Kým sa niektorý nezapojí, nebudú tu žiadne čísla —
            radšej nič než vymyslené údaje.
          </p>
        </div>

        <div className="ad-choices">
          {SOURCES.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`ad-choice${source === s.id ? ' is-on' : ''}`}
              onClick={() => setSource(s.id)}
              aria-pressed={source === s.id}
            >
              <span className={`ad-radio${source === s.id ? ' is-on' : ''}`} aria-hidden="true" />
              <span>
                <b>{s.name}</b>
                <i>{s.note}</i>
              </span>
            </button>
          ))}
          <div className="ad-choice-actions">
            <button className="abtn abtn-primary" disabled title="Zapojenie robí správca servera">
              Pokračovať s {SOURCES.find((s) => s.id === source)?.name.split(' —')[0]}
            </button>
            <span className="ad-note">Zapojenie vyžaduje zásah na serveri.</span>
          </div>
        </div>
      </div>

      {/* ── Obsah: skutočné údaje ── */}
      <div>
        <h2 className="ad-section-title">Obsah — skutočné údaje zo Strapi</h2>
        <div className="ad-stats">
          <Tile label="Články" value={n(stats?.articles)} note={`z toho ${n(stats?.published)} publikovaných`} />
          <Tile label="Štítky" value={n(stats?.tags)} note={`${n(stats?.categories)} kategórií`} />
          <Tile label="Komentáre na schválenie" value={n(stats?.commentsWaiting)} />
          <Tile label="Publikované za 30 dní" value={n(stats?.publishedLast30)} />
        </div>
      </div>

      <div className="acard ad-todo">
        <h2 className="ad-section-title" style={{ margin: 0 }}>Na doplnenie</h2>
        <Row icon={<ImageOff className="w-4 h-4" />} label="Články bez titulnej fotografie" value={n(stats?.noCover)} />
        <Row icon={<FileSearch className="w-4 h-4" />} label="Články bez meta popisu pre vyhľadávače" value={n(stats?.noMeta)} />
        <Row icon={<MapPinOff className="w-4 h-4" />} label="Články bez polohy na mape" value={n(stats?.noLocation)} />
        <p className="ad-note" style={{ margin: '4px 0 0' }}>
          Nie každý článok potrebuje polohu — povesti či odborné texty sú bez nej v poriadku.
        </p>
      </div>
    </div>
  );
}

function Tile({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="acard ad-stat">
      <span className="ad-stat-label">{label}</span>
      <span className="ad-stat-n">{value}</span>
      {note && <span className="ad-note">{note}</span>}
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="ad-todo-row">
      <span className="ad-todo-icon">{icon}</span>
      <span className="ad-todo-label">{label}</span>
      <span className="ad-todo-n">{value}</span>
      <ChevronRight className="w-4 h-4" style={{ color: 'var(--ad-muted)' }} />
    </div>
  );
}
