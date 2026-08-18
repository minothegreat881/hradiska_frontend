/* Viditeľnosť fokusového rámu sa nedá overiť tým, že rám existuje — musí byť
 * VIDNO ho voči podkladu, na ktorom leží (norma: 3:1 pre netextové prvky).
 *   node audit/zameranie-kontrast.mjs [ruta] [URL]
 */
import { chromium } from 'playwright';
const RUTA = process.argv[2] || '/design/blog/mikulcice-kopcany?t=pecat';
const BASE = process.argv[3] || 'http://localhost:4188';
const ZDROJ = 'https://webdesignforhradiskask.vercel.app';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport:{width:1440,height:900} });
const p = await ctx.newPage();
if (BASE.includes('localhost')) await p.route('**/strapi/**', async (r) => { const u=new URL(r.request().url());
  try { const res=await fetch(ZDROJ+u.pathname+u.search,{headers:{accept:'application/json'}});
    r.fulfill({status:res.status, body:Buffer.from(await res.arrayBuffer()), headers:{'content-type':res.headers.get('content-type')||'application/json'}}); } catch { r.abort(); } });
await p.goto(BASE+RUTA, { waitUntil:'domcontentloaded' });
/* Cookie lišta sa objavuje s oneskorením a prekrýva spodok stránky —
   bez trpezlivého odkliknutia hlásia merania falošné chyby (kurzor
   skončí na lište, nie na mape). */
for (let i = 0; i < 12; i++) {
  const x = p.locator('.ck-btn-primary').first();
  if (await x.count() && await x.isVisible()) { await x.click({ force: true }); await p.waitForTimeout(400); }
  if (!(await p.locator('.ck-root').count())) break;
  await p.waitForTimeout(500);
}
await p.waitForTimeout(6000);
await p.evaluate(()=>window.scrollTo(0,0));
const KROKOV = Number(process.env.KROKOV || 40);
let slabe = [];
for (let i = 1; i <= KROKOV; i++) {
  await p.keyboard.press('Tab');
  await p.waitForTimeout(120);
  const s = await p.evaluate(() => {
    const e = document.activeElement; if (!e || e === document.body) return null;
    const roz=(x)=>{const m=/rgba?\(([^)]+)\)/.exec(x);if(!m)return null;const q=m[1].split(',').map(parseFloat);return{c:[q[0],q[1],q[2]],a:q.length>3?q[3]:1};};
    const jas=(c)=>{const t=c.map(v=>{v/=255;return v<=0.03928?v/12.92:((v+0.055)/1.055)**2.4;});return .2126*t[0]+.7152*t[1]+.0722*t[2];};
    const pom=(f,g)=>{const x=jas(f),y=jas(g);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
    const cs = getComputedStyle(e);
    /* podklad, na ktorom rám leží — prvý nepriehľadný predok NAD prvkom */
    let bg=[255,255,255];
    for (let k=e.parentElement;k;k=k.parentElement){const q=roz(getComputedStyle(k).backgroundColor);
      if(q&&q.a>.9){bg=q.c;break;}}
    const ram = roz(cs.outlineColor);
    const sirka = parseFloat(cs.outlineWidth);
    const jeRam = cs.outlineStyle !== 'none' && sirka > 0;
    return { kto: e.tagName.toLowerCase()+((e.className+'').split(' ').filter(Boolean)[0]?'.'+(e.className+'').split(' ').filter(Boolean)[0]:''),
             text:(e.innerText||e.getAttribute('aria-label')||'').trim().slice(0,24),
             jeRam, sirka, pomer: jeRam && ram ? +pom(ram.c, bg).toFixed(2) : null };
  });
  if (!s) continue;
  if (!s.jeRam) slabe.push(`${i}. ${s.kto} „${s.text}" — ŽIADNY RÁM`);
  else if (s.pomer !== null && s.pomer < 3) slabe.push(`${i}. ${s.kto} „${s.text}" — rám ${s.pomer}:1 (treba 3:1)`);
}
console.log(`ruta ${RUTA}`);
console.log(slabe.length ? '✘ ' + slabe.join('\n✘ ') : `✔ všetkých ${KROKOV} zastávok má rám s kontrastom aspoň 3:1`);
await b.close();
