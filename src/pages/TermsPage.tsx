'use client';

import { poAnglicky, odkaz } from '../lib/jazyk';

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
            <h2 style={H2}>1. Úvod</h2>
            <p>
              Tieto podmienky upravujú používanie webu <strong>Hradiska.sk</strong>, ktorý prevádzkuje
              občianske združenie Hradiska.sk. Používaním webu s nimi vyjadrujete súhlas. Ak s nimi
              nesúhlasíte, web prosím nepoužívajte.
            </p>
          </section>

          <section>
            <h2 style={H2}>2. Obsah a autorské práva</h2>
            <p>
              Texty, fotografie, kresby, 3D rekonštrukcie a ďalší obsah webu sú chránené autorským
              právom a patria združeniu, jeho členom alebo autorom, ktorí ho poskytli. Obsah môžete
              čítať a zdieľať odkazom na osobné, nekomerčné účely. <strong>Preberanie, kopírovanie alebo
              ďalšie šírenie</strong> textov a obrázkov (najmä na iné weby či publikácie) je možné len
              s predchádzajúcim súhlasom prevádzkovateľa a s uvedením zdroja.
            </p>
          </section>

          <section>
            <h2 style={H2}>3. Používateľské kontá</h2>
            <ul style={UL}>
              <li>Pri registrácii uvádzajte pravdivé údaje; konto je určené pre jednu osobu.</li>
              <li>Za svoje prihlasovacie údaje a aktivitu na konte zodpovedáte vy; heslo chráňte.</li>
              <li>Konto môžete kedykoľvek zrušiť; prevádzkovateľ môže zrušiť konto, ktoré porušuje tieto podmienky.</li>
            </ul>
          </section>

          <section>
            <h2 style={H2}>4. Komentáre a príspevky používateľov</h2>
            <p>Za obsah, ktorý pridáte (komentáre), zodpovedáte vy. Zaväzujete sa nezverejňovať obsah, ktorý:</p>
            <ul style={UL}>
              <li>je nezákonný, urážlivý, nenávistný, vulgárny alebo ohrozuje iných;</li>
              <li>porušuje práva tretích osôb (autorské práva, súkromie);</li>
              <li>je spam, reklama alebo zavádzajúci.</li>
            </ul>
            <p style={{ marginTop: 8 }}>
              Pridaním komentára udeľujete prevádzkovateľovi nevýhradné právo tento obsah na webe
              zobrazovať. Prevádzkovateľ môže komentáre <strong>moderovať, skryť alebo odstrániť</strong>,
              najmä pri porušení týchto podmienok, bez predchádzajúceho upozornenia.
            </p>
          </section>

          <section>
            <h2 style={H2}>5. Zakázané správanie</h2>
            <p>Web nesmiete zneužívať — najmä sa pokúšať narušiť jeho prevádzku, získať neoprávnený prístup, automatizovane sťahovať obsah vo veľkom (scraping) či obchádzať bezpečnostné opatrenia.</p>
          </section>

          <section>
            <h2 style={H2}>6. Vylúčenie zodpovednosti</h2>
            <p>
              Obsah poskytujeme v dobrej viere a s odbornou starostlivosťou, no <strong>„tak, ako je"</strong> —
              bez záruky úplnosti či bezchybnosti. Interpretácie a datovania v archeológii sa vyvíjajú.
              Prevádzkovateľ nezodpovedá za škody vzniknuté používaním webu ani za obsah stránok tretích strán,
              na ktoré web odkazuje.
            </p>
          </section>

          <section>
            <h2 style={H2}>7. Zmeny podmienok</h2>
            <p>Podmienky môžeme priebežne aktualizovať. Zmeny sú účinné zverejnením na tejto stránke; pri dôležitých zmenách sa o tom pokúsime informovať.</p>
          </section>

          <section>
            <h2 style={H2}>8. Kontakt</h2>
            <p>
              Otázky k týmto podmienkam smerujte na{' '}
              <a href="mailto:info@hradiska.sk" style={LINK}>info@hradiska.sk</a>. Spracovanie osobných
              údajov upravujú samostatné{' '}
              <a href={odkaz('/ochrana-osobnych-udajov')} style={LINK}>Zásady ochrany osobných údajov</a>.
            </p>
          </section>
    </>
  );
}

function TeloEN() {
  return (
    <>
          <section>
            <h2 style={H2}>1. Introduction</h2>
            <p>
              These terms govern the use of the <strong>Hradiska.sk</strong> website, run by the
              Hradiska.sk civic association. By using the site you agree to them. If you do not agree
              with them, please do not use the site.
            </p>
          </section>

          <section>
            <h2 style={H2}>2. Content and copyright</h2>
            <p>
              The texts, photographs, drawings, 3D reconstructions and other content of the site are
              protected by copyright and belong to the association, its members or the authors who
              provided them. You may read the content and share it by link for personal,
              non-commercial purposes. <strong>Taking over, copying or further distributing</strong>{' '}
              texts and images (above all to other websites or publications) is possible only with the
              prior consent of the operator and with the source stated.
            </p>
          </section>

          <section>
            <h2 style={H2}>3. User accounts</h2>
            <ul style={UL}>
              <li>Give truthful details when registering; an account is meant for one person.</li>
              <li>You are responsible for your login details and for the activity on your account; keep your password safe.</li>
              <li>You can close your account at any time; the operator may close an account that breaks these terms.</li>
            </ul>
          </section>

          <section>
            <h2 style={H2}>4. Comments and user contributions</h2>
            <p>You are responsible for the content you add (comments). You undertake not to publish content that:</p>
            <ul style={UL}>
              <li>is unlawful, insulting, hateful, vulgar or threatening to others;</li>
              <li>infringes the rights of third parties (copyright, privacy);</li>
              <li>is spam, advertising or misleading.</li>
            </ul>
            <p style={{ marginTop: 8 }}>
              By adding a comment you grant the operator a non-exclusive right to display that content
              on the site. The operator may <strong>moderate, hide or remove</strong> comments,
              above all when these terms are broken, without prior notice.
            </p>
          </section>

          <section>
            <h2 style={H2}>5. Prohibited conduct</h2>
            <p>You must not misuse the site — above all by trying to disrupt its operation, to gain unauthorised access, to download content automatically on a large scale (scraping) or to circumvent security measures.</p>
          </section>

          <section>
            <h2 style={H2}>6. Disclaimer</h2>
            <p>
              We provide the content in good faith and with professional care, but <strong>“as it is”</strong> —
              without any warranty of completeness or freedom from error. Interpretations and datings in
              archaeology develop over time. The operator is not liable for damage arising from use of the
              site, nor for the content of third-party pages to which the site links.
            </p>
          </section>

          <section>
            <h2 style={H2}>7. Changes to the terms</h2>
            <p>We may update these terms from time to time. Changes take effect when published on this page; in the case of important changes we will try to give notice of them.</p>
          </section>

          <section>
            <h2 style={H2}>8. Contact</h2>
            <p>
              Please send questions about these terms to{' '}
              <a href="mailto:info@hradiska.sk" style={LINK}>info@hradiska.sk</a>. The processing of
              personal data is governed by a separate{' '}
              <a href={odkaz('/ochrana-osobnych-udajov')} style={LINK}>Privacy policy</a>.
            </p>
          </section>
    </>
  );
}

export function TermsPage() {
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
            {t('Podmienky používania')}
          </h1>
          <p className="mt-3 text-sm" style={{ color: 'var(--hr-clear-text)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
            {t('Posledná aktualizácia: 22. júla 2026')}
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
