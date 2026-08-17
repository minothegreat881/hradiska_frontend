/**
 * Nosič šatu Pečať pre ostrú stránku.
 *
 * Existuje len preto, aby sa `theme.css` (2 372 riadkov) sťahoval AŽ VTEDY,
 * keď je šat zapnutý. Keby sa importoval priamo v `App.tsx`, niesol by ho
 * v hlavnom balíku každý návštevník, aj kým je šat vypnutý — a to je počas
 * prevodu dlhé obdobie.
 *
 * Sám nič nevykresľuje; celý jeho zmysel je ten import.
 */
import './theme.css';

export default function SatPecat() {
  return null;
}
