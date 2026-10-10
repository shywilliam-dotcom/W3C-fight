// 第一轮：功能完备性测试
const C = require('./common');
const fs = require('fs');

const results = [];
function rec(id, mod, name, steps, expected, actual, ok) {
  results.push({ id, mod, name, steps, expected, actual, status: ok ? 'PASS' : 'FAIL' });
  console.log((ok?'✅':'❌')+' '+id+' '+name+' => '+actual);
}

(async () => {
  const browser = await C.chromium.launch({ executablePath: '/usr/local/bin/chromium', args:['--no-sandbox','--disable-dev-shm-usage'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = await C.launchGame(page);

  // ---- 1.1 核心流程 ----
  rec('TC-101','核心流程','页面加载无JS错误','打开页面','无console.error/pageerror',
    `捕获错误数=${errors.length}: ${errors.slice(0,3).join(' | ')}`, errors.length===0);

  let st = await C.getState(page);
  rec('TC-102','核心流程','初始状态：金币500/时间0/未开始','读取getState()','gold=500,time=0,started为假',
    `gold=${st.gold},time=${st.time},started=${String(st.started)}`, st.gold===500 && st.time===0 && !st.started);

  // 开始对战：游戏区(400-800,280-380) -> canvas y=340-440, center(600,390)
  await C.clickCanvas(page, 600, 390);
  await page.waitForTimeout(300);
  st = await C.getState(page);
  rec('TC-103','核心流程','点击开始对战按钮','simulateClick(600,390)','started=true',
    `started=${st.started}`, st.started===true);

  await page.waitForTimeout(4500); // 过prepTime 3秒
  st = await C.getState(page);
  rec('TC-104','核心流程','开战倒计时后时间递增','等待4.5秒(含3秒备战)','time>0',
    `time=${st.time.toFixed(1)}`, st.time>0);

  const goldBefore = (await C.getState(page)).gold;
  await page.waitForTimeout(1000);
  const goldAfter = (await C.getState(page)).gold;
  rec('TC-105','经济系统','被动收入5金/秒','记录1秒前后金币差','增长约5金(±2)',
    `前=${goldBefore} 后=${goldAfter} 差=${goldAfter-goldBefore}`, Math.abs((goldAfter-goldBefore)-5)<=2);

  st = await C.getState(page);
  rec('TC-106','核心流程','单位生成/塔数','读取状态','塔数=22(双方11座),单位>0',
    `towers=${st.towers},units=${st.units}`, st.towers===22 && st.units>0);
  await C.shot(page, 'r1-01-游戏中-dark');

  // ---- 1.2 英雄祭坛 ----
  await page.evaluate(()=>window.__debug.setGold(500));
  // 我方中路祭坛 slot0 world(5,940) -> canvas(5,280)
  await C.clickCanvas(page, 5, 280);
  await page.waitForTimeout(200);
  let menuOpen = await page.evaluate(()=>!!game.altarPickMenu);
  rec('TC-120','英雄祭坛','点击未解锁栏位弹出选兵菜单','点击祭坛slot0','altarPickMenu非空',
    `altarPickMenu=${menuOpen}`, menuOpen===true);

  // melee按钮 game区(300-440,140-220) center(370,180)->canvas(370,240)
  await C.clickCanvas(page, 370, 240);
  await page.waitForTimeout(400);
  let units = await C.getUnits(page);
  let myHeroes = units.filter(u=>u.side==='my' && u.type==='melee');
  rec('TC-121','英雄祭坛','选择刀盾手解锁并生成英雄','点击melee按钮','我方出现melee英雄',
    `我方melee数=${myHeroes.length}, 我方单位=${units.filter(u=>u.side==='my').length}`, myHeroes.length>=1);

  await C.shot(page, 'r1-02-解锁英雄后');

  // 等英雄走远，避免单位点击拦截祭坛
  await page.waitForTimeout(8000);
  await C.clickCanvas(page, 115, 280); // slot1 world(115,940)
  await page.waitForTimeout(200);
  menuOpen = await page.evaluate(()=>!!game.altarPickMenu);
  rec('TC-122','英雄祭坛','再次弹出选兵菜单(弓手)','点击slot1','菜单打开',
    `altarPickMenu=${menuOpen}`, menuOpen===true);
  if (menuOpen) {
    await C.clickCanvas(page, 525, 240); // archer
    await page.waitForTimeout(400);
  }
  units = await C.getUnits(page);
  rec('TC-123','英雄祭坛','解锁弓手','选archer','我方出现archer',
    `我方类型=[${[...new Set(units.filter(u=>u.side==='my'&&u.isHero!==undefined).map(u=>u.type))].join(',')}]`,
    units.filter(u=>u.side==='my'&&u.type==='archer').length>=1);

  // 金币不足测试
  await page.evaluate(()=>window.__debug.setGold(10));
  await C.clickCanvas(page, 5, 390); // slot2 world(5,1050)->canvas(5,450)
  await page.waitForTimeout(200);
  menuOpen = await page.evaluate(()=>!!game.altarPickMenu);
  await C.clickCanvas(page, 685, 240); // mage 90金
  await page.waitForTimeout(200);
  const goldNow = (await C.getState(page)).gold;
  const afterUnits = await C.getUnits(page);
  const mageSpawned = afterUnits.filter(u=>u.side==='my'&&u.type==='mage').length;
  rec('TC-124','经济系统','金币不足无法解锁(不扣金币)','setGold(10)后点mage(90金)','不扣90金,无mage英雄',
    `菜单开=${menuOpen}, 操作后金币=${goldNow}(<90), mage数=${mageSpawned}`, menuOpen===true && goldNow<90 && mageSpawned===0);

  // ---- 1.5 UI交互 ----
  let speedBefore = (await C.getState(page)).speed;
  await C.clickCanvas(page, 45, 695);
  let speedAfter = (await C.getState(page)).speed;
  rec('TC-150','UI交互','速度按钮切换1x→2x','点击速度按钮','speed翻倍',
    `${speedBefore}->${speedAfter}`, speedAfter===speedBefore*2);
  await C.clickCanvas(page, 45, 695); await C.clickCanvas(page, 45, 695);
  speedAfter = (await C.getState(page)).speed;
  rec('TC-151','UI交互','速度循环1x→2x→4x→1x','累计点3次','回到1x',
    `speed=${speedAfter}`, speedAfter===1);

  await C.clickCanvas(page, 120, 695);
  let autoOn = await page.evaluate(()=>game.autoRevive);
  rec('TC-152','UI交互','AUTO自动复活开关','点击AUTO','autoRevive=true',
    `autoRevive=${autoOn}`, autoOn===true);
  await C.clickCanvas(page, 120, 695);

  // 设置菜单
  await C.clickCanvas(page, 45, 730);
  await page.waitForTimeout(200);
  let settingsOpen = await page.evaluate(()=>game.settingsOpen);
  rec('TC-153','UI交互','设置菜单打开','点击设置','settingsOpen=true',
    `settingsOpen=${settingsOpen}`, settingsOpen===true);
  await C.shot(page, 'r1-03-设置菜单-dark');

  // ---- 1.6 主题系统 ----
  const themes = ['dark','light','youth','girl','business'];
  for (const t of themes) {
    await page.evaluate((name)=>window.__debug.setTheme(name), t);
    await page.waitForTimeout(150);
    await C.shot(page, 'r1-04-主题-'+t);
  }
  const lightText = await page.evaluate(()=>THEMES.light.textPrimary);
  rec('TC-160','主题系统','light主题文字为深色(非白)','读THEMES.light.textPrimary','深色',
    `textPrimary=${lightText}`, lightText.toLowerCase()!=='#ffffff' && lightText!=='#fff');

  await page.evaluate(()=>window.__debug.setTheme('dark'));
  st = await C.getState(page);
  rec('TC-161','主题系统','5主题可切换无异常','逐一切换','全部成功,无JS错误',
    `当前主题=${st.theme}, 错误数=${errors.length}`, st.theme==='dark' && errors.length===0);

  // 设置菜单里点主题按钮 light (游戏区 i=1 bx=963 center987, y457->canvas517)
  // settings仍开着，直接点
  await C.clickCanvas(page, 987, 517);
  await page.waitForTimeout(200);
  const themeNow = await page.evaluate(()=>currentTheme);
  rec('TC-162','主题系统','设置菜单主题按钮切换light','设置菜单中点light按钮','theme=light',
    `theme=${themeNow}`, themeNow==='light');
  await C.shot(page, 'r1-05-light主题');
  // 关闭设置 (游戏区1140-1175,385-410 center1157,397->canvas457)
  await C.clickCanvas(page, 1157, 457);
  await page.waitForTimeout(150);

  // 图鉴
  await C.clickCanvas(page, 120, 730);
  await page.waitForTimeout(200);
  let codexOpen = await page.evaluate(()=>codexOpen);
  rec('TC-163','UI交互','图鉴打开','点击图鉴','codexOpen=true',
    `codexOpen=${codexOpen}`, codexOpen===true);
  await C.shot(page, 'r1-06-图鉴');
  // 关闭图鉴 (1150,90 实测有效)
  await C.clickCanvas(page, 1150, 90);
  await page.waitForTimeout(150);
  codexOpen = await page.evaluate(()=>codexOpen);
  rec('TC-164','UI交互','图鉴关闭','点关闭按钮','codexOpen=false',
    `codexOpen=${codexOpen}`, codexOpen===false);

  // 模拟菜单
  await C.clickCanvas(page, 195, 695);
  await page.waitForTimeout(200);
  const simOpen = await page.evaluate(()=>game.simOpen);
  rec('TC-165','UI交互','模拟菜单打开(1v1/多v多/对局)','点击模拟','simOpen=true',
    `simOpen=${simOpen}`, simOpen===true);
  await C.shot(page, 'r1-07-模拟菜单');
  await C.clickCanvas(page, 600, 360); // 菜单外关闭
  await page.waitForTimeout(150);

  // 选中单位信息栏：实时取一个我方英雄位置点击
  const sel = await page.evaluate(()=>{
    const u = game.units.find(x=>x.side==='my' && x.hp>0 && x.isHero);
    if (!u) return null;
    const cx = u.x - viewX;
    const cy = (u.y - viewY) + HUD_H;
    window.__debug.simulateClick(cx, cy);
    return {name:u.name, type:u.type, wx:Math.round(u.x), wy:Math.round(u.y)};
  });
  await page.waitForTimeout(250);
  const selNow = await page.evaluate(()=>game.selectedUnit ? {name:game.selectedUnit.name,type:game.selectedUnit.type} : null);
  rec('TC-166','UI交互','点击单位显示信息栏','点击我方英雄','selectedUnit非空',
    `目标=${JSON.stringify(sel)} 选中=${JSON.stringify(selNow)}`, sel!==null && selNow!==null);

  // ---- 1.7 调试系统 ----
  const apiCheck = await page.evaluate(()=>{
    const d = window.__debug;
    const keys = ['getLogs','clearLogs','simulateClick','getState','setTheme','getUnitList','forceWin','forceLose','setGold','setSpeed'];
    return { missing: keys.filter(k=>typeof d[k]!=='function'), stateKeys: Object.keys(d.getState()), logsIsArr: Array.isArray(d.getLogs()) };
  });
  rec('TC-170','调试系统','__debug API全部可调用','检查10个API','全部function',
    `缺失=${apiCheck.missing.join(',')||'无'}, 字段=${apiCheck.stateKeys.join(',')}`,
    apiCheck.missing.length===0 && apiCheck.logsIsArr);

  await page.evaluate(()=>window.__debug.forceWin());
  await page.waitForTimeout(200);
  st = await C.getState(page);
  rec('TC-171','调试系统','forceWin触发胜利','调用forceWin','gameOver=true',
    `gameOver=${st.gameOver}`, st.gameOver===true);
  await C.shot(page, 'r1-08-forceWin胜利');

  console.log('\n=== 第一轮错误总数:', errors.length, '===');
  await browser.close();
  fs.writeFileSync('/home/user/Doubao/chats/38444220314495490/test-scripts/round1-results.json',
    JSON.stringify({results, errors}, null, 2));
  console.log('第一轮完成, 用例数:', results.length, '通过:', results.filter(r=>r.status==='PASS').length);
})().catch(e=>{ console.error('FATAL', e); process.exit(1); });
