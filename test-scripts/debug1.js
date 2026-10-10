const C = require('./common');
(async () => {
  const browser = await C.chromium.launch({ executablePath:'/usr/local/bin/chromium', args:['--no-sandbox'] });
  const page = await browser.newPage({ viewport:{width:1280,height:800} });
  await C.launchGame(page);
  // 开始
  await C.clickCanvas(page, 600, 360);
  await page.waitForTimeout(4000); // 过prepTime
  let st = await C.getState(page);
  console.log('开始4秒后:', JSON.stringify(st));

  // 图鉴
  await C.clickCanvas(page, 120, 730);
  await page.waitForTimeout(200);
  console.log('图鉴开?', await page.evaluate(()=>codexOpen));
  // 试几个关闭点
  for (const [x,y] of [[1140,70],[1150,90],[1130,80]]) {
    await C.clickCanvas(page, x, y);
    await page.waitForTimeout(150);
    console.log('点('+x+','+y+')后 codexOpen=', await page.evaluate(()=>codexOpen));
    if (await page.evaluate(()=>codexOpen)===false) break;
    // 没关掉就重开
    await C.clickCanvas(page, 120, 730);
    await page.waitForTimeout(150);
  }
  await C.shot(page,'dbg-codex');
  await browser.close();
})();
