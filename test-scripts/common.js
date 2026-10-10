// 共享测试工具
const { chromium } = require('playwright');
const path = require('path');

const GAME_URL = 'file:///home/user/Doubao/chats/38444220314495490/tower-defense-demo.html';
const SHOT_DIR = '/home/user/Doubao/chats/38444220314495490/test-screenshots';

async function launchGame(page) {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push('[console.error] ' + msg.text());
  });
  page.on('pageerror', err => errors.push('[pageerror] ' + err.message));
  await page.goto(GAME_URL, { waitUntil: 'load' });
  // 等待游戏循环跑几帧
  await page.waitForTimeout(800);
  return errors;
}

// canvas逻辑坐标点击 (0-1200, 0-780)
async function clickCanvas(page, x, y) {
  await page.evaluate(([cx, cy]) => window.__debug.simulateClick(cx, cy), [x, y]);
  await page.waitForTimeout(150);
}

async function getState(page) {
  return page.evaluate(() => window.__debug.getState());
}

async function getUnits(page) {
  return page.evaluate(() => window.__debug.getUnitList());
}

async function shot(page, name) {
  await page.screenshot({ path: path.join(SHOT_DIR, name + '.png') });
}

module.exports = { chromium, GAME_URL, SHOT_DIR, launchGame, clickCanvas, getState, getUnits, shot };
