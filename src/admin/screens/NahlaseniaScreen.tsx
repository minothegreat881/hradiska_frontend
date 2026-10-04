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
  zmazNahlasenyPrispevok, nazvyClankov, DOVODY,
  type AdminNahlasenie, type NahlasenieStav,
} from '../api/nahlasenia';

const PAGE = 30;

const STAVY: { id: NahlasenieStav | 'vsetky'; label: string }[] = [
  { id: 'nove', label: 'Nové' },
  { id: 'vybavene', label: 'Vybavené' },
  { id: 'zamietnute', label: 'Zamietnuté' },
  { id: 'vsetky', label: 'Všetky' },
];

/** Slug článku z adresy nahlásenia („…/blog/beckov-…?fotoFile=3" → slug). */
function slugZAdresy(url?: string | null): string {
  return url?.match(/\/blog\/([^/?#]+)/)?.[1] ?? '';
}

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
  /** slug → názov článku; dopĺňa sa osobitnou požiadavkou po načítaní strany */
  const [nazvy, setNazvy] = useState<Record<string, string>>({});
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
        /* Názvy článkov k slugom — jedna požiadavka pre celú stranu. */
        nazvyClankov(token, r.items.map((x) => slugZAdresy(x.url)))
          .then((m) => { if (!zrusene) setNazvy((p) => ({ ...p, ...m })); });
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
        {!loading && rows.map((n) => {
          const slug = slugZAdresy(n.url);
          const nazov = nazvy[slug] || slug || 'neznámy článok';
          return (
          <div key={n.documentId} className="nahl-riadok">
            {/* 1 · KDE to je. Toto chýbalo najviac: z adresy sa redakcia
                   neorientovala a musela klikať, aby zistila, o ktorý článok
                   ide. Názov je prvý a je to zároveň odkaz na miesto. */}
            <div className="nahl-kde">
              {n.url ? (
                <a href={n.url} target="_blank" rel="noopener noreferrer" className="nahl-clanok">
                  {nazov} <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
              ) : (
                <span className="nahl-clanok">{nazov}</span>
              )}
              <span className="achip achip-draft"><Flag className="w-3 h-3" /> {DOVODY[n.dovod] || n.dovod}</span>
              {n.stav !== 'nove' && (
                <span className="achip">{n.stav === 'vybavene' ? 'vybavené' : 'zamietnuté'}</span>
              )}
            </div>

            {/* 2 · KTO a KEDY */}
            <div className="nahl-meta">
              {n.druh === 'komentar' ? 'komentár pod článkom' : 'komentár pod fotografiou'}
              {' · '}autor <strong>{n.autorObsahu || 'neznámy'}</strong>
              {n.nahlasil ? <> · nahlásil <strong>{n.nahlasil}</strong></> : null}
              {' · '}{kedy(n.createdAt)}
            </div>

            {/* 3 · ČO sa rieši — odpis uložený pri nahlásení */}
            <blockquote className="nahl-text">{n.odpisObsahu || '(komentár bol prázdny)'}</blockquote>

            {n.poznamka && (
              <div className="nahl-poznamka">
                <strong>Poznámka nahlasovateľa:</strong> {n.poznamka}
              </div>
            )}

            {/* 4 · ČO S TÝM. Tlačidlá sú pomenované, nie holé ikony: dve
                   odpadkové koše vedľa seba (zmazať komentár × zahodiť
                   záznam) sa inak pliesť musia. */}
            <div className="nahl-akcie">
              {n.url && (
                <a className="abtn" href={n.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4" /> Otvoriť na webe
                </a>
              )}
              <button className="abtn abtn-danger" onClick={() => zmazPrispevok(n)}>
                <Trash2 className="w-4 h-4" /> Zmazať komentár
              </button>
              {n.stav !== 'vybavene' && (
                <button className="abtn" onClick={() => zmenStav(n, 'vybavene')}>
                  <Check className="w-4 h-4" /> Vybavené
                </button>
              )}
              {n.stav !== 'zamietnute' && (
                <button className="abtn" onClick={() => zmenStav(n, 'zamietnute')}
                        title="Komentár je v poriadku, nahlásenie bolo neopodstatnené">
                  <X className="w-4 h-4" /> Zamietnuť
                </button>
              )}
              <span style={{ flex: 1 }} />
              <button className="abtn abtn-ghost nahl-zahodit" onClick={() => setMazem(n)}
                      title="Zmaže len záznam o nahlásení, komentár ostane">
                Zahodiť záznam
              </button>
            </div>
          </div>
          );
        })}
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
