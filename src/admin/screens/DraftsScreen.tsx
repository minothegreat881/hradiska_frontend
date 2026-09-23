'use client';

/**
 * KONCEPTY — všetko rozpísané na jednom mieste.
 *
 * Dve rôzne veci, ktoré si redaktor ľahko pomýli, a preto sú tu vedľa seba
 * a pomenované:
 *
 *   1. NEULOŽENÉ V PREHLIADAČI — práca, ktorá sa ešte nedostala na server.
 *      Žije len v tomto počítači (a len v tomto prehliadači), takže ju treba
 *      dokončiť a uložiť; inde ju nikto neuvidí. Presne toto sa predtým
 *      strácalo, lebo o tom nebolo nikde ani slovo.
 *   2. NEPUBLIKOVANÉ ČLÁNKY — uložené koncepty v Strapi. Sú v bezpečí, len
 *      ich ešte nevidí verejnosť.
 */

import { useEffect, useState } from 'react';
import { FileEdit, Loader2, PenLine, Eye, Trash2 } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { listPosts, type PostListItem } from '../api/posts';
import { listDrafts, clearDraft, whenOf, type DraftInfo } from '../editor/state/autosave';

export function DraftsScreen({ onEdit }: { onEdit: (id: string | null) => void }) {
  const { token } = useAuth();
  const [local, setLocal] = useState<DraftInfo[]>([]);
  const [posts, setPosts] = useState<PostListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { setLocal(listDrafts()); }, []);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    listPosts({ token, state: 'draft', pageSize: 100, sort: 'updatedAt:desc' })
      .then((r) => setPosts(r.items || []))
      .catch((e) => setError(e?.message || 'Koncepty sa nepodarilo načítať.'))
      .finally(() => setLoading(false));
  }, [token]);

  const zahod = (d: DraftInfo) => {
    if (!window.confirm('Zahodiť rozpracovanú prácu „' + d.title + '"? Nedá sa to vrátiť.')) return;
    clearDraft(d.articleId);
    setLocal(listDrafts());
  };

  return (
    <div className="ad-page">
      <div className="ad-page-head">
        <div style={{ flex: 1 }}>
          <h1 className="ad-page-title">Koncepty</h1>
          <div className="ad-page-sub">
            Všetko rozpísané — neuložená práca v tomto prehliadači aj uložené, zatiaľ nepublikované články.
          </div>
        </div>
      </div>

      {/* 1. Neuložené v prehliadači */}
      <div className="acard ad-drafts" style={{ marginBottom: 18 }}>
        <div className="ad-drafts-head">
          <PenLine className="w-4 h-4" />
          <b>Neuložené v prehliadači</b>
          <span className="ad-badge">{local.length}</span>
          <i>na server sa zatiaľ nedostali — ostávajú len v tomto počítači</i>
        </div>
        {local.length === 0 && (
          <div className="ad-empty-row">Nič rozpísané. Všetko, čo ste písali, je uložené.</div>
        )}
        {local.map((d) => (
          <div key={d.articleId || 'novy'} className="ad-drafts-row">
            <span className="ad-drafts-title">{d.title}</span>
            <span className="ad-drafts-when">
              {d.articleId ? 'rozpísaná zmena článku' : 'nový článok'} · naposledy {whenOf(d.savedAt)}
            </span>
            <button className="abtn abtn-primary" onClick={() => onEdit(d.articleId)}>Pokračovať</button>
            <button className="abtn" onClick={() => zahod(d)} title="Zahodiť rozpracovanú prácu">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* 2. Nepublikované články zo Strapi */}
      <div className="acard ad-drafts">
        <div className="ad-drafts-head">
          <FileEdit className="w-4 h-4" />
          <b>Nepublikované články</b>
          <span className="ad-badge">{posts.length}</span>
          <i>uložené na serveri, verejnosť ich zatiaľ nevidí</i>
        </div>
        {loading && <div className="ad-empty-row"><Loader2 className="w-4 h-4 animate-spin" /> Načítavam…</div>}
        {error && <div className="ad-empty-row" style={{ color: 'var(--ad-danger)' }}>{error}</div>}
        {!loading && !error && posts.length === 0 && (
          <div className="ad-empty-row">Žiadny nepublikovaný článok — všetko je vonku.</div>
        )}
        {posts.map((p) => (
          <div key={p.documentId} className="ad-drafts-row">
            <span className="ad-drafts-title">{p.title || 'Bez názvu'}</span>
            <span className="ad-drafts-when">{p.categoryName || 'bez kategórie'}</span>
            <button className="abtn abtn-primary" onClick={() => onEdit(p.documentId)}>Upraviť</button>
            <a
              className="abtn"
              href={`/blog/${p.slug}?preview=draft`}
              target="_blank"
              rel="noreferrer"
              title="Náhľad konceptu na webe"
            >
              <Eye className="w-3.5 h-3.5" />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
