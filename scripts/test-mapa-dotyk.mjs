/**
 * Meranie, nie hádanie.
 *
 * Otvorí domovskú stránku v prehliadači s DOTYKOM, otvorí mapu na celú
 * obrazovku a spraví na nej ťah prstom. Potom povie:
 *   - ktorý prvok je pod prstom (a či nie je „priehľadný" pre dotyk),
 *   - reťaz `pointer-events` / `touch-action` od plátna nahor,
 *   - či sa mapa naozaj posunula (porovnanie snímok plátna).
 */
import { chromium } from 'playwright';

const URL = process.argv[2] || 'http://localhost:4188/';

const px = (buf) => {
  // hrubé porovnanie: koľko bajtov sa líši
  return buf;
};

const run = async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 412, height: 900 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Mobile Safari/537.36',
  });
  const page = await ctx.newPage();
  const log = [];
  page.on('console', m => { if (m.type() === 'error') log.push('CONSOLE ERROR: ' + m.text()); });
  page.on('pageerror', e => log.push('PAGE ERROR: ' + e.message));

  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.lmap', { timeout: 30000 });
  await page.waitForTimeout(4000);

  const cdp = await ctx.newCDPSession(page);

  // súhlas s cookies / výzva na inštaláciu prekrývajú spodok stránky
  for (let i = 0; i < 3; i++) {
    const b = page.locator('.ck-btn-primary').first();
    if (await b.count() && await b.isVisible()) { await b.click({ force: true }); await page.waitForTimeout(400); }
    else break;
  }
  await page.waitForTimeout(600);

  await page.locator('.lmap-canvas').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);
  const box = await page.locator('.lmap-canvas').boundingBox();
  console.log('== náhľad ==');
  console.log('plátno:', JSON.stringify(box));

  // ─ 1. ťuknutie: otvorí sa celá obrazovka? ─────────────────────────────
  const cx = Math.round(box.x + box.width / 2);
  const cy = Math.round(box.y + box.height / 2);
  await page.evaluate(([x, y]) => window.scrollBy(0, 0), [cx, cy]);

  const tap = async (x, y) => {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    await new Promise(r => setTimeout(r, 60));
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  };
  const pre = await page.evaluate(([x, y]) => {
    const top = document.elementFromPoint(x, y);
    return {
      shield: !!document.querySelector('.lmap-shield'),
      hint: !!document.querySelector('.lmap-open'),
      side: !!document.querySelector('.lmap-side'),
      topEl: top ? top.tagName + '.' + String(top.className || '') : null,
    };
  }, [cx, cy]);
  console.log('pred ťuknutím:', JSON.stringify(pre));

  await tap(cx, cy);
  await page.waitForTimeout(1200);

  const isFull = await page.evaluate(() => !!document.querySelector('.lmap.is-full'));
  console.log('otvorené na celú obrazovku:', isFull);
  if (!isFull) { console.log(log.join('\n')); await browser.close(); return; }

  await page.waitForTimeout(1500);

  // ─ 2. kto je pod prstom a aká je reťaz vlastností ─────────────────────
  const vp = page.viewportSize();
  const mx = Math.round(vp.width / 2), my = Math.round(vp.height / 2);
  const chain = await page.evaluate(([x, y]) => {
    const top = document.elementFromPoint(x, y);
    const out = [];
    for (let e = top; e && e !== document.documentElement; e = e.parentElement) {
      const cs = getComputedStyle(e);
      out.push({
        tag: e.tagName.toLowerCase(),
        cls: (e.className && e.className.baseVal !== undefined ? e.className.baseVal : String(e.className || '')).slice(0, 60),
        pe: cs.pointerEvents,
        ta: cs.touchAction,
      });
    }
    return out;
  }, [mx, my]);
  console.log('== pod prstom (zhora nadol) ==');
  chain.forEach(c => console.log(`  <${c.tag}.${c.cls}>  pointer-events=${c.pe}  touch-action=${c.ta}`));

  // ─ 3. ťah prstom: posunie sa mapa? ────────────────────────────────────
  const shot = async () => (await page.screenshot());
  const diffPct = (a, b) => {
    let d = 0; const n = Math.min(a.length, b.length);
    for (let k = 0; k < n; k++) if (a[k] !== b[k]) d++;
    return (d / n) * 100;
  };
  const drag = async (dx, dy, steps = 12) => {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: mx, y: my }] });
    for (let i = 1; i <= steps; i++) {
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove', touchPoints: [{ x: mx + (dx * i) / steps, y: my + (dy * i) / steps }],
      });
      await new Promise(r => setTimeout(r, 25));
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(1400);
  };
  const pinch = async (out) => {
    const a = { id: 1, x: mx - 40, y: my }, b = { id: 2, x: mx + 40, y: my };
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [a, b] });
    for (let i = 1; i <= 10; i++) {
      const s2 = out ? 40 + i * 12 : 40 - i * 3;
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ id: 1, x: mx - s2, y: my }, { id: 2, x: mx + s2, y: my }],
      });
      await new Promise(r => setTimeout(r, 30));
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(1400);
  };

  const t = [];
  let prev = await shot();
  await page.waitForTimeout(1400);
  let now = await shot();
  t.push(['kontrola (bez dotyku)', diffPct(prev, now), false]);

  prev = await shot(); await drag(-140, 0); now = await shot();
  t.push(['ťah DOĽAVA 140 px', diffPct(prev, now), true]);

  prev = await shot(); await drag(140, 0); now = await shot();
  t.push(['ťah DOPRAVA 140 px', diffPct(prev, now), true]);

  prev = await shot(); await drag(0, -160); now = await shot();
  t.push(['ťah HORE 160 px', diffPct(prev, now), true]);

  prev = await shot(); await drag(0, 160); now = await shot();
  t.push(['ťah DOLE 160 px', diffPct(prev, now), true]);

  prev = await shot(); await pinch(true); now = await shot();
  t.push(['štipnutie VON (priblíženie)', diffPct(prev, now), true]);

  prev = await shot(); await pinch(false); now = await shot();
  t.push(['štipnutie DNU (oddialenie)', diffPct(prev, now), true]);

  console.log('== gestá ==');
  const base = t[0][1];
  for (const [name, pct, want] of t) {
    const moved = pct > Math.max(base * 3, 1);
    const ok = want ? moved : true;
    console.log(`  ${ok ? '✔' : '✘'}  ${name.padEnd(30)} zmena ${pct.toFixed(2)} %${want ? (moved ? ' — reagovalo' : ' — BEZ REAKCIE') : ' (základ šumu)'}`);
  }

  if (log.length) console.log('\n== chyby v konzole ==\n' + log.join('\n'));
  await browser.close();
};

run().catch(e => { console.error('ZLYHALO:', e.message); process.exit(1); });
