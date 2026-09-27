'use client';

/**
 * NAHLÁSENIA — podnety od čitateľov na komentáre, ktoré podľa nich na web
 * nepatria.
 *
 * Nahlásenie samo o sebe nič neskrýva; rozhoduje redakcia. Preto sú tu tri
 * úkony na dosah: otvoriť príspevok na mieste, zmazať ho, alebo nahlásenie
 * zamietnuť.
 *
 * Text komentára sa zobrazuje z ODPISU, ktorý uložil server pri nahlásení —
 * keď sa komentár medzitým zmaže, musí ostať vidieť, čo sa vlastne riešilo.
 */

import { useEffect, useState } from 'react';
import { Loader2, Trash2, ExternalLink, Check, X, Flag } from 'lucide-react';
import { useAuth } from '../AuthContext';
import {
  listNahlasenia, nahlaseniaPocty, nastavStavNahlasenia, zmazNahlasenie,
  zmazNahlasenyPrispevok, DOVODY,
  type AdminNahlasenie, type NahlasenieStav,
} from '../api/nahlasenia';

const PAGE = 30;

const STAVY: { id: NahlasenieStav | 'vsetky'; label: string }[] = [
  { id: 'nove', label: 'Nové' },
  { id: 'vybavene', label: 'Vybavené' },
  { id: 'zamietnute', label: 'Zamietnuté' },
  { id: 'vsetky', label: 'Všetky' },
];

function kedy(iso: string): string {
  const d = new Date(iso);
  const dnes = new Date();
  const cas = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return d.toDateString() === dnes.toDateString() ? `dnes ${cas}` : `${d.getDate()}. ${d.getMonth() + 1}. ${cas}`;
}

export function NahlaseniaScreen() {
  const { token } = useAuth();
  const [stav, setStav] = useState<NahlasenieStav | 'vsetky'>('nove');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<AdminNahlasenie[]>([]);
  const [pageCount, setPageCount] = useState(1);
  const [pocty, setPocty] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const [mazem, setMazem] = useState<AdminNahlasenie | null>(null);
  const [sprava, setSprava] = useState('');

  useEffect(() => {
    if (!token) return;
    let zrusene = false;
    setLoading(true);
    setError('');
    listNahlasenia({ token, page, pageSize: PAGE, stav })
      .then((r) => {
        if (zrusene) return;
        setRows(r.items);
        setPageCount(r.pageCount);
      })
      .catch((e: any) => { if (!zrusene) setError(e?.message || 'Načítanie zlyhalo.'); })
      .finally(() => { if (!zrusene) setLoading(false); });
    nahlaseniaPocty(token).then((p) => { if (!zrusene) setPocty(p as any); }).catch(() => {});
    return () => { zrusene = true; };
  }, [token, page, stav, reload]);

  const zmenStav = async (n: AdminNahlasenie, novy: NahlasenieStav) => {
    if (!token) return;
    // Optimisticky — pri chybe sa zoznam načíta znova a stav sa vráti sám.
    setRows((p) => p.map((x) => (x.documentId === n.documentId ? { ...x, stav: novy } : x)));
    try { await nastavStavNahlasenia(token, n.documentId, novy); setReload((x) => x + 1); }
    catch (e: any) { setError(e?.message || 'Zmena stavu zlyhala.'); setReload((x) => x + 1); }
  };

  const zmazPrispevok = async (n: AdminNahlasenie) => {
    if (!token) return;
    try {
      await zmazNahlasenyPrispevok(token, n);
      await nastavStavNahlasenia(token, n.documentId, 'vybavene');
      setSprava('Komentár je zmazaný, nahlásenie označené ako vybavené.');
      setTimeout(() => setSprava(''), 3000);
      setReload((x) => x + 1);
    } catch (e: any) {
      setError(e?.message || 'Komentár sa nepodarilo zmazať.');
    }
  };

  const vymazNahlasenie = async () => {
    if (!token || !mazem) return;
    try { await zmazNahlasenie(token, mazem.documentId); setMazem(null); setReload((x) => x + 1); }
    catch (e: any) { setError(e?.message || 'Mazanie zlyhalo.'); }
  };

  return (
    <div className="ad-page">
      <div className="ad-page-head">
        <div style={{ flex: 1 }}>
          <h1 className="ad-page-title">Nahlásenia</h1>
          <div className="ad-page-sub">
            Komentáre, ktoré čitatelia označili ako nevhodné. Nahlásenie samo nič neskrýva —
            príspevok ostáva na webe, kým sa nerozhodnete.
          </div>
        </div>
      </div>

      {sprava && <div className="acard" role="status" style={{ padding: '10px 14px', fontSize: 13.5 }}>{sprava}</div>}

      <div className="ad-toolbar">
        <div className="ad-seg" role="group" aria-label="Stav nahlásenia">
          {STAVY.map((s) => (
            <button key={s.id} className={stav === s.id ? 'is-on' : ''} onClick={() => { setStav(s.id); setPage(1); }}>
              {s.label}
              {pocty[s.id] ? <span className="ad-badge">{pocty[s.id]}</span> : null}
            </button>
          ))}
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
            {stav === 'nove' ? 'Žiadne nové nahlásenia. 🎉' : 'Nič sa nenašlo.'}
          </div>
        )}
        {!loading && rows.map((n) => (
          <div key={n.documentId} className="ad-list-row" style={{ gridTemplateColumns: '1fr auto', alignItems: 'start', gap: 12, padding: '14px 0' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                <span className="achip achip-draft"><Flag className="w-3 h-3" /> {DOVODY[n.dovod] || n.dovod}</span>
                <span style={{ fontSize: 12.5, color: 'var(--ad-muted)' }}>
                  {n.druh === 'komentar' ? 'komentár pod článkom' : 'komentár pod fotografiou'}
                  {' · '}autor {n.autorObsahu || 'neznámy'}
                  {n.nahlasil ? ` · nahlásil ${n.nahlasil}` : ''}
                  {' · '}{kedy(n.createdAt)}
                </span>
              </div>

              <blockquote style={{
                margin: '0 0 8px', padding: '10px 13px', borderLeft: '3px solid var(--ad-danger)',
                background: 'var(--hr-paper-2, #f4efe6)', borderRadius: 6,
                fontSize: 14, lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              }}>
                {n.odpisObsahu || '(komentár bol prázdny)'}
              </blockquote>

              {n.poznamka && (
                <div style={{ fontSize: 13.5, color: 'var(--ad-muted)', marginBottom: 6 }}>
                  Poznámka nahlasovateľa: {n.poznamka}
                </div>
              )}

              {n.stav !== 'nove' && (
                <span className="achip">{n.stav === 'vybavene' ? 'vybavené' : 'zamietnuté'}</span>
              )}
            </div>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {n.url && (
                <a className="abtn abtn-ghost" href={n.url} target="_blank" rel="noopener noreferrer" title="Otvoriť na webe">
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
              <button className="abtn abtn-ghost" title="Zmazať komentár a vybaviť" onClick={() => zmazPrispevok(n)}>
                <Trash2 className="w-4 h-4" />
              </button>
              {n.stav !== 'vybavene' && (
                <button className="abtn abtn-ghost" title="Označiť ako vybavené" onClick={() => zmenStav(n, 'vybavene')}>
                  <Check className="w-4 h-4" />
                </button>
              )}
              {n.stav !== 'zamietnute' && (
                <button className="abtn abtn-ghost" title="Zamietnuť — komentár je v poriadku" onClick={() => zmenStav(n, 'zamietnute')}>
                  <X className="w-4 h-4" />
                </button>
              )}
              <button className="abtn abtn-ghost" title="Zmazať samotné nahlásenie" onClick={() => setMazem(n)}>
                <Trash2 className="w-4 h-4" style={{ opacity: .5 }} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {pageCount > 1 && (
        <div className="ad-pager">
          <button className="abtn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Späť</button>
          <span>{page} / {pageCount}</span>
          <button className="abtn" disabled={page >= pageCount} onClick={() => setPage((p) => p + 1)}>Ďalej</button>
        </div>
      )}

      {mazem && (
        <div className="ad-modal-wrap" role="dialog" aria-modal="true">
          <div className="ad-modal">
            <h2>Zmazať nahlásenie?</h2>
            <p>Komentár ostane na webe. Zmaže sa len záznam o tom, že ho niekto nahlásil.</p>
            <div className="ad-modal-actions">
              <button className="abtn" onClick={() => setMazem(null)}>Nechať</button>
              <button className="abtn abtn-danger" onClick={vymazNahlasenie}>Zmazať</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NahlaseniaScreen;
