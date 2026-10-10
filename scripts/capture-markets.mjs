import { chromium } from '@playwright/test';
import { preview } from 'vite';
import { fileURLToPath } from 'node:url';

const server = await preview({ preview: { host: '127.0.0.1', port: 4175, strictPort: true } });
let browser;
try {
  browser = await chromium.launch();
  for (const [name, viewport] of [
    ['desktop', { width: 1440, height: 1000 }],
    ['mobile', { width: 390, height: 844 }]
  ]) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    await page.route('https://data-api.binance.vision/**', (route) => route.abort());
    await page.goto('http://127.0.0.1:4175/?mode=demo');
    await page.locator('.feed-status[data-status="demo"]').waitFor();
    await page.screenshot({
      path: fileURLToPath(new URL(`../docs/screenshots/market-home-${name}.png`, import.meta.url)),
      fullPage: true
    });
    await page.goto('http://127.0.0.1:4175/markets/BTCUSDT?mode=demo');
    await page.locator('.candle-chart canvas').first().waitFor();
    await page.screenshot({
      path: fileURLToPath(
        new URL(`../docs/screenshots/market-detail-${name}.png`, import.meta.url)
      ),
      fullPage: true
    });
    await context.close();
  }
  console.log(
    'Saved desktop/mobile Home and candle screenshots using explicit fixed demonstration data.'
  );
} finally {
  await browser?.close();
  await new Promise((resolve, reject) =>
    server.httpServer.close((error) => (error ? reject(error) : resolve()))
  );
}
