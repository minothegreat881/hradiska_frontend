'use client';

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
            <span className="h-px w-16" style={{ background: 'linear-gradient(90deg, transparent, #c4a574)' }} />
            <span style={{ color: '#c4a574', fontSize: 14, lineHeight: 1 }}>⚜</span>
            <span className="h-px w-16" style={{ background: 'linear-gradient(90deg, #c4a574, transparent)' }} />
          </div>
          <h1
            className="font-semibold tracking-wide"
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: 'clamp(28px, 4vw, 40px)',
              color: '#2d1810',
              letterSpacing: '0.04em',
            }}
          >
            Ochrana osobných údajov
          </h1>
          <p className="mt-3 text-sm" style={{ color: '#7a6b56', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
            Posledná aktualizácia: 11. júna 2026
          </p>
        </div>

        <div
          className="prose-content space-y-5"
          style={{
            background: '#fffdf8',
            border: '1px solid rgba(196,165,116,0.4)',
            borderRadius: 12,
            padding: '32px',
            boxShadow: '0 1px 2px rgba(70,40,20,0.06), 0 4px 12px rgba(70,40,20,0.05)',
            color: '#4a3f35',
            fontFamily: 'Georgia, serif',
            fontSize: 15,
            lineHeight: 1.7,
          }}
        >
          <section>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#2d1810', marginBottom: 8 }}>1. Prevádzkovateľ</h2>
            <p>
              Občianske združenie <strong>Hradiska.sk</strong> spracúva osobné údaje v súlade s nariadením
              GDPR (EÚ 2016/679) a zákonom č. 18/2018 Z. z. o ochrane osobných údajov.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#2d1810', marginBottom: 8 }}>2. Aké údaje zbierame</h2>
            <p>Prostredníctvom kontaktného formulára „Pridajte sa k nám" zbierame:</p>
            <ul style={{ paddingLeft: 20, marginTop: 8 }}>
              <li>meno a priezvisko,</li>
              <li>e-mailovú adresu,</li>
              <li>obsah vašej správy.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#2d1810', marginBottom: 8 }}>3. Účel spracovania</h2>
            <p>
              Údaje použijeme výhradne na odpoveď na vašu konkrétnu správu a ďalšiu komunikáciu
              o navrhnutej spolupráci. Neposkytujeme ich tretím stranám ani na marketingové účely.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#2d1810', marginBottom: 8 }}>4. Doba uchovávania</h2>
            <p>
              Údaje uchovávame po dobu nevyhnutnú na vybavenie vašej žiadosti, maximálne však 3 roky
              od posledného kontaktu.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#2d1810', marginBottom: 8 }}>5. Vaše práva</h2>
            <p>Máte právo na:</p>
            <ul style={{ paddingLeft: 20, marginTop: 8 }}>
              <li>prístup k svojim osobným údajom,</li>
              <li>opravu nepresných údajov,</li>
              <li>vymazanie údajov („právo byť zabudnutý"),</li>
              <li>obmedzenie spracovania,</li>
              <li>prenosnosť údajov,</li>
              <li>namietať proti spracovaniu.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#2d1810', marginBottom: 8 }}>6. Kontakt</h2>
            <p>
              S otázkami sa obráťte na e-mail{' '}
              <a href="mailto:info@hradiska.sk" style={{ color: '#7d4f1d', textDecoration: 'underline' }}>
                info@hradiska.sk
              </a>.
            </p>
          </section>

          <section
            style={{
              marginTop: 16,
              padding: 16,
              background: 'rgba(232,197,110,0.18)',
              border: '1px solid rgba(168,116,55,0.35)',
              borderRadius: 8,
              fontStyle: 'italic',
              fontSize: 14,
            }}
          >
            Toto je predbežná verzia dokumentu. Pre úplné znenie kontaktujte správcu webu.
          </section>
        </div>
      </div>
    </div>
  );
}
