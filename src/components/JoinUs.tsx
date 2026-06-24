'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Send, CheckCircle, Loader2 } from 'lucide-react';

type FieldErrors = Partial<Record<'name' | 'email' | 'message', string>>;

// TODO (backend): zatiaľ atrapa – formulár sa neodosiela nikam.
// Pre produkciu: napojiť na Strapi collection "kontakt" alebo /api/mail endpoint
// alebo služby ako Resend / EmailJS / Formspree.
async function submitForm(_data: { name: string; email: string; message: string }) {
  await new Promise(r => setTimeout(r, 900));
  return { ok: true };
}

export function JoinUs() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
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

  // Field props helper
  const fieldClass = (err?: string) => ({
    height: 44,
    width: '100%',
    padding: '0 14px',
    background: '#fff',
    color: '#2d1810',
    border: `1px solid ${err ? '#c44561' : 'rgba(125,79,29,0.35)'}`,
    borderRadius: 8,
    fontFamily: 'Georgia, serif',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 150ms ease, box-shadow 150ms ease',
  } as React.CSSProperties);

  const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = '#a87437';
    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(196,165,116,0.25)';
  };
  const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>, fieldName: keyof FieldErrors) => {
    e.currentTarget.style.boxShadow = 'none';
    e.currentTarget.style.borderColor = errors[fieldName] ? '#c44561' : 'rgba(125,79,29,0.35)';
  };

  return (
    <section
      className="relative py-16 md:py-24 border-t-2 border-amber-900/20"
      style={{ backgroundColor: '#f7f1e3', overflowX: 'clip' }}
    >
      {/* Slovanské zlaté medailóny po stranách formulára – viewport >= 1200 px.
          mix-blend-mode: multiply skrýva biele pozadie PNG na krémovej stránke,
          zlatá ostane plne viditeľná.
          PERF: <picture> načíta WebP (~100 KB, 1400px) namiesto pôvodného PNG (5.8 MB, 2506px).
          PNG ostáva ako fallback + záloha pri obnove. */}
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
                // Vycentrované medzi okrajom viewportu a kartou (max-w 640 → 320 polovica)
                left: 'calc((50% - 320px - 470px) / 2)',
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
                right: 'calc((50% - 320px - 470px) / 2)',
                top: '50%',
                transform: 'translateY(-50%) rotate(4deg)',
                width: 'clamp(380px, 30vw, 560px)',
                opacity: 0.65,
                mixBlendMode: 'multiply',
                pointerEvents: 'none',
                zIndex: 1,
              }}
            /></picture>
        </>
      )}

      <div className="container relative" style={{ zIndex: 2 }}>
        <div className="max-w-3xl mx-auto">
          {/* HLAVIČKA SEKCIE */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            {/* Pill badge */}
            <span
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[12px] font-medium uppercase mb-5"
              style={{
                background: 'rgba(196,165,116,0.18)',
                border: '1px solid rgba(125,79,29,0.3)',
                color: '#7d4f1d',
                fontFamily: 'Georgia, serif',
                letterSpacing: '0.12em',
              }}
            >
              <Users className="w-3.5 h-3.5" />
              Pridajte sa k nám
            </span>

            {/* Nadpis – tmavohnedý, garantovane viditeľný */}
            <h2
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: 'clamp(24px, 3.5vw, 34px)',
                fontWeight: 600,
                color: '#2d1810',
                letterSpacing: '0.02em',
                lineHeight: 1.2,
                margin: 0,
              }}
            >
              Staňte sa súčasťou našej komunity
            </h2>

            {/* Zlatá ozdobná linka */}
            <div
              className="mx-auto mt-3"
              style={{
                width: 56,
                height: 2,
                background: 'linear-gradient(90deg, transparent, #a87437, transparent)',
              }}
            />

            {/* Podtitul */}
            <p
              className="mx-auto mt-4"
              style={{
                color: '#7a6b56',
                fontFamily: 'Georgia, serif',
                fontStyle: 'italic',
                fontSize: 15,
                lineHeight: 1.55,
                maxWidth: 480,
              }}
            >
              Pomôžte nám uchovať a zdieľať našu históriu — fotografie z hradísk, archeologické nálezy aj odborné poznatky sú vítané.
            </p>
          </motion.div>

          {/* KARTA FORMULÁRA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{
              background: '#fffdf8',
              borderRadius: 12,
              border: '1px solid rgba(196,165,116,0.4)',
              boxShadow: '0 1px 2px rgba(70,40,20,0.06), 0 4px 14px rgba(70,40,20,0.06)',
              padding: '28px',
              maxWidth: 640,
              margin: '0 auto',
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
                  {/* Meno + E-mail v 2 stĺpcoch desktop */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label htmlFor="join-name">Vaše meno</Label>
                      <input
                        id="join-name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        value={formData.name}
                        onChange={(e) => { setFormData({ ...formData, name: e.target.value }); if (errors.name) setErrors({ ...errors, name: undefined }); }}
                        onFocus={onFocus}
                        onBlur={(e) => onBlur(e, 'name')}
                        placeholder="Jana Nováková"
                        style={fieldClass(errors.name)}
                        aria-invalid={!!errors.name}
                        aria-describedby={errors.name ? 'join-name-err' : undefined}
                      />
                      {errors.name && <ErrorMsg id="join-name-err">{errors.name}</ErrorMsg>}
                    </div>
                    <div>
                      <Label htmlFor="join-email">E-mail</Label>
                      <input
                        id="join-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={formData.email}
                        onChange={(e) => { setFormData({ ...formData, email: e.target.value }); if (errors.email) setErrors({ ...errors, email: undefined }); }}
                        onFocus={onFocus}
                        onBlur={(e) => onBlur(e, 'email')}
                        placeholder="meno@domena.sk"
                        style={fieldClass(errors.email)}
                        aria-invalid={!!errors.email}
                        aria-describedby={errors.email ? 'join-email-err' : undefined}
                      />
                      {errors.email && <ErrorMsg id="join-email-err">{errors.email}</ErrorMsg>}
                    </div>
                  </div>

                  {/* Správa */}
                  <div className="mb-5">
                    <Label htmlFor="join-message">Vaša správa</Label>
                    <textarea
                      id="join-message"
                      name="message"
                      rows={5}
                      value={formData.message}
                      onChange={(e) => { setFormData({ ...formData, message: e.target.value }); if (errors.message) setErrors({ ...errors, message: undefined }); }}
                      onFocus={onFocus}
                      onBlur={(e) => onBlur(e, 'message')}
                      placeholder="Popíšte, čím by ste chceli prispieť…"
                      style={{ ...fieldClass(errors.message), height: 'auto', padding: '10px 14px', resize: 'vertical' }}
                      aria-invalid={!!errors.message}
                      aria-describedby={errors.message ? 'join-msg-err' : undefined}
                    />
                    {errors.message && <ErrorMsg id="join-msg-err">{errors.message}</ErrorMsg>}
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl font-medium hover:brightness-110 disabled:opacity-70 disabled:cursor-not-allowed"
                    style={{
                      height: 48,
                      background: 'linear-gradient(135deg, #7d4f1d 0%, #a87437 100%)',
                      color: '#faf7f1',
                      fontFamily: 'Georgia, serif',
                      fontSize: 15,
                      letterSpacing: '0.02em',
                      boxShadow: '0 4px 12px rgba(125,79,29,0.3)',
                      border: 'none',
                      cursor: submitting ? 'wait' : 'pointer',
                      transition: 'filter 150ms ease',
                    }}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Odosielam…
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Odoslať správu
                      </>
                    )}
                  </button>

                  {/* Poznámka o použití údajov */}
                  <p
                    className="text-center mt-3"
                    style={{
                      color: '#7a6b56',
                      fontFamily: 'Georgia, serif',
                      fontSize: 12,
                      fontStyle: 'italic',
                      lineHeight: 1.5,
                    }}
                  >
                    Vaše údaje použijeme len na odpoveď na túto správu. Neposkytujeme ich tretím stranám.
                  </p>
                </motion.form>
              ) : (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className="text-center py-6"
                >
                  <CheckCircle className="w-14 h-14 mx-auto mb-4" style={{ color: '#2D7F4F' }} />
                  <h3
                    className="mb-2"
                    style={{
                      fontFamily: 'Georgia, serif',
                      fontSize: 22,
                      fontWeight: 600,
                      color: '#2d1810',
                    }}
                  >
                    Ďakujeme, ozveme sa vám
                  </h3>
                  <p
                    className="mx-auto"
                    style={{
                      color: '#7a6b56',
                      fontFamily: 'Georgia, serif',
                      fontStyle: 'italic',
                      fontSize: 14.5,
                      maxWidth: 380,
                      lineHeight: 1.55,
                    }}
                  >
                    Vašu správu sme prijali. Ozveme sa vám čo najskôr s ďalšími informáciami o spolupráci.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({ name: '', email: '', message: '' });
                    }}
                    className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px]"
                    style={{
                      background: 'transparent',
                      color: '#7d4f1d',
                      border: '1px solid rgba(125,79,29,0.35)',
                      fontFamily: 'Georgia, serif',
                      cursor: 'pointer',
                    }}
                  >
                    Poslať ďalšiu správu
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ----- helpers -----
function Label({ htmlFor, children, as = 'label' }: { htmlFor?: string; children: React.ReactNode; as?: 'label' | 'div' }) {
  const Tag: any = as;
  return (
    <Tag
      htmlFor={htmlFor}
      style={{
        display: 'block',
        marginBottom: 6,
        fontFamily: 'Georgia, serif',
        fontSize: 13,
        fontWeight: 500,
        color: '#3d3528',
        letterSpacing: '0.02em',
      }}
    >
      {children}
    </Tag>
  );
}

function ErrorMsg({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <div
      id={id}
      role="alert"
      style={{
        marginTop: 5,
        color: '#c44561',
        fontFamily: 'Georgia, serif',
        fontSize: 12,
        fontStyle: 'italic',
      }}
    >
      {children}
    </div>
  );
}
