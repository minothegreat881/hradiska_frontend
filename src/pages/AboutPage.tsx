'use client';

import { motion } from 'motion/react';
import { Users, Target, BookOpen, Mail } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

export function AboutPage() {
  const timeline = [
    { year: '2015', event: 'Založenie projektu hradiska.sk' },
    { year: '2017', event: 'Spustenie databázy 500+ lokalít' },
    { year: '2019', event: 'Pridanie interaktívnej mapy' },
    { year: '2021', event: 'Rozšírenie o blog a odborné články' },
    { year: '2023', event: 'Redesign a nové funkcie' },
    { year: '2024', event: 'Spolupráca s archeologickými ústavmi' },
  ];

  const team = [
    {
      name: 'Dr. Mária Novotná',
      role: 'Vedúca projektu',
      specialization: 'Veľká Morava',
    },
    {
      name: 'Mgr. Peter Kovács',
      role: 'Archeológ',
      specialization: 'Metodika výskumu',
    },
    {
      name: 'Doc. PhDr. Martin Furman, PhD.',
      role: 'Historik',
      specialization: 'Včasný stredovek',
    },
    {
      name: 'Ing. Jana Horváthová',
      role: 'Kurátorka',
      specialization: 'Múzejníctvo',
    },
  ];

  return (
    <div id="main-content" className="min-h-screen bg-white dark:bg-stone-950">
      {/* Hero */}
      <section className="relative bg-gradient-to-b from-clay-50 to-white dark:from-stone-900 dark:to-stone-950 overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1702234458473-978dff0d6b1a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpZXZhbCUyMGZvcnRyZXNzfGVufDF8fHx8MTc2MjE3OTA1NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            alt=""
            className="w-full h-full object-cover"
          />
        </div>

        <div className="container relative py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-stone-900 dark:text-stone-50 mb-6">
                O projekte Hradiska.sk
              </h1>
              <p className="text-stone-600 dark:text-stone-400">
                Digitálna platforma venovaná slovenskej archeológii, ktorá
                sprístupňuje bohatstvo archeologických lokalít širokej verejnosti
                aj odborníkom.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 md:py-24 bg-white dark:bg-stone-950">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-sky-100 dark:bg-sky-950 flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-sky-600 dark:text-sky-400" />
              </div>
              <h3 className="text-stone-900 dark:text-stone-100 mb-3">
                Naša misia
              </h3>
              <p className="text-sm text-stone-600 dark:text-stone-400">
                Sprístupniť archeologické dedičstvo Slovenska a podporiť
                záujem o históriu a archeológiu medzi širokou verejnosťou.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-clay-100 dark:bg-clay-900/30 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-clay-600 dark:text-clay-400" />
              </div>
              <h3 className="text-stone-900 dark:text-stone-100 mb-3">
                Vzdelávanie
              </h3>
              <p className="text-sm text-stone-600 dark:text-stone-400">
                Poskytujeme kvalitné a overené informácie o archeologických
                lokalitách, nálezoch a výskumných metódach.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-stone-600 dark:text-stone-400" />
              </div>
              <h3 className="text-stone-900 dark:text-stone-100 mb-3">
                Komunita
              </h3>
              <p className="text-sm text-stone-600 dark:text-stone-400">
                Prepájame archeológov, historikov, študentov a nadšencov
                archeológie v rámci jednej platformy.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 md:py-24 bg-stone-50 dark:bg-stone-900">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-stone-900 dark:text-stone-50 mb-12 text-center">
              História projektu
            </h2>

            <div className="space-y-6">
              {timeline.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="flex gap-6"
                >
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-sky-600 text-white flex items-center justify-center flex-shrink-0">
                      <span className="text-sm">{item.year}</span>
                    </div>
                    {idx < timeline.length - 1 && (
                      <div className="w-0.5 h-full bg-stone-200 dark:bg-stone-800 mt-2" />
                    )}
                  </div>
                  <div className="flex-1 pb-8">
                    <div className="p-6 bg-white dark:bg-stone-950 rounded-2xl border border-stone-200 dark:border-stone-800">
                      <p className="text-stone-900 dark:text-stone-100">
                        {item.event}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 md:py-24 bg-white dark:bg-stone-950">
        <div className="container">
          <h2 className="text-stone-900 dark:text-stone-50 mb-12 text-center">
            Náš tím
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {team.map((member, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="text-center"
              >
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-clay-400 to-clay-600 flex items-center justify-center text-white mx-auto mb-4 text-2xl">
                  {member.name.charAt(0)}
                </div>
                <h3 className="text-stone-900 dark:text-stone-100 mb-1">
                  {member.name}
                </h3>
                <div className="text-sm text-sky-600 dark:text-sky-400 mb-2">
                  {member.role}
                </div>
                <div className="text-xs text-stone-500 dark:text-stone-400">
                  {member.specialization}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-clay-50 to-white dark:from-stone-900 dark:to-stone-950">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-16 h-16 rounded-2xl bg-sky-600 flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-stone-900 dark:text-stone-50 mb-4">
              Máte otázku alebo pripomienku?
            </h2>
            <p className="text-stone-600 dark:text-stone-400 mb-8">
              Budeme radi, ak nám napíšete. Vaša spätná väzba nám pomáha
              zlepšovať projekt a poskytovať kvalitnejší obsah.
            </p>
            <a
              href="mailto:info@hradiska.sk"
              className="inline-flex items-center gap-2 px-8 py-4 bg-sky-600 hover:bg-sky-700 text-white rounded-xl transition-colors"
            >
              <Mail className="w-5 h-5" />
              info@hradiska.sk
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
