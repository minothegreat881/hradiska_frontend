/**
 * Rozdelenie vloženého zoznamu na jednotlivé zdroje.
 *
 * Redaktor má bibliografiu v jednom kuse a nemá dôvod klikať „Pridať zdroj"
 * pri každom riadku. Ak text oddeľujú prázdne riadky, delí sa podľa nich
 * (jeden záznam sa tak môže tiahnuť cez dva riadky), inak podľa riadkov.
 * Holý odkaz na samostatnom riadku sa pripojí k zdroju nad ním ako jeho
 * odkaz — presne tak to vyzerá aj v hotovom článku.
 */
export function splitSourceList(raw: string): { text: string; url: string }[] {
  const text = (raw || '').replace(/\r\n/g, '\n').trim();
  if (!text) return [];
  const bloky = /\n\s*\n/.test(text) ? text.split(/\n\s*\n/) : text.split(/\n/);
  const out: { text: string; url: string }[] = [];
  for (const b of bloky) {
    const t = b.trim().replace(/\s*\n\s*/g, ' ');
    if (!t) continue;
    const samotnyOdkaz = /^https?:\/\/\S+$/i.test(t);
    if (samotnyOdkaz && out.length && !out[out.length - 1].url) {
      out[out.length - 1].url = t;
      continue;
    }
    out.push({ text: samotnyOdkaz ? '' : t, url: samotnyOdkaz ? t : '' });
  }
  return out;
}
