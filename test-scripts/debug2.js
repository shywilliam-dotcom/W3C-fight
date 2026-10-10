const C = require('./common');
(async () => {
  const browser = await C.chromium.launch({ executablePath:'/usr/local/bin/chromium', args:['--no-sandbox'] });
  const page = await browser.newPage({ viewport:{width:1280,height:800} });
  await C.launchGame(page);
  await C.clickCanvas(page, 600, 390);
  await page.waitForTimeout(4000);
  await page.evaluate(()=>window.__debug.setGold(500));

  // unlock melee slot0
  await C.clickCanvas(page, 5, 280);
  await page.waitForTimeout(150);
  await C.clickCanvas(page, 370, 240); // melee
  await page.waitForTimeout(500);
  console.log('解锁melee后 units:', JSON.stringify((await C.getUnits(page)).filter(u=>u.side==='my')));

  // 等英雄走开
  await page.waitForTimeout(8000);
  // 找中路祭坛slot1位置
  console.log('8秒后 my units:', JSON.stringify((await C.getUnits(page)).filter(u=>u.side==='my').map(u=>({t:u.type,x:u.y>900&&u.y<1100?u.x:undefined}))));
  await C.clickCanvas(page, 115, 280);
  await page.waitForTimeout(200);
  console.log('点slot1后 menu=', await page.evaluate(()=>game.altarPickMenu));
  if (await page.evaluate(()=>game.altarPickMenu)) {
    await C.clickCanvas(page, 525, 240); // archer
    await page.waitForTimeout(500);
    console.log('选archer后 my units:', JSON.stringify((await C.getUnits(page)).filter(u=>u.side==='my').map(u=>u.type)));
    console.log('gold=', (await C.getState(page)).gold);
  }
  await browser.close();
})();
