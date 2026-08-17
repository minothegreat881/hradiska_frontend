'use client';

/**
 * „Pridajte sa k nám" — nový návrh. Žije LEN v laboratóriu; produkčný
 * `JoinUs.tsx` sa nedotýka (v laboratóriu sa skryje cez CSS).
 *
 * TEXT JE PREVZATÝ DOSLOVA — vety, e-mail aj citát sú tie isté. Mení sa iba
 * to, ako sú podané.
 *
 * ČO BOLO ZLE NA PÔVODNEJ:
 *   • tmavý banner s ✦ a nápisom „Buďme hrdí na naše dejiny!" vyzeral ako
 *     pamätná tabuľa, nie ako výzva na spoluprácu,
 *   • päť blokov pod sebou (banner, karta, výzva, callout, formulár), každý
 *     s vlastným rámom a tieňom — sekcia pôsobila ako päť samostatných vecí,
 *   • formulár bol až úplne dole, po dvoch obrazovkách čítania,
 *   • ozdoby (drop-cap, medailóny, kurzívne citáty) ťahali pozornosť od toho
 *     jediného, čo tu má človek urobiť: poslať fotku.
 *
 * ČO ROBÍ NOVÁ (druhé kolo — sekcia mala rytmus jedného dlhého stĺpca):
 *   Dve pohyby namiesto jedného. Hore dvojica dôvod × formulár, dole cez celú
 *   šírku trojica „čo pomôže" oddelená zvislými vláskami ako v novinách.
 *   Citát nestojí na konci, kde ho nikto nedočítal — je hneď pod nadpisom
 *   a je jediné farebné miesto sekcie. Jediný rám ostáva okolo formulára;
 *   e-mail je vlásková linka so šípkou, nie ďalšia karta.
 */

import { useState } from 'react';

const CONTACT_EMAIL = 'info@hradiska.sk';

type FieldErrors = Partial<Record<'name' | 'email' | 'message', string>>;

const ASKS = [
  {
    t: 'Valy a opevnenia',
    d: 'Zábery na valy, pozostatky opevnení, budov a podobne — najmä pri hradiskách, na ktorých som ešte nebol a ku ktorým preto nemám žiadne fotky.',
  },
  {
    t: 'Nálezy v zahraničí',
    d: 'Slovanské nálezy v Maďarsku a Rakúsku — múzeá vo Visegráde, Novohrade, Ostrihome či Zalavári. Šperky, zbrane, črepy a podobne.',
  },
  {
    t: 'Máte doma nález?',
    d: 'Platí to aj pre náhodných nálezcov, ktorí majú v pivnici či na povale zaujímavé nálezy, na ktoré len sadá prach a s ktorými sa boja oficiálne pochváliť. Urobiť fotku, napísať, kde sa nález našiel, a poslať to na mail sa predsa dá.',
  },
];

export function LabJoinUs() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: FieldErrors = {};
    if (!form.name.trim()) next.name = 'Meno je povinné';
    if (!form.email.trim()) next.email = 'E-mail je povinný';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) next.email = 'Zadajte platnú adresu';
    if (!form.message.trim()) next.message = 'Správa nesmie byť prázdna';
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    // Rovnako ako pôvodný formulár správu zatiaľ NIKAM neodosiela — je to
    // atrapa aj v produkcii (viď poznámka v JoinUs.tsx).
    await new Promise(r => setTimeout(r, 700));
    setBusy(false);
    setSent(true);
  };

  const clear = (k: keyof FieldErrors) => { if (errors[k]) setErrors({ ...errors, [k]: undefined }); };

  return (
    <section className="ljoin">
      {/* Vrstevnice — ten istý motív ako v pätičke, aby to bol jeden šat a nie
          dve samostatné nápady. Vylieva sa za ľavú hranu, do prázdna vedľa textu. */}
      <div className="ljoin-rings" aria-hidden="true">
        <svg viewBox="0 0 400 400" width="100%" height="100%">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <ellipse
              key={i}
              cx="200"
              cy="200"
              rx={58 + i * 31}
              ry={42 + i * 26}
              transform={`rotate(${-16 + i * 3.5} 200 200)`}
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              opacity={0.4 - i * 0.055}
            />
          ))}
        </svg>
      </div>

      <div className="ljoin-wrap">
        {/* ── Prvý pohyb: dôvod × formulár ────────────────────────────── */}
        <div className="ljoin-top">
          <div className="ljoin-left">
            <span className="ljoin-eyebrow">Buďme hrdí na naše dejiny</span>
            <h2 className="ljoin-title">Staňte sa našimi spolupracovníkmi</h2>

            {/* Najsilnejšia veta sekcie. Na konci ju nemal kto dočítať. */}
            <blockquote className="ljoin-quote">
              Možno sami neviete, aké poklady vlastníte.
            </blockquote>

            <p className="ljoin-lead">
              Aj vy sa môžete podieľať na zveľaďovaní našej stránky. Ak máte doma
              zaujímavé fotografie z hradísk alebo obrázky a fotky nálezov, stačí sa
              s nami o ne podeliť — každý záber pomáha dopĺňať náš spoločný obraz
              o dávnej minulosti.
            </p>

            <a className="ljoin-mail" href={`mailto:${CONTACT_EMAIL}`}>
              <span className="ljoin-mail-txt">
                <span className="ljoin-mail-lbl">Pošlite fotky na</span>
                <strong>{CONTACT_EMAIL}</strong>
              </span>
              <span className="ljoin-mail-go" aria-hidden="true">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </span>
            </a>
          </div>

          {/* ── Vpravo: formulár ────────────────────────────────────────── */}
          <div className="ljoin-right">
            <div className="ljoin-card">
              {/* Po odoslaní sa formulár vymení za poďakovanie. Bez ohlásenia
                  je to pre čítačku tichá výmena — ostane stáť tam, kde bolo
                  tlačidlo, a nedozvie sa, či správa odišla. */}
              {sent ? (
                <div className="ljoin-done" role="status" aria-live="polite">
                  <div className="ljoin-done-mark" aria-hidden="true">✓</div>
                  <h3>Ďakujeme!</h3>
                  <p>Vašu správu sme prijali. Ozveme sa vám čo najskôr s ďalšími informáciami o spolupráci.</p>
                  <button type="button" className="ljoin-ghost" onClick={() => { setSent(false); setForm({ name: '', email: '', message: '' }); }}>
                    Poslať ďalšiu správu
                  </button>
                </div>
              ) : (
                <form onSubmit={submit} noValidate>
                  <h3 className="ljoin-card-t">Alebo nám napíšte rovno tu</h3>
                  <p className="ljoin-card-s">Ozveme sa vám späť na uvedený e-mail.</p>

                  <label htmlFor="lj-name">Vaše meno</label>
                  <input id="lj-name" className="ljoin-fld" autoComplete="name" placeholder="Jana Nováková"
                    value={form.name} aria-invalid={!!errors.name}
                    onChange={e => { setForm({ ...form, name: e.target.value }); clear('name'); }} />
                  {errors.name && <span className="ljoin-err">{errors.name}</span>}

                  <label htmlFor="lj-mail">E-mail</label>
                  <input id="lj-mail" className="ljoin-fld" type="email" autoComplete="email" placeholder="meno@domena.sk"
                    value={form.email} aria-invalid={!!errors.email}
                    onChange={e => { setForm({ ...form, email: e.target.value }); clear('email'); }} />
                  {errors.email && <span className="ljoin-err">{errors.email}</span>}

                  <label htmlFor="lj-msg">Vaša správa</label>
                  <textarea id="lj-msg" className="ljoin-fld" rows={5} placeholder="Popíšte, čím by ste chceli prispieť…"
                    value={form.message} aria-invalid={!!errors.message}
                    onChange={e => { setForm({ ...form, message: e.target.value }); clear('message'); }} />
                  {errors.message && <span className="ljoin-err">{errors.message}</span>}

                  <button type="submit" className="ljoin-send" disabled={busy} aria-busy={busy}>
                    {busy ? 'Odosielam…' : 'Odoslať správu'}
                  </button>
                  <p className="ljoin-note">
                    Vaše údaje použijeme len na odpoveď na túto správu. Neposkytujeme ich tretím stranám.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* ── Druhý pohyb: čo pomôže najviac ──────────────────────────────
            Tri body vedľa seba cez celú šírku. V stĺpci pod sebou to bol
            odsek navyše; v trojici sa dajú porovnať na jeden pohľad. */}
        <div className="ljoin-asks">
          <div className="ljoin-askhead">
            <span>Čo pomôže najviac</span>
            <span className="ljoin-askrule" aria-hidden="true" />
          </div>
          <div className="ljoin-ask-grid">
            {ASKS.map((a, i) => (
              <article className="ljoin-ask" key={a.t}>
                <span className="ljoin-num" aria-hidden="true">{i + 1}</span>
                <h3 className="ljoin-ask-t">{a.t}</h3>
                <p className="ljoin-ask-d">{a.d}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default LabJoinUs;
