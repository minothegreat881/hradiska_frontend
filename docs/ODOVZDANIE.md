# Odovzdanie – vetva `zaklad-web` (14. 11. 2026)

Nič z tohto som nevykonal. Postup je pre toho, kto bude nasadzovať. Poradie je záväzné:
**backend → web → editor vzhľadu → mobilná aplikácia.**

## 0. Pred nasadením

- Nasadzovať mimo času, keď pracuje redaktor. Pri nasadení webu sa stará karta administrácie rozbije, kým ju redaktor neobnoví.
- Záloha DB: `hradiska-zaloha.timer` beží denne. Pred nasadením ešte ručne
  `ssh -i ~/.ssh/hetzner_hradiska root@188.245.47.29 "cp /opt/hradiska/.tmp/data.db /var/backups/hradiska/data.db.pred-zakladom"`.

## 1. Backend (`hradiska_backend`, vetva `zaklad-web` → `master`)

**Čo sa mení:** `src/api/vzhlad-webu/typy.ts` a `kontrola.ts` (nové voliteľné polia `domov.odkazy`, `cinnost.tlacidla`,
`cinnost.odkazy`) a test `scripts/kontrola/vzhlad-volne-odkazy.mjs`. Panel (`src/admin`) sa nemení.
Commity 461521a a f5fdbed na `master` 1dfd4bd.

**Prečo prvý:** editor vzhľadu po nasadení webu doplní do konceptu nové zoznamy. Stará kontrola na serveri neznáme kľúče
odmieta, takže uloženie konceptu by zlyhalo.

Postup:

1. Lokálne (`hradiska-strapi`):
   ```
   git switch master
   git merge --ff-only zaklad-web
   git push origin master
   ```
2. Na serveri:
   ```
   ssh -i ~/.ssh/hetzner_hradiska root@188.245.47.29
   cd /opt/hradiska
   git log --oneline -1                                   # zapísať pôvodný hash (čaká sa 1dfd4bd)
   rsync -a --exclude build/uploads dist/ /root/hradiska-dist-pred-zakladom/
   git pull
   git diff --stat 1dfd4bd HEAD -- src/admin              # musí byť prázdne
   NODE_ENV=production systemd-run --scope -p MemoryMax=1500M npm run build
   ```
   - Stavba panela môže na serveri spadnúť na pamäť. API sa skompiluje skôr („Compiling TS“), a keďže sa panel nemení,
     vráti sa pôvodný panel:
     ```
     rm -rf dist/build && cp -a /root/hradiska-dist-pred-zakladom/build dist/build
     rm -rf dist/build/uploads                              # build kopíruje public/ – 4,8 GB fotiek navyše
     systemctl restart hradiska
     ```

**Overenie:**
```
systemctl is-active hradiska                                              # active
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:1337/api/vzhlad-webu   # 200
grep -c volneOdkazy dist/src/api/vzhlad-webu/kontrola.js                  # aspoň 1 = nová kontrola beží
journalctl -u hradiska -n 50 --no-pager                                   # bez chýb
```
Potom otvoriť terajší web (main) a administráciu. Musia fungovať ako pred nasadením, starý web nové polia nepoužíva.

**Vrátenie:**
```
cd /opt/hradiska
git checkout 1dfd4bd
rsync -a --delete --exclude build/uploads /root/hradiska-dist-pred-zakladom/ dist/
systemctl restart hradiska
```
Potom na `master` `git revert f5fdbed 461521a` a push. Vrátiť backend sa smie, len kým nie je zverejnený vzhľad
s novými poľami (krok 3). Inak by stará kontrola odmietla aj zverejnený vzhľad.

## 2. Web (`hradiska_frontend`, vetva `zaklad-web` → `main` → Vercel)

1. Lokálne:
   ```
   git switch main
   git merge --no-ff zaklad-web
   git push origin main
   ```
   - Vercel nasadí produkciu sám.
   - `public/sitemap.xml` sa pri stavbe prepisuje. Ak ho `git status` ukáže zmenený len v koncoch riadkov, necommitovať.
2. Vercel → projekt `webdesignforhradiskask` → Deployments → posledné nasadenie musí byť **Ready**.

**Overenie (na adrese ukážky pre klienta):**
- domovská stránka: pod hľadaním rad 5 obrázkových odkazov (K2), pod „Čo združenie robí“ 2 tlačidlá a 2 odkazy (K3);
- článok s veľkou diskusiou `/blog/nelegalny-detektorizmus-skodi-nasej-historii`:
  - diskusia zbalená s počtom 209, `#discussion` ju rozbalí;
  - pod článkom hľadanie, rad K2, mapa, činnosť;
- `/en/` a `/de/`: `curl -s <adresa>/de/ | grep -o '<html lang="[a-z]*"'` → `de`;
- `/category/aktuality`: tlačidlo „Zobraziť ďalšie“; `/blog/neexistuje`: nadpis a `noindex`;
- konzola prehliadača bez chýb.

Redaktorom povedať, nech obnovia administráciu (Ctrl+F5).

**Vrátenie:**
- **Hneď:** Vercel → Deployments → predchádzajúce produkčné nasadenie → **Instant Rollback**.
- **Natrvalo:**
  ```
  git revert -m 1 <hash zlúčenia>
  git push origin main
  ```
- Backend netreba vracať, nové polia sú voliteľné a starý web ich ignoruje.

## 3. Editor vzhľadu (administrácia → Vzhľad webu)

1. Otvoriť Vzhľad webu. Editor doplní do konceptu rad odkazov pod hľadaním a tlačidlá a odkazy činnosti zo základu.
   Ukáže ich ako neuložené zmeny.
2. Prejsť K2 a K3 na plátne (SK, EN, DE), prípadne doplniť chýbajúce podklady (otázky pre Petra v správe).
3. **Uložiť**, potom **Zverejniť**.

**Overenie:**
- História zverejnení má novú verziu;
- `curl -s https://<web>/strapi/api/vzhlad-webu | grep -o '"odkazy"' | head -1` vráti `"odkazy"`;
- domovská stránka a článok vyzerajú ako po kroku 2, odteraz z databázy;
- v EN a DE vedú odkazy K2 na anglické a nemecké články.

**Vrátenie:** História zverejnení → predchádzajúca verzia → Obnoviť do konceptu → Zverejniť.

## 4. Mobilná aplikácia

**Nič nestavať do obchodu.**
- Appka dostáva web cez vzduch (OTA). Nový balík vzniká príkazom `npm run app:sync` a nahrá sa do
  `/opt/hradiska/public/app/` spolu s `aktualizacia.json` (postup v `docs/MOBILNA-APLIKACIA.md`, kap. 5).
- Kým sa nový balík nenahrá, telefóny bežia na starom webe. Ten so serverom po kroku 1 funguje ďalej.
- Staré balíky nový tvar vzhľadu prečítajú bez pádu (`test-odolnost.mjs` 19 z 19).

**Overenie:**
- na emulátore `hradiska` (`emulator -avd hradiska`) spustiť appku, zavrieť ju a spustiť znova;
- domovská stránka má rad K2;
- vydaná verzia balíka je na serveri v `/opt/hradiska/public/app/aktualizacia.json` (stránka `/aplikacia` ukazuje
  verziu inštalačného balíka, nie balíka cez vzduch).

**Vrátenie:**
- Ak nový balík do 10 s nepotvrdí štart (`notifyAppReady`), appka sa vráti na predošlý sama.
- Inak nahrať predošlý zip a `aktualizacia.json` (záloha v `/opt/hradiska/public/app/` pred nahratím).

## 5. Testy editora a mobilu (spustíte sami)

Oba bežia **len lokálne** proti kópii DB v `hradiska-strapi` (súbor `.env.lokalne-vzhlad` a `.tmp/data.db` tam už sú).
Test mení lokálnu DB a na konci ju vráti. Pred spustením je aj tak dobré urobiť zálohu.
Backend musí bežať s kódom vetvy, lebo stará kontrola by nové polia odmietla.

**Okno 1 – backend s kódom vetvy** (Git Bash):
```
cd C:/Users/milan/Desktop/Git-Projects/hradiska-strapi
git status --short                                   # musí byť čisté
cp .tmp/data.db .tmp/data.db.pred-testami
git switch --detach zaklad-web                       # vetvu drží pracovný strom hradiska-strapi-zaklad, preto --detach
ENV_PATH=.env.lokalne-vzhlad node node_modules/@strapi/strapi/bin/strapi.js develop
```

**Okno 2 – web vetvy:**
```
cd C:/Users/milan/Desktop/Git-Projects/hradiska-zaklad
VITE_STRAPI_URL=http://localhost:1337 npx vite --port 5190 --strictPort
```

**Okno 3 – testy** (keď backend vypíše „Strapi started“ a web beží na :5190):
```
cd C:/Users/milan/Desktop/Git-Projects/hradiska-zaklad
node scripts/vzhlad/test-editor.mjs --be C:/Users/milan/Desktop/Git-Projects/hradiska-strapi
node scripts/vzhlad/test-mobil.mjs  --be C:/Users/milan/Desktop/Git-Projects/hradiska-strapi
```
- Výsledky:
  - `scripts/vzhlad/vystup/test-editor-vysledok.txt`;
  - `scripts/vzhlad/vystup/test-mobil-vysledok.txt`;
  - snímky v `scripts/vzhlad/vystup/snimky-*`.
- Čaká sa 100 z 100 a „tabuľky s iným obsahom: žiadne“.

**Po testoch:**
1. Zastaviť backend (Ctrl+C) a web.
2. Vrátiť backend na master:
   ```
   cd C:/Users/milan/Desktop/Git-Projects/hradiska-strapi
   git switch master
   ```
3. Ak test hlási rozdiel v tabuľkách, vrátiť DB zo zálohy:
   ```
   cp .tmp/data.db.pred-testami .tmp/data.db
   rm -f .tmp/data.db-wal .tmp/data.db-shm
   ```

## 6. Čo z K2 a K3 neuvidno na ukážke pre klienta, kým nie je nasadený backend

Ukážka pre klienta = `main` na Verceli. Platí pre stav, keď je web nasadený (krok 2), ale backend ešte nie (krok 1).
Iné poradie neodporúčam.

**Uvidno:**
- K2: 5 obrázkových odkazov pod hľadaním, na domovskej aj pod článkom;
- K3: 2 tlačidlá a 2 textové odkazy pod činnosťou.

Web ich kreslí zo základu v kóde. Anglické a nemecké adresy článkov si web dohľadá sám.

**Neuvidno:**
- **Skryté položky:**
  - tlačidlo „Naše ďalšie blogy“;
  - odkazy „Archeoskanzeny“ a „Odporúčané stránky k dejinám Slovanov“.

  Nemajú cieľ ani obrázok a čakajú na Petra. V editore sú, na webe nie.
- **Úpravy K2 a K3 z editora:**
  - so starým backendom sa koncept s novými zoznamami neuloží;
  - pozor: neuloží sa ani žiadna iná zmena vzhľadu, lebo editor nové zoznamy do konceptu doplní vždy.

  Preto backend ide prvý.
- **Ochrana obrázkov K2 a K3 v knižnici médií:** starý server o nich nevie, takže pri mazaní fotky v Médiách nevaruje,
  že ju používa vzhľad. Obrázky základu sú dnes cesty `/uploads/…`; zmazaním súboru by odkaz stratil obrázok a skryl sa.

Na náhľade vetvy (`zaklad-web`) to je rovnaké: náhľad číta ostrý backend len na čítanie, takže K2 a K3 kreslí zo základu.

## 7. Commity a ako ich vrátiť

Každý commit sa dá vrátiť samostatne cez `git revert <hash>`. Zoznam vypíše `git log --oneline main..zaklad-web`.
Revertovať sa ide od najnovšieho.

| commit | čo | pri vrátení |
|---|---|---|
| 5dd3cd9 | merací projekt (zaklad.projekt.json, CLAUDE.md) | – |
| 44f6582 | K1 – K5 (web, editor, tvar údajov) | backend 461521a ostane kompatibilný (polia sú voliteľné) |
| 3e6446d | dávka 1: fokus | – |
| 6af76e1 | dávka 2: mechanické odporúčania | 05aa7a6 je jej doplnok |
| 1671dc6 | dávka 3: kontrast | – |
| 728c843 | úloha 3 bod 2: main, preskočenie, prepínač jazyka | – |
| 0ee3ab3 | úloha 3 bod 7: neexistujúci článok, tlačidlo 404 | – |
| 460c7c1 | úloha 3 bod 1: „Aktuality“ raz v mobilnom menu | – |
| 3f93661 | úloha 3 bod 4: jazyk dokumentu | – |
| 618f4ad | úloha 3 bod 3: mapa stránok a prerender | kostry /en a /de z neho používa bod 4 |
| 16de72d | úloha 3 bod 5: „Zobraziť ďalšie“ | – |
| e2ef6d5 | úloha 3 bod 6: vloženia po kliknutí, nocookie, cookie lišta | 56c1e72 je jeho oprava |
| 4d00db6 | úloha 3 bod 8: hľadanie | – |
| 4847b7f | úloha 3 bod 9: service worker | – |
| b4997c6 | úloha 3 bod 10: formulár → e-mail | – |
| d76c728 | zjednotenie: zaoblenia, farby článku, docs/STYL.md | – |
| 05aa7a6 | dávka 2 doplnok: pobočný stĺpec | – |
| 1b7e9c6 | dávka 4: dotykové ciele | – |
| 56c1e72 | bod 6 oprava: „Súhlasím / Nesúhlasím“ na mobile | – |
| 1305522 | oprava zhoršení: náhľad vloženia, omrvinky, znížený pohyb | – |
| fe1af9a | oprava zhoršenia: nemecký titulok | – |
| 00cc263 | konečné meranie: správa, posudok, STAV | – |
| 7d2b63e | mapa vrátená 1:1 ako main | revert by vrátil zmeny mapy z dávok 1 – 3 – zadávateľ ich nechce |
| 90e7fbf | bod 2b: rozmery obrázkov | – |
| 5325094 | bod 2c: ciele pod 24 px | – |
| (tento) | dokumenty: K1, odovzdanie, STYL, správa | – |
| BE 461521a | backend: tvar voľných odkazov | vrátiť až po vrátení webu 44f6582 |
| BE f5fdbed | backend: test servera | – |

Nástroj zaklad-webov (vlastný repozitár, `main`):
- d65f7f7 – kontrast bez riadkov skrytých orezaním;
- 30304a7 – Tab od začiatku dokumentu;
- 883501b – ZMENY.md.

Každý má skúšku na neutrálnej stránke.
