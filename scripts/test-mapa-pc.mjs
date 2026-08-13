/** To isté, ale na počítači: myš musí mapu ťahať a bod musí otvoriť kartu. */
import { chromium } from 'playwright';

const URL = process.argv[2] || 'http://localhost:4188/';

const run = async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('PAGE ERROR: ' + e.message));

  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  for (let i = 0; i < 3; i++) {
    const b = page.locator('.ck-btn-primary').first();
    if (await b.count() && await b.isVisible()) { await b.click({ force: true }); await page.waitForTimeout(300); }
    else break;
  }
  await page.waitForSelector('.lmap', { timeout: 30000 });
  await page.locator('.lmap-canvas').scrollIntoViewIfNeeded();
  await page.waitForTimeout(4500);

  const box = await page.locator('.lmap-canvas').boundingBox();
  const cx = Math.round(box.x + box.width / 2), cy = Math.round(box.y + box.height / 2);

  const top = await page.evaluate(([x, y]) => {
    const e = document.elementFromPoint(x, y);
    return e ? e.tagName + '.' + String(e.className || '') : null;
  }, [cx, cy]);
  console.log('pod kurzorom v strede mapy:', top);

  const shot = async () => await page.screenshot();
  const diffPct = (a, b) => { let d = 0; const n = Math.min(a.length, b.length); for (let k = 0; k < n; k++) if (a[k] !== b[k]) d++; return (d / n) * 100; };

  let prev = await shot(); await page.waitForTimeout(1200); let now = await shot();
  const base = diffPct(prev, now);
  console.log(`kontrola (bez pohybu): ${base.toFixed(2)} %`);

  prev = await shot();
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  for (let i = 1; i <= 12; i++) { await page.mouse.move(cx - i * 12, cy); await page.waitForTimeout(20); }
  await page.mouse.up();
  await page.waitForTimeout(1200);
  now = await shot();
  const d1 = diffPct(prev, now);
  console.log(`${d1 > Math.max(base * 3, 1) ? '✔' : '✘'}  ťahanie myšou: ${d1.toFixed(2)} %`);

  // karta po nabehnutí na bod
  await page.mouse.move(cx + 300, cy + 200);
  await page.waitForTimeout(600);
  console.log('bodov:', await page.locator('.lmap-pin').count(), ' zhlukov:', await page.locator('.lmap-cluster').count());
  const sel = (await page.locator('.lmap-pin').count()) ? '.lmap-pin' : '.lmap-cluster';
  const pin = (await page.locator(sel).count()) ? await page.locator(sel).first().boundingBox() : null;
  if (pin) {
    await page.mouse.move(pin.x + pin.width / 2, pin.y + pin.height / 2);
    await page.waitForTimeout(900);
    const card = await page.locator('.lmap-card').count();
    console.log(`${card ? '✔' : '✘'}  karta po nabehnutí na bod: ${card}`);
  } else console.log('✘  žiadny bod na plátne');

  if (errs.length) console.log('\n' + errs.join('\n'));
  await browser.close();
};
run().catch(e => { console.error('ZLYHALO:', e.message); process.exit(1); });
