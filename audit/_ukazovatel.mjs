import { chromium } from 'playwright';
const b = await chromium.launch();
for (const [meno, w, h, mob, dot] of [
  ['mobil 390 (isMobile+touch)', 390, 844, true, true],
  ['dotykový notebook 1440 (touch, nie isMobile)', 1440, 900, false, true],
  ['myš 1440', 1440, 900, false, false],
]) {
  const ctx = await b.newContext({ viewport:{width:w,height:h}, isMobile:mob, hasTouch:dot });
  const p = await ctx.newPage();
  await p.goto('http://localhost:4188/design?t=pecat', { waitUntil:'domcontentloaded' });
  const r = await p.evaluate(() => ({
    pointerCoarse: matchMedia('(pointer: coarse)').matches,
    pointerFine: matchMedia('(pointer: fine)').matches,
    anyPointerCoarse: matchMedia('(any-pointer: coarse)').matches,
    hoverNone: matchMedia('(hover: none)').matches,
    anyHoverHover: matchMedia('(any-hover: hover)').matches,
    maxTouchPoints: navigator.maxTouchPoints,
  }));
  console.log(meno.padEnd(44), JSON.stringify(r));
  await ctx.close();
}
await b.close();
