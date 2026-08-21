/**
 * Nájde fotky podľa poradia, aké ukazuje svetlík vo fotoarchíve
 * („Fotogaléria · N / M"). Poradie sa NEDÁ uhádnuť — musí sa presne
 * zopakovať to, čo robí stránka: načítať po stranách, zoskupiť po článkoch,
 * zoradiť skupiny podľa počtu fotiek zostupne a zoznam sploštiť.
 *
 * Celkové číslo M hovorí, po koľkých stranách bol človek, keď si tú fotku
 * pozeral — podľa neho sa pozná stav, v ktorom to poradie platilo.
 */
const API = 'http://188.245.47.29';
const NON_PHOTO = /banner|logo|plagat|letak|tlacivo|pozvanka|diplom|sviatky|pf_?20|mapa|map_|schema|graf/i;

async function strana(page) {
  const q = [
    'sort=originalPublishedDate:desc',
    `pagination[page]=${page}`, 'pagination[pageSize]=24',
    'fields[0]=title', 'fields[1]=slug',
    'populate[gallery][fields][0]=url', 'populate[gallery][fields][1]=formats',
    'populate[gallery][fields][2]=alternativeText', 'populate[gallery][fields][3]=caption',
  ].join('&');
  const r = await fetch(`${API}/api/blog-posts?${q}`);
  const j = await r.json();
  const von = [];
  for (const post of j.data || []) {
    for (const img of post.gallery || []) {
      const fmt = img.formats?.medium || img.formats?.small;
      if (!fmt?.url) continue;
      if (NON_PHOTO.test(img.url)) continue;
      von.push({
        fileId: img.id, url: img.url,
        alt: img.alternativeText || '', caption: img.caption || '',
        postTitle: post.title, postSlug: post.slug,
      });
    }
  }
  return von;
}

const ploche = (fotky) => {
  const m = new Map();
  for (const f of fotky) {
    const k = f.postSlug || f.postTitle || 'ine';
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(f);
  }
  return [...m.values()].sort((a, b) => b.length - a.length).flat();
};

const HLADANE = [
  { n: 1, m: 371 }, { n: 176, m: 371 }, { n: 193, m: 371 },
  { n: 746, m: 755 }, { n: 480, m: 1187 }, { n: 478, m: 1187 },
];

let vsetky = [];
const stavy = new Map();
for (let p = 1; p <= 6; p++) {
  vsetky = vsetky.concat(await strana(p));
  const zoznam = ploche(vsetky);
  stavy.set(zoznam.length, zoznam);
  console.log(`po strane ${p}: ${zoznam.length} fotiek`);
}

console.log('');
for (const { n, m } of HLADANE) {
  const zoznam = stavy.get(m);
  if (!zoznam) { console.log(`✘ ${n}/${m} — stav so ${m} fotkami nenastal`); continue; }
  const f = zoznam[n - 1];
  console.log(`${String(n).padStart(4)}/${m}  fileId ${String(f.fileId).padStart(5)}  ${f.postTitle.slice(0, 34).padEnd(36)} ${(f.caption || f.alt || '—').slice(0, 46)}`);
  console.log(`            ${f.url}`);
}
