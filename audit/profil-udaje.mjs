/**
 * Vymyslené odpovede Strapi pre náhľad a meranie profilu.
 *
 * Profil vidí len prihlásený člen a testovací účet na ostrom serveri
 * nechceme. Údaje sú v tvare, aký naozaj vracajú controllery účtu,
 * notifikácií, komentárov a reakcií.
 */

const teraz = Date.now();
const pred = (h) => new Date(teraz - h * 3600e3).toISOString();

const CLEN = { id: 7, username: 'orgon', email: 'orgon@example.sk', confirmed: true, blocked: false };

const PROFIL = {
  id: 7, username: 'orgon', email: 'orgon@example.sk', displayName: 'Orgon',
  avatar: null, warnsCount: 0, preModerated: false, joinedAt: '2011-06-01T00:00:00.000Z',
  prefs: { notifyReply: true, notifyLike: true, notifyPost: false, notifyEmail: false },
  stats: { comments: 128, favorites: 12, shares: 4 },
};

const OZVY = {
  data: [
    { documentId: 'n1', type: 'reply', read: false, text: null, aggregateCount: 1, createdAt: pred(2),
      actor: { username: 'milan', displayName: 'Milan' },
      post: { title: 'Mikulčice — Valy', slug: 'mikulcice-valy' },
      comment: { documentId: 'c9', content: 'Máte pravdu, tie základy sa dajú datovať aj podľa keramiky z vrstvy pod nimi.' } },
    { documentId: 'n2', type: 'like', read: false, text: null, aggregateCount: 4, createdAt: pred(20),
      actor: { username: 'zuzana', displayName: 'Zuzana' },
      post: { title: 'Výprava Poľské hradiská 2', slug: 'vyprava-polske-hradiska-2' },
      photoComment: { documentId: 'p3', content: 'Ten profil sondy je nádherne čitateľný.' }, fileId: 4412 },
    { documentId: 'n3', type: 'warning', read: true, text: 'Príspevok pod článkom o Bojnej obsahoval osobný útok.',
      aggregateCount: 1, createdAt: pred(96), actor: null, post: { title: 'Bojná — Valy', slug: 'bojna-valy' } },
    { documentId: 'n4', type: 'post', read: true, text: null, aggregateCount: 1, createdAt: pred(140),
      actor: null, post: { title: 'Wogastisburg — hradisko Samovej ríše', slug: 'wogastisburg' } },
  ],
  meta: { pagination: { page: 1, pageSize: 20, total: 4 } },
};

const KOMENTARE = { data: [
  { documentId: 'k1', content: 'K opevneniu na Martinskom vrchu — v starších správach sa uvádza aj druhá línia valu, ktorá dnes už nie je čitateľná.',
    status: 'visible', likes: 6, replyCount: 2, editedAt: null, createdAt: pred(300),
    post: { title: 'Nitra — Martinský vrch', slug: 'nitra-martinsky-vrch' } },
  { documentId: 'k2', content: 'Ten črep s hlaholským nápisom je z roku 2009, nález je publikovaný v zborníku zo Zalaváru.',
    status: 'waiting', likes: 12, replyCount: 5, editedAt: pred(280), createdAt: pred(400),
    post: { title: 'Blatnohrad — Pribinovo sídlo', slug: 'blatnohrad' } },
] };

const FOTO_KOMENTARE = { data: [
  { documentId: 'f1', content: 'Snímka je z jari, keď val ešte nezarástol.', status: 'visible',
    likes: 3, replyCount: 0, editedAt: null, createdAt: pred(500), fileId: 4412,
    post: { title: 'Výprava Poľské hradiská 2', slug: 'vyprava-polske-hradiska-2' } },
] };

const OBLUBENE = { data: [
  { documentId: 'o1', title: 'Wogastisburg — najvýznamnejšie hradisko Samovej ríše', slug: 'wogastisburg',
    category: { name: 'Kniežacie sídla', slug: 'kniezacie-sidla' }, coverImage: null },
  { documentId: 'o2', title: 'Arkona, Retra a iné pohanské svätyne', slug: 'arkona-retra',
    category: { name: 'Svätyne', slug: 'svatyne' }, coverImage: null },
] };

const ZDIELANE = { data: [
  { documentId: 'z1', channel: 'facebook', createdAt: pred(600), post: { title: 'Bojná — Valy', slug: 'bojna-valy' } },
] };

const FOTKY = { data: [
  { fileId: 4412, url: '/logo_hradiska_small.png', thumb: '/logo_hradiska_small.png', alt: 'Profil sondy',
    post: { title: 'Výprava Poľské hradiská 2', slug: 'vyprava-polske-hradiska-2' } },
  { fileId: 4413, url: '/logo_hradiska_small.png', thumb: '/logo_hradiska_small.png', alt: 'Val od západu',
    post: { title: 'Bojná — Valy', slug: 'bojna-valy' } },
] };

export const ODPOVEDE = [
  ['**/api/users/me*', CLEN],
  ['**/api/account/me', PROFIL],
  ['**/api/notifications/mine*', OZVY],
  ['**/api/notifications/mark-all-read', { ok: true }],
  ['**/api/blog-comments/mine-all', KOMENTARE],
  ['**/api/photo-comments/mine-all', FOTO_KOMENTARE],
  ['**/api/reactions/mine/posts', OBLUBENE],
  ['**/api/reactions/mine/photos', FOTKY],
  ['**/api/shares/mine', ZDIELANE],
];

