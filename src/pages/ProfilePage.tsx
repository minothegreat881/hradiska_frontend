'use client';

/**
 * Profil člena — vlastná kronika.
 *
 * PREČO NANOVO. Predošlá podoba bola sled kariet s odznakmi úrovní
 * („Bádateľ", „Kronikár"), farebnými štítkami a modálnym oknom nastavení.
 * Vyzerala ako panel aplikácie, nie ako časť encyklopédie — a po prezlečení
 * webu do pečatného šatu ostala jedinou stránkou v starej grafike.
 *
 * ČÍM JE TERAZ. Web je kronika, takže profil je vlastná kronika člena: čo
 * napísal, čo si odložil, čo sa k jeho príspevkom ozvalo. Skladba je tá istá
 * ako vo fotoarchíve a v aktualitách — hlavička so značkou, register po
 * riadkoch, vláskové čiary medzi záznamami. Žiadne boxy, žiadne odznaky
 * úrovní: koľko kto napísal, je ÚDAJ, nie titul.
 *
 * Nastavenia nie sú modálne okno, ale posledná položka registra. Modál mal
 * zmysel, kým bol profil jedna dlhá stránka; register ho robí zbytočným.
 *
 * Nové ozvy nesú červený prúžok pri ľavom okraji a bodku v registri — stav
 * sa dá prečítať aj z polohy, nielen z farby.
 */

import { useEffect, useMemo, useState } from 'react';
import { useMember } from '../auth/MemberAuth';
import { deleteMyAccount } from '../lib/memberApi';
import {
  getProfile, getNotifications, getMyComments, getMyPhotoComments,
  getMyFavorites, getMyLikedPhotos, getMyShares, markAllRead,
  editComment, deleteComment, editPhotoComment, deletePhotoComment,
  updateProfile, uploadAvatar,
  type Profile, type NotificationItem, type MyComment, type FavoritePost,
  type LikedPhoto, type MyShare,
} from '../lib/profileApi';
import { pushSupported, pushPermission, enablePush, disablePush, isPushEnabled } from '../lib/push';

const STRAPI_URL = import.meta.env.PROD
  ? (typeof window !== 'undefined' ? window.location.origin + '/strapi' : '/strapi')
  : (import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337');

const prejdi = (p: string) => { window.history.pushState({}, '', p); window.dispatchEvent(new PopStateEvent('popstate')); };

type Sekcia = 'ozvy' | 'prispevky' | 'ulozene' | 'fotky' | 'nastavenia';

/** Prvé písmeno mena do pečate. */
const iniciala = (m: string) => ((m || '?').trim().charAt(0) || '?').toUpperCase();

/** Ako dlho je človek v kronike. Menej než rok sa hlási v mesiacoch. */
function vKronike(iso: string): { cislo: string; slovo: string } {
  const d = new Date(iso), teraz = new Date();
  const mes = (teraz.getFullYear() - d.getFullYear()) * 12 + (teraz.getMonth() - d.getMonth());
  if (mes < 12) {
    const m = Math.max(1, mes);
    return { cislo: String(m), slovo: m === 1 ? 'mesiac v kronike' : m < 5 ? 'mesiace v kronike' : 'mesiacov v kronike' };
  }
  const r = Math.floor(mes / 12);
  return { cislo: String(r), slovo: r === 1 ? 'rok v kronike' : r < 5 ? 'roky v kronike' : 'rokov v kronike' };
}

/** Relatívny čas — v kronike stačí hrubo. */
function kedy(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 90) return 'pred chvíľou';
  const m = Math.floor(s / 60); if (m < 60) return `pred ${m} min`;
  const h = Math.floor(m / 60); if (h < 24) return `pred ${h} h`;
  const d = Math.floor(h / 24); if (d < 31) return `pred ${d} dňami`;
  return new Date(iso).toLocaleDateString('sk-SK', { day: 'numeric', month: 'numeric', year: 'numeric' });
}

const datum = (iso: string) => new Date(iso).toLocaleDateString('sk-SK', { day: 'numeric', month: 'numeric', year: 'numeric' });

/** Strapi vracia cesty relatívne k svojmu koreňu — bez predpony sa hľadajú
    na frontende a obrázok sa nenačíta. */
const naAdresu = (u: string | null | undefined) => (u ? (u.startsWith('http') ? u : STRAPI_URL + u) : null);

function mediaUrl(m: { url: string; formats?: Record<string, { url: string }> } | null | undefined): string | null {
  return naAdresu(m?.formats?.thumbnail?.url || m?.url);
}

/* ══════════════════════════════════════════════════════════════════════════
   STRÁNKA
   ══════════════════════════════════════════════════════════════════════════ */
export function ProfilePage() {
  const { member, token, signOut } = useMember();

  const [profil, setProfil] = useState<Profile | null>(null);
  const [sekcia, setSekcia] = useState<Sekcia>('ozvy');
  const [ozvy, setOzvy] = useState<NotificationItem[] | null>(null);
  const [prispevky, setPrispevky] = useState<MyComment[] | null>(null);
  const [ulozene, setUlozene] = useState<FavoritePost[] | null>(null);
  const [zdielane, setZdielane] = useState<MyShare[] | null>(null);
  const [fotky, setFotky] = useState<LikedPhoto[] | null>(null);
  const [novych, setNovych] = useState(0);

  useEffect(() => {
    if (!token) return;
    getProfile(token).then(setProfil).catch(() => {});
    getNotifications(token)
      .then((r) => { setOzvy(r.data); setNovych(r.data.filter((n) => !n.read).length); })
      .catch(() => setOzvy([]));
  }, [token]);

  const nacitajPrispevky = () => {
    if (!token) return;
    Promise.all([getMyComments(token).catch(() => []), getMyPhotoComments(token).catch(() => [])])
      .then(([a, b]) => setPrispevky([...a, ...b].sort((x, y) => +new Date(y.createdAt) - +new Date(x.createdAt))));
  };

  useEffect(() => {
    if (!token) return;
    if (sekcia === 'ozvy' && novych > 0) markAllRead(token).then(() => setNovych(0)).catch(() => {});
    if (sekcia === 'prispevky' && prispevky === null) nacitajPrispevky();
    if (sekcia === 'ulozene' && ulozene === null) {
      getMyFavorites(token).then(setUlozene).catch(() => setUlozene([]));
      getMyShares(token).then(setZdielane).catch(() => setZdielane([]));
    }
    if (sekcia === 'fotky' && fotky === null) getMyLikedPhotos(token).then(setFotky).catch(() => setFotky([]));
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [sekcia, token]);

  const meno = profil?.displayName || profil?.username || member?.username || '';
  const vek = profil?.joinedAt ? vKronike(profil.joinedAt) : null;

  const register: { id: Sekcia; nazov: string; pocet: number | null }[] = useMemo(() => [
    { id: 'ozvy', nazov: 'Ozvalo sa', pocet: ozvy?.length ?? null },
    { id: 'prispevky', nazov: 'Moje príspevky', pocet: prispevky?.length ?? profil?.stats.comments ?? null },
    { id: 'ulozene', nazov: 'Odložené', pocet: ulozene?.length ?? profil?.stats.favorites ?? null },
    { id: 'fotky', nazov: 'Moje fotografie', pocet: fotky?.length ?? null },
    { id: 'nastavenia', nazov: 'Nastavenia', pocet: null },
  ], [ozvy, prispevky, ulozene, fotky, profil]);

  if (!token) {
    return <div className="lprof"><div className="container lprof-in"><p className="lprof-prazdno">Načítavam…</p></div></div>;
  }

  const avatar = mediaUrl(profil?.avatar);

  return (
    <div className="lprof">
      <div className="container lprof-in">

        <nav aria-label="Omrvinky" className="lgal-omrvinky">
          <ol>
            <li><a href="/">Domov</a></li>
            <li aria-hidden="true">·</li>
            <li>Môj profil</li>
          </ol>
        </nav>

        <header className="lprof-hlava">
          {avatar
            ? <img className="lprof-pecat lprof-pecat-foto" src={avatar} alt="" width={64} height={64} />
            : <span className="lprof-pecat" aria-hidden="true">{iniciala(meno)}</span>}
          <div>
            <h1 className="lprof-meno">{meno || 'Môj profil'}</h1>
            <p className="lprof-udaje">
              <b>{profil?.stats.comments ?? 0}</b> príspevkov
              {vek && <> · <b>{vek.cislo}</b> {vek.slovo}</>}
            </p>
          </div>
          {/* Odhlásenie patrí sem, nie do nastavení: je to úkon, ktorý človek
              robí najčastejšie zo všetkých v profile, a hľadať ho pod
              „Nastavenia účtu" znamená prejsť tri obrazovky pre jeden klik. */}
          <div className="lprof-ukony">
            <button
              type="button"
              className="lprof-nastavenia"
              aria-pressed={sekcia === 'nastavenia'}
              onClick={() => setSekcia('nastavenia')}
            >
              Nastavenia účtu
            </button>
            <button
              type="button"
              className="lprof-nastavenia"
              onClick={() => { signOut(); prejdi('/'); }}
            >
              Odhlásiť sa
            </button>
          </div>
        </header>

        {profil?.preModerated && (
          <p className="lprof-vystraha" role="status">
            Vaše príspevky pred zverejnením číta správca.
            {profil.warnsCount > 0 && ` Upozornení: ${profil.warnsCount}.`}
          </p>
        )}

        <div className="lprof-telo">
          <nav className="lprof-register" aria-label="Časti profilu">
            {register.map((s) => (
              <button
                key={s.id}
                type="button"
                className={sekcia === s.id ? 'is-on' : undefined}
                aria-current={sekcia === s.id ? 'page' : undefined}
                onClick={() => setSekcia(s.id)}
              >
                <span className="lprof-reg-nazov">{s.nazov}</span>
                {s.pocet !== null && <span className="lprof-reg-pocet">{String(s.pocet).padStart(2, '0')}</span>}
                {s.id === 'ozvy' && novych > 0 && <span className="lprof-nove" aria-label={`${novych} nových`} />}
              </button>
            ))}
          </nav>

          <section className="lprof-obsah">
            {sekcia === 'ozvy' && <Ozvy items={ozvy} />}
            {sekcia === 'prispevky' && (
              <Prispevky items={prispevky} token={token} onZmena={() => { setPrispevky(null); nacitajPrispevky(); }} />
            )}
            {sekcia === 'ulozene' && <Ulozene clanky={ulozene} zdielane={zdielane} />}
            {sekcia === 'fotky' && <Fotky items={fotky} />}
            {sekcia === 'nastavenia' && (profil
              ? <Nastavenia profil={profil} token={token} onProfil={setProfil} onOdhlas={() => { signOut(); prejdi('/'); }} />
              : <p className="lprof-prazdno">Načítavam…</p>)}
          </section>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   OZVALO SA

   Zoznam bol nečitateľný nie preto, že by mu chýbal obsah, ale preto, že
   všetky záznamy mali rovnaký tvar a jediná farba na stránke — pečatná
   červená — bola použitá na odkazy, prúžky aj bodky naraz. Nič potom
   nerozlišovalo odpoveď od ocenenia a upozornenie od oznamu.

   Každý druh ozvy má teraz vlastnú farbu, a nie náhodnú: sú to odtiene
   z tej istej krajiny, akú ukazuje titulná ilustrácia — tráva, okrová zem,
   pečať a rieka. Farba sedí na terči s iniciálou a na štítku druhu; telo
   záznamu ostáva čierne na papieri, takže sa neprefarbuje text.

   Červený prúžok pri ľavom okraji ostáva vyhradený JEDINEJ veci: že je ozva
   nová. Keby ho prebrali druhy, prestal by o novosti hovoriť.
   ══════════════════════════════════════════════════════════════════════════ */

type DruhOzvy = 'reply' | 'like' | 'warning' | 'post';

const DRUH: Record<DruhOzvy, { stitok: string; znak: string }> = {
  reply:   { stitok: 'Odpoveď',      znak: '↩' },
  like:    { stitok: 'Ocenenie',     znak: '♥' },
  warning: { stitok: 'Upozornenie',  znak: '!' },
  post:    { stitok: 'Nový článok',  znak: '✦' },
};

function Ozvy({ items }: { items: NotificationItem[] | null }) {
  if (items === null) return <Kostra n={3} />;
  if (!items.length) {
    return <p className="lprof-prazdno">Zatiaľ sa nikto neozval. Záznam pribudne, keď niekto odpovie na váš príspevok alebo ho ocení.</p>;
  }

  return (
    <ul className="lprof-zoznam">
      {items.map((n) => {
        const druh = (DRUH[n.type as DruhOzvy] ? n.type : 'post') as DruhOzvy;
        const kto = n.actor?.displayName || n.actor?.username || 'Niekto';
        const nazov = n.post?.title || n.aktualita?.nazov || '';
        const kFotke = !!(n.photoComment || n.fileId);
        const odkaz = n.post
          ? `/blog/${n.post.slug}${kFotke && n.fileId ? `?fotoFile=${n.fileId}` : ''}`
          : n.aktualita ? '/aktuality' : null;
        const viac = n.aggregateCount > 1;

        /* Kto sa ozval a čo urobil. Pri systémových ozvách nie je nikto —
           terč vtedy nesie znak, nie iniciálu. */
        let ktoText = kto;
        let coText = 'sa ozval';
        let osoba = true;
        if (druh === 'reply') {
          coText = kFotke ? 'odpovedal na váš komentár k fotografii' : 'odpovedal na váš komentár';
        } else if (druh === 'like') {
          ktoText = viac ? `${n.aggregateCount} čitateľov` : kto;
          coText = `${viac ? 'ocenilo' : 'ocenil'} váš komentár${kFotke ? ' k fotografii' : ''}`;
          osoba = !viac;
        } else if (druh === 'warning') {
          ktoText = 'Správca';
          coText = 'upozorňuje na nedodržanie pravidiel diskusie';
          osoba = false;
        } else {
          ktoText = 'Kronika';
          coText = 'pribudol nový článok';
          osoba = false;
        }

        const citat = druh === 'post' ? null : (n.comment?.content || n.photoComment?.content || n.text);

        return (
          <li
            key={n.documentId}
            className={`lprof-zaznam lprof-ozva${!n.read ? ' is-nove' : ''}`}
            data-druh={druh}
          >
            <span className="lprof-terc" aria-hidden="true">
              {osoba ? iniciala(ktoText) : DRUH[druh].znak}
            </span>

            <div className="lprof-ozva-telo">
              <div className="lprof-riadok">
                <span className="lprof-kto">{ktoText}</span>
                <span className="lprof-co">{coText}</span>
                <span className="lprof-druh">{DRUH[druh].stitok}</span>
                <span className="lprof-kedy">{kedy(n.createdAt)}</span>
              </div>
              {nazov && (odkaz
                ? <a className="lprof-kde" href={odkaz}>{nazov}</a>
                : <span className="lprof-kde">{nazov}</span>)}
              {citat && <p className="lprof-citat">{citat}</p>}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MOJE PRÍSPEVKY
   ══════════════════════════════════════════════════════════════════════════ */
/* Zverejnený príspevok stav nehlási — je to bežný prípad a štítok „Zverejnený"
   pri každom riadku by len šumel. Hlási sa len to, čo si žiada pozornosť. */
const STAV: Record<string, string> = {
  waiting: 'čaká na schválenie',
  reported: 'nahlásený',
  hidden: 'skrytý',
  spam: 'odstránený',
};

function Prispevky({ items, token, onZmena }: { items: MyComment[] | null; token: string; onZmena: () => void }) {
  const [upravovany, setUpravovany] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [chyba, setChyba] = useState('');

  if (items === null) return <Kostra n={3} />;
  if (!items.length) {
    return <p className="lprof-prazdno">Zatiaľ ste nič nenapísali. Do diskusie sa dá zapojiť pod každým článkom.</p>;
  }

  const uloz = async (c: MyComment) => {
    if (!text.trim()) return;
    setBusy(true); setChyba('');
    try {
      await (c.source === 'photo' ? editPhotoComment : editComment)(token, c.documentId, text.trim());
      setUpravovany(null);
      onZmena();
    } catch { setChyba('Úpravu sa nepodarilo uložiť. Skúste to prosím znova.'); }
    finally { setBusy(false); }
  };

  const zmaz = async (c: MyComment) => {
    if (!window.confirm('Zmazať tento príspevok? Nedá sa to vrátiť.')) return;
    setBusy(true); setChyba('');
    try {
      await (c.source === 'photo' ? deletePhotoComment : deleteComment)(token, c.documentId);
      onZmena();
    } catch { setChyba('Príspevok sa nepodarilo zmazať. Skúste to prosím znova.'); }
    finally { setBusy(false); }
  };

  return (
    <>
      {chyba && <p className="lprof-chyba" role="alert">{chyba}</p>}
      <ul className="lprof-zoznam">
        {items.map((c) => {
          const kFotke = c.source === 'photo';
          const odkaz = c.post ? `/blog/${c.post.slug}${kFotke && c.fileId ? `?fotoFile=${c.fileId}` : ''}` : null;
          return (
            <li key={c.documentId} className="lprof-zaznam">
              <div className="lprof-riadok">
                <span className="lprof-co">{kFotke ? 'k fotografii' : 'pod článkom'}</span>
                <span className="lprof-kedy">{c.editedAt ? `upravené ${kedy(c.editedAt)}` : kedy(c.createdAt)}</span>
              </div>
              {c.post && (odkaz
                ? <a className="lprof-kde" href={odkaz}>{c.post.title}</a>
                : <span className="lprof-kde">{c.post.title}</span>)}

              {upravovany === c.documentId ? (
                <div className="lprof-uprava">
                  <label htmlFor={`lprof-up-${c.documentId}`} className="lab-only-reader">Znenie príspevku</label>
                  <textarea
                    id={`lprof-up-${c.documentId}`}
                    value={text}
                    rows={4}
                    onChange={(e) => setText(e.target.value)}
                  />
                  <div className="lprof-tlacidla">
                    <button type="button" className="lprof-hlavne" disabled={busy} onClick={() => uloz(c)}>Uložiť zmenu</button>
                    <button type="button" onClick={() => setUpravovany(null)}>Zrušiť</button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="lprof-citat">{c.content}</p>
                  <div className="lprof-riadok lprof-spodok">
                    <span className="lprof-reakcie">{c.likes} ocenení · {c.replyCount} odpovedí</span>
                    {STAV[c.status] && <span className="lprof-stav">{STAV[c.status]}</span>}
                    <span className="lprof-akcie">
                      <button type="button" onClick={() => { setUpravovany(c.documentId); setText(c.content); }}>Upraviť</button>
                      <button type="button" disabled={busy} onClick={() => zmaz(c)}>Zmazať</button>
                    </span>
                  </div>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   ODLOŽENÉ — články, ktoré si člen odložil, a čo poslal ďalej
   ══════════════════════════════════════════════════════════════════════════ */
function Ulozene({ clanky, zdielane }: { clanky: FavoritePost[] | null; zdielane: MyShare[] | null }) {
  if (clanky === null) return <Kostra n={3} />;
  if (!clanky.length && !(zdielane || []).length) {
    return <p className="lprof-prazdno">Zatiaľ ste si nič neodložili. Článok sa odkladá srdcom v jeho hlavičke.</p>;
  }
  return (
    <>
      {clanky.length > 0 && (
        <ul className="lprof-zoznam">
          {clanky.map((z) => (
            <li key={z.documentId} className="lprof-zaznam">
              <div className="lprof-riadok"><a className="lprof-nazov" href={`/blog/${z.slug}`}>{z.title}</a></div>
              {z.category && <span className="lprof-znacka">{z.category.name}</span>}
            </li>
          ))}
        </ul>
      )}

      {(zdielane || []).length > 0 && (
        <section className="lprof-podskupina">
          <h2>Poslané ďalej</h2>
          <ul className="lprof-zoznam">
            {zdielane!.map((s) => (
              <li key={s.documentId} className="lprof-zaznam">
                <div className="lprof-riadok">
                  <span className="lprof-co">{s.channel || 'odkazom'}</span>
                  <span className="lprof-kedy">{datum(s.createdAt)}</span>
                </div>
                {s.post && <a className="lprof-kde" href={`/blog/${s.post.slug}`}>{s.post.title}</a>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MOJE FOTOGRAFIE
   ══════════════════════════════════════════════════════════════════════════ */
function Fotky({ items }: { items: LikedPhoto[] | null }) {
  if (items === null) return <Kostra n={2} />;
  if (!items.length) {
    return <p className="lprof-prazdno">Zatiaľ ste neocenili žiadnu fotografiu. Srdce nájdete pri každej snímke v článku aj vo fotoarchíve.</p>;
  }
  return (
    <ul className="lprof-fotky">
      {items.map((f) => (
        <li key={f.fileId}>
          <a href={f.post ? `/blog/${f.post.slug}?fotoFile=${f.fileId}` : '/galeria'}>
            <img src={naAdresu(f.thumb || f.url) || ''} alt={f.alt || ''} loading="lazy" decoding="async" />
            {f.post && <span>{f.post.title}</span>}
          </a>
        </li>
      ))}
    </ul>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   NASTAVENIA
   ══════════════════════════════════════════════════════════════════════════ */
function Nastavenia({ profil, token, onProfil, onOdhlas }: {
  profil: Profile; token: string; onProfil: (p: Profile) => void; onOdhlas: () => void;
}) {
  const [meno, setMeno] = useState(profil.displayName || '');
  const [prefs, setPrefs] = useState(profil.prefs);
  const [push, setPush] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hlaska, setHlaska] = useState('');
  const [chyba, setChyba] = useState('');
  const [rusim, setRusim] = useState(false);

  useEffect(() => { isPushEnabled().then(setPush).catch(() => {}); }, []);

  const oznam = (s: string) => { setHlaska(s); setChyba(''); };
  const zlyhalo = (s: string) => { setChyba(s); setHlaska(''); };

  const uloz = async () => {
    setBusy(true);
    try {
      await updateProfile(token, { displayName: meno, ...prefs });
      onProfil(await getProfile(token));
      oznam('Uložené.');
    } catch { zlyhalo('Zmeny sa nepodarilo uložiť. Skúste to prosím znova.'); }
    finally { setBusy(false); }
  };

  const nahrajFotku = async (file: File) => {
    setBusy(true);
    try {
      const id = await uploadAvatar(token, file);
      await updateProfile(token, { avatar: id });
      onProfil(await getProfile(token));
      oznam('Fotografia je zmenená.');
    } catch { zlyhalo('Fotografiu sa nepodarilo nahrať. Skúste JPG alebo PNG.'); }
    finally { setBusy(false); }
  };

  const prepniPush = async () => {
    setBusy(true);
    try {
      if (push) {
        await disablePush(token);
        setPush(false);
        oznam('Upozornenia v zariadení sú vypnuté.');
      } else {
        const r = await enablePush(token);
        setPush(r.ok);
        if (r.ok) oznam('Upozornenia v zariadení sú zapnuté.');
        else zlyhalo(r.reason === 'denied'
          ? 'Prehliadač má upozornenia zakázané. Povolíte ich v jeho nastaveniach pre túto stránku.'
          : 'Upozornenia sa nepodarilo zapnúť.');
      }
    } finally { setBusy(false); }
  };

  const zrusUcet = async () => {
    setBusy(true);
    try { await deleteMyAccount(token); onOdhlas(); }
    catch { zlyhalo('Účet sa nepodarilo zrušiť. Skúste to prosím znova.'); setBusy(false); }
  };

  const foto = mediaUrl(profil.avatar);
  const PREFS: { k: keyof Profile['prefs']; t: string }[] = [
    { k: 'notifyReply', t: 'Keď mi niekto odpovie' },
    { k: 'notifyLike', t: 'Keď niekto ocení môj príspevok' },
    { k: 'notifyPost', t: 'Keď pribudne nový článok' },
    { k: 'notifyEmail', t: 'Posielať aj e-mailom' },
  ];

  return (
    <div className="lprof-nast">
      {hlaska && <p className="lprof-hlaska" role="status">{hlaska}</p>}
      {chyba && <p className="lprof-chyba" role="alert">{chyba}</p>}

      <section>
        <h2>Ako sa podpisujem</h2>
        <div className="lprof-pole">
          <label htmlFor="lprof-meno">Zobrazené meno</label>
          <input
            id="lprof-meno"
            value={meno}
            maxLength={60}
            placeholder={profil.username}
            onChange={(e) => setMeno(e.target.value)}
          />
        </div>
        <p className="lprof-poznamka">Pod týmto menom vás uvidia ostatní pri príspevkoch. E-mail ({profil.email}) zostáva skrytý.</p>
      </section>

      <section>
        <h2>Fotografia</h2>
        <div className="lprof-foto">
          {foto
            ? <img src={foto} alt="" width={56} height={56} />
            : <span className="lprof-pecat lprof-pecat-mala" aria-hidden="true">{iniciala(profil.displayName || profil.username)}</span>}
          <label className="lprof-subor">
            {foto ? 'Zmeniť fotografiu' : 'Nahrať fotografiu'}
            <input
              type="file"
              accept="image/*"
              disabled={busy}
              onChange={(e) => e.target.files?.[0] && nahrajFotku(e.target.files[0])}
            />
          </label>
        </div>
      </section>

      <section>
        <h2>Kedy mi dať vedieť</h2>
        <ul className="lprof-prefs">
          {PREFS.map(({ k, t }) => (
            <li key={k}>
              <label>
                <input type="checkbox" checked={prefs[k]} onChange={(e) => setPrefs({ ...prefs, [k]: e.target.checked })} />
                {t}
              </label>
            </li>
          ))}
          {pushSupported() && (
            <li>
              <label>
                <input
                  type="checkbox"
                  checked={push}
                  disabled={busy || pushPermission() === 'denied'}
                  onChange={prepniPush}
                />
                Upozorniť priamo v zariadení
              </label>
            </li>
          )}
        </ul>
        <div className="lprof-tlacidla">
          <button type="button" className="lprof-hlavne" disabled={busy} onClick={uloz}>Uložiť zmeny</button>
        </div>
      </section>

      {/* Odhlásenie je v hlavičke profilu — tu ostáva len to, čo sa nedá
          vrátiť, aby si to nikto nepomýlil s odhlásením. */}
      <section className="lprof-ucet">
        <h2>Zrušenie účtu</h2>
        <div className="lprof-tlacidla">
          {!rusim && <button type="button" className="lprof-zrusit" onClick={() => setRusim(true)}>Zrušiť účet</button>}
        </div>
        {rusim && (
          <div className="lprof-zrusenie">
            <p>
              Účet sa zmaže natrvalo. Vaše príspevky zostanú v diskusiách podpísané ako <b>Zmazaný účet</b>.
              Vrátiť sa to nedá.
            </p>
            <div className="lprof-tlacidla">
              <button type="button" onClick={() => setRusim(false)}>Ponechať účet</button>
              <button type="button" className="lprof-hlavne lprof-zmazat" disabled={busy} onClick={zrusUcet}>Zmazať natrvalo</button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

/* Kostry namiesto točiaceho kolieska — stránka si udrží tvar a nepreskočí,
   keď údaje doskočia. */
function Kostra({ n }: { n: number }) {
  return (
    <ul className="lprof-zoznam" aria-hidden="true">
      {Array.from({ length: n }, (_, i) => (
        <li key={i} className="lprof-zaznam lprof-kostra">
          <span style={{ width: '38%' }} />
          <span style={{ width: '64%' }} />
          <span style={{ width: '82%' }} />
        </li>
      ))}
    </ul>
  );
}

export default ProfilePage;
