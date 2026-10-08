'use client';

import { poAnglicky } from '../lib/jazyk';

import { openCookieSettings } from '../lib/consent';

const H2: React.CSSProperties = { fontSize: 18, fontWeight: 600, color: 'var(--hr-ink)', marginBottom: 8 };
const UL: React.CSSProperties = { paddingLeft: 20, marginTop: 8 };
const LINK: React.CSSProperties = { color: 'var(--hr-accent-deep)', textDecoration: 'underline' };

/* Telo stránky v oboch jazykoch. Právny text sa neprekladá po vetách cez
   prekladovú vrstvu — tá je na nápisy v rozhraní; dve úplné znenia sa
   čítajú aj upravujú lepšie než poskladaný text. */
function TeloSK() {
  return (
    <>
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
    </>
  );
}

function TeloEN() {
  return (
    <>
          <section>
            <h2 style={H2}>1. Controller</h2>
            <p>
              The controller is the <strong>Hradiska.sk</strong> civic association, which processes
              personal data in accordance with the <strong>GDPR (EU) 2016/679</strong> and Act
              no. 18/2018 Coll. on the protection of personal data. Contact:{' '}
              <a href="mailto:info@hradiska.sk" style={LINK}>info@hradiska.sk</a>.
            </p>
            <p style={{ marginTop: 8, fontSize: 13, fontStyle: 'italic', color: 'var(--hr-clear-text)' }}>
              (The association&rsquo;s identification and registration details — company number, registered
              office and registration number — are being added.)
            </p>
          </section>

          <section>
            <h2 style={H2}>2. What data we process</h2>
            <p><strong>a) User account</strong> (on registration): e-mail address, name or nickname and password (stored in encrypted form only). The account serves for signing in and commenting.</p>
            <p style={{ marginTop: 8 }}><strong>b) Comments</strong>: name or nickname, the content of the comment and the date. Only signed-in users may comment; the e-mail is taken from the account and is not shown publicly.</p>
            <p style={{ marginTop: 8 }}><strong>c) Contact form</strong> (“Join us”): name, e-mail address and the content of the message.</p>
            <p style={{ marginTop: 8 }}><strong>d) Technical data</strong>: IP address and server records (logs), which arise automatically on a visit and serve the operation and security of the site.</p>
          </section>

          <section>
            <h2 style={H2}>3. Cookies and local storage</h2>
            <p>
              For signing in and for remembering your decision about cookies we use{' '}
              <strong>necessary</strong> local storage in the browser (for example a login token) —
              these are needed for the site to work.
              <strong> Analytical</strong> cookies (anonymous traffic figures) we use{' '}
              <strong>only with your consent</strong>; before it is given, no analytical script and no
              third-party cookies are loaded.
            </p>
            <p style={{ marginTop: 10 }}>
              You can change your decision at any time:{' '}
              <button type="button" onClick={openCookieSettings} style={{ ...LINK, background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit' }}>
                open the cookie settings (“Hillfort customs”)
              </button>.
            </p>
          </section>

          <section>
            <h2 style={H2}>4. Legal bases and purpose</h2>
            <ul style={UL}>
              <li><strong>Provision of the service</strong> (Art. 6(1)(b)) — keeping the account and displaying comments.</li>
              <li><strong>Consent</strong> (Art. 6(1)(a)) — analytical cookies; handling a message from the contact form.</li>
              <li><strong>Legitimate interest</strong> (Art. 6(1)(f)) — security, operation and protection of the site against misuse.</li>
            </ul>
            <p style={{ marginTop: 8 }}>We do not use the data for profiling or automated decision-making and we do not provide it for marketing purposes.</p>
          </section>

          <section>
            <h2 style={H2}>5. Recipients and processors</h2>
            <p>We process the data ourselves; technical help comes from:</p>
            <ul style={UL}>
              <li>the <strong>hosting</strong> provider on which the site and the database run;</li>
              <li>an <strong>e-mail service</strong> (SMTP) for verifying registration and resetting passwords;</li>
              <li><strong>Google Fonts</strong> when the historical fonts are loaded (the IP address is processed) — this falls away once the fonts are served locally.</li>
            </ul>
            <p style={{ marginTop: 8 }}>We do not provide the data to third parties for their own purposes.</p>
          </section>

          <section>
            <h2 style={H2}>6. Retention period</h2>
            <ul style={UL}>
              <li><strong>Account and comments</strong> — for as long as the account exists; after it is closed we delete them (comments may be anonymised).</li>
              <li><strong>A contact message</strong> — at most 3 years from the last contact.</li>
              <li><strong>Server logs</strong> — for a short time, to the extent necessary for security and operation.</li>
            </ul>
          </section>

          <section>
            <h2 style={H2}>7. Your rights</h2>
            <p>You have the right to:</p>
            <ul style={UL}>
              <li>access your personal data,</li>
              <li>have inaccurate data corrected,</li>
              <li>have the data erased (“the right to be forgotten”),</li>
              <li>restrict the processing,</li>
              <li>data portability,</li>
              <li>object to the processing and withdraw your consent at any time.</li>
            </ul>
            <p style={{ marginTop: 8 }}>
              You also have the right to lodge a complaint with the supervisory authority — the{' '}
              <strong>Office for Personal Data Protection of the Slovak Republic</strong>{' '}
              (<a href="https://dataprotection.gov.sk" target="_blank" rel="noopener noreferrer" style={LINK}>dataprotection.gov.sk</a>).
            </p>
          </section>

          <section>
            <h2 style={H2}>8. Contact</h2>
            <p>
              With questions about the processing of data and to exercise your rights, please contact{' '}
              <a href="mailto:info@hradiska.sk" style={LINK}>info@hradiska.sk</a>.
            </p>
          </section>
    </>
  );
}

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
            {poAnglicky() ? 'Privacy policy' : 'Ochrana osobných údajov'}
          </h1>
          <p className="mt-3 text-sm" style={{ color: 'var(--hr-clear-text)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
            {poAnglicky() ? 'Last updated: 22 July 2026' : 'Posledná aktualizácia: 22. júla 2026'}
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
          {poAnglicky() ? <TeloEN /> : <TeloSK />}
        </div>
      </div>
    </div>
  );
}
