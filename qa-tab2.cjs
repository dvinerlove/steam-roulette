const { chromium } = require('C:/Users/adrew/AppData/Local/npm-cache/_npx/31e32ef8478fbf80/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Users/adrew/AppData/Local/ms-playwright/chromium-1255/chrome-win64/chrome.exe' });
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 800 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.addInitScript(() => {
    const games = [];
    for (let i = 1; i <= 80; i++) games.push({ id: 'g'+i, name: 'Game ' + i, color: '#6366f1' });
    localStorage.setItem('fortuneWheelGames', JSON.stringify(games));
    localStorage.setItem('fortuneWheelSettings', JSON.stringify({steam:{enableIntegration:false}}));
    localStorage.setItem('fortuneWheelListCollapsed', '1');
  });
  await page.goto('http://localhost:5173/fortune-wheel/', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('button[aria-expanded="false"]', { timeout: 15000 });
  await page.waitForTimeout(700);
  await page.screenshot({ path: 'docs/review/tab2-idle.png' });
  await page.locator('button[aria-expanded="false"]').hover();
  await page.waitForTimeout(350);
  await page.screenshot({ path: 'docs/review/tab2-hover.png' });
  await page.locator('button[aria-expanded="false"]').click();
  await page.waitForTimeout(500);
  const expanded = await page.evaluate(() => !!document.querySelector('input'));
  console.log('expanded ok:', expanded, '| errors:', errors);
  await page.screenshot({ path: 'docs/review/tab2-expanded.png' });
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
