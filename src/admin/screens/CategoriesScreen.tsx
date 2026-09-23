'use client';

/**
 * Kategórie.
 *
 * Predtým tu bol iba zástupný text. Kategórie sa dali meniť len v Strapi
 * paneli, hoci určujú hlavné menu webu.
 *
 * Zoznam vľavo, formulár vpravo. Poradie sa mení ťahaním za úchyt a ukladá sa
 * hneď (pole `order` v schéme). Kategóriu s článkami sa vymazať nedá — články
 * by ostali bez zaradenia.
 */

import { useEffect, useRef, useState } from 'react';
import { GripVertical, Plus, ChevronRight, Loader2, Trash2 } from 'lucide-react';
import { useAuth } from '../AuthContext';
import {
  listCategories, createCategory, updateCategory, deleteCategory, saveCategoryOrder, toSlug,
  type Category,
} from '../api/taxonomy';

export function CategoriesScreen() {
  const { token } = useAuth();
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<Category>>({});
  const [dirty, setDirty] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [askDelete, setAskDelete] = useState(false);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    try { setCats(await listCategories(token)); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [token]);

  const pick = (c: Category) => {
    setSelected(c.documentId);
    setDraft({ ...c });
    setDirty(false);
    setSlugTouched(true);
    setMsg(null);
  };

  const addNew = () => {
    setSelected('nova');
    setDraft({ name: '', slug: '', description: '', order: cats.length });
    setDirty(true);
    setSlugTouched(false);
    setMsg(null);
  };

  const save = async () => {
    if (!token || !draft.name?.trim()) return;
    setBusy(true); setMsg(null);
    try {
      if (selected === 'nova') await createCategory(token, { ...draft, slug: draft.slug || toSlug(draft.name) });
      else await updateCategory(token, selected!, draft);
      await load();
      setDirty(false);
      setMsg({ tone: 'ok', text: 'Uložené.' });
    } catch (e: any) {
      setMsg({ tone: 'err', text: e?.message || 'Uloženie zlyhalo.' });
    } finally { setBusy(false); }
  };

  const remove = async () => {
    if (!token || !selected || selected === 'nova') return;
    setBusy(true);
    try {
      await deleteCategory(token, selected);
      setSelected(null); setDraft({}); setAskDelete(false);
      await load();
      setMsg({ tone: 'ok', text: 'Kategória vymazaná.' });
    } catch (e: any) {
      setMsg({ tone: 'err', text: e?.message || 'Mazanie zlyhalo.' });
    } finally { setBusy(false); }
  };

  // ── Presun poradia ─────────────────────────────────────────────────────────
  const dragState = useRef<{ from: number; over: number } | null>(null);
  const [over, setOver] = useState<number | null>(null);

  const startDrag = (index: number) => (e: React.PointerEvent) => {
    e.preventDefault(); e.stopPropagation();
    const list = (e.currentTarget as HTMLElement).closest('[data-cat-list]') as HTMLElement | null;
    if (!list) return;
    dragState.current = { from: index, over: index };
    const move = (ev: PointerEvent) => {
      const rows = [...list.querySelectorAll('[data-cat-row]')] as HTMLElement[];
      let idx = rows.length;
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i].getBoundingClientRect();
        if (ev.clientY < r.top + r.height / 2) { idx = i; break; }
      }
      if (dragState.current) dragState.current.over = idx;
      setOver(idx);
    };
    const up = async () => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
      const st = dragState.current;
      dragState.current = null;
      setOver(null);
      if (!st) return;
      let to = st.over;
      if (to > st.from) to -= 1;
      if (to === st.from || to < 0) return;
      const next = [...cats];
      const [m] = next.splice(st.from, 1);
      next.splice(to, 0, m);
      setCats(next);
      if (token) {
        const n = await saveCategoryOrder(token, next);
        setMsg({ tone: 'ok', text: `Poradie uložené (${n} ${n === 1 ? 'zmena' : 'zmeny'}).` });
        load();
      }
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
  };

  const current = cats.find((c) => c.documentId === selected);
  const canDelete = selected && selected !== 'nova' && (current?.posts ?? 0) === 0;

  return (
    <div className="ad-page">
      <div className="ad-page-head">
        <div style={{ flex: 1 }}>
          <h1 className="ad-page-title">Kategórie</h1>
          <div className="ad-page-sub">
            {loading ? 'Načítavam…' : `${cats.length} kategórií · poradie zodpovedá menu na webe`}
          </div>
        </div>
        <button className="abtn abtn-primary" onClick={addNew}>
          <Plus className="w-4 h-4" /> Nová kategória
        </button>
      </div>

      {msg && (
        <div className="acard" role="status" style={{
          padding: '10px 14px', fontSize: 13.5,
          background: msg.tone === 'ok' ? 'var(--ad-pub-bg)' : 'var(--hr-error-bg)',
          borderColor: msg.tone === 'ok' ? 'var(--ad-pub-br)' : 'var(--hr-error-line)',
          color: msg.tone === 'ok' ? 'var(--ad-pub-fg)' : 'var(--ad-danger)',
        }}>{msg.text}</div>
      )}

      <div className="ad-split">
        <div className="acard" data-cat-list>
          {loading && <div className="ad-empty-row"><Loader2 className="w-4 h-4 animate-spin" /> Načítavam…</div>}
          {!loading && cats.map((c, i) => (
            <div
              key={c.documentId}
              data-cat-row
              className={`ad-list-row ad-cat-row${selected === c.documentId ? ' is-selected' : ''}${over === i ? ' is-over' : ''}`}
              onClick={() => pick(c)}
            >
              <button className="ad-row-grip" title="Potiahnutím zmeníte poradie"
                      aria-label={`Presunúť ${c.name}`} onPointerDown={startDrag(i)}>
                <GripVertical className="w-4 h-4" />
              </button>
              <div style={{ minWidth: 0 }}>
                <div className="ad-cat-name">{c.name}</div>
                <div className="ad-cat-slug">/{c.slug}</div>
              </div>
              <div className="ad-cat-count">{c.posts ?? '—'}</div>
              <ChevronRight className="w-4 h-4" style={{ color: 'var(--ad-muted)' }} />
            </div>
          ))}
        </div>

        <div className="acard ad-form">
          {!selected ? (
            <div className="ad-empty-row">Vyberte kategóriu vľavo, alebo pridajte novú.</div>
          ) : (
            <>
              <div className="ad-field">
                <label htmlFor="cat-name">Názov</label>
                <input
                  id="cat-name" className="afld" value={draft.name ?? ''}
                  onChange={(e) => {
                    const name = e.target.value;
                    setDraft((d) => ({ ...d, name, slug: slugTouched ? d.slug : toSlug(name) }));
                    setDirty(true);
                  }}
                />
              </div>

              <div className="ad-field">
                <label htmlFor="cat-slug">Adresa</label>
                <div className="ad-prefixed">
                  <span>hradiska.sk/kategoria/</span>
                  <input
                    id="cat-slug" value={draft.slug ?? ''}
                    onChange={(e) => { setDraft((d) => ({ ...d, slug: e.target.value })); setSlugTouched(true); setDirty(true); }}
                  />
                </div>
              </div>

              <div className="ad-field">
                <label htmlFor="cat-desc">Popis <small>— úvod na stránke kategórie</small></label>
                <textarea
                  id="cat-desc" className="afld" rows={3} value={draft.description ?? ''}
                  onChange={(e) => { setDraft((d) => ({ ...d, description: e.target.value })); setDirty(true); }}
                />
              </div>

              {current && (
                <div className="ad-note">
                  {current.posts === 0
                    ? 'Kategória zatiaľ nemá žiadny článok.'
                    : `Obsahuje ${current.posts} ${current.posts === 1 ? 'článok' : (current.posts ?? 0) < 5 ? 'články' : 'článkov'}.`}
                </div>
              )}

              <div className="ad-form-foot">
                <button
                  className="ad-link-danger"
                  disabled={!canDelete}
                  title={canDelete ? 'Vymazať kategóriu' : `Najprv presuňte ${current?.posts ?? 0} článkov inam.`}
                  onClick={() => setAskDelete(true)}
                >
                  <Trash2 className="w-4 h-4" /> Vymazať kategóriu
                </button>
                <button className="abtn abtn-primary" onClick={save} disabled={!dirty || busy || !draft.name?.trim()}>
                  {busy && <Loader2 className="w-4 h-4 animate-spin" />} Uložiť
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {askDelete && (
        <div className="ad-modal-wrap" onClick={() => setAskDelete(false)}>
          <div className="acard ad-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Vymazať kategóriu?</h2>
            <p>Kategória „{current?.name}" sa odstráni. Nedá sa to vrátiť.</p>
            <div>
              <button className="abtn" onClick={() => setAskDelete(false)}>Nechať</button>
              <button className="abtn abtn-danger" onClick={remove} disabled={busy}>Vymazať</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
