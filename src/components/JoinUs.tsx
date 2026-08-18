'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, Loader2 } from 'lucide-react';

type FieldErrors = Partial<Record<'name' | 'email' | 'message', string>>;

/** Kontaktný e-mail združenia — používa sa v CTA aj ako cieľ formulára.
 *  Zjednotené na doménovú adresu (rovnaká vo Footeri aj v Zásadách ochrany údajov). */
const CONTACT_EMAIL = 'info@hradiska.sk';

// ⚠️ PRODUKCIA — TODO: formulár je zatiaľ ATRAPA, správu NIKAM neodosiela
// (len simuluje úspech). Rozhodnutie: doriešiť až v produkcii so skutočnou
// e-mailovou schránkou. Vtedy napojiť na Strapi (collection „kontakt" alebo
// /api/mail cez existujúci nodemailer), prípadne Resend/EmailJS/Formspree,
// a doplniť GDPR súhlas (checkbox + odkaz na Zásady ochrany osobných údajov).
async function submitForm(_data: { name: string; email: string; message: string }) {
  await new Promise(r => setTimeout(r, 900));
  return { ok: true };
}

export function JoinUs() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // JS-driven viewport check pre bočné medailóny (>= 1200 px)
  const [viewportWidth, setViewportWidth] = useState(0);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const update = () => setViewportWidth(window.innerWidth);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  const showMedailony = viewportWidth >= 1200;

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    if (!formData.name.trim()) next.name = 'Meno je povinné';
    if (!formData.email.trim()) next.email = 'E-mail je povinný';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(formData.email.trim())) {
      next.email = 'Zadajte platnú e-mailovú adresu';
    }
    if (!formData.message.trim()) next.message = 'Správa nesmie byť prázdna';
    return next;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length > 0) return;
    setSubmitting(true);
    try {
      await submitForm(formData);
      setSubmitted(true);
    } catch (err) {
      console.error('Submit failed:', err);
      setErrors({ message: 'Odoslanie zlyhalo, skúste neskôr.' });
    } finally {
      setSubmitting(false);
    }
  };

  const clearErr = (k: keyof FieldErrors) => {
    if (errors[k]) setErrors({ ...errors, [k]: undefined });
  };

  return (
    <section
      className="joinus relative"
      style={{
        background: 'var(--ju-page)',
        padding: '70px 20px 96px',
        overflowX: 'clip',
        borderTop: '2px solid rgba(125,79,29,0.2)',
      }}
    >
      {/* Slovanské zlaté medailóny po stranách – viewport >= 1200 px. NEMENIŤ.
          mix-blend-mode: multiply skrýva biele pozadie PNG na krémovej stránke,
          zlatá ostane plne viditeľná.
          PERF: <picture> načíta WebP (~100 KB, 1400px) namiesto pôvodného PNG (5.8 MB, 2506px).
          PNG ostáva ako fallback + záloha pri obnove.
          Odsadenie: stĺpec obsahu má max-width 780 px (polovica 390), medailón sa
          centruje medzi jeho okraj a okraj viewportu. */}
      {showMedailony && (
        <>
          <picture>
            <source srcSet="/medailon-bojna.webp" type="image/webp" />
            <img
              src="/medailon-bojna.png"
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
              style={{
                position: 'absolute',
                left: 'calc((50% - 390px - 470px) / 2)',
                top: '50%',
                transform: 'translateY(-50%) rotate(-4deg)',
                width: 'clamp(380px, 30vw, 560px)',
                opacity: 0.65,
                mixBlendMode: 'multiply',
                pointerEvents: 'none',
                zIndex: 1,
              }}
            />
          </picture>
          <picture>
            <source srcSet="/medailon-bojna.webp" type="image/webp" />
            <img
              src="/medailon-bojna.png"
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
              style={{
                position: 'absolute',
                right: 'calc((50% - 390px - 470px) / 2)',
                top: '50%',
                transform: 'translateY(-50%) rotate(4deg)',
                width: 'clamp(380px, 30vw, 560px)',
                opacity: 0.65,
                mixBlendMode: 'multiply',
                pointerEvents: 'none',
                zIndex: 1,
              }}
            />
          </picture>
        </>
      )}

      <div style={{ maxWidth: 780, margin: '0 auto', position: 'relative', zIndex: 2 }}>
        {/* Hlavička sekcie odstránená na želanie — badge „◆ Pridajte sa k nám",
            nadpis „Staňte sa súčasťou našej komunity" aj kurzívny podnadpis.
            Sekciu otvára rovno tmavý banner. */}

        {/* ---------- „HRDOSŤ" BANNER ---------- */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="relative text-center"
          style={{
            background: 'linear-gradient(180deg, var(--ju-banner-top), var(--ju-banner-bottom))',
            border: '1px solid var(--ju-border-banner)',
            borderRadius: 16,
            padding: 30,
            overflow: 'hidden',
            marginBottom: 34,
          }}
        >
          {/* Jemná diagonálna textúra */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'repeating-linear-gradient(58deg, var(--hr-line) 0 2px, transparent 2px 10px)',
              pointerEvents: 'none',
            }}
          />
          <div className="relative">
            <div
              aria-hidden="true"
              className="flex items-center justify-center gap-3"
              style={{ color: 'var(--ju-banner-orn)', fontSize: 15, marginBottom: 12 }}
            >
              <span style={{ height: 1, width: 54, background: 'currentColor', opacity: 0.55 }} />
              <span>✦</span>
              <span style={{ height: 1, width: 54, background: 'currentColor', opacity: 0.55 }} />
            </div>
            <div
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(21px, 3vw, 27px)',
                fontWeight: 700,
                letterSpacing: '0.05em',
                color: 'var(--ju-banner-title)',
                lineHeight: 1.2,
              }}
            >
              Buďme hrdí na naše dejiny!
            </div>
            <div
              style={{
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                fontSize: 19,
                color: 'var(--ju-banner-sub)',
                marginTop: 6,
              }}
            >
              Máme na to mnoho dôvodov.
            </div>
          </div>
        </motion.div>

        {/* ---------- 3) KARTA S VÝZVOU ---------- */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{
            background: 'var(--ju-card)',
            border: '1px solid var(--ju-border)',
            borderRadius: 18,
            boxShadow: '0 20px 50px -30px rgba(60,40,15,.45)',
            padding: '36px 40px 34px',
            marginBottom: 30,
          }}
        >
          <h3
            className="text-center"
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 25,
              fontWeight: 600,
              color: 'var(--ju-text)',
              margin: '0 0 20px',
              lineHeight: 1.2,
            }}
          >
            Staňte sa našimi spolupracovníkmi
          </h3>

          <p
            className="dropcap"
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 19,
              lineHeight: 1.62,
              color: 'var(--ju-body)',
              margin: '0 0 24px',
            }}
          >
            Aj vy sa môžete podieľať na zveľaďovaní našej stránky. Ak máte doma
            zaujímavé fotografie z hradísk alebo obrázky a fotky nálezov, stačí sa
            s nami o ne podeliť — každý záber pomáha dopĺňať náš spoločný obraz
            o dávnej minulosti.
          </p>

          {/* E-mail CTA */}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="ju-cta"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              textDecoration: 'none',
              background: 'linear-gradient(180deg,#fbf1da,#f5e8c9)',
              border: '1px solid var(--ju-border-soft)',
              borderRadius: 14,
              padding: '16px 20px',
              margin: '0 0 26px',
              transition: 'border-color 150ms ease, box-shadow 150ms ease',
            }}
          >
            <span
              aria-hidden="true"
              className="flex-shrink-0 flex items-center justify-center"
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: 'linear-gradient(180deg, var(--ju-amber-mid), var(--ju-amber-deep))',
                color: '#fbf3e2',
                fontSize: 22,
              }}
            >
              ✉
            </span>
            <span className="flex-1 min-w-0">
              <span
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-heading)',
                  fontSize: 11,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--ju-amber)',
                }}
              >
                Pošlite fotky na
              </span>
              <span
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-serif)',
                  fontSize: 23,
                  fontWeight: 700,
                  color: 'var(--ju-text)',
                  lineHeight: 1.25,
                  wordBreak: 'break-word',
                }}
              >
                {CONTACT_EMAIL}
              </span>
            </span>
            <span
              aria-hidden="true"
              style={{ color: 'var(--ju-amber-bright)', fontSize: 20, flexShrink: 0 }}
            >
              →
            </span>
          </a>

          {/* Pôvodne to boli dva súvislé odstavce. Nesú tri konkrétne prosby,
              lenže schované vo vete — kto len prebehol očami, nevedel, čo poslať.
              Vety sú ponechané v pôvodnom znení, len rozdelené a označené. */}
          <div style={{ display: 'grid', gap: 2 }}>
            <span
              style={{
                fontFamily: 'var(--font-heading)', fontSize: 12, letterSpacing: '.16em',
                textTransform: 'uppercase', color: 'var(--ju-amber-deep)', marginBottom: 10,
              }}
            >
              Čo pomôže najviac
            </span>

            {[
              {
                t: 'Valy a opevnenia',
                d: 'Zábery na valy, pozostatky opevnení, budov a podobne — najmä pri hradiskách, na ktorých som ešte nebol a ku ktorým preto nemám žiadne fotky.',
              },
              {
                t: 'Nálezy v zahraničí',
                d: 'Slovanské nálezy v Maďarsku a Rakúsku — múzeá vo Visegráde, Novohrade, Ostrihome či Zalavári. Šperky, zbrane, črepy a podobne.',
              },
            ].map((it, i) => (
              <div
                key={it.t}
                className="ju-ask"
                style={{
                  display: 'flex', gap: 14, alignItems: 'flex-start',
                  padding: '15px 2px',
                  borderTop: i === 0 ? '1px solid var(--ju-frame)' : 'none',
                  borderBottom: '1px solid var(--ju-frame)',
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    flexShrink: 0, width: 26, height: 26, borderRadius: 999,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-heading)', fontSize: 12, fontWeight: 600,
                    color: 'var(--ju-amber-deep)', background: 'var(--ju-callout)',
                    border: '1px solid var(--ju-border-callout)', marginTop: 3,
                  }}
                >
                  {i + 1}
                </span>
                <span style={{ minWidth: 0 }}>
                  <span
                    style={{
                      display: 'block', fontFamily: 'var(--font-serif)', fontSize: 18,
                      fontWeight: 700, color: 'var(--ju-text)', marginBottom: 3,
                    }}
                  >
                    {it.t}
                  </span>
                  <span
                    style={{
                      display: 'block', fontFamily: 'var(--font-serif)', fontSize: 17,
                      lineHeight: 1.55, color: 'var(--ju-body)',
                    }}
                  >
                    {it.d}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ---------- 4) CALLOUT „MÁTE DOMA NÁLEZ?" ---------- */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.12 }}
          style={{
            background: 'var(--ju-callout)',
            border: '1px solid var(--ju-border-callout)',
            borderRadius: 18,
            padding: '26px 30px',
            marginBottom: 34,
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 12,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--ju-amber-deep)',
              marginBottom: 12,
            }}
          >
            Máte doma nález?
          </div>
          <p
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 18,
              lineHeight: 1.6,
              color: 'var(--ju-body)',
              margin: '0 0 14px',
            }}
          >
            Platí to aj pre náhodných nálezcov, ktorí majú v pivnici či na povale
            zaujímavé nálezy, na ktoré len sadá prach a s ktorými sa boja oficiálne
            pochváliť. Urobiť fotku, napísať, kde sa nález našiel, a poslať to na
            mail sa predsa dá.
          </p>
          <p
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 22,
              fontStyle: 'italic',
              fontWeight: 600,
              color: 'var(--ju-amber-deep)',
              margin: 0,
            }}
          >
            „Možno sami neviete, aké poklady vlastníte."
          </p>
        </motion.div>

        {/* ---------- 5) KONTAKTNÝ FORMULÁR ---------- */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15 }}
          style={{
            background: 'var(--ju-card)',
            border: '1px solid var(--ju-border)',
            borderRadius: 18,
            boxShadow: '0 28px 66px -30px rgba(60,40,15,.5)',
            padding: 6,
          }}
        >
          <div
            style={{
              border: '1px solid var(--ju-frame)',
              borderRadius: 14,
              padding: '34px 34px 30px',
            }}
          >
            <AnimatePresence mode="wait">
              {!submitted ? (
                <motion.form
                  key="form"
                  onSubmit={handleSubmit}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  noValidate
                >
                  <h3
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: 21,
                      fontWeight: 600,
                      color: 'var(--ju-text)',
                      margin: 0,
                    }}
                  >
                    Alebo nám napíšte rovno tu
                  </h3>
                  <p
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontStyle: 'italic',
                      fontSize: 17,
                      color: 'var(--ju-muted-2)',
                      margin: '6px 0 24px',
                    }}
                  >
                    Ozveme sa vám späť na uvedený e-mail.
                  </p>

                  <div className="ju-grid">
                    <div>
                      <label className="lbl" htmlFor="join-name">
                        Vaše meno</label>
                      <input
                        id="join-name"
                        name="name"
                        type="text"
                        className="fld"
                        autoComplete="name"
                        required
                        aria-required="true"
                        value={formData.name}
                        onChange={(e) => { setFormData({ ...formData, name: e.target.value }); clearErr('name'); }}
                        placeholder="Jana Nováková"
                        aria-invalid={!!errors.name}
                        aria-describedby={errors.name ? 'join-name-err' : undefined}
                      />
                      {errors.name && <ErrorMsg id="join-name-err">{errors.name}</ErrorMsg>}
                    </div>

                    <div>
                      <label className="lbl" htmlFor="join-email">
                        E-mail</label>
                      <input
                        id="join-email"
                        name="email"
                        type="email"
                        className="fld"
                        autoComplete="email"
                        required
                        aria-required="true"
                        value={formData.email}
                        onChange={(e) => { setFormData({ ...formData, email: e.target.value }); clearErr('email'); }}
                        placeholder="meno@domena.sk"
                        aria-invalid={!!errors.email}
                        aria-describedby={errors.email ? 'join-email-err' : undefined}
                      />
                      {errors.email && <ErrorMsg id="join-email-err">{errors.email}</ErrorMsg>}
                    </div>

                    <div className="ju-full">
                      <label className="lbl" htmlFor="join-message">
                        Vaša správa</label>
                      <textarea
                        id="join-message"
                        name="message"
                        className="fld"
                        required
                        aria-required="true"
                        style={{ minHeight: 150, resize: 'vertical' }}
                        value={formData.message}
                        onChange={(e) => { setFormData({ ...formData, message: e.target.value }); clearErr('message'); }}
                        placeholder="Popíšte, čím by ste chceli prispieť…"
                        aria-invalid={!!errors.message}
                        aria-describedby={errors.message ? 'join-msg-err' : undefined}
                      />
                      {errors.message && <ErrorMsg id="join-msg-err">{errors.message}</ErrorMsg>}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="ju-submit w-full inline-flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    style={{
                      marginTop: 24,
                      fontFamily: 'var(--font-heading)',
                      fontSize: 16,
                      fontWeight: 600,
                      letterSpacing: '0.06em',
                      color: '#fbf3e2',
                      background: 'linear-gradient(180deg, var(--ju-amber-mid), var(--ju-amber-deep))',
                      border: '1px solid #7c4a13',
                      borderRadius: 999,
                      padding: 16,
                      boxShadow: '0 12px 26px -12px rgba(120,74,19,.7)',
                      cursor: submitting ? 'wait' : 'pointer',
                      transition: 'filter 150ms ease, transform 100ms ease',
                    }}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Odosielam…
                      </>
                    ) : (
                      <>✎ Odoslať správu</>
                    )}
                  </button>

                  <p
                    className="text-center"
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontStyle: 'italic',
                      fontSize: 15,
                      color: '#9a8a6c',
                      lineHeight: 1.5,
                      margin: '14px 0 0',
                    }}
                  >
                    🛡 Vaše údaje použijeme len na odpoveď na túto správu.
                    Neposkytujeme ich tretím stranám.
                  </p>
                </motion.form>
              ) : (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className="text-center"
                  style={{ padding: '18px 0' }}
                  role="status"
                >
                  <CheckCircle className="w-14 h-14 mx-auto mb-4" style={{ color: '#2D7F4F' }} />
                  <h3
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: 24,
                      fontWeight: 600,
                      color: 'var(--ju-text)',
                      margin: '0 0 8px',
                    }}
                  >
                    Ďakujeme, ozveme sa vám
                  </h3>
                  <p
                    className="mx-auto"
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontStyle: 'italic',
                      fontSize: 18,
                      color: 'var(--ju-muted-2)',
                      maxWidth: 420,
                      lineHeight: 1.55,
                      margin: 0,
                    }}
                  >
                    Vašu správu sme prijali. Ozveme sa vám čo najskôr s ďalšími
                    informáciami o spolupráci.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({ name: '', email: '', message: '' });
                    }}
                    style={{
                      marginTop: 22,
                      fontFamily: 'var(--font-heading)',
                      fontSize: 12,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      background: 'transparent',
                      color: 'var(--ju-amber-deep)',
                      border: '1px solid var(--ju-border-soft)',
                      borderRadius: 999,
                      padding: '10px 20px',
                      cursor: 'pointer',
                    }}
                  >
                    Poslať ďalšiu správu
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ----- helpers -----
function ErrorMsg({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <div
      id={id}
      role="alert"
      style={{
        marginTop: 6,
        color: '#a33a24',
        fontFamily: 'var(--font-serif)',
        fontSize: 15,
        fontStyle: 'italic',
      }}
    >
      {children}
    </div>
  );
}
