'use client';

/**
 * PRIPOMIENKY — všetko, čo sa naklikalo na webe, na jednom mieste.
 *
 * Pripomienka vzniká na stránke (nástroj v pravom dolnom rohu): redaktor klikne
 * na prvok a napíše poznámku. Sem prídu aj s adresou stránky a popisom prvku,
 * takže sa dá kliknúť „Otvoriť na mieste" a stránka sa otvorí presne tam.
 *
 * Stav: nová → rieši sa → hotová (alebo zamietnutá). Hotové a zamietnuté sa na
 * webe už nekreslia, tu ostávajú ako história.
 */

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Search, X, Trash2, ExternalLink, Copy, AlertTriangle, FileText, Check } from 'lucide-react';
import { useAuth } from '../AuthContext';
import {
  listPripomienky, pripomienkyPocty, nastavStav, zmazPripomienku, prePrenos,
  type AdminPripomienka, type PripomienkaStav, type PripomienkaDruh,
} from '../api/pripomienky';

const PAGE = 30;

const STAVY: { id: PripomienkaStav | 'vsetky'; label: string }[] = [
  { id: 'nova', label: 'Nové' },
  { id: 'riesi-sa', label: 'Rieši sa' },
  { id: 'hotova', label: 'Hotové' },
  { id: 'zamietnuta', label: 'Zamietnuté' },
  { id: 'vsetky', label: 'Všetky' },
];

const STAV_LABEL: Record<PripomienkaStav, string> = {
  nova: 'Nová', 'riesi-sa': 'Rieši sa', hotova: 'Hotová', zamietnuta: 'Zamietnutá',
};

function kedy(iso: string): string {
  const d = new Date(iso);
  const dnes = new Date();
  const cas = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return d.toDateString() === dnes.toDateString() ? `dnes ${cas}` : `${d.getDate()}. ${d.getMonth() + 1}. ${cas}`;
}

export function PripomienkyScreen() {
  const { token } = useAuth();
  const [stav, setStav] = useState<PripomienkaStav | 'vsetky'>('nova');
  const [druh, setDruh] = useState<PripomienkaDruh | 'vsetky'>('vsetky');
  const [q, setQ] = useState('');
  const [dq, setDq] = useState('');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<AdminPripomienka[]>([]);
  const [total, setTotal] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [pocty, setPocty] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const [askDelete, setAskDelete] = useState<AdminPripomienka | null>(null);
  const [sprava, setSprava] = useState('');

  useEffect(() => {
    const t = setTimeout(() => { setDq(q); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    listPripomienky({ token, page, pageSize: PAGE, stav, druh, q: dq })
      .then((r) => { if (!cancelled) { setRows(r.items); setTotal(r.total); setPageCount(r.pageCount); } })
      .catch((e) => { if (!cancelled) setError(e?.message || 'Načítanie zlyhalo.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token, page, stav, druh, dq, reload]);

  useEffect(() => {
    if (!token) return;
    pripomienkyPocty(token).then(setPocty).catch(() => {});
  }, [token, reload]);

  /** Optimisticky — a pri chybe naspäť, nech obrazovka neklame. */
  const zmen = async (p: AdminPripomienka, novy: PripomienkaStav) => {
    if (!token) return;
    const povodne = rows;
    setRows((r) => r.map((x) => (x.documentId === p.documentId ? { ...x, stav: novy } : x)));
    try {
      await nastavStav(token, p.documentId, novy);
      setReload((n) => n + 1);
    } catch {
      setRows(povodne);
      setError('Zmena stavu zlyhala.');
    }
  };

  const vymaz = async () => {
    if (!token || !askDelete) return;
    try {
      await zmazPripomienku(token, askDelete.documentId);
      setAskDelete(null);
      setReload((n) => n + 1);
    } catch (e: any) {
      setError(e?.message || 'Mazanie zlyhalo.');
    }
  };

  const text = useMemo(() => prePrenos(rows), [rows]);
  const skopiruj = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setSprava(`Skopírovaných ${rows.length} pripomienok.`);
      setTimeout(() => setSprava(''), 2500);
    } catch {
      setSprava('Kopírovanie zlyhalo.');
    }
  };

  return (
    <div className="ad-page">
      <div className="ad-page-head">
        <div style={{ flex: 1 }}>
          <h1 className="ad-page-title">Pripomienky</h1>
          <div className="ad-page-sub">
            Poznámky naklikané priamo na webe — chyby aj úpravy obsahu. Nástroj nájdete na stránke
            vpravo dole.
          </div>
        </div>
        <button className="abtn" onClick={skopiruj} disabled={!rows.length}>
          <Copy className="w-4 h-4" /> Kopírovať pre vývojára
        </button>
      </div>

      {sprava && <div className="acard" role="status" style={{ padding: '10px 14px', fontSize: 13.5 }}>{sprava}</div>}

      <div className="ad-toolbar">
        <div className="ad-seg" role="group" aria-label="Stav pripomienky">
          {STAVY.map((s) => (
            <button key={s.id} className={stav === s.id ? 'is-on' : ''} onClick={() => { setStav(s.id); setPage(1); }}>
              {s.label}
              {pocty[s.id] ? <span className="ad-badge">{pocty[s.id]}</span> : null}
            </button>
          ))}
        </div>
        <div className="ad-seg" role="group" aria-label="Druh pripomienky">
          <button className={druh === 'vsetky' ? 'is-on' : ''} onClick={() => { setDruh('vsetky'); setPage(1); }}>Všetko</button>
          <button className={druh === 'chyba' ? 'is-on' : ''} onClick={() => { setDruh('chyba'); setPage(1); }}>Chyby</button>
          <button className={druh === 'obsah' ? 'is-on' : ''} onClick={() => { setDruh('obsah'); setPage(1); }}>Obsah</button>
        </div>
        <div className="ad-search">
          <Search className="w-4 h-4" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Hľadať v texte alebo adrese…" />
          {q && <button onClick={() => setQ('')} aria-label="Zrušiť hľadanie"><X className="w-3.5 h-3.5" /></button>}
        </div>
      </div>

      {error && (
        <div className="acard" style={{ padding: '12px 16px', background: 'var(--hr-error-bg)', borderColor: 'var(--hr-error-line)', color: 'var(--ad-danger)', fontSize: 13.5 }}>
          {error}
        </div>
      )}

      <div className="acard">
        {loading && <div className="ad-empty-row"><Loader2 className="w-4 h-4 animate-spin" /> Načítavam…</div>}
        {!loading && rows.length === 0 && (
          <div className="ad-empty-row">
            {stav === 'nova' ? 'Žiadne nové pripomienky. 🎉' : 'Nič sa nenašlo.'}
          </div>
        )}
        {!loading && rows.map((p) => (
          <div key={p.documentId} className="ad-list-row" style={{ gridTemplateColumns: '1fr auto', alignItems: 'start', gap: 12, padding: '12px 0' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                <span className={`achip ${p.druh === 'chyba' ? 'achip-draft' : 'achip-cat'}`}>
                  {p.druh === 'chyba' ? <AlertTriangle className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                  {p.druh === 'chyba' ? 'chyba' : 'obsah'}
                </span>
                {p.stav !== 'nova' && <span className="achip">{STAV_LABEL[p.stav]}</span>}
                <span style={{ fontSize: 12, color: 'var(--ad-muted)' }}>
                  {p.autor || 'hosť'} · {kedy(p.createdAt)}
                  {p.zariadenie === 'mobil' ? ' · mobil' : ''}
                </span>
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--ad-text)', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                {p.text}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ad-muted)', marginTop: 4, overflowWrap: 'anywhere' }}>
                {p.nadpisStranky || p.url} — {p.popisPrvku || 'neznámy prvok'}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <a
                className="abtn"
                href={`${p.url}${p.url.includes('?') ? '&' : '?'}pripomienka=${p.documentId}`}
                target="_blank"
                rel="noreferrer"
                title="Otvoriť stránku na mieste pripomienky"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Na mieste
              </a>
              {p.stav !== 'riesi-sa' && p.stav !== 'hotova' && (
                <button className="abtn" onClick={() => zmen(p, 'riesi-sa')}>Rieši sa</button>
              )}
              {p.stav !== 'hotova' && (
                <button className="abtn abtn-primary" onClick={() => zmen(p, 'hotova')}>
                  <Check className="w-3.5 h-3.5" /> Hotová
                </button>
              )}
              {p.stav === 'hotova' && (
                <button className="abtn" onClick={() => zmen(p, 'nova')}>Otvoriť znova</button>
              )}
              <button className="abtn abtn-icon abtn-danger" onClick={() => setAskDelete(p)} aria-label="Zmazať">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {pageCount > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end', fontSize: 13 }}>
          <span style={{ color: 'var(--ad-muted)' }}>strana {page} z {pageCount} · {total} pripomienok</span>
          <button className="abtn abtn-icon" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>‹</button>
          <button className="abtn abtn-icon" disabled={page >= pageCount} onClick={() => setPage((p) => p + 1)}>›</button>
        </div>
      )}

      {askDelete && (
        <div className="ad-modal-wrap" onClick={() => setAskDelete(null)}>
          <div className="acard ad-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Zmazať pripomienku?</h2>
            <p>„{askDelete.text.slice(0, 120)}{askDelete.text.length > 120 ? '…' : ''}" — nedá sa to vrátiť.</p>
            <div>
              <button className="abtn" onClick={() => setAskDelete(null)}>Nechať</button>
              <button className="abtn abtn-danger" onClick={vymaz}>Zmazať</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
