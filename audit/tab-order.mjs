/* Poradie tabulátora OKOM: prejde stránku, po každom kroku odfotí zameraný
 * prvok aj s okolím a zapíše, kde sa nachádza.
 *   node audit/tab-order.mjs <ruta> [URL]
 */
import { chromium } from 'playwright';
const RUTA = process.argv[2] || '/design/blog/mikulcice-kopcany?t=pecat';
const BASE = process.argv[3] || 'http://localhost:4188';
const ZDROJ = 'https://webdesignforhradiskask.vercel.app';
const MENO = RUTA.includes('/blog/') ? 'clanok' : 'domovska';

const b = await chromium.launch();
const ctx = await b.newContext({ viewport:{width:1440,height:900}, deviceScaleFactor:2 });
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
await p.waitForTimeout(800);

const KROKOV = Number(process.env.KROKOV || 34);
let bezRamu = 0, mimoHladiska = 0;
for (let i = 1; i <= KROKOV; i++) {
  await p.keyboard.press('Tab');
  await p.waitForTimeout(160);
  const s = await p.evaluate(() => {
    const e = document.activeElement;
    if (!e || e === document.body) return null;
    const cs = getComputedStyle(e);
    const r = e.getBoundingClientRect();
    const ram = (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || cs.boxShadow !== 'none';
    return { kto: e.tagName.toLowerCase() + ((e.className+'').split(' ').filter(Boolean)[0] ? '.'+(e.className+'').split(' ').filter(Boolean)[0] : ''),
             text: (e.innerText||e.getAttribute('aria-label')||'').trim().slice(0,28),
             ram, x:r.x, y:r.y, w:r.width, h:r.height,
             vHladisku: r.top >= -2 && r.bottom <= innerHeight + 2 && r.left >= -2 && r.right <= innerWidth + 2,
             ramPopis: cs.outlineStyle + ' ' + cs.outlineWidth + ' ' + cs.outlineColor };
  });
  if (!s) { console.log(`${String(i).padStart(2)}  (mimo stránky)`); continue; }
  if (!s.ram) bezRamu++;
  if (!s.vHladisku) mimoHladiska++;
  console.log(`${String(i).padStart(2)}  ${s.ram ? '▣' : '✘ BEZ RÁMU'}  ${s.vHladisku ? '' : '↕ mimo hľadiska '}${s.kto}  „${s.text}"   ${s.ramPopis}`);
  await p.screenshot({ path: `audit/screenshots/tab-${MENO}-${String(i).padStart(2,'0')}.png`,
    clip: { x: Math.max(0, s.x-24), y: Math.max(0, Math.min(s.y-24, 900-100)), width: Math.min(520, 1440), height: Math.min(140, 900) } });
}
console.log(`\nbez rámu: ${bezRamu} · mimo hľadiska: ${mimoHladiska} · krokov: ${KROKOV}`);
await b.close();
