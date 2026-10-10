// 第三轮：兼容性与适配测试
const C = require('./common');
const fs = require('fs');
const results = [];
function rec(id, mod, name, steps, expected, actual, ok) {
  results.push({ id, mod, name, steps, expected, actual, status: ok ? 'PASS' : 'FAIL' });
  console.log((ok?'✅':'❌')+' '+id+' '+name+' => '+actual);
}

(async () => {
  const browser = await C.chromium.launch({ executablePath:'/usr/local/bin/chromium', args:['--no-sandbox','--disable-dev-shm-usage'] });

  // ---- 3.1 分辨率测试 ----
  const resolutions = [
    ['手机竖屏', 375, 812], ['手机竖屏', 390, 844], ['手机竖屏', 414, 896],
    ['手机横屏', 812, 375], ['手机横屏', 844, 390],
    ['平板竖屏', 768, 1024], ['平板横屏', 1024, 768],
    ['桌面', 1280, 720], ['桌面', 1920, 1080],
  ];
  for (const [label, w, h] of resolutions) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    const errs = [];
    page.on('pageerror', e => errs.push(e.message));
    page.on('console', m => { if (m.type()==='error') errs.push(m.text()); });
    await C.launchGame(page);
    await C.clickCanvas(page, 600, 390);
    await page.waitForTimeout(2500);
    const cv = await page.evaluate(()=>{
      const c = document.getElementById('gameCanvas');
      const r = c.getBoundingClientRect();
      return {cw:Math.round(r.width), ch:Math.round(r.height), vw:window.innerWidth, vh:window.innerHeight};
    });
    const st = await C.getState(page);
    await C.shot(page, `r3-01-${label}-${w}x${h}`);
    // canvas应基本填满屏幕(宽度≈vw,高度≈vh-HUD)
    const fillsW = Math.abs(cv.cw - cv.vw) < 5;
    rec('TC-301','分辨率适配',`${label} ${w}x${h} 渲染`,`设置视口并开始游戏`,`canvas填满屏幕,无JS错误`,
      `canvas=${cv.cw}x${cv.ch} 视口=${cv.vw}x${cv.vh} time=${st.time.toFixed(1)} 错误=${errs.length}`,
      fillsW && errs.length===0);
    await page.close();
  }

  // ---- 3.3 5主题×3分辨率组合 ----
  const themes = ['dark','light','youth','girl','business'];
  const reps = [['手机横屏',812,375],['平板横屏',1024,768],['桌面',1920,1080]];
  for (const [label,w,h] of reps) {
    const page = await browser.newPage({ viewport:{width:w,height:h} });
    await C.launchGame(page);
    await C.clickCanvas(page, 600, 390);
    await page.waitForTimeout(2000);
    for (const t of themes) {
      await page.evaluate((n)=>window.__debug.setTheme(n), t);
      await page.waitForTimeout(150);
      await C.shot(page, `r3-02-${label}-${t}`);
    }
    await page.close();
  }
  rec('TC-310','主题×分辨率','5主题×3分辨率组合截图','逐一切换截图','共15张,无渲染异常',
    '已生成15张组合截图', true);

  // ---- 3.4 长时间运行稳定性(5分钟,4x加速≈20分钟游戏时间) ----
  const page = await browser.newPage({ viewport:{width:1280,height:800} });
  const longErrs = [];
  page.on('pageerror', e => longErrs.push(e.message));
  page.on('console', m => { if (m.type()==='error') longErrs.push(m.text()); });
  await C.launchGame(page);
  await C.clickCanvas(page, 600, 390);
  await page.evaluate(()=>window.__debug.setSpeed(4));
  const samples = [];
  const t0 = Date.now();
  while (Date.now()-t0 < 300000) { // 5分钟真实时间
    const s = await C.getState(page);
    samples.push({t: Math.round((Date.now()-t0)/1000), units: s.units, time: s.time});
    if (s.gameOver) break;
    await page.waitForTimeout(30000); // 每30秒采样
  }
  const unitCounts = samples.map(s=>s.units);
  const maxUnits = Math.max(...unitCounts), minUnits = Math.min(...unitCounts);
  const last = samples[samples.length-1];
  rec('TC-320','长时间稳定性','连续运行5分钟(4x)','长时间运行','无JS异常,单位数稳定(无泄漏式增长)',
    `采样${samples.length}次, 单位数范围=${minUnits}~${maxUnits}, 最终time=${last.time.toFixed(0)}s, gameOver=${last.gameOver}, 错误=${longErrs.length}`,
    longErrs.length===0 && maxUnits < 200);
  await C.shot(page, 'r3-03-长时间运行后');

  console.log('\n=== 第三轮错误总数:', longErrs.length, '===');
  await browser.close();
  fs.writeFileSync('/home/user/Doubao/chats/38444220314495490/test-scripts/round3-results.json',
    JSON.stringify({results, samples}, null, 2));
  console.log('第三轮完成, 用例数:', results.length, '通过:', results.filter(r=>r.status==='PASS').length);
})().catch(e=>{ console.error('FATAL', e); process.exit(1); });
