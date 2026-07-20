'use client';

import { useEffect, useState } from 'react';
import {
  ArrowLeft, Eye, GripVertical, Copy, Trash2, ChevronDown, Plus, X,
  Bold, Italic, Link2, List, ListOrdered, ImageOff, Loader2,
} from 'lucide-react';
import {
  BLOCK_TYPES, IMAGE_POSITIONS, IMAGE_WIDTHS, ASPECT_RATIOS,
  KEY_FACT_ICONS, TIMELINE_TYPES, TIMELINE_TYPE_LABELS,
} from '../data';
import { useAuth } from '../AuthContext';
import { getPost, listCategories, isPublished } from '../api/posts';
import {
  createPost, updatePost, isSlugFree, verifyBlockCount, type EditorState,
} from '../api/savePost';
import { LayoutPreview } from '../components/LayoutPreview';
import { Panel } from '../components/Panel';
import { MediaPicker } from '../components/MediaPicker';
import { RichTextEditor } from '../richtext/RichTextEditor';
import { TagPicker } from '../components/TagPicker';
import { LocationMap } from '../components/LocationMap';
import { type Tag } from '../api/tags';
import { fileUrl, type MediaFile } from '../api/media';

interface Block {
  uid: string;
  type: string;
  /** id komponentu v Strapi — pri ukladaní ho treba zachovať, inak sa blok
   *  zmaže a vytvorí nanovo (stratí sa poradie aj väzby). */
  cmpId?: number;
  collapsed?: boolean;
  data: any;
}

/** Strapi blok → tvar, s ktorým pracuje formulár. */
function fromStrapiBlock(b: any): any {
  switch (b.__component) {
    case 'content.rich-text':
      return { body: b.body ?? [] };
    case 'content.image-block':
      return {
        image: b.image ?? null, alt: b.alt ?? '', caption: b.caption ?? '',
        position: b.position ?? 'center', width: b.width ?? '50',
        aspectRatio: b.aspectRatio ?? 'auto', objectPosition: b.objectPosition ?? 'center center',
        pairWithNext: !!b.pairWithNext, showCaption: b.showCaption !== false,
        rounded: b.rounded !== false, shadow: b.shadow !== false,
      };
    case 'content.quote-block':
    case 'content.poem':
      return { text: b.text ?? '', title: b.title ?? '', author: b.author ?? '', source: b.source ?? '' };
    case 'content.embed':
      return { provider: b.provider ?? 'youtube', url: b.url ?? '', embedId: b.embedId ?? '', caption: b.caption ?? '' };
    case 'content.sources':
      return { title: b.title ?? 'Zdroje a literatúra', intro: b.intro ?? '', items: b.items ?? [] };
    case 'content.image-gallery':
      return { images: b.images ?? [], columns: b.columns ?? '3' };
    default:
      return { ...b };
  }
}

const newUid = () => Math.random().toString(36).slice(2, 9);

export function EditorScreen({
  articleId, onBack, onSaved,
}: { articleId: string | null; onBack: () => void; onSaved?: (id: string) => void }) {
  const { token } = useAuth();

  const [loading, setLoading] = useState(!!articleId);
  const [loadError, setLoadError] = useState('');
  const [published, setPublished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);

  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [slug, setSlug] = useState('');
  const [author, setAuthor] = useState('Orgon');
  const [readingTime, setReadingTime] = useState(6);
  const [pubDate, setPubDate] = useState('');
  const [featured, setFeatured] = useState(false);
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<Tag[]>([]);
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDesc, setMetaDesc] = useState('');
  const [dirty, setDirty] = useState(false);
  const [cats, setCats] = useState<{ slug: string; name: string }[]>([]);

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [keyFacts, setKeyFacts] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loc, setLoc] = useState({ name: '', latitude: '', longitude: '', region: '', country: 'Slovensko' });
  const [cover, setCover] = useState<any | null>(null);
  // Kam sa má priradiť vybraný obrázok: cover alebo konkrétny blok.
  const [picking, setPicking] = useState<{ target: 'cover' } | { target: 'block'; uid: string } | null>(null);

  useEffect(() => {
    if (!token) return;
    listCategories(token).then(setCats).catch(() => { /* výber kategórie ostane prázdny */ });
  }, [token]);

  // Varovanie pri zatvorení karty s rozpísanými zmenami.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  // Načítanie existujúceho článku cez deep populate — bez neho by sa časť
  // blokov a sidebaru nenačítala a pri uložení by sa prepísala prázdnymi.
  useEffect(() => {
    if (!token || !articleId) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true); setLoadError('');
    getPost(token, articleId)
      .then(d => {
        if (cancelled || !d) return;
        setTitle(d.title ?? '');
        setExcerpt(d.excerpt ?? '');
        setSlug(d.slug ?? '');
        setAuthor(d.authorName ?? '');
        setReadingTime(d.readingTime ?? 1);
        setPubDate((d.originalPublishedDate ?? '').slice(0, 10));
        setFeatured(!!d.featured);
        setCategory(d.category?.slug ?? '');
        setTags(d.tags ?? []);
        setMetaTitle(d.metaTitle ?? '');
        setMetaDesc(d.metaDescription ?? '');
        setCover(d.coverImage ?? null);
        setLoc({
          name: d.location?.name ?? '',
          latitude: d.location?.latitude != null ? String(d.location.latitude) : '',
          longitude: d.location?.longitude != null ? String(d.location.longitude) : '',
          region: d.location?.region ?? '',
          country: d.location?.country ?? 'Slovensko',
        });
        setKeyFacts((d.keyFacts ?? []).map((f: any) => ({ uid: newUid(), cmpId: f.id, label: f.label ?? '', value: f.value ?? '', icon: f.icon ?? 'star' })));
        setTimeline((d.timeline ?? []).map((t: any) => ({ uid: newUid(), cmpId: t.id, year: t.year ?? '', title: t.title ?? '', description: t.description ?? '', type: t.type ?? 'event' })));
        // `_original` drží presný JSON zo Strapi. Ak sa bloku nikto nedotkne,
        // uloží sa späť bezo zmeny a prevod cez TipTap sa naň vôbec nespustí.
        setBlocks((d.blocks ?? []).map((b: any) => ({
          uid: newUid(), type: b.__component, cmpId: b.id,
          data: fromStrapiBlock(b),
          original: b,
        })));
        setDirty(false);
      })
      .catch(e => { if (!cancelled) setLoadError(e?.message || 'Článok sa nepodarilo načítať.'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    // Stav sa zisťuje samostatným dotazom — v draft odpovedi je `publishedAt`
    // vždy null, aj keď dokument publikovaný je.
    isPublished(token, articleId).then(p => { if (!cancelled) setPublished(p); });

    return () => { cancelled = true; };
  }, [token, articleId]);

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: 'var(--ad-secondary)' }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ display: 'inline' }} /> Načítavam článok…
      </div>
    );
  }
  if (loadError) {
    return (
      <div className="acard" style={{ padding: 24 }}>
        <div style={{ color: 'var(--ad-danger)', marginBottom: 14 }}>{loadError}</div>
        <button className="abtn" onClick={onBack}>Späť na zoznam</button>
      </div>
    );
  }

  const applyPick = (files: MediaFile[]) => {
    const f = files[0];
    if (!f || !picking) return;
    if (picking.target === 'cover') setCover(f);
    else setBlocks(bs => bs.map(b => (b.uid === picking.uid ? { ...b, data: { ...b.data, image: f } } : b)));
    setDirty(true);
  };

  const collectState = (): EditorState => ({
    title, slug, excerpt, authorName: author, readingTime,
    originalPublishedDate: pubDate, featured,
    metaTitle, metaDescription: metaDesc,
    categoryDocumentId: cats.find(c => c.slug === category)?.documentId ?? null,
    tagDocumentIds: tags.map(t => t.documentId),
    location: loc,
    keyFacts, timeline,
    // `original` sa posiela len pri rich-texte, ktorého sa používateľ nedotkol —
    // vtedy sa uloží presne to, čo prišlo zo Strapi, a prevod sa preskočí.
    blocks: blocks.map(b => ({
      type: b.type,
      data: b.data,
      original: b.type === 'content.rich-text' && !b.data?._edited ? (b as any).original : undefined,
    })),
    coverImage: cover,
  });

  const validate = (): string | null => {
    if (!title.trim()) return 'Článok musí mať názov.';
    if (!slug.trim()) return 'Článok musí mať slug.';
    const badImg = blocks.find(b => b.type === 'content.image-block' && !b.data.alt?.trim());
    if (badImg) return 'Každý obrázok musí mať vyplnený alternatívny text.';
    const badQuote = blocks.find(b => (b.type === 'content.quote-block' || b.type === 'content.poem') && !b.data.text?.trim());
    if (badQuote) return 'Citát ani báseň nemôžu byť prázdne.';
    const badEmbed = blocks.find(b => b.type === 'content.embed' && !b.data.url?.trim());
    if (badEmbed) return 'Vložené video potrebuje URL.';
    return null;
  };

  const save = async (publish: boolean) => {
    if (!token) return;
    const problem = validate();
    if (problem) { setSaveMsg({ tone: 'err', text: problem }); return; }

    setSaving(true);
    setSaveMsg(null);
    try {
      if (!(await isSlugFree(token, slug.trim(), articleId ?? undefined))) {
        setSaveMsg({ tone: 'err', text: 'Slug už používa iný článok. Zvoľte iný.' });
        setSaving(false);
        return;
      }

      const state = collectState();
      let docId = articleId;

      if (docId) {
        await updatePost(token, docId, state, { publish, includeBlocks: true });
      } else {
        const created = await createPost(token, state);
        docId = created.documentId;
        if (publish) await updatePost(token, docId!, state, { publish: true, includeBlocks: true });
        onSaved?.(docId!);
      }

      // Poistka: bloky sa pri PUT prepisujú celé — overíme, že ich sedí počet.
      const check = await verifyBlockCount(token, docId!, state.blocks.length);
      if (!check.ok) {
        setSaveMsg({ tone: 'err', text: `Pozor: uložilo sa ${check.actual} blokov namiesto ${check.expected}. Skontrolujte článok.` });
      } else {
        setSaveMsg({ tone: 'ok', text: publish ? 'Publikované.' : 'Koncept uložený.' });
        setDirty(false);
        if (publish) setPublished(true);
      }
    } catch (e: any) {
      setSaveMsg({ tone: 'err', text: e?.message || 'Uloženie zlyhalo.' });
    } finally {
      setSaving(false);
    }
  };

  const leave = () => {
    if (dirty && !window.confirm('Máte neuložené zmeny. Naozaj chcete odísť?')) return;
    onBack();
  };

  const touch = () => setDirty(true);
  const patchBlock = (uid: string, patch: any) => {
    setBlocks(bs => bs.map(b => (b.uid === uid ? { ...b, data: { ...b.data, ...patch } } : b)));
    touch();
  };
  const moveBlock = (uid: string, dir: -1 | 1) => {
    setBlocks(bs => {
      const i = bs.findIndex(b => b.uid === uid);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= bs.length) return bs;
      const next = [...bs];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
    touch();
  };

  const addBlock = (type: string) => {
    setBlocks(bs => [...bs, { uid: newUid(), type, data: defaultsFor(type) }]);
    touch();
  };

  return (
    <>
      {/* ── Horná lišta ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <button className="abtn abtn-icon" onClick={leave} title="Späť na zoznam">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {title || 'Nový článok'}
          </h1>
          <div style={{ fontSize: 12.5, color: 'var(--ad-muted)', marginTop: 3 }}>
            {dirty ? "Neuložené zmeny" : articleId ? "Bez zmien" : "Nový článok"}
          </div>
        </div>
        <span className={`achip ${published ? "achip-pub" : "achip-draft"}`}>
          {published ? "Publikovaný" : "Koncept"}
        </span>
        <div style={{ flex: 1 }} />
        <a className="abtn" href={`/blog/${slug}`} target="_blank" rel="noreferrer">
          <Eye className="w-4 h-4" /> Náhľad
        </a>
        <button className="abtn" onClick={() => save(false)} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Uložiť koncept
        </button>
        <button className="abtn abtn-primary" onClick={() => save(true)} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Publikovať
        </button>
      </div>

      {saveMsg && (
        <div
          className="acard"
          role="status"
          style={{
            padding: '11px 15px', marginBottom: 16, fontSize: 13.5,
            background: saveMsg.tone === 'ok' ? 'var(--ad-pub-bg)' : '#fbeae8',
            borderColor: saveMsg.tone === 'ok' ? 'var(--ad-pub-br)' : '#e8c4bf',
            color: saveMsg.tone === 'ok' ? 'var(--ad-pub-fg)' : 'var(--ad-danger)',
          }}
        >
          {saveMsg.text}
        </div>
      )}

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }} className="ad-editor-cols">
        {/* ═══ Ľavý stĺpec — telo ═══ */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="acard" style={{ padding: 18, marginBottom: 16 }}>
            <input
              className="afld"
              value={title}
              onChange={e => { setTitle(e.target.value); touch(); }}
              placeholder="Názov článku"
              style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 700, border: 'none', padding: '4px 0', marginBottom: 10 }}
            />
            <textarea
              className="afld"
              value={excerpt}
              onChange={e => { setExcerpt(e.target.value.slice(0, 500)); touch(); }}
              placeholder="Krátka ukážka, ktorá sa zobrazí na kartách…"
              style={{ minHeight: 78, resize: 'vertical' }}
            />
            <div style={{ textAlign: 'right', fontSize: 12, color: excerpt.length > 460 ? 'var(--ad-danger)' : 'var(--ad-muted)', marginTop: 5 }}>
              {excerpt.length} / 500
            </div>
          </div>

          {blocks.map(b => (
            <BlockCard
              key={b.uid}
              block={b}
              onPick={() => setPicking({ target: 'block', uid: b.uid })}
              onMoveUp={() => moveBlock(b.uid, -1)}
              onMoveDown={() => moveBlock(b.uid, 1)}
              onPatch={p => patchBlock(b.uid, p)}
              onToggle={() => setBlocks(bs => bs.map(x => (x.uid === b.uid ? { ...x, collapsed: !x.collapsed } : x)))}
              onDelete={() => { setBlocks(bs => bs.filter(x => x.uid !== b.uid)); touch(); }}
              onDuplicate={() => { setBlocks(bs => [...bs, { ...b, uid: newUid() }]); touch(); }}
            />
          ))}

          {/* Paleta blokov */}
          <div
            style={{
              border: '2px dashed var(--ad-field-border)', borderRadius: 12,
              padding: 16, background: 'rgba(253,251,244,.5)',
            }}
          >
            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ad-secondary)', marginBottom: 10 }}>
              <Plus className="w-3.5 h-3.5" style={{ display: 'inline', marginRight: 5 }} />
              Pridať blok
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {BLOCK_TYPES.map(t => (
                <button key={t.id} className="abtn" onClick={() => addBlock(t.id)} style={{ fontSize: 13 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: t.accent }} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ Pravý stĺpec — metadáta ═══ */}
        <aside
          className="acard ad-editor-side"
          style={{ width: 330, flexShrink: 0, background: 'var(--ad-surface)', position: 'sticky', top: 76, maxHeight: 'calc(100vh - 96px)', overflowY: 'auto' }}
        >
          <Panel title="Základné údaje" defaultOpen>
            <Field label="Slug">
              <input className="afld" value={slug} onChange={e => { setSlug(e.target.value); touch(); }} placeholder="nazov-clanku" />
              <Hint>Generuje sa z názvu. Musí byť jedinečný.</Hint>
            </Field>
            <Field label="Autor">
              <input className="afld" list="ad-authors" value={author} onChange={e => { setAuthor(e.target.value); touch(); }} />
              <datalist id="ad-authors"><option value="Orgon" /></datalist>
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Čítanie (min)">
                <input className="afld" type="number" min={1} value={readingTime} onChange={e => { setReadingTime(+e.target.value); touch(); }} />
              </Field>
              <Field label="Pôvodný dátum">
                <input className="afld" type="date" value={pubDate} onChange={e => { setPubDate(e.target.value); touch(); }} />
              </Field>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, cursor: 'pointer' }}>
              <input type="checkbox" checked={featured} onChange={e => { setFeatured(e.target.checked); touch(); }} />
              ⭐ Odporúčaný článok
            </label>
          </Panel>

          <Panel title="Cover obrázok" defaultOpen>
            {cover ? (
              <img
                src={fileUrl(cover as MediaFile, 'small')}
                alt=""
                style={{ width: '100%', height: 130, objectFit: 'cover', borderRadius: 9, border: '1px solid var(--ad-line)', marginBottom: 10, display: 'block' }}
              />
            ) : (
              <div
                style={{
                  height: 120, borderRadius: 9, border: '1px dashed var(--ad-field-border)',
                  background: '#f1e8d2', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--ad-muted)', fontSize: 13, marginBottom: 10, gap: 8,
                }}
              >
                <ImageOff className="w-4 h-4" /> Bez obrázka
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="abtn" style={{ flex: 1, justifyContent: 'center' }}
                      onClick={() => setPicking({ target: 'cover' })}>
                {cover ? 'Vymeniť' : 'Vybrať z knižnice'}
              </button>
              {cover && (
                <button className="abtn abtn-danger" onClick={() => { setCover(null); touch(); }}>
                  Odstrániť
                </button>
              )}
            </div>
          </Panel>

          <Panel title="Zaradenie">
            <Field label="Kategória">
              <select className="afld" value={category} onChange={e => { setCategory(e.target.value); touch(); }}>
                <option value="">— vyberte —</option>
                {cats.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Štítky">
              <TagPicker value={tags} onChange={t => { setTags(t); touch(); }} />
            </Field>
          </Panel>

          <Panel title="SEO">
            <Field label="Meta titulok">
              <input className="afld" value={metaTitle} onChange={e => { setMetaTitle(e.target.value.slice(0, 70)); touch(); }} />
              <Counter n={metaTitle.length} max={70} />
            </Field>
            <Field label="Meta popis">
              <textarea className="afld" value={metaDesc} onChange={e => { setMetaDesc(e.target.value.slice(0, 160)); touch(); }} style={{ minHeight: 64, resize: 'vertical' }} />
              <Counter n={metaDesc.length} max={160} />
            </Field>
            <div style={{ background: '#fff', border: '1px solid var(--ad-line)', borderRadius: 9, padding: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--ad-muted)', marginBottom: 6 }}>Náhľad vo vyhľadávaní</div>
              <div style={{ color: '#1a0dab', fontSize: 15, lineHeight: 1.3 }}>{metaTitle || title || 'Názov článku'}</div>
              <div style={{ color: '#006621', fontSize: 12, margin: '2px 0 4px' }}>hradiska.sk/blog/{slug || 'slug'}</div>
              <div style={{ color: '#545454', fontSize: 12.5, lineHeight: 1.45 }}>{metaDesc || excerpt || 'Popis článku…'}</div>
            </div>
          </Panel>

          <Panel title="Lokalita">
            <LocationMap
              lat={loc.latitude} lng={loc.longitude}
              onPick={(la, ln) => { setLoc({ ...loc, latitude: String(la), longitude: String(ln) }); touch(); }}
            />
            <Field label="Názov lokality *">
              <input className="afld" value={loc.name} onChange={e => { setLoc({ ...loc, name: e.target.value }); touch(); }} />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Zem. šírka *">
                <input className="afld" value={loc.latitude} onChange={e => { setLoc({ ...loc, latitude: e.target.value }); touch(); }} placeholder="48.7395" />
              </Field>
              <Field label="Zem. dĺžka *">
                <input className="afld" value={loc.longitude} onChange={e => { setLoc({ ...loc, longitude: e.target.value }); touch(); }} placeholder="18.0431" />
              </Field>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Región"><input className="afld" value={loc.region} onChange={e => { setLoc({ ...loc, region: e.target.value }); touch(); }} /></Field>
              <Field label="Krajina"><input className="afld" value={loc.country} onChange={e => { setLoc({ ...loc, country: e.target.value }); touch(); }} /></Field>
            </div>
          </Panel>

          <Panel title="Kľúčové fakty">
            {keyFacts.map(f => (
              <div key={f.uid} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <GripVertical className="w-3.5 h-3.5 ablock-grip" />
                <select
                  className="afld" value={f.icon} style={{ width: 92, padding: '7px 8px', fontSize: 12 }}
                  onChange={e => { setKeyFacts(ks => ks.map(x => x.uid === f.uid ? { ...x, icon: e.target.value } : x)); touch(); }}
                >
                  {KEY_FACT_ICONS.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
                <input
                  className="afld" value={f.label} placeholder="Popis" style={{ flex: 1, padding: '7px 9px', fontSize: 13 }}
                  onChange={e => { setKeyFacts(ks => ks.map(x => x.uid === f.uid ? { ...x, label: e.target.value } : x)); touch(); }}
                />
                <input
                  className="afld" value={f.value} placeholder="Hodnota" style={{ flex: 1, padding: '7px 9px', fontSize: 13 }}
                  onChange={e => { setKeyFacts(ks => ks.map(x => x.uid === f.uid ? { ...x, value: e.target.value } : x)); touch(); }}
                />
                <button className="abtn abtn-icon abtn-danger" onClick={() => { setKeyFacts(ks => ks.filter(x => x.uid !== f.uid)); touch(); }}>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <button className="abtn" style={{ width: '100%', justifyContent: 'center' }} onClick={() => { setKeyFacts(ks => [...ks, { uid: newUid(), label: '', value: '', icon: 'star' }]); touch(); }}>
              <Plus className="w-3.5 h-3.5" /> Pridať fakt
            </button>
          </Panel>

          <Panel title="Časová os">
            {timeline.map(t => (
              <div key={t.uid} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <GripVertical className="w-3.5 h-3.5 ablock-grip" />
                <input
                  className="afld" value={t.year} placeholder="~906" style={{ width: 68, padding: '7px 8px', fontSize: 13 }}
                  onChange={e => { setTimeline(ts => ts.map(x => x.uid === t.uid ? { ...x, year: e.target.value } : x)); touch(); }}
                />
                <input
                  className="afld" value={t.title} placeholder="Udalosť" style={{ flex: 1, padding: '7px 9px', fontSize: 13 }}
                  onChange={e => { setTimeline(ts => ts.map(x => x.uid === t.uid ? { ...x, title: e.target.value } : x)); touch(); }}
                />
                <select
                  className="afld" value={t.type} style={{ width: 104, padding: '7px 8px', fontSize: 12 }}
                  onChange={e => { setTimeline(ts => ts.map(x => x.uid === t.uid ? { ...x, type: e.target.value } : x)); touch(); }}
                >
                  {TIMELINE_TYPES.map(v => <option key={v} value={v}>{TIMELINE_TYPE_LABELS[v]}</option>)}
                </select>
                <button className="abtn abtn-icon abtn-danger" onClick={() => { setTimeline(ts => ts.filter(x => x.uid !== t.uid)); touch(); }}>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <button className="abtn" style={{ width: '100%', justifyContent: 'center' }} onClick={() => { setTimeline(ts => [...ts, { uid: newUid(), year: '', title: '', description: '', type: 'event' }]); touch(); }}>
              <Plus className="w-3.5 h-3.5" /> Pridať udalosť
            </button>
          </Panel>
        </aside>
      </div>

      {picking && (
        <MediaPicker
          onPick={applyPick}
          onClose={() => setPicking(null)}
        />
      )}
    </>
  );
}

// ── Blok ─────────────────────────────────────────────────────────────────────
function BlockCard({ block, onPatch, onToggle, onDelete, onDuplicate, onPick, onMoveUp, onMoveDown }: any) {
  const meta = BLOCK_TYPES.find(t => t.id === block.type);
  return (
    <div className="ablock" style={{ borderLeftColor: meta?.accent }}>
      <div className="ablock-head">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <button className="abtn abtn-icon" title="Posunúť vyššie" onClick={onMoveUp}
                  style={{ width: 20, height: 15, padding: 0, fontSize: 9 }}>▲</button>
          <button className="abtn abtn-icon" title="Posunúť nižšie" onClick={onMoveDown}
                  style={{ width: 20, height: 15, padding: 0, fontSize: 9 }}>▼</button>
        </div>
        <span className="ablock-type">{meta?.label}</span>
        {block.collapsed && (
          <span style={{ fontSize: 12.5, color: 'var(--ad-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 320 }}>
            {summarize(block)}
          </span>
        )}
        <div style={{ flex: 1 }} />
        <button className="abtn abtn-icon" title="Duplikovať" onClick={onDuplicate}><Copy className="w-3.5 h-3.5" /></button>
        <button className="abtn abtn-icon" title="Zbaliť" onClick={onToggle}>
          <ChevronDown className="w-3.5 h-3.5" style={{ transform: block.collapsed ? 'rotate(-90deg)' : 'none', transition: 'transform .18s' }} />
        </button>
        <button className="abtn abtn-icon abtn-danger" title="Zmazať" onClick={onDelete}><Trash2 className="w-3.5 h-3.5" /></button>
      </div>

      {!block.collapsed && (
        <div style={{ padding: 14 }}>
          {block.type === 'content.rich-text' && <RichTextBlock data={block.data} onPatch={onPatch} />}
          {block.type === 'content.image-block' && <ImageBlock data={block.data} onPatch={onPatch} onPick={onPick} />}
          {block.type === 'content.quote-block' && <QuoteBlockFields data={block.data} onPatch={onPatch} />}
          {!['content.rich-text', 'content.image-block', 'content.quote-block'].includes(block.type) && (
            <div style={{ fontSize: 13, color: 'var(--ad-secondary)' }}>
              Polia pre „{meta?.label}" doplníme podľa schémy pri napojení.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RichTextBlock({ data, onPatch }: any) {
  return <RichTextEditor body={data.body} onChange={next => onPatch({ body: next, _edited: true })} />;
}

function ImageBlock({ data, onPatch, onPick }: any) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 190px', gap: 16 }}>
      <div>
        <button
          onClick={onPick}
          style={{
            width: '100%', height: 104, borderRadius: 9, overflow: 'hidden', padding: 0, cursor: 'pointer',
            border: data.image ? '1px solid var(--ad-line)' : '1px dashed var(--ad-field-border)',
            background: '#f1e8d2', display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 8, color: 'var(--ad-muted)', fontSize: 13, marginBottom: 10,
          }}
          title="Kliknutím vyberiete obrázok"
        >
          {data.image
            ? <img src={fileUrl(data.image as MediaFile, 'small')} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <><ImageOff className="w-4 h-4" /> Vybrať obrázok</>}
        </button>
        <Field label={<>Alternatívny text <span style={{ color: 'var(--ad-danger)' }}>*</span></>}>
          <input className="afld" value={data.alt} onChange={e => onPatch({ alt: e.target.value })} placeholder="Čo je na obrázku" aria-invalid={!data.alt} />
          {!data.alt && <Hint tone="danger">Povinné — bez toho článok neuložíš.</Hint>}
        </Field>
        <Field label="Popis pod obrázkom">
          <input className="afld" value={data.caption} onChange={e => onPatch({ caption: e.target.value })} />
        </Field>

        <details style={{ marginTop: 6 }}>
          <summary style={{ cursor: 'pointer', fontSize: 13, color: 'var(--ad-amber)', fontWeight: 500 }}>
            Rozšírené nastavenia
          </summary>
          <div style={{ paddingTop: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <Field label="Pozícia">
                <select className="afld" value={data.position} onChange={e => onPatch({ position: e.target.value })}>
                  {IMAGE_POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </Field>
              <Field label="Šírka (%)">
                <select className="afld" value={data.width} onChange={e => onPatch({ width: e.target.value })}>
                  {IMAGE_WIDTHS.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </Field>
              <Field label="Pomer strán">
                <select className="afld" value={data.aspectRatio} onChange={e => onPatch({ aspectRatio: e.target.value })}>
                  {ASPECT_RATIOS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </Field>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 6 }}>
              {[
                ['pairWithNext', 'Spárovať s ďalším'],
                ['showCaption', 'Zobraziť popis'],
                ['rounded', 'Zaoblenie'],
                ['shadow', 'Tieň'],
              ].map(([k, lbl]) => (
                <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" checked={!!data[k as string]} onChange={e => onPatch({ [k as string]: e.target.checked })} />
                  {lbl}
                </label>
              ))}
            </div>
          </div>
        </details>
      </div>

      <LayoutPreview position={data.position} width={data.width} pairWithNext={data.pairWithNext} />
    </div>
  );
}

function QuoteBlockFields({ data, onPatch }: any) {
  return (
    <>
      <Field label={<>Text citátu <span style={{ color: 'var(--ad-danger)' }}>*</span></>}>
        <textarea
          className="afld" value={data.text} onChange={e => onPatch({ text: e.target.value })}
          style={{ minHeight: 84, resize: 'vertical', fontFamily: 'var(--font-serif)', fontSize: 16 }}
          aria-invalid={!data.text}
        />
        <Hint>Používa sa na dobové pramene — kroniky a listiny, nie modernú literatúru.</Hint>
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label="Autor"><input className="afld" value={data.author} onChange={e => onPatch({ author: e.target.value })} /></Field>
        <Field label="Zdroj"><input className="afld" value={data.source} onChange={e => onPatch({ source: e.target.value })} /></Field>
      </div>
    </>
  );
}

// ── Pomocné ──────────────────────────────────────────────────────────────────
function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: 'var(--ad-panel-head)', marginBottom: 5 }}>
        {label}
      </label>
      {children}
    </div>
  );
}
function Hint({ children, tone }: { children: React.ReactNode; tone?: 'danger' }) {
  return (
    <div style={{ fontSize: 11.5, color: tone === 'danger' ? 'var(--ad-danger)' : 'var(--ad-muted)', marginTop: 4, lineHeight: 1.45 }}>
      {children}
    </div>
  );
}
function Counter({ n, max }: { n: number; max: number }) {
  return (
    <div style={{ textAlign: 'right', fontSize: 11.5, color: n > max * 0.92 ? 'var(--ad-danger)' : 'var(--ad-muted)', marginTop: 4 }}>
      {n} / {max}
    </div>
  );
}

function summarize(b: Block) {
  if (b.type === 'content.rich-text') return String(b.data.body || '').slice(0, 60) + '…';
  if (b.type === 'content.quote-block') return `„${String(b.data.text || '').slice(0, 40)}…" — ${b.data.author || '?'}`;
  if (b.type === 'content.image-block') return b.data.alt || 'bez alt textu';
  return '';
}

function defaultsFor(type: string): any {
  switch (type) {
    case 'content.rich-text': return { body: '' };
    case 'content.image-block': return { alt: '', caption: '', position: 'center', width: '50', aspectRatio: 'auto', pairWithNext: false, showCaption: true, rounded: true, shadow: true };
    case 'content.quote-block': return { text: '', author: '', source: '' };
    case 'content.sources': return { title: 'Zdroje a literatúra', intro: '', items: [] };
    case 'content.embed': return { provider: 'youtube', url: '', embedId: '', caption: '' };
    case 'content.poem': return { text: '', title: '', author: '', source: '' };
    case 'content.image-gallery': return { images: [], columns: '3' };
    default: return {};
  }
}
