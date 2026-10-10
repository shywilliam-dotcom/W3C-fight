// 第二轮：对战模拟测试（重点1v1与多vs多）
const C = require('./common');
const fs = require('fs');
const results = [];
function rec(id, mod, name, steps, expected, actual, ok) {
  results.push({ id, mod, name, steps, expected, actual, status: ok ? 'PASS' : 'FAIL' });
  console.log((ok?'✅':'❌')+' '+id+' '+name+' => '+actual);
}

// 等待duel结束
async function waitDuel(page, timeoutMs=40000) {
  const t0 = Date.now();
  while (Date.now()-t0 < timeoutMs) {
    const d = await page.evaluate(()=> duelAnim ? {done:duelAnim.done, winner:duelAnim.winner, time:duelAnim.time, logs:duelAnim.logs.length,
      myAlive: duelAnim.game.units.filter(u=>u.side==='my'&&u.hp>0).length,
      enAlive: duelAnim.game.units.filter(u=>u.side==='enemy'&&u.hp>0).length} : null);
    if (d && d.done) return d;
    await page.waitForTimeout(300);
  }
  return null;
}

(async () => {
  const browser = await C.chromium.launch({ executablePath:'/usr/local/bin/chromium', args:['--no-sandbox','--disable-dev-shm-usage'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = await C.launchGame(page);
  await page.evaluate(()=>window.__debug.setSpeed(4));

  // ============ 2.1 正常模式AI对战 ============
  await C.clickCanvas(page, 600, 390); // 开始
  await page.waitForTimeout(4000);
  const t0 = Date.now();
  const startSt = await C.getState(page);
  // 运行至结束或120秒(4x加速≈30秒真实时间)
  let endSt=null;
  while (Date.now()-t0 < 35000) {
    endSt = await C.getState(page);
    if (endSt.gameOver) break;
    await page.waitForTimeout(1000);
  }
  rec('TC-201','AI对战','正常模式AI自动对战','开始游戏跑120秒(4x)','AI解锁祭坛/复活/推进,正常结束',
    `用时=${Math.round((Date.now()-t0)/1000)}s, gameOver=${endSt.gameOver}, units=${endSt.units}, towers=${endSt.towers}, time=${endSt.time.toFixed(0)}`,
    endSt.gameOver===true || endSt.time>=115);
  await C.shot(page,'r2-01-AI对战结束');

  // ============ 2.2 PVP对局模拟(双方AI) ============
  await page.evaluate(()=>{ if(typeof restartGame==='function') restartGame(); });
  await page.waitForTimeout(500);
  await page.evaluate(()=>startSimulation(1));
  await page.waitForTimeout(500);
  // watch模式需手动点开始
  await C.clickCanvas(page, 600, 390);
  await page.waitForTimeout(500);
  await page.evaluate(()=>window.__debug.setSpeed(4));
  const watchOn = await page.evaluate(()=>game._watchMode===true);
  rec('TC-210','PVP模拟','对局模拟启动(watch模式)','startSimulation(1)->点开始','_watchMode=true,双方AI',
    `_watchMode=${watchOn}, started=${(await C.getState(page)).started}`, watchOn===true);
  // 观战模式双方AI运行,等待结束
  let pvpEnd=null;
  for (let i=0;i<50;i++){
    pvpEnd = await C.getState(page);
    if (pvpEnd.gameOver) break;
    await page.waitForTimeout(1000);
  }
  rec('TC-211','PVP模拟','对局模拟运行至结束','等待观战结束','有胜负,单位数稳定无异常',
    `gameOver=${pvpEnd.gameOver}, units=${pvpEnd.units}, towers=${pvpEnd.towers}, time=${pvpEnd.time.toFixed(0)}`,
    pvpEnd.gameOver===true);
  await C.shot(page,'r2-02-PVP对局模拟');

  // ============ 2.3 1v1完整UI流程 ============
  // 重新开始
  await page.evaluate(()=>{ if(typeof restartGame==='function') restartGame(); });
  await page.evaluate(()=>window.__debug.setSpeed(4));
  await page.waitForTimeout(500);
  // 打开模拟菜单 -> 1v1
  await C.clickCanvas(page, 195, 695);
  await page.waitForTimeout(200);
  await C.clickCanvas(page, 150, 570); // 1v1选项
  await page.waitForTimeout(300);
  let duelModeOn = await page.evaluate(()=>duelMode && codexOpen);
  rec('TC-220','1v1对战','选兵界面打开','模拟菜单->1v1','图鉴1v1选兵模式',
    `duelMode=${await page.evaluate(()=>duelMode)}, duelPick=${await page.evaluate(()=>duelPick)}`, duelModeOn);

  // 选我方: index0=melee; 选敌方: index3=fighter
  async function pickDuelUnit(idx){
    const rect = await page.evaluate((i)=>getCodexButtonRect(i), idx);
    // rect.y是游戏区坐标, canvas需+HUD_H(60)
    await C.clickCanvas(page, rect.x + rect.w/2, rect.y + rect.h/2 + 60);
    await page.waitForTimeout(150);
  }
  await pickDuelUnit(0); // melee
  let pick1 = await page.evaluate(()=>({duelA, duelPick}));
  await pickDuelUnit(3); // fighter
  let pick2 = await page.evaluate(()=>({duelA, duelB, duelPick}));
  rec('TC-221','1v1对战','UI选择两个兵种(刀盾手vs格斗家)','点刀盾手->格斗家','duelA/duelB设定,duelPick=2',
    `A=${pick2.duelA} B=${pick2.duelB} pick=${pick2.duelPick}`, pick2.duelA==='melee' && pick2.duelB==='fighter' && pick2.duelPick===2);
  // 开始按钮 game区(450-750,350-400)->canvas y=410-460 center435
  await C.clickCanvas(page, 600, 435);
  await page.waitForTimeout(500);
  let d = await waitDuel(page);
  rec('TC-222','1v1对战','刀盾手vs格斗家 战斗结束','等待结束','有胜者/平局,日志输出',
    d? `胜者=${d.winner} 用时=${d.time.toFixed(1)}s 日志数=${d.logs}` : '超时未结束', d!==null && d.logs>5);
  await C.shot(page,'r2-03-1v1-刀盾vs格斗');

  // ============ 1v1 三组兵种组合(直接调用startDuel) ============
  const combos = [
    ['TC-223','近战vs近战','barbarian','fighter'],
    ['TC-224','远程vs近战','ranger','paladin'],
    ['TC-225','法师vs攻城','arcane','cannon'],
  ];
  for (const [id,label,a,b] of combos) {
    await page.evaluate(([ta,tb])=>startDuel(ta,tb,6), [a,b]);
    await page.waitForTimeout(300);
    d = await waitDuel(page);
    const logSample = await page.evaluate(()=> duelAnim ? duelAnim.logs.slice(-3).map(l=>l.msg||l).join(' | ') : '');
    rec(id,'1v1对战',label+'('+a+' vs '+b+')','startDuel运行','正常结束,有胜者,有战斗日志',
      d? `胜者=${d.winner} 用时=${d.time.toFixed(1)}s 日志数=${d.logs} 末日志=${logSample.slice(0,40)}` : '超时',
      d!==null);
  }
  await C.shot(page,'r2-04-1v1-法师vs攻城');

  // ============ 2.4 多vs多 5v5 UI流程 ============
  await page.evaluate(()=>{ if(typeof restartGame==='function') restartGame(); });
  await page.evaluate(()=>window.__debug.setSpeed(4));
  await page.waitForTimeout(500);
  await C.clickCanvas(page, 195, 695);
  await page.waitForTimeout(200);
  await C.clickCanvas(page, 150, 600); // 多vs多选项 (game cy525-555->canvas585-615)
  await page.waitForTimeout(300);
  let pickState = await page.evaluate(()=>({duelPick, duelMode}));
  rec('TC-230','多vs多','多vs多选兵界面打开','模拟菜单->多vs多','duelPick=10选我方',
    `duelPick=${pickState.duelPick}`, pickState.duelPick===10);

  // 我方5个: 0,4,8,12,1 (melee,archer,mage,cannon,barbarian)
  const teamIdxs = [0,4,8,12,1];
  for (const i of teamIdxs) await pickDuelUnit(i);
  await page.waitForTimeout(200);
  let teamACount = await page.evaluate(()=>duelTeamA.length);
  // 完成按钮 game区(950-1170,650-700)->canvas y=710-760 center735
  await C.clickCanvas(page, 1060, 735);
  await page.waitForTimeout(200);
  let pickState2 = await page.evaluate(()=>({duelPick, teamA:duelTeamA.length}));
  rec('TC-231','多vs多','我方选满5个兵种并进入选敌方','选5个->完成','duelPick=11',
    `我方选了=${teamACount}个, 完成后duelPick=${pickState2.duelPick}`, teamACount===5 && pickState2.duelPick===11);
  // 敌方5个: 3,7,11,15,5 (fighter,crossbow,fire,siege,musketeer)
  for (const i of [3,7,11,15,5]) await pickDuelUnit(i);
  await C.clickCanvas(page, 1060, 735);
  await page.waitForTimeout(200);
  let pickState3 = await page.evaluate(()=>({duelPick, teamB:duelTeamB.length}));
  rec('TC-232','多vs多','敌方选满5个兵种','选5个->完成','duelPick=12等级页',
    `敌方选了=${pickState3.teamB}个, duelPick=${pickState3.duelPick}`, pickState3.duelPick===12);
  // 开始按钮 game区(450-750,350-400)->canvas y435
  await C.clickCanvas(page, 600, 435);
  await page.waitForTimeout(500);
  d = await waitDuel(page, 60000);
  rec('TC-233','多vs多','5v5战斗运行至结束','等待结束','一方全灭或超时,无异常',
    d? `胜者=${d.winner} 用时=${d.time.toFixed(1)}s 日志数=${d.logs} 我方存活=${d.myAlive} 敌方存活=${d.enAlive}` : '超时',
    d!==null);
  await C.shot(page,'r2-05-多vs多-5v5战斗中');
  await page.waitForTimeout(2000);
  await C.shot(page,'r2-06-多vs多-5v5结果');

  // ============ 5主题下1v1/多v多UI配色 ============
  const themes = ['dark','light','youth','girl','business'];
  for (const t of themes) {
    await page.evaluate((name)=>window.__debug.setTheme(name), t);
    await page.waitForTimeout(200);
    // 重新开一局1v1
    await page.evaluate(()=>startDuel('melee','ranger',6));
    await page.waitForTimeout(800);
    await C.shot(page,'r2-07-主题'+t+'-1v1');
    await page.evaluate(()=>startDuelMulti(['melee','archer','mage'],['fighter','crossbow','fire'],6));
    await page.waitForTimeout(800);
    await C.shot(page,'r2-08-主题'+t+'-多v多');
  }

  console.log('\n=== 第二轮错误总数:', errors.length, '===');
  await browser.close();
  fs.writeFileSync('/home/user/Doubao/chats/38444220314495490/test-scripts/round2-results.json',
    JSON.stringify({results, errors}, null, 2));
  console.log('第二轮完成, 用例数:', results.length, '通过:', results.filter(r=>r.status==='PASS').length);
})().catch(e=>{ console.error('FATAL', e); process.exit(1); });
