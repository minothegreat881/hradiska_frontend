/* Popisy máp a veľkosť hlasovacích tlačidiel na PRODUKČNÝCH routách.
 *   node audit/mapa-popisy.mjs [URL]
 */
import { chromium } from 'playwright';
const BASE = process.argv[2] || 'http://localhost:4188';
const ZDROJ = 'https://webdesignforhradiskask.vercel.app';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport:{width:1440,height:900} });
const p = await ctx.newPage();
if (BASE.includes('localhost')) await p.route('**/strapi/**', async (r) => { const u=new URL(r.request().url());
  try { const res=await fetch(ZDROJ+u.pathname+u.search,{headers:{accept:'application/json'}});
    r.fulfill({status:res.status, body:Buffer.from(await res.arrayBuffer()), headers:{'content-type':res.headers.get('content-type')||'application/json'}}); } catch { r.abort(); } });
await p.goto(BASE+'/blog/mikulcice-kopcany',{waitUntil:'domcontentloaded'});
for (let i=0;i<3;i++){const x=p.locator('.ck-btn-primary').first();
  if(await x.count()&&await x.isVisible()){await x.click({force:true});await p.waitForTimeout(300);}else break;}
await p.waitForTimeout(9000);
await p.evaluate(()=>window.scrollTo(0,document.body.scrollHeight/2));
await p.waitForTimeout(4000);
const popisy = await p.evaluate(() => [...new Set(
  [...document.querySelectorAll('.maplibregl-canvas, .maplibregl-ctrl button, .maplibregl-marker')]
    .map(e => (e.getAttribute('aria-label') || e.getAttribute('title') || '').trim()).filter(Boolean))]);
console.log('popisy mapy v článku:', JSON.stringify(popisy));
const anglicke = popisy.filter(t => /^(Map|Zoom|Reset|Enter|Exit|Find)\b/i.test(t));
console.log(anglicke.length ? '✘ anglické: ' + anglicke.join(', ') : '✔ všetky po slovensky');
await p.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));
await p.waitForTimeout(5000);
const t = await p.evaluate(() => { const x=[...document.querySelectorAll('button')].find(e=>(e.getAttribute('title')||'').includes('Páči'));
  if(!x) return null; const q=x.getBoundingClientRect(); return [Math.round(q.width), Math.round(q.height)]; });
console.log('hlasovacie tlačidlo:', t ? `${t[0]}×${t[1]} ${t[0]>=44&&t[1]>=44?'✔':'✘'}` : 'nenájdené');
await b.close();
