# Hradiska.sk - Archeologické lokality Slovenska

Moderná webová aplikácia pre prehľadávanie a objavovanie archeologických lokalít na Slovensku. Postavená s dôrazom na UI/UX dizajn, interaktívnosť a prístupnosť.

## 🎯 Funkcie

- **Komplexná databáza lokalít** - Hradiská, sídliská, pohrebiská a kultové miesta
- **Pokročilé vyhľadávanie** - Filtre podľa obdobia, regiónu a typu lokality
- **Interaktívna mapa** - Vizualizácia lokalít s klastrovacím systémom
- **Blog s článkami** - Výskumy, objavy a odborné poznatky
- **Detailné informácie** - Nálezy, bibliografia, galéria obrázkov
- **Dark mode** - Automatický prepínač podľa systému

## 🚀 Rýchly štart

### Spustenie aplikácie

Aplikácia je pripravená na priamu integráciu do Next.js 14 projektu. Všetky komponenty sú standalone a používajú mock dáta.

```bash
# Aplikácia beží ako React single-page app
# Všetky závislosti sú už načítané
```

### Štruktúra projektu

```
/
├── components/          # React komponenty
│   ├── NavBar.tsx      # Navigácia s mega-menu
│   ├── HeroSearch.tsx  # Vyhľadávací komponent
│   ├── FacetFilters.tsx # Filtrovací panel
│   ├── SiteCard.tsx    # Karta lokality
│   ├── ArticleCard.tsx # Karta článku
│   ├── ResultsGrid.tsx # Mriežka výsledkov
│   ├── MapView.tsx     # Interaktívna mapa
│   └── FilterDrawer.tsx # Mobilný filter drawer
├── pages/              # Stránky aplikácie
│   ├── HomePage.tsx    # Domovská stránka
│   ├── SearchPage.tsx  # Vyhľadávanie lokalít
│   ├── SiteDetailPage.tsx # Detail lokality
│   ├── BlogPage.tsx    # Zoznam článkov
│   ├── ArticlePage.tsx # Detail článku
│   └── AboutPage.tsx   # O projekte
├── data/               # Mock dáta
│   └── mock-data.ts    # Lokality, články, helper funkcie
├── styles/             # Štýly
│   └── globals.css     # Design tokens + Tailwind
└── App.tsx             # Hlavná aplikácia + routing
```

## 🎨 Dizajn systém

### Farby

Aplikácia používa zemité neutrálne tóny s modrým akcentom:

- **Stone** (50-950): Neutrálna sivá škála pre UI
- **Clay** (50-900): Teplá terakotová paleta pre archeológiu
- **Sky** (50-900): Modrý akcent pre interaktívne elementy

### Typografia

- **Sans-serif (UI)**: System fonts pre modernú čitateľnosť
- **Serif (Články)**: Georgia pre elegantné čítanie článkov
- **Fluid škála**: 12-56px s responsívnym clamp()

### Spacing

8-bodový grid systém: 2px, 4px, 8px, 12px, 16px, 24px, 32px, 40px, 48px, 64px, 80px, 96px

### Border radius

- `sm`: 8px
- `md`: 12px  
- `lg`: 16px
- `xl`: 24px
- `2xl`: 32px (default pre karty)

### Tiene

Jemné tiene s nízkym kontrastom pre depth bez rušivosti.

## 📝 Prispôsobenie

### Zmena farieb

Editujte súbor `/styles/globals.css`:

```css
@theme {
  /* Primárna farba (akcent) */
  --color-primary: var(--color-sky-600);
  
  /* Pozadie */
  --color-background: #ffffff;
  
  /* Texty */
  --color-text: var(--color-stone-900);
}
```

### Pridanie nových lokalít

Editujte `/data/mock-data.ts`:

```typescript
export const mockSites: Site[] = [
  {
    id: '9',
    slug: 'nova-lokalita',
    name: 'Nová lokalita',
    period: ['bronz'],
    region: 'zapadne',
    type: 'sidlisko',
    district: 'Trnava',
    coordinates: { lat: 48.3774, lng: 17.5855 },
    description: 'Popis lokality...',
    findings: ['Nález 1', 'Nález 2'],
    images: [],
    bibliography: ['Ref 1', 'Ref 2'],
  },
  // ... existujúce lokality
];
```

### Pridanie nových období/regiónov/typov

V `/data/mock-data.ts` rozšírte enums a pole:

```typescript
export const periods = [
  // ... existujúce obdobia
  { value: 'nove-obdobie', label: 'Nové obdobie' },
];
```

## 🎭 Komponenty

### NavBar
Sticky navigácia s mega-menu, dark mode prepínačom a mobilným menu.

**Props:** Žiadne (standalone)

**Funkcie:**
- Automatický dark mode podľa systému
- Mega-menu pre obdobie/región/typ
- Mobilné hamburger menu
- Klávesové skratky (/, Esc)

### HeroSearch
Veľký vyhľadávací komponent s live suggestions.

**Props:** Žiadne (standalone)

**Funkcie:**
- Real-time vyhľadávanie
- Keyboard navigation (↑↓, Enter, Esc)
- Klávesová skratka / na fokus
- Suggestions pre lokality a články

### FacetFilters
Filtrovací panel s chip-based výberom.

**Props:**
- `selectedPeriods`, `selectedRegions`, `selectedTypes`
- `onPeriodToggle`, `onRegionToggle`, `onTypeToggle`
- `onClearAll`, `resultCount`

**Funkcie:**
- Multi-select filtre
- Chip badges s počtom
- Clear all funkcia
- Aria live regions

### SiteCard / ArticleCard
Kartičky pre zobrazenie lokalít a článkov.

**Props:** `site: Site` / `article: Article`

**Funkcie:**
- Hover elevation animácia
- Featured badge
- Metadata (obdobie, región, autor, dátum)
- Responsive design

### MapView
Interaktívna mapa s markermi lokalít.

**Props:**
- `sites: Site[]`
- `selectedSiteId?: string`
- `onSiteSelect?: (id) => void`

**Funkcie:**
- Clustering pre blízke lokality
- Expandable do fullscreen
- Animované markery
- Legenda

### FilterDrawer
Mobilný bottom sheet pre filtre.

**Props:** Rovnaké ako FacetFilters + `isOpen`, `onClose`

**Funkcie:**
- Drag-to-close gesture support
- Backdrop blur
- Spring animácia
- Sticky footer s počtom výsledkov

## ♿ Prístupnosť

- **ARIA labels** - Všetky interaktívne elementy
- **Focus rings** - Viditeľné pri navigácii klávesnicou
- **Skip to content** - Preskočenie navigácie
- **Live regions** - Oznamovanie zmien pre screen readery
- **Klávesové skratky**:
  - `/` - Fokus na vyhľadávanie
  - `Esc` - Zatvoriť modály
  - `↑↓` - Navigácia v suggestions
  - `Enter` - Potvrdiť výber

## 📱 Responzivita

- **Mobile-first** prístup
- **Breakpointy**: sm (640px), md (768px), lg (1024px), xl (1280px), 2xl (1536px)
- **Desktop**: Split layout (sidebar + content)
- **Mobile**: Bottom sheet filtre, stacked layout
- **Tablet**: Adaptívny grid

## 🎬 Animácie (Motion)

Všetky animácie používajú Motion (Framer Motion) s dôrazom na výkon:

- **Fade + slide** na mount (< 200ms)
- **Hover lift** na kartách (scale 1.01)
- **Spring animácie** pre drawery
- **Layout animations** pre taby
- **Stagger** pre zoznamy (delay 50ms)

## 🔧 Technológie

- **React** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS 4.0** - Utility-first styling
- **Motion** (Framer Motion) - Animácie
- **Lucide React** - Ikony
- **shadcn/ui** - Komponentová knižnica (ak potrebné)

## 📦 Mock dáta

Aplikácia obsahuje mock dáta pre:

- **8 archeologických lokalít** (Devín, Bratislavský hrad, Nitriansky hrad, Spišský hrad, Bojná, Pobedim, Lužianky, Havránok)
- **4 blogové články** s kompletným obsahom
- **9 historických období** (Paleolit → Stredovek)
- **5 regiónov** Slovenska
- **6 typov lokalít**

## 🎯 Budúce rozšírenia

Pre integráciu s reálnym backendom:

1. **API integrácia** - Nahradiť mock dáta volaniami API
2. **Autentifikácia** - Prihlásenie pre správcov
3. **CMS** - Admin rozhranie pre správu obsahu
4. **Skutočná mapa** - Integrácia Leaflet/MapLibre
5. **Galéria** - Lightbox s real obrázkami
6. **Vyhľadávanie** - Full-text search s Elasticsearch
7. **Export** - PDF/CSV export lokalít
8. **Sharing** - Social media integrácia
9. **i18n** - Viacjazyčná podpora

## 📄 Licencia

Ukážkový projekt pre demonstráciu UI/UX dizajnu a frontend implementácie.

## 👤 Kontakt

Pre otázky a feedback: info@hradiska.sk

---

**Poznámka:** Toto je frontend-only implementácia s mock dátami. Pre produkčné nasadenie je potrebné implementovať backend, databázu a real API.
