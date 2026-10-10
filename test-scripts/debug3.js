const C = require('./common');
(async () => {
  const browser = await C.chromium.launch({ executablePath:'/usr/local/bin/chromium', args:['--no-sandbox'] });
  const page = await browser.newPage({ viewport:{width:1280,height:800} });
  await C.launchGame(page);
  await page.evaluate(()=>window.__debug.setSpeed(4));
  // 1v1 flow
  await C.clickCanvas(page, 195, 695);
  await page.waitForTimeout(200);
  await C.clickCanvas(page, 150, 570);
  await page.waitForTimeout(300);
  async function pick(i){ const r=await page.evaluate((x)=>getCodexButtonRect(x), i); await C.clickCanvas(page, r.x+r.w/2, r.y+r.h/2+60); await page.waitForTimeout(150); }
  await pick(0); await pick(3);
  console.log('pick:', await page.evaluate(()=>({duelA,duelB,duelPick})));
  // 点开始
  await C.clickCanvas(page, 600, 435);
  await page.waitForTimeout(1000);
  console.log('点开始后 duelAnim?', await page.evaluate(()=> duelAnim? {done:duelAnim.done,typeA:duelAnim.typeA,time:duelAnim.time} : null));
  await C.shot(page,'debug3-1v1start');
  await browser.close();
})();
