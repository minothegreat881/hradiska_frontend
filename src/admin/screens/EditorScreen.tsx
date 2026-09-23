'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft, Eye, GripVertical, Plus, X, ImageOff, Loader2,
  Monitor, Smartphone, Undo2, Redo2,
} from 'lucide-react';
import {
  BLOCK_TYPES, KEY_FACT_ICONS, TIMELINE_TYPES, TIMELINE_TYPE_LABELS,
} from '../data';
import { useAuth } from '../AuthContext';
import { getPost, listCategories, isPublished } from '../api/posts';
import {
  createPost, updatePost, isSlugFree, verifyBlockCount, type EditorState,
} from '../api/savePost';
import { Panel } from '../components/Panel';
import { MediaPicker } from '../components/MediaPicker';
import { RichTextEditor } from '../richtext/RichTextEditor';
import { TagPicker } from '../components/TagPicker';
import { LocationMap } from '../components/LocationMap';
import { type Tag } from '../api/tags';
import { fileUrl, type MediaFile } from '../api/media';
import { EditorCanvas, type CanvasDevice, type CanvasZoom } from '../editor/EditorCanvas';
import { useHistory } from '../editor/state/useHistory';
import { useRowDrag } from '../editor/useRowDrag';
import { saveDraft, readDraft, clearDraft, timeOf } from '../editor/state/autosave';

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
  const [saveMsg, setSaveMsg] = useState<{ tone: 'ok' | 'err'; text: string; uid?: string } | null>(null);

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

  /* Bloky idú cez históriu — Ctrl+Z vráti ktorýkoľvek z posledných 100 krokov.
     `setBlocks` zapisuje do histórie, `blocksHistory.reset` nie (načítanie). */
  const blocksHistory = useHistory<Block[]>([]);
  const blocks = blocksHistory.state;
  const setBlocks = blocksHistory.set;
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  /** Blok čakajúci na potvrdenie zmazania (dialóg je v admine, nie v plátne). */
  const [askDelete, setAskDelete] = useState<string | null>(null);
  const [keyFacts, setKeyFacts] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loc, setLoc] = useState({ name: '', latitude: '', longitude: '', region: '', country: 'Slovensko' });

  /* Úchyt pri faktoch a časovej osi bol doteraz iba obrázok — teraz naozaj ťahá. */
  const factsDrag = useRowDrag(keyFacts, next => { setKeyFacts(next); setDirty(true); });
  const timelineDrag = useRowDrag(timeline, next => { setTimeline(next); setDirty(true); });
  const [cover, setCover] = useState<any | null>(null);
  // Kam sa má priradiť vybraný obrázok: cover alebo konkrétny blok.
  const [picking, setPicking] = useState<
    { target: 'cover' } | { target: 'block'; uid: string; multiple?: boolean } | null
  >(null);

  const [device, setDevice] = useState<CanvasDevice>('desktop');
  const [zoom, setZoom] = useState<CanvasZoom>('fit');
  /** Čas posledného úspešného uloženia do Strapi — pre stavovú lištu. */
  const [savedAt, setSavedAt] = useState<number | null>(null);
  /** Nájdená záloha rozpísaného článku (ponuka obnovy po páde prehliadača). */
  const [recovery, setRecovery] = useState<{ savedAt: number; data: any } | null>(null);

  useEffect(() => {
    if (!token) return;
    listCategories(token).then(setCats).catch(() => { /* výber kategórie ostane prázdny */ });
  }, [token]);

  /* ZÁLOHA ROZPÍSANÉHO ČLÁNKU do prehliadača každých 5 sekúnd.
     Nie je to ukladanie do Strapi — na webe sa bez tlačidla „Uložiť koncept"
     nezmení nič. Slúži to na prípad, keď spadne prehliadač alebo sa omylom
     zavrie karta. Po úspešnom uložení sa záloha maže. */
  const snapshotRef = useRef<() => any>(() => null);
  useEffect(() => {
    if (!dirty) return;
    const t = setInterval(() => saveDraft(articleId, snapshotRef.current()), 5000);
    return () => clearInterval(t);
  }, [dirty, articleId]);

  /* Klávesové skratky. Poslucháč musí byť nad skoršími návratmi komponentu
     (načítavanie, chyba), inak by sa React háčiky volali podmienečne. */
  const keyHandlerRef = useRef<(e: KeyboardEvent) => void>(() => {});
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => keyHandlerRef.current(e);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

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
        blocksHistory.reset((d.blocks ?? []).map((b: any) => ({
          uid: newUid(), type: b.__component, cmpId: b.id,
          data: fromStrapiBlock(b),
          original: b,
        })));
        setDirty(false);
        // Ostala po predošlej návšteve rozpísaná práca? Ponúkni ju.
        const draft = readDraft(articleId);
        if (draft) setRecovery(draft);
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
    if (!files.length || !picking) return;
    if (picking.target === 'cover') { setCover(files[0]); setDirty(true); return; }
    setBlocks(bs => bs.map(b => {
      if (b.uid !== picking.uid) return b;
      // Galéria zbiera viac obrázkov, ostatné bloky majú jeden.
      return picking.multiple
        ? { ...b, data: { ...b.data, images: [...(b.data.images || []), ...files] } }
        : { ...b, data: { ...b.data, image: files[0] } };
    }), 'výber obrázka');
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

  /** Prekážka uloženia. `uid` umožní na blok rovno ukázať. */
  /** Čo sa zálohuje a čo sa dá obnoviť. */
  const snapshot = () => ({
    title, excerpt, slug, author, readingTime, pubDate, featured, category,
    tags, metaTitle, metaDesc, loc, cover, keyFacts, timeline, blocks,
  });
  snapshotRef.current = snapshot;

  const restoreDraft = (data: any) => {
    setTitle(data.title ?? ''); setExcerpt(data.excerpt ?? ''); setSlug(data.slug ?? '');
    setAuthor(data.author ?? ''); setReadingTime(data.readingTime ?? 1);
    setPubDate(data.pubDate ?? ''); setFeatured(!!data.featured);
    setCategory(data.category ?? ''); setTags(data.tags ?? []);
    setMetaTitle(data.metaTitle ?? ''); setMetaDesc(data.metaDesc ?? '');
    setLoc(data.loc ?? loc); setCover(data.cover ?? null);
    setKeyFacts(data.keyFacts ?? []); setTimeline(data.timeline ?? []);
    blocksHistory.reset(data.blocks ?? []);
    setDirty(true);
    setRecovery(null);
  };

  const validate = (): { text: string; uid?: string } | null => {
    if (!title.trim()) return { text: 'Článok musí mať názov.' };
    if (!slug.trim()) return { text: 'Článok musí mať slug (adresu na webe).' };

    const at = (uid: string) => blocks.findIndex(b => b.uid === uid) + 1;

    const badImg = blocks.find(b => b.type === 'content.image-block' && !String(b.data.alt || '').trim());
    if (badImg) return { uid: badImg.uid, text: `Obrázok v bloku č. ${at(badImg.uid)} nemá popis pre čítačky (alt). Bez neho sa článok neuloží.` };

    const noPic = blocks.find(b => b.type === 'content.image-block' && !b.data.image);
    if (noPic) return { uid: noPic.uid, text: `Blok č. ${at(noPic.uid)} je obrázok bez obrázka — vyberte ho z knižnice alebo blok zmažte.` };

    const badQuote = blocks.find(b => (b.type === 'content.quote-block' || b.type === 'content.poem') && !String(b.data.text || '').trim());
    if (badQuote) return { uid: badQuote.uid, text: `${badQuote.type === 'content.poem' ? 'Báseň' : 'Citát'} v bloku č. ${at(badQuote.uid)} je prázdny.` };

    const badEmbed = blocks.find(b => b.type === 'content.embed' && !String(b.data.url || '').trim());
    if (badEmbed) return { uid: badEmbed.uid, text: `Vložené video v bloku č. ${at(badEmbed.uid)} nemá adresu.` };

    const emptyGallery = blocks.find(b => b.type === 'content.image-gallery' && !(b.data.images || []).length);
    if (emptyGallery) return { uid: emptyGallery.uid, text: `Galéria v bloku č. ${at(emptyGallery.uid)} nemá žiadny obrázok.` };

    return null;
  };

  const save = async (publish: boolean) => {
    if (!token) return;
    const problem = validate();
    if (problem) {
      setSaveMsg({ tone: 'err', text: problem.text, uid: problem.uid });
      if (problem.uid) setSelectedUid(problem.uid);
      return;
    }

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
        setSavedAt(Date.now());
        clearDraft(articleId);   // záloha v prehliadači už netreba
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
  const labelOf = (type: string) => BLOCK_TYPES.find(t => t.id === type)?.label || 'blok';

  const patchBlock = (uid: string, patch: any) => {
    setBlocks(bs => bs.map(b => (b.uid === uid ? { ...b, data: { ...b.data, ...patch } } : b)), 'úprava bloku');
    touch();
  };

  /** Presun bloku na konkrétne miesto (0 = úplne hore). */
  const moveBlockTo = (uid: string, toIndex: number) => {
    setBlocks(bs => {
      const from = bs.findIndex(b => b.uid === uid);
      const to = Math.max(0, Math.min(bs.length - 1, toIndex));
      if (from < 0 || from === to) return bs;
      const next = [...bs];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    }, 'presun bloku');
    touch();
  };

  const moveBlock = (uid: string, dir: -1 | 1) => {
    const i = blocks.findIndex(b => b.uid === uid);
    if (i >= 0) moveBlockTo(uid, i + dir);
  };

  /** Vloženie na miesto, nie na koniec. */
  const insertBlock = (type: string, atIndex: number) => {
    const uid = newUid();
    setBlocks(bs => {
      const next = [...bs];
      next.splice(Math.max(0, Math.min(bs.length, atIndex)), 0, { uid, type, data: defaultsFor(type) });
      return next;
    }, `vloženie bloku ${labelOf(type)}`);
    setSelectedUid(uid);
    touch();
  };

  const addBlock = (type: string) => insertBlock(type, blocks.length);

  const deleteBlock = (uid: string) => {
    setBlocks(bs => bs.filter(b => b.uid !== uid), 'zmazanie bloku');
    setSelectedUid(null);
    touch();
  };

  /** Kópia ide HNEĎ POD originál (predtým padala na koniec článku). */
  const duplicateBlock = (uid: string) => {
    const copyUid = newUid();
    setBlocks(bs => {
      const i = bs.findIndex(b => b.uid === uid);
      if (i < 0) return bs;
      const next = [...bs];
      // `cmpId` sa kópii NEDÁVA — v Strapi to musí byť nový komponent.
      const { cmpId, ...rest } = next[i] as any;
      next.splice(i + 1, 0, { ...rest, uid: copyUid });
      return next;
    }, 'duplikovanie bloku');
    setSelectedUid(copyUid);
    touch();
  };

  const undo = () => { blocksHistory.undo(); setSelectedUid(null); touch(); };
  const redo = () => { blocksHistory.redo(); setSelectedUid(null); touch(); };

  /** Klávesy platia rovnako v admine aj v okne plátna. */
  const handleKey = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement | null;
    const typing = !!target?.closest?.('input, textarea, [contenteditable="true"]');
    const ctrl = e.ctrlKey || e.metaKey;

    if (ctrl && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return; }
    if (ctrl && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
      e.preventDefault(); redo(); return;
    }
    if (typing) return;

    const i = blocks.findIndex(b => b.uid === selectedUid);
    if (e.key === 'Escape') { setSelectedUid(null); return; }
    if (e.key === 'ArrowDown' && i < blocks.length - 1) { e.preventDefault(); setSelectedUid(blocks[i + 1]?.uid ?? blocks[0]?.uid); }
    if (e.key === 'ArrowUp' && i > 0) { e.preventDefault(); setSelectedUid(blocks[i - 1].uid); }
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedUid) {
      e.preventDefault();
      setAskDelete(selectedUid);
    }
  };

  // Odkaz drží vždy najnovšiu verziu; poslucháč sa registruje raz, vyššie.
  keyHandlerRef.current = handleKey;

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
            {/* Stavová lišta: vždy je jasné, či je práca uložená. */}
            {saving
              ? 'Ukladám…'
              : dirty
                ? 'Neuložené zmeny'
                : savedAt
                  ? `Uložené ${timeOf(savedAt)}`
                  : articleId ? 'Bez zmien' : 'Nový článok'}
          </div>
        </div>
        <span className={`achip ${published ? "achip-pub" : "achip-draft"}`}>
          {published ? "Publikovaný" : "Koncept"}
        </span>
        <div style={{ flex: 1 }} />

        {/* Vrátenie zmien — funguje v oboch zobrazeniach, aj klávesmi Ctrl+Z / Ctrl+Y. */}
        <div className="ad-seg" role="group" aria-label="História zmien">
          <button
            onClick={undo}
            disabled={!blocksHistory.canUndo}
            title={blocksHistory.undoLabel ? `Vrátiť: ${blocksHistory.undoLabel} (Ctrl+Z)` : 'Nie je čo vrátiť'}
          >
            <Undo2 className="w-3.5 h-3.5" /> Vrátiť
          </button>
          <button
            onClick={redo}
            disabled={!blocksHistory.canRedo}
            title={blocksHistory.redoLabel ? `Znovu: ${blocksHistory.redoLabel} (Ctrl+Y)` : 'Nie je čo zopakovať'}
          >
            <Redo2 className="w-3.5 h-3.5" /> Znovu
          </button>
        </div>

        <div className="ad-seg" role="group" aria-label="Zväčšenie náhľadu">
            <button
              className={zoom === 'fit' ? 'is-on' : ''}
              onClick={() => setZoom('fit')}
              title="Zmenšiť tak, aby sa zmestil celý"
            >
              Prispôsobiť
            </button>
            <button
              className={zoom === 'full' ? 'is-on' : ''}
              onClick={() => setZoom('full')}
              title="Skutočná veľkosť — dolu sa posúva do strán"
            >
              100 %
            </button>
        </div>

        <div className="ad-seg" role="group" aria-label="Šírka náhľadu">
            <button
              className={device === 'desktop' ? 'is-on' : ''}
              onClick={() => setDevice('desktop')}
              title="Ako to vyzerá na počítači"
            >
              <Monitor className="w-3.5 h-3.5" /> Počítač
            </button>
            <button
              className={device === 'mobil' ? 'is-on' : ''}
              onClick={() => setDevice('mobil')}
              title="Ako to vyzerá na telefóne (390 px) — obrázky sa správajú inak"
            >
              <Smartphone className="w-3.5 h-3.5" /> Mobil
            </button>
        </div>

        {/* `?preview=draft` ukáže ULOŽENÝ koncept (viď lib/preview.ts).
            Rozpísané zmeny v tomto formulári v ňom ešte nie sú. */}
        <a
          className="abtn"
          href={`/blog/${slug}?preview=draft`}
          target="_blank"
          rel="noreferrer"
          title={dirty ? 'Náhľad ukáže posledný uložený stav — rozpísané zmeny v ňom ešte nie sú.' : 'Zobrazí uložený koncept tak, ako bude vyzerať na webe.'}
        >
          <Eye className="w-4 h-4" /> Náhľad
        </a>
        <button className="abtn" onClick={() => save(false)} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Uložiť koncept
        </button>
        <button className="abtn abtn-primary" onClick={() => save(true)} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Publikovať
        </button>
      </div>

      {/* Ponuka obnovy po páde prehliadača — pýta sa skôr, než sa začne písať. */}
      {recovery && (
        <div className="acard" role="status" style={{ padding: '12px 16px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12, background: 'var(--ad-amber-wash, #fdf6e6)', borderColor: 'var(--ad-amber-mid)' }}>
          <span style={{ fontSize: 13.5, flex: 1 }}>
            Našla sa rozpísaná práca z <strong>{timeOf(recovery.savedAt)}</strong>, ktorá sa neuložila.
            Chcete ju obnoviť? Článok na webe sa tým nezmení, kým ho neuložíte.
          </span>
          <button className="abtn" onClick={() => { clearDraft(articleId); setRecovery(null); }}>Zahodiť</button>
          <button className="abtn abtn-primary" onClick={() => restoreDraft(recovery.data)}>Obnoviť</button>
        </div>
      )}

      {saveMsg && (
        <div
          className="acard"
          role="status"
          style={{
            padding: '11px 15px', marginBottom: 16, fontSize: 13.5,
            background: saveMsg.tone === 'ok' ? 'var(--ad-pub-bg)' : 'var(--hr-error-bg)',
            borderColor: saveMsg.tone === 'ok' ? 'var(--ad-pub-br)' : 'var(--hr-error-line)',
            color: saveMsg.tone === 'ok' ? 'var(--ad-pub-fg)' : 'var(--ad-danger)',
          }}
        >
          {saveMsg.text}
          {saveMsg.uid && (
            <button
              className="abtn"
              style={{ marginLeft: 10, padding: '4px 10px', fontSize: 12.5 }}
              onClick={() => setSelectedUid(saveMsg.uid!)}
            >
              Ukáž mi to
            </button>
          )}
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

          <EditorCanvas
              device={device}
              zoom={zoom}
              article={{
                title,
                excerpt,
                authorName: author,
                readingTime,
                coverImage: cover,
                /* Plátno kreslí to isté, čo sa uloží: tvar Strapi bloku.
                   `__uid` je navyše — drží väzbu na blok vo formulári. */
                blocks: blocks.map(b => ({ __component: b.type, id: b.cmpId, __uid: b.uid, ...b.data })),
              }}
              selectedUid={selectedUid}
              onSelect={setSelectedUid}
              onMove={moveBlockTo}
              onDelete={setAskDelete}
              onDuplicate={duplicateBlock}
              onInsert={insertBlock}
              onKeyDown={handleKey}
              onBodyChange={(uid, body) => patchBlock(uid, { body, _edited: true })}
              onPatch={patchBlock}
              onPickMedia={(uid, multiple) => setPicking({ target: 'block', uid, multiple })}
              blockTypes={BLOCK_TYPES as any}
            />
        </div>

        {/* ═══ Pravý stĺpec — metadáta ═══ */}
        <aside
          className="acard ad-editor-side"
          style={{ width: 330, flexShrink: 0, background: 'var(--ad-surface)', position: 'sticky', top: 76, maxHeight: 'calc(100vh - 96px)', overflowY: 'auto' }}
        >
          <Panel title="Publikovanie" defaultOpen>
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

          <Panel title="Titulná fotografia" defaultOpen>
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
                  background: 'var(--hr-wash-4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
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

          <Panel title="Zaradenie — kategória a štítky">
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

          <Panel title="SEO — ako sa článok ukáže vo vyhľadávaní">
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

          <Panel title="Lokalita na mape">
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

          <Panel title="Kľúčové fakty (pobočný stĺpec)">
            <div data-row-list>
            {keyFacts.map((f, i) => (
              <div
                key={f.uid}
                data-row-uid={f.uid}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8,
                  opacity: factsDrag.dragUid === f.uid ? 0.4 : 1,
                  borderTop: factsDrag.overIndex === i ? '2px solid var(--ad-amber-deep)' : '2px solid transparent',
                }}
              >
                <button
                  className="ad-grip"
                  title="Potiahnutím zmeníte poradie"
                  aria-label="Presunúť fakt"
                  onPointerDown={factsDrag.startDrag(f.uid)}
                >
                  <GripVertical className="w-3.5 h-3.5" />
                </button>
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
            </div>
            <button className="abtn" style={{ width: '100%', justifyContent: 'center' }} onClick={() => { setKeyFacts(ks => [...ks, { uid: newUid(), label: '', value: '', icon: 'star' }]); touch(); }}>
              <Plus className="w-3.5 h-3.5" /> Pridať fakt
            </button>
          </Panel>

          <Panel title="Časová os (pobočný stĺpec)">
            <div data-row-list>
            {timeline.map((t, i) => (
              <div
                key={t.uid}
                data-row-uid={t.uid}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8,
                  opacity: timelineDrag.dragUid === t.uid ? 0.4 : 1,
                  borderTop: timelineDrag.overIndex === i ? '2px solid var(--ad-amber-deep)' : '2px solid transparent',
                }}
              >
                <button
                  className="ad-grip"
                  title="Potiahnutím zmeníte poradie"
                  aria-label="Presunúť udalosť"
                  onPointerDown={timelineDrag.startDrag(t.uid)}
                >
                  <GripVertical className="w-3.5 h-3.5" />
                </button>
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
            </div>
            <button className="abtn" style={{ width: '100%', justifyContent: 'center' }} onClick={() => { setTimeline(ts => [...ts, { uid: newUid(), year: '', title: '', description: '', type: 'event' }]); touch(); }}>
              <Plus className="w-3.5 h-3.5" /> Pridať udalosť
            </button>
          </Panel>
        </aside>
      </div>

      {askDelete && (() => {
        const b = blocks.find(x => x.uid === askDelete);
        return (
          <div
            onClick={() => setAskDelete(null)}
            style={{ position: 'fixed', inset: 0, zIndex: 120, background: 'rgba(30,22,12,.45)',
                     display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <div className="acard" onClick={e => e.stopPropagation()} style={{ width: 'min(420px, 92vw)', padding: 20 }}>
              <h2 style={{ fontSize: 17, fontWeight: 600, margin: '0 0 8px' }}>Zmazať blok?</h2>
              <p style={{ fontSize: 13.5, color: 'var(--ad-secondary)', lineHeight: 1.55, margin: '0 0 16px' }}>
                Blok „{labelOf(b?.type || '')}" sa z článku odstráni. Vrátiť sa dá tlačidlom
                {' '}<strong>Vrátiť</strong> alebo klávesmi Ctrl+Z, a kým článok neuložíte, na webe sa nič nezmení.
              </p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button className="abtn" onClick={() => setAskDelete(null)}>Nechať</button>
                <button className="abtn abtn-danger" onClick={() => { deleteBlock(askDelete); setAskDelete(null); }}>
                  Zmazať blok
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {picking && (
        <MediaPicker
          onPick={applyPick}
          onClose={() => setPicking(null)}
          multiple={picking.target === 'block' && !!picking.multiple}
        />
      )}
    </>
  );
}

// ── Blok ─────────────────────────────────────────────────────────────────────
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
