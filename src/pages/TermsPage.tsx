'use client';

const H2: React.CSSProperties = { fontSize: 18, fontWeight: 600, color: 'var(--hr-ink)', marginBottom: 8 };
const UL: React.CSSProperties = { paddingLeft: 20, marginTop: 8 };
const LINK: React.CSSProperties = { color: 'var(--hr-accent-deep)', textDecoration: 'underline' };

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
            Podmienky používania
          </h1>
          <p className="mt-3 text-sm" style={{ color: 'var(--hr-clear-text)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
            Posledná aktualizácia: 22. júla 2026
          </p>
        </div>

        <div
          className="prose-content space-y-5"
          style={{
            background: 'var(--hr-surface)',
            border: '1px solid rgba(196,165,116,0.4)',
            borderRadius: 12,
            padding: '32px',
            boxShadow: '0 1px 2px rgba(70,40,20,0.06), 0 4px 12px rgba(70,40,20,0.05)',
            color: 'var(--hr-body)',
            fontFamily: 'Georgia, serif',
            fontSize: 15,
            lineHeight: 1.7,
          }}
        >
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
              <a href="/ochrana-osobnych-udajov" style={LINK}>Zásady ochrany osobných údajov</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
