/**
 * Šírka okna ADMINISTRÁCIE (nie plátna) — pre rozvrh na telefóne a tablete.
 *
 * Prahy sú tie isté ako v `admin-mobil.css`:
 *   • úzke (≤ 1023 px): ponuka v zásuvke, panel editora vzhľadu ako spodný list,
 *   • telefón (≤ 767 px): jeden stĺpec, dialógy na celú obrazovku, náhľad Mobil.
 *
 * Nepýta sa `window.matchMedia`: kým je otvorený editor vzhľadu, plátno ho
 * presmeruje na svoje okno (`vzhlad/Platno.tsx`), takže by odpovedalo podľa
 * šírky plátna. `innerWidth` okna administrácie plátno nemení.
 */
import { useEffect, useState } from 'react';

export const UZKE_MAX = 1023;
export const TELEFON_MAX = 767;

export const jeUzke = () => typeof window !== 'undefined' && window.innerWidth <= UZKE_MAX;
export const jeTelefon = () => typeof window !== 'undefined' && window.innerWidth <= TELEFON_MAX;

export function useSirkaAdministracie(): { uzke: boolean; telefon: boolean } {
  const [s, setS] = useState(() => ({ uzke: jeUzke(), telefon: jeTelefon() }));
  useEffect(() => {
    const zmena = () => setS((p) => {
      const n = { uzke: jeUzke(), telefon: jeTelefon() };
      return n.uzke === p.uzke && n.telefon === p.telefon ? p : n;
    });
    window.addEventListener('resize', zmena);
    zmena();
    return () => window.removeEventListener('resize', zmena);
  }, []);
  return s;
}
