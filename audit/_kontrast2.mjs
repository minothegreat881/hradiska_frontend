/* Kontrast so ZATRIEDENÍM: text nad fotografiou sa z farieb merať nedá,
   takže ho hlásim osobitne ako „na ručné posúdenie", nie ako porušenie. */
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
const BASE = process.argv[2] || 'https://webdesignforhradiskask.vercel.app';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport:{width:1440,height:900} });
const p = await ctx.newPage();
const out = {};
for (const [n, cesta] of [['domovska','/design?t=pecat'], ['clanok','/design/blog/mikulcice-kopcany?t=pecat']]) {
  await p.goto(BASE+cesta, { waitUntil:'domcontentloaded' });
  for (let i=0;i<3;i++){const x=p.locator('.ck-btn-primary').first();
    if(await x.count()&&await x.isVisible()){await x.click({force:true});await p.waitForTimeout(300);}else break;}
  await p.waitForTimeout(6500);
  out[n] = await p.evaluate(() => {
    const lum=(c)=>{const s=c.map(v=>{v/=255;return v<=0.03928?v/12.92:((v+0.055)/1.055)**2.4;});return .2126*s[0]+.7152*s[1]+.0722*s[2];};
    const rgb=(s)=>{const m=/rgba?\(([^)]+)\)/.exec(s);if(!m)return null;const q=m[1].split(',').map(parseFloat);return{c:[q[0],q[1],q[2]],a:q.length>3?q[3]:1};};
    const nadFotkou=(el)=>{
      for(let e=el;e;e=e.parentElement){
        const cs=getComputedStyle(e);
        if(cs.backgroundImage && cs.backgroundImage!=='none' && !cs.backgroundImage.startsWith('linear-gradient(rgba(0, 0, 0, 0)')) return true;
        if(e.querySelector && e.querySelector(':scope > img, :scope > picture')) return true;
        if(cs.position!=='static' && [...(e.parentElement?.children||[])].some(s=>s.tagName==='IMG'||s.tagName==='PICTURE')) return true;
      }
      return false;
    };
    const pozadie=(el)=>{for(let e=el;e;e=e.parentElement){const q=rgb(getComputedStyle(e).backgroundColor);if(q&&q.a>.85)return q.c;}return[255,255,255];};
    const pom=(f,g)=>{const a=lum(f),c=lum(g);return (Math.max(a,c)+.05)/(Math.min(a,c)+.05);};
    const cesta=(el)=>el.tagName.toLowerCase()+([...el.classList].slice(0,2).join('.')?'.'+[...el.classList].slice(0,2).join('.'):'');
    const merane=[], fotka=[]; const videne=new Set();
    for(const el of document.querySelectorAll('p,span,a,h1,h2,h3,h4,li,button,label,small,div')){
      if(!el.textContent||!el.textContent.trim())continue;
      if([...el.children].some(c=>c.textContent&&c.textContent.trim()))continue;
      const r=el.getBoundingClientRect(); if(r.width<4||r.height<4)continue;
      const cs=getComputedStyle(el);
      if(cs.visibility==='hidden'||cs.opacity==='0'||cs.display==='none')continue;
      const f=rgb(cs.color); if(!f)continue;
      const px=parseFloat(cs.fontSize);
      const velke=px>=24||(px>=18.66&&+cs.fontWeight>=700);
      const min=velke?3:4.5;
      const v=pom(f.c,pozadie(el));
      if(v>=min)continue;
      const k=cesta(el)+'|'+Math.round(v*10); if(videne.has(k))continue; videne.add(k);
      const zaznam={el:cesta(el),text:el.textContent.trim().slice(0,34),pomer:+v.toFixed(2),min,px:Math.round(px)};
      (nadFotkou(el)?fotka:merane).push(zaznam);
    }
    return { merane, fotka };
  });
}
await b.close();
writeFileSync('audit/kontrast.json', JSON.stringify(out,null,1),'utf8');
for(const [k,v] of Object.entries(out)){
  console.log(`\n### ${k}`);
  console.log(`porušenia (plná farba pozadia): ${v.merane.length}`);
  v.merane.sort((a,b)=>a.pomer-b.pomer).forEach(x=>console.log(`  ${x.pomer}:1 (min ${x.min}) ${x.px}px  ${x.el}  "${x.text}"`));
  console.log(`nad fotografiou — automaticky nemerateľné: ${v.fotka.length}`);
  v.fotka.slice(0,4).forEach(x=>console.log(`  ~${x.pomer}:1  ${x.el}  "${x.text}"`));
}
