"use client";

/**
 * Profil člena — návrh nanovo.
 *
 * PREČO OD ZAČIATKU. Doterajšia stránka bola sled kariet s odznakmi úrovní,
 * farebnými štítkami a tromi rôznymi šírkami boxov pod sebou. Vyzerala ako
 * panel aplikácie, nie ako časť encyklopédie.
 *
 * ČÍM SA NAHRÁDZA. Web je kronika, takže profil je VLASTNÁ KRONIKA ČLENA:
 * čo napísal, čo si odložil, čo sa k jeho príspevkom ozvalo. Skladba je tá
 * istá ako v archíve a v aktualitách — hlavička so značkou, register po
 * riadkoch, vlások medzi záznamami. Žiadne odznaky úrovní: koľko kto
 * napísal, je údaj, nie titul.
 *
 * Tento súbor je NÁVRH s ukážkovými údajmi, aby sa dal pozrieť bez
 * prihlásenia (`/design/profil`). Napojenie na skutočné údaje je ďalší krok.
 */

import { useState } from "react";

type Sekcia = "ozvy" | "prispevky" | "ulozene" | "fotky";

const UKAZKA = {
  meno: "Orgon",
  odkedy: "2011-06-01",
  prispevkov: 128,
  ozvy: [
    { id: 1, nove: true, kto: "Milan", co: "odpovedal na váš príspevok", kde: "Mikulčice (Kopčany)", kedy: "pred 2 hodinami",
      text: "Máte pravdu, tie základy sa dajú datovať aj podľa keramiky z vrstvy pod nimi." },
    { id: 2, nove: true, kto: "Zuzana", co: "reagovala na vašu fotografiu", kde: "Výprava Poľské hradiská 2", kedy: "včera", text: null },
    { id: 3, nove: false, kto: "Peter", co: "spomenul vás v diskusii", kde: "Bojná — Valy", kedy: "pred 4 dňami",
      text: "Orgon to kedysi popisoval presne opačne, možno vie doplniť." },
  ],
  prispevky: [
    { id: 1, kde: "Nitra", kedy: "25. 7. 2026", reakcii: 6,
      text: "K opevneniu na Martinskom vrchu — v starších správach sa uvádza aj druhá línia valu, ktorá dnes už nie je čitateľná." },
    { id: 2, kde: "Blatnohrad — Pribinovo sídlo", kedy: "19. 7. 2026", reakcii: 12,
      text: "Ten črep s hlaholským nápisom je z roku 2009, nález je publikovaný v zborníku zo Zalaváru." },
  ],
  ulozene: [
    { id: 1, nazov: "Wogastisburg — najvýznamnejšie hradisko Samovej ríše", kategoria: "Kniežacie sídla", kedy: "21. 7. 2026" },
    { id: 2, nazov: "Arkona, Retra a iné pohanské svätyne", kategoria: "Svätyne", kedy: "14. 7. 2026" },
  ],
  fotky: [
    { id: 1, kde: "Bojná — Valy", kedy: "3. 6. 2026" },
    { id: 2, kde: "Staré Město — Velehrad", kedy: "28. 5. 2026" },
  ],
};

const SEKCIE: { id: Sekcia; nazov: string; pocet: () => number }[] = [
  { id: "ozvy", nazov: "Ozvalo sa", pocet: () => UKAZKA.ozvy.length },
  { id: "prispevky", nazov: "Moje príspevky", pocet: () => UKAZKA.prispevky.length },
  { id: "ulozene", nazov: "Odložené", pocet: () => UKAZKA.ulozene.length },
  { id: "fotky", nazov: "Moje fotografie", pocet: () => UKAZKA.fotky.length },
];

const iniciala = (m: string) => m.trim().charAt(0).toUpperCase();
const rokov = (iso: string) => Math.max(1, new Date().getFullYear() - new Date(iso).getFullYear());

export function LabProfil() {
  const [sekcia, setSekcia] = useState<Sekcia>("ozvy");
  const u = UKAZKA;
  const novych = u.ozvy.filter((o) => o.nove).length;

  return (
    <div className="lprof">
      <div className="container lprof-in">

        <header className="lprof-hlava">
          <span className="lprof-pecat" aria-hidden="true">{iniciala(u.meno)}</span>
          <div>
            <h1 className="lprof-meno">{u.meno}</h1>
            <p className="lprof-udaje">
              <b>{u.prispevkov}</b> príspevkov · <b>{rokov(u.odkedy)}</b> rokov v kronike
            </p>
          </div>
          <button type="button" className="lprof-nastavenia">Nastavenia účtu</button>
        </header>

        <div className="lprof-telo">
          <nav className="lprof-register" aria-label="Časti profilu">
            {SEKCIE.map((s) => (
              <button
                key={s.id}
                type="button"
                className={sekcia === s.id ? "is-on" : undefined}
                aria-current={sekcia === s.id ? "page" : undefined}
                onClick={() => setSekcia(s.id)}
              >
                <span className="lprof-reg-nazov">{s.nazov}</span>
                <span className="lprof-reg-pocet">{String(s.pocet()).padStart(2, "0")}</span>
                {s.id === "ozvy" && novych > 0 && <span className="lprof-nove" aria-label={novych + " nové"} />}
              </button>
            ))}
          </nav>

          <section className="lprof-obsah">
            {sekcia === "ozvy" && (
              <ul className="lprof-zoznam">
                {u.ozvy.map((o) => (
                  <li key={o.id} className={o.nove ? "lprof-zaznam is-nove" : "lprof-zaznam"}>
                    <div className="lprof-riadok">
                      <span className="lprof-kto">{o.kto}</span>
                      <span className="lprof-co">{o.co}</span>
                      <span className="lprof-kedy">{o.kedy}</span>
                    </div>
                    <a className="lprof-kde" href="#">{o.kde}</a>
                    {o.text && <p className="lprof-citat">{o.text}</p>}
                  </li>
                ))}
              </ul>
            )}

            {sekcia === "prispevky" && (
              <ul className="lprof-zoznam">
                {u.prispevky.map((p) => (
                  <li key={p.id} className="lprof-zaznam">
                    <div className="lprof-riadok">
                      <a className="lprof-kde" href="#">{p.kde}</a>
                      <span className="lprof-kedy">{p.kedy}</span>
                    </div>
                    <p className="lprof-citat">{p.text}</p>
                    <span className="lprof-reakcie">{p.reakcii} reakcií</span>
                  </li>
                ))}
              </ul>
            )}

            {sekcia === "ulozene" && (
              <ul className="lprof-zoznam">
                {u.ulozene.map((z) => (
                  <li key={z.id} className="lprof-zaznam">
                    <div className="lprof-riadok"><a className="lprof-nazov" href="#">{z.nazov}</a></div>
                    <div className="lprof-riadok">
                      <span className="lprof-znacka">{z.kategoria}</span>
                      <span className="lprof-kedy">odložené {z.kedy}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {sekcia === "fotky" && (
              <ul className="lprof-zoznam">
                {u.fotky.map((f) => (
                  <li key={f.id} className="lprof-zaznam">
                    <div className="lprof-riadok">
                      <a className="lprof-kde" href="#">{f.kde}</a>
                      <span className="lprof-kedy">{f.kedy}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default LabProfil;
