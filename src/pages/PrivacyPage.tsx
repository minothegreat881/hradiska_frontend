'use client';

import { openCookieSettings } from '../lib/consent';

const H2: React.CSSProperties = { fontSize: 18, fontWeight: 600, color: 'var(--hr-ink)', marginBottom: 8 };
const UL: React.CSSProperties = { paddingLeft: 20, marginTop: 8 };
const LINK: React.CSSProperties = { color: 'var(--hr-accent-deep)', textDecoration: 'underline' };

export function PrivacyPage() {
  return (
    <div className="min-h-screen parchment relative">
      <div
        className="w-full h-3 bg-repeat-x relative z-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='12' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 6 L25 0 L50 6 L75 0 L100 6' stroke='%237d4f1d' stroke-width='2' fill='none'/%3E%3C/svg%3E")`,
          opacity: 0.3,
        }}
      />
      <div className="container mx-auto px-4 max-w-3xl py-12 md:py-16">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-3 opacity-60" aria-hidden="true">
            <span className="h-px w-16" style={{ background: 'linear-gradient(90deg, transparent, var(--hr-line-quiet))' }} />
            <span style={{ color: 'var(--hr-line-quiet)', fontSize: 14, lineHeight: 1 }}>⚜</span>
            <span className="h-px w-16" style={{ background: 'linear-gradient(90deg, var(--hr-line-quiet), transparent)' }} />
          </div>
          <h1
            className="font-semibold tracking-wide"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 'clamp(28px, 4vw, 40px)', color: 'var(--hr-ink)', letterSpacing: '0.04em' }}
          >
            Ochrana osobných údajov
          </h1>
          <p className="mt-3 text-sm" style={{ color: 'var(--hr-clear-text)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
            Posledná aktualizácia: 22. júla 2026
          </p>
        </div>

        <div
          className="prose-content space-y-5"
          style={{
            background: 'var(--hr-surface)',
            border: '1px solid var(--hr-line)',
            borderRadius: 12,
            padding: '32px',
            boxShadow: 'var(--hr-shadow-sm)',
            color: 'var(--hr-body)',
            fontFamily: 'var(--font-serif, Georgia, serif)',
            fontSize: 15,
            lineHeight: 1.7,
          }}
        >
          <section>
            <h2 style={H2}>1. Prevádzkovateľ</h2>
            <p>
              Prevádzkovateľom je občianske združenie <strong>Hradiska.sk</strong>, ktoré spracúva osobné
              údaje v súlade s nariadením <strong>GDPR (EÚ) 2016/679</strong> a zákonom č. 18/2018 Z. z.
              o ochrane osobných údajov. Kontakt:{' '}
              <a href="mailto:info@hradiska.sk" style={LINK}>info@hradiska.sk</a>.
            </p>
            <p style={{ marginTop: 8, fontSize: 13, fontStyle: 'italic', color: 'var(--hr-clear-text)' }}>
              (Identifikačné a registračné údaje združenia — IČO, sídlo a registračné číslo — sa dopĺňajú.)
            </p>
          </section>

          <section>
            <h2 style={H2}>2. Aké údaje spracúvame</h2>
            <p><strong>a) Používateľské konto</strong> (pri registrácii): e-mailová adresa, meno alebo prezývka a heslo (uložené výhradne v zašifrovanej podobe). Konto slúži na prihlásenie a komentovanie.</p>
            <p style={{ marginTop: 8 }}><strong>b) Komentáre</strong>: meno alebo prezývka, obsah komentára a dátum. Komentovať môžu iba prihlásení používatelia; e-mail sa preberá z konta a verejne sa nezobrazuje.</p>
            <p style={{ marginTop: 8 }}><strong>c) Kontaktný formulár</strong> („Pridajte sa k nám"): meno, e-mailová adresa a obsah správy.</p>
            <p style={{ marginTop: 8 }}><strong>d) Technické údaje</strong>: IP adresa a záznamy servera (logy), ktoré vznikajú automaticky pri návšteve a slúžia na prevádzku a bezpečnosť webu.</p>
          </section>

          <section>
            <h2 style={H2}>3. Cookies a lokálne úložisko</h2>
            <p>
              Na prihlásenie a zapamätanie vášho rozhodnutia o cookies používame <strong>nevyhnutné</strong>{' '}
              lokálne úložisko prehliadača (napr. prihlasovací token) — tie sú potrebné na chod webu.
              <strong> Analytické</strong> cookies (anonymná návštevnosť) používame <strong>iba s vaším súhlasom</strong>;
              pred jeho udelením sa nenačíta žiadny analytický skript ani cookies tretích strán.
            </p>
            <p style={{ marginTop: 10 }}>
              Svoje rozhodnutie môžete kedykoľvek zmeniť:{' '}
              <button type="button" onClick={openCookieSettings} style={{ ...LINK, background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit' }}>
                otvoriť nastavenia cookies („Zvyky hradiska")
              </button>.
            </p>
          </section>

          <section>
            <h2 style={H2}>4. Právne základy a účel</h2>
            <ul style={UL}>
              <li><strong>Poskytnutie služby</strong> (čl. 6 ods. 1 písm. b) — vedenie konta a zobrazovanie komentárov.</li>
              <li><strong>Súhlas</strong> (čl. 6 ods. 1 písm. a) — analytické cookies; vybavenie správy z kontaktného formulára.</li>
              <li><strong>Oprávnený záujem</strong> (čl. 6 ods. 1 písm. f) — bezpečnosť, prevádzka a ochrana webu pred zneužitím.</li>
            </ul>
            <p style={{ marginTop: 8 }}>Údaje nepoužívame na profilovanie ani automatizované rozhodovanie a neposkytujeme ich na marketingové účely.</p>
          </section>

          <section>
            <h2 style={H2}>5. Príjemcovia a sprostredkovatelia</h2>
            <p>Údaje spracúvame my; technicky nám pomáhajú:</p>
            <ul style={UL}>
              <li>poskytovateľ <strong>hostingu</strong>, na ktorom beží web a databáza;</li>
              <li><strong>e-mailová služba</strong> (SMTP) pri overovaní registrácie a resete hesla;</li>
              <li><strong>Google Fonts</strong> pri načítaní historických fontov (spracúva sa IP adresa) — v prípade prechodu na lokálne fonty odpadá.</li>
            </ul>
            <p style={{ marginTop: 8 }}>Údaje neposkytujeme tretím stranám na ich vlastné účely.</p>
          </section>

          <section>
            <h2 style={H2}>6. Doba uchovávania</h2>
            <ul style={UL}>
              <li><strong>Konto a komentáre</strong> — po dobu existencie konta; po zrušení konta ich vymažeme (komentáre možno anonymizovať).</li>
              <li><strong>Kontaktná správa</strong> — najviac 3 roky od posledného kontaktu.</li>
              <li><strong>Serverové logy</strong> — krátkodobo, v rozsahu nevyhnutnom na bezpečnosť a prevádzku.</li>
            </ul>
          </section>

          <section>
            <h2 style={H2}>7. Vaše práva</h2>
            <p>Máte právo na:</p>
            <ul style={UL}>
              <li>prístup k svojim osobným údajom,</li>
              <li>opravu nepresných údajov,</li>
              <li>vymazanie údajov („právo byť zabudnutý"),</li>
              <li>obmedzenie spracovania,</li>
              <li>prenosnosť údajov,</li>
              <li>namietať proti spracovaniu a kedykoľvek odvolať súhlas.</li>
            </ul>
            <p style={{ marginTop: 8 }}>
              Máte tiež právo podať sťažnosť dozornému orgánu — <strong>Úrad na ochranu osobných údajov SR</strong>{' '}
              (<a href="https://dataprotection.gov.sk" target="_blank" rel="noopener noreferrer" style={LINK}>dataprotection.gov.sk</a>).
            </p>
          </section>

          <section>
            <h2 style={H2}>8. Kontakt</h2>
            <p>
              S otázkami o spracovaní údajov a uplatnením práv sa obráťte na{' '}
              <a href="mailto:info@hradiska.sk" style={LINK}>info@hradiska.sk</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
