# 🗺️ Mapbox 3D Mapa Hradísk - Návod na Nastavenie

## 📋 Prehľad

Aplikácia obsahuje pokročilú 3D interaktívnu mapu Slovenska s 50+ hradmi, hradiskami a zámkami. Mapa používa Mapbox GL JS pre 3D vizualizáciu terénu.

## 🔑 Ako získať Mapbox API kľúč

1. **Vytvorte Mapbox účet:**
   - Prejdite na: https://account.mapbox.com/auth/signup/
   - Zaregistrujte sa pomocou e-mailu alebo GitHub účtu
   - Účet je **ZDARMA** pre bežné použitie (50,000 zobrazení mesačne)

2. **Získajte API token:**
   - Po prihlásení prejdite na: https://account.mapbox.com/access-tokens/
   - Skopírujte váš **Default public token**
   - Alebo vytvorte nový token s názvom "Hradiska-App"

3. **Nastavte API kľúč v aplikácii:**
   - Otvorte súbor `/components/MapboxMap.tsx`
   - Nájdite riadok: `mapboxgl.accessToken = 'YOUR_MAPBOX_TOKEN';`
   - Nahraďte `'YOUR_MAPBOX_TOKEN'` vaším skutočným API kľúčom
   
   Príklad:
   ```typescript
   mapboxgl.accessToken = 'pk.eyJ1IjoibXl1c2VybmFtZSIsImEiOiJjbHh4eHh4eHgifQ.xxxxxxxxxxxxx';
   ```

## ✨ Funkcionality

### Základné ovládanie:
- **🖱️ Zoom:** Kolieskom myši alebo tlačidlami +/-
- **🧭 Otáčanie:** Shift + ťahanie myšou alebo dvoma prstami (touchpad)
- **⛰️ 3D terén:** Tlačidlo "3D" pre zapnutie/vypnutie 3D terénu
- **🔄 Reset:** Tlačidlo s ikonou rotácie vráti pohľad na Slovensko
- **🎲 Náhodný hrad:** Tlačidlo s ikonou Shuffle zobrazí náhodný hrad

### Filtre a vyhľadávanie:
- **🔍 Vyhľadávanie:** Hľadajte podľa názvu hradu, okresu alebo kraja
- **🎨 Filter podľa typu:**
  - 🏰 Hrady (červená)
  - 🏛️ Hradiská (oranžová)
  - 🏰 Zámky (fialová)
- **⭐ UNESCO pamiatky:** Označené zlatým rámčekom

### Interaktivita:
- **Kliknutie na marker:** Zobrazí popup s informáciami
- **Detailné info:** Tlačidlo "Viac informácií" otvorí modal s kompletným popisom
- **Fly-to animácia:** Plynulý prelet k vybranej lokalite

## 📊 Dáta

### Aktuálne lokality (50+):
- **Bratislavský kraj:** Bratislavský hrad, Devín, Pajštún, Červený Kameň...
- **Trnavský kraj:** Beckov, Čachtice, Smolenice, Branč...
- **Trenčiansky kraj:** Trenčín, Strečno, Lietava, Bojnice...
- **Nitriansky kraj:** Levice, Topoľčany, Gýmeš, Hrušov...
- **Žilinský kraj:** Orava, Budatín, Stará Ľubovňa, Sklabina...
- **Banskobystrický kraj:** Zvolen, Ľupča, Fiľakovo, Šomoška, Banská Štiavnica...
- **Prešovský kraj:** Spišský hrad (UNESCO), Kapušany, Plaveč, Šariš...
- **Košický kraj:** Krásna Hôrka, Jasov, Turňa, Parič...
- **Hradiská:** Bojná, Molpír, Pobedim, Ducové, Majcichov...

### Štruktúra dát:
Každá lokalita obsahuje:
- ✅ Názov a typ (hrad/hradisko/zámok)
- 📍 GPS súradnice (longitude, latitude)
- 📜 Detailný popis
- 📅 Obdobie vzniku
- 🏗️ Súčasný stav
- 📍 Okres a kraj
- ⛰️ Nadmorská výška
- ⭐ UNESCO status (ak je relevantné)

## 🛠️ Technické detaily

### Mapbox nastavenia:
- **Štýl mapy:** `satellite-streets-v12` (satelitný podklad s popismi)
- **3D terén:** Mapbox Terrain DEM s exaggeration 1.7
- **Centrum mapy:** 19.5°E, 48.7°N (stred Slovenska)
- **Počiatočný zoom:** 7
- **Sky layer:** Atmosférický efekt pre realistický vzhľad

### Používané knižnice:
- `mapbox-gl` - 3D mapa a vizualizácia
- `lucide-react` - Ikony pre UI
- `motion/react` - Animácie (predtým Framer Motion)

### Optimalizácie:
- ✅ Markers sú cached v refs
- ✅ Filtering prebieha len pri zmene filtrov
- ✅ Popups sú lazy-loaded
- ✅ 3D terén je voliteľne vypínateľný
- ✅ Responzívny dizajn pre desktop aj mobil

## 🎨 Dizajn

Mapa používa historický/archeologický štýl:
- **Farby:** Tmavé tóny (stone-900) s jantárovými akcentami
- **Typografia:** Georgia serif pre autentický akademický vzhľad
- **Markery:** Farebne odlíšené podľa typu s hover efektmi
- **Modaly:** Glassmorphism s backdrop blur
- **Animácie:** Smooth fly-to transitions

## 🚀 Ďalšie možnosti rozšírenia

Môžete pridať:
1. **Fotografie hradov** - pridať `fotka` URL do dát
2. **Historické obrázky** - slider v modale
3. **Plánovanie trás** - integrácia Mapbox Directions API
4. **Heatmapa** - clustering pre hustejšie oblasti
5. **Timeline slider** - filtrovanie podľa storočia
6. **Export** - PDF/JPG export pohľadu
7. **Sharing** - URL parametre pre konkrétny hrad
8. **Viac lokalít** - pridať ďalších 50+ hradov

## 📝 Pridanie nového hradiska

Otvorte `/data/hradiska.ts` a pridajte nový objekt:

```typescript
{
  name: "Názov hradu",
  type: "hrad", // alebo "hradisko" alebo "zamok"
  coordinates: [longitude, latitude], // napr. [19.5, 48.7]
  description: "Detailný popis...",
  rok: "13. storočie",
  stav: "ruiny",
  okres: "Názov okresu",
  kraj: "Názov kraja",
  nadmorskaVyska: 500,
  unesco: false // alebo true pre UNESCO pamiatky
}
```

## 🆘 Riešenie problémov

### Mapa sa nezobrazuje:
1. Skontrolujte, či ste nastavili Mapbox API kľúč
2. Otvorte konzolu (F12) a skontrolujte chybové hlášky
3. Uistite sa, že máte pripojenie na internet

### Markery sa nezobrazujú:
1. Skontrolujte, či sú vybrané typy v filtri
2. Vyskúšajte reset view
3. Skontrolujte konzolu pre chyby

### 3D terén nefunguje:
1. 3D terén vyžaduje moderný prehliadač (Chrome, Firefox, Safari, Edge)
2. Vyskúšajte vypnúť a zapnúť 3D tlačidlom
3. Skontrolujte, či nie je problém s GPU akceleráciou

## 📚 Užitočné odkazy

- **Mapbox dokumentácia:** https://docs.mapbox.com/mapbox-gl-js/
- **Mapbox príklady:** https://docs.mapbox.com/mapbox-gl-js/example/
- **Mapbox pricing:** https://www.mapbox.com/pricing (50k free views/mesiac)
- **GPS koordináty:** https://www.gps-coordinates.net/ (pre nové lokality)

---

**Poznámka:** Tento súbor je len dokumentácia. Pre fungovanie mapy musíte nastaviť Mapbox API kľúč v `/components/MapboxMap.tsx`.
