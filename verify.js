// 游戏运行验证：模拟initGame + 跑600帧update，检查不报错+能出兵
const fs = require('fs');
const html = fs.readFileSync('/home/user/Doubao/chats/38444220314495490/tower-defense-demo.html', 'utf8');
const m = html.match(/<script>([\s\S]*?)<\/script>/);
if (!m) { console.log('FAIL: no script found'); process.exit(1); }

// 构建mock环境
const ctxMock = new Proxy({}, {
  get: (t, k) => {
    if (k === 'createLinearGradient' || k === 'createRadialGradient') return () => ({ addColorStop: () => {} });
    return () => ({});
  }
});
const makeEl = () => ({style:{}, textContent:'', onclick:null, addEventListener:()=>{}, width:1200, height:720,
  getContext: () => ctxMock, getBoundingClientRect: () => ({left:0,top:0,width:1200,height:720})});
const canvasMock = makeEl();
global.document = {
  getElementById: (id) => id === 'gameCanvas' ? canvasMock : makeEl(),
  addEventListener: () => {},
  createElement: () => makeEl(),
  body: { insertAdjacentHTML: () => {} }
};
global.window = { innerWidth:1200, innerHeight:720, addEventListener: () => {} };
global.Image = function() { this.onload=null; this._ready=false; this.complete=true; this.naturalWidth=100; this.naturalHeight=100; };
global.requestAnimationFrame = () => {};
global.Image = function() { this.onload=null; this._ready=false; };
global.requestAnimationFrame = () => {};

try {
  // 执行游戏代码
  eval(m[1] + '\n; globalThis.__initGame = initGame; globalThis.__update = update; globalThis.__render = render; globalThis.__getGame = () => game;');
  
  // 1. initGame
  __initGame();
  globalThis.__game = __getGame();
  console.log('✓ initGame OK');
  
  // 2. 跑600帧update (每帧0.1秒=60秒游戏时间)
  let maxUnits = 0;
  for (let i = 0; i < 600; i++) {
    __update(0.1);
    if (__game.units.length > maxUnits) maxUnits = __game.units.length;
  }
  console.log('✓ 600帧update OK, 最大存活单位:', maxUnits);
  
  // 3. 检查状态
  console.log('✓ 游戏时间:', __game.time.toFixed(1) + 's');
  console.log('✓ 兵营数量:', __game.barracks.length);
  console.log('✓ 塔数量:', __game.towers.length);
  console.log('✓ 金币:', __game.gold);
  
  if (maxUnits === 0) {
    console.log('FAIL: 60秒内没有出兵');
    process.exit(1);
  }
  
  // 4. render不报错
  __render();
  console.log('✓ render OK');
  
  console.log('\n=== 全部通过 ===');
} catch(e) {
  console.log('FAIL:', e.message);
  console.log(e.stack.split('\n').slice(0,5).join('\n'));
  process.exit(1);
}
