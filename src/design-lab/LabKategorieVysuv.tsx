'use client';

/**
 * LIŠTA KATEGÓRIÍ, KTORÁ SA VYSUNIE PRI POSUNE NAHOR.
 *
 * Tá istá deviatka dlaždíc, aká stojí na začiatku článku, je takto po ruke
 * NA CELOM WEBE: kto sa počas čítania pohne nahor, dostane rozcestník hneď
 * pod hlavičkou a nemusí sa prerolovať na začiatok stránky.
 *
 * Prečo až pri posune nahor a nie stále: lišta je vysoká ako dva riadky
 * textu a keby visela nad stránkou vždy, ukrojila by z obrazovky práve
 * tam, kde sa číta. Pohyb nahor je prirodzený signál „hľadám, kam ďalej".
 *
 * Kedy sa NEUKÁŽE:
 *   • v prvých 420 px stránky — tam je rozcestník aj tak na dosah
 *     (na domovskej dlaždice, v článku vlastná lišta),
 *   • keď je otvorená roletka kategórií v hlavičke — bola by to tá istá
 *     ponuka dvakrát cez seba.
 */

import { useEffect, useRef, useState } from 'react';
import LabKategorieLista from './LabKategorieLista';

/** Odkiaľ vyššie má zmysel ponúkať rozcestník. */
const PRAH = 420;
/** Mŕtvy chod, aby lišta nepoblikávala pri chvení prsta na dotyku. */
const CHVENIE = 6;

export function LabKategorieVysuv() {
  const [vidno, setVidno] = useState(false);
  /* Hlavička je `sticky`, nie `fixed`, takže jej výšku treba odmerať —
     lišta sa musí zavesiť presne pod ňu, nie ju prekryť. */
  const [podHlavickou, setPodHlavickou] = useState(0);
  const posledny = useRef(0);
  const ceka = useRef(false);

  useEffect(() => {
    const zmeraj = () => {
      const h = document.querySelector('.lnav')?.getBoundingClientRect().height;
      if (h) setPodHlavickou(Math.round(h));
    };
    zmeraj();
    window.addEventListener('resize', zmeraj);
    return () => window.removeEventListener('resize', zmeraj);
  }, []);

  useEffect(() => {
    posledny.current = window.scrollY;

    const vyhodnot = () => {
      ceka.current = false;
      const y = window.scrollY;
      const rozdiel = y - posledny.current;
      if (Math.abs(rozdiel) < CHVENIE) return;
      posledny.current = y;

      const roletka = document.querySelector('.lnav')?.hasAttribute('data-expanded');
      if (y < PRAH || roletka) { setVidno(false); return; }
      setVidno(rozdiel < 0);
    };

    const naPosun = () => {
      if (ceka.current) return;
      ceka.current = true;
      requestAnimationFrame(vyhodnot);
    };

    window.addEventListener('scroll', naPosun, { passive: true });
    return () => window.removeEventListener('scroll', naPosun);
  }, []);

  /* Kategória, v ktorej človek je — na stránke kategórie ju lišta zvýrazní.
     Čítame ju pri každom vysunutí, nie raz na začiatku: web prepína stránky
     bez obnovenia a cesta sa medzitým mení. */
  const aktivna = vidno && typeof window !== 'undefined'
    ? (window.location.pathname.match(/^\/category\/([^/?#]+)/)?.[1] ?? undefined)
    : undefined;

  return (
    <div
      className={vidno ? 'cat-vysuv je-vidno' : 'cat-vysuv'}
      style={{ top: podHlavickou }}
      aria-hidden={!vidno}
      /* Skrytú lištu vyraďuje z klikania aj z tabulátora `visibility: hidden`
         v CSS — spoľahlivejšie než `inert`, ktorý React 18 ešte nepozná. */
    >
      <LabKategorieLista aktivna={aktivna} />
    </div>
  );
}

export default LabKategorieVysuv;
