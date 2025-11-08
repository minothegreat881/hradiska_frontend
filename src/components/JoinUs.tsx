'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Mail, Camera, FileText, Send, CheckCircle, Sparkles } from 'lucide-react';

export function JoinUs() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contributionType: '',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const contributionTypes = [
    { value: 'photos', label: 'Fotografie z hradísk', icon: Camera },
    { value: 'findings', label: 'Archeologické nálezy', icon: Sparkles },
    { value: 'articles', label: 'Odborné články', icon: FileText },
    { value: 'research', label: 'Výskum a spolupráca', icon: Users },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock submission
    setIsSubmitted(true);
    setTimeout(() => {
      setFormData({ name: '', email: '', contributionType: '', message: '' });
      setIsSubmitted(false);
    }, 5000);
  };

  return (
    <section className="relative py-20 md:py-32 overflow-hidden border-t-2 border-amber-900/20">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-50/30 via-orange-50/20 to-amber-50/30 dark:from-amber-950/20 dark:via-orange-950/10 dark:to-amber-950/20" />
      
      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-amber-500/30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.6, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 4 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      <div className="container relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <motion.div
              className="inline-flex items-center gap-3 mb-6 px-6 py-3 bg-amber-100/50 dark:bg-amber-900/30 rounded-full border-2 border-amber-300/50 dark:border-amber-700/50"
              animate={{
                boxShadow: [
                  '0 0 20px rgba(217, 119, 6, 0.2)',
                  '0 0 30px rgba(217, 119, 6, 0.4)',
                  '0 0 20px rgba(217, 119, 6, 0.2)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Users className="w-6 h-6 text-amber-700 dark:text-amber-400" />
              <span 
                className="text-amber-900 dark:text-amber-100 uppercase tracking-wider"
                style={{ fontFamily: 'Georgia, "Times New Roman", serif', letterSpacing: '0.15em' }}
              >
                Pridajte sa k nám
              </span>
            </motion.div>

            <h2 
              className="text-amber-950 dark:text-amber-100 mb-6"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              Staňte sa súčasťou nашej komunity
            </h2>
            
            <p 
              className="text-lg text-stone-600 dark:text-stone-400 max-w-3xl mx-auto leading-relaxed"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontStyle: 'italic' }}
            >
              Pomôžte nám uchovať a zdieľať našu históriu. Či už vlastníte fotografie z hradísk, 
              archeologické nálezy alebo chcete prispieť odbornými poznatkami – budeme radi za každú formu spolupráce.
            </p>
          </motion.div>

          {/* Form Container */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            {/* Decorative corners */}
            {[
              { top: -3, left: -3, rotate: 0 },
              { top: -3, right: -3, rotate: 90 },
              { bottom: -3, right: -3, rotate: 180 },
              { bottom: -3, left: -3, rotate: 270 },
            ].map((pos, i) => (
              <motion.div
                key={i}
                className="absolute w-8 h-8 pointer-events-none z-10"
                style={pos}
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.4 + i * 0.1 }}
              >
                <svg viewBox="0 0 32 32" className="w-full h-full">
                  <path
                    d="M 0 8 Q 0 0 8 0 M 0 16 Q 0 0 16 0"
                    stroke="#d97706"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    opacity="0.6"
                  />
                </svg>
              </motion.div>
            ))}

            {/* Glow effect */}
            <motion.div
              className="absolute inset-0 rounded-3xl"
              animate={{
                opacity: [0.3, 0.5, 0.3],
                scale: [0.98, 1.02, 0.98],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              style={{
                background: 'radial-gradient(circle at center, rgba(217, 119, 6, 0.15), transparent 70%)',
                filter: 'blur(30px)',
                zIndex: -1,
              }}
            />

            <div className="relative rounded-3xl overflow-hidden border-2 border-amber-200/50 dark:border-amber-800/50 shadow-2xl backdrop-blur-sm">
              {/* Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-amber-50/95 via-orange-50/90 to-amber-100/95 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-amber-900/40" />
              
              {/* Texture */}
              <div 
                className="absolute inset-0 opacity-20 dark:opacity-10"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E")`,
                }}
              />

              <div className="relative p-8 md:p-12">
                <AnimatePresence mode="wait">
                  {!isSubmitted ? (
                    <motion.form
                      key="form"
                      onSubmit={handleSubmit}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-6"
                    >
                      {/* Name field */}
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                      >
                        <label 
                          className="block text-amber-950 dark:text-amber-100 mb-2 uppercase tracking-wide text-sm"
                          style={{ fontFamily: 'Georgia, "Times New Roman", serif', letterSpacing: '0.1em' }}
                        >
                          Vaše meno
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            onFocus={() => setFocusedField('name')}
                            onBlur={() => setFocusedField(null)}
                            className="w-full px-4 py-3 bg-white/50 dark:bg-amber-950/20 border-2 border-amber-200/50 dark:border-amber-700/50 rounded-xl outline-none transition-all text-amber-950 dark:text-amber-50"
                            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                          />
                          <motion.div
                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-600 to-transparent"
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: focusedField === 'name' ? 1 : 0 }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                      </motion.div>

                      {/* Email field */}
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                      >
                        <label 
                          className="block text-amber-950 dark:text-amber-100 mb-2 uppercase tracking-wide text-sm"
                          style={{ fontFamily: 'Georgia, "Times New Roman", serif', letterSpacing: '0.1em' }}
                        >
                          Email
                        </label>
                        <div className="relative">
                          <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            onFocus={() => setFocusedField('email')}
                            onBlur={() => setFocusedField(null)}
                            className="w-full px-4 py-3 bg-white/50 dark:bg-amber-950/20 border-2 border-amber-200/50 dark:border-amber-700/50 rounded-xl outline-none transition-all text-amber-950 dark:text-amber-50"
                            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                          />
                          <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-600/40 dark:text-amber-400/40 pointer-events-none" />
                          <motion.div
                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-600 to-transparent"
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: focusedField === 'email' ? 1 : 0 }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                      </motion.div>

                      {/* Contribution type */}
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                      >
                        <label 
                          className="block text-amber-950 dark:text-amber-100 mb-3 uppercase tracking-wide text-sm"
                          style={{ fontFamily: 'Georgia, "Times New Roman", serif', letterSpacing: '0.1em' }}
                        >
                          Typ príspevku
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {contributionTypes.map((type, idx) => {
                            const Icon = type.icon;
                            return (
                              <motion.label
                                key={type.value}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.4 + idx * 0.05 }}
                                className="relative cursor-pointer"
                              >
                                <input
                                  type="radio"
                                  name="contributionType"
                                  value={type.value}
                                  checked={formData.contributionType === type.value}
                                  onChange={(e) => setFormData({ ...formData, contributionType: e.target.value })}
                                  className="sr-only"
                                />
                                <motion.div
                                  className={`relative p-4 rounded-xl border-2 transition-all ${
                                    formData.contributionType === type.value
                                      ? 'bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/60 dark:to-orange-900/50 border-amber-500 dark:border-amber-600 shadow-lg'
                                      : 'bg-white/30 dark:bg-amber-950/10 border-amber-200/50 dark:border-amber-700/50 hover:border-amber-400 dark:hover:border-amber-600'
                                  }`}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <div className="flex items-center gap-3">
                                    <Icon className={`w-5 h-5 ${
                                      formData.contributionType === type.value
                                        ? 'text-amber-700 dark:text-amber-400'
                                        : 'text-amber-600/60 dark:text-amber-400/60'
                                    }`} />
                                    <span 
                                      className={`text-sm ${
                                        formData.contributionType === type.value
                                          ? 'text-amber-950 dark:text-amber-50'
                                          : 'text-amber-900/70 dark:text-amber-100/70'
                                      }`}
                                      style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                                    >
                                      {type.label}
                                    </span>
                                  </div>
                                  {formData.contributionType === type.value && (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      className="absolute top-2 right-2"
                                    >
                                      <CheckCircle className="w-5 h-5 text-amber-700 dark:text-amber-400" />
                                    </motion.div>
                                  )}
                                </motion.div>
                              </motion.label>
                            );
                          })}
                        </div>
                      </motion.div>

                      {/* Message field */}
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5 }}
                      >
                        <label 
                          className="block text-amber-950 dark:text-amber-100 mb-2 uppercase tracking-wide text-sm"
                          style={{ fontFamily: 'Georgia, "Times New Roman", serif', letterSpacing: '0.1em' }}
                        >
                          Vaša správa
                        </label>
                        <div className="relative">
                          <textarea
                            required
                            rows={5}
                            value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            onFocus={() => setFocusedField('message')}
                            onBlur={() => setFocusedField(null)}
                            placeholder="Popíšte čím by ste chceli prispieť..."
                            className="w-full px-4 py-3 bg-white/50 dark:bg-amber-950/20 border-2 border-amber-200/50 dark:border-amber-700/50 rounded-xl outline-none transition-all resize-none text-amber-950 dark:text-amber-50 placeholder:text-amber-800/40 dark:placeholder:text-amber-200/30"
                            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                          />
                          <motion.div
                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-600 to-transparent"
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: focusedField === 'message' ? 1 : 0 }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                      </motion.div>

                      {/* Submit button */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.6 }}
                        className="flex justify-center pt-4"
                      >
                        <motion.button
                          type="submit"
                          className="relative px-8 py-4 bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 text-amber-50 rounded-xl overflow-hidden group shadow-lg"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {/* Shimmer effect */}
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                            animate={{
                              x: ['-200%', '200%'],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              repeatDelay: 1,
                              ease: 'linear',
                            }}
                          />
                          
                          <span 
                            className="relative flex items-center gap-3 uppercase tracking-wider"
                            style={{ fontFamily: 'Georgia, "Times New Roman", serif', letterSpacing: '0.15em' }}
                          >
                            <Send className="w-5 h-5" />
                            Odoslať správu
                          </span>
                        </motion.button>
                      </motion.div>
                    </motion.form>
                  ) : (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="text-center py-12"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                      >
                        <CheckCircle className="w-20 h-20 text-green-600 dark:text-green-400 mx-auto mb-6" />
                      </motion.div>
                      
                      <h3 
                        className="text-amber-950 dark:text-amber-100 mb-4"
                        style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                      >
                        Ďakujeme za váš záujem!
                      </h3>
                      
                      <p 
                        className="text-stone-600 dark:text-stone-400 max-w-md mx-auto"
                        style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontStyle: 'italic' }}
                      >
                        Vašu správu sme prijali. Ozveme sa vám čo najskôr s ďalšími informáciami o spolupráci.
                      </p>

                      {/* Sparkles animation */}
                      {[...Array(8)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute w-1 h-1 rounded-full bg-amber-500"
                          style={{
                            left: '50%',
                            top: '50%',
                          }}
                          initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                          animate={{
                            opacity: [0, 1, 0],
                            scale: [0, 1.5, 0],
                            x: Math.cos((i / 8) * Math.PI * 2) * 100,
                            y: Math.sin((i / 8) * Math.PI * 2) * 100,
                          }}
                          transition={{
                            duration: 1,
                            delay: i * 0.05,
                            ease: "easeOut"
                          }}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
