// 汇总三轮结果生成测试用例文档
const fs = require('fs');
const base = '/home/user/Doubao/chats/38444220314495490';
const r1 = JSON.parse(fs.readFileSync(base+'/test-scripts/round1-results.json'));
const r2 = JSON.parse(fs.readFileSync(base+'/test-scripts/round2-results.json'));
const r3 = JSON.parse(fs.readFileSync(base+'/test-scripts/round3-results.json'));

const all = [...r1.results, ...r2.results, ...r3.results];

// 模块分组
const modules = {};
for (const r of all) {
  if (!modules[r.mod]) modules[r.mod] = [];
  modules[r.mod].push(r);
}

let md = `# 三路兵营战（v12.00）回归测试用例文档

> 测试时间：2026-10-10
> 测试环境：Node v22.23.2 + Playwright 1.64 + Chromium（/usr/local/bin/chromium），headless
> 被测文件：tower-defense-demo.html（5080行，单文件HTML/Canvas 2D，内部分辨率1200×780）
> 测试方法：file://加载页面，通过 page.evaluate() 调用 window.__debug API + simulateClick 自动化驱动

## 总览

| 轮次 | 用例数 | 通过 | 失败 | 通过率 |
|---|---|---|---|---|
| 第一轮 功能完备性 | ${r1.results.length} | ${r1.results.filter(r=>r.status==='PASS').length} | ${r1.results.filter(r=>r.status==='FAIL').length} | ${(r1.results.filter(r=>r.status==='PASS').length/r1.results.length*100).toFixed(0)}% |
| 第二轮 对战模拟 | ${r2.results.length} | ${r2.results.filter(r=>r.status==='PASS').length} | ${r2.results.filter(r=>r.status==='FAIL').length} | ${(r2.results.filter(r=>r.status==='PASS').length/r2.results.length*100).toFixed(0)}% |
| 第三轮 兼容适配 | ${r3.results.length} | ${r3.results.filter(r=>r.status==='PASS').length} | ${r3.results.filter(r=>r.status==='FAIL').length} | ${(r3.results.filter(r=>r.status==='PASS').length/r3.results.length*100).toFixed(0)}% |
| **合计** | **${all.length}** | **${all.filter(r=>r.status==='PASS').length}** | **${all.filter(r=>r.status==='FAIL').length}** | **${(all.filter(r=>r.status==='PASS').length/all.length*100).toFixed(0)}%** |

---

`;

for (const [mod, cases] of Object.entries(modules)) {
  md += `## ${mod}\n\n`;
  md += `| 用例ID | 用例名称 | 测试步骤 | 预期结果 | 实际结果 | 状态 |\n`;
  md += `|---|---|---|---|---|---|\n`;
  for (const c of cases) {
    const esc = s => (s||'').replace(/\|/g,'\\|').replace(/\n/g,' ');
    md += `| ${c.id} | ${esc(c.name)} | ${esc(c.steps)} | ${esc(c.expected)} | ${esc(c.actual)} | ${c.status==='PASS'?'✅通过':'❌失败'} |\n`;
  }
  md += `\n`;
}

fs.writeFileSync(base+'/测试用例文档.md', md);
console.log('测试用例文档已生成, 共', all.length, '条用例');
