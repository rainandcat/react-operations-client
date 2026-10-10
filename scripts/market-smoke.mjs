import { chromium } from '@playwright/test';
import { preview } from 'vite';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Optional real-network smoke check. CI uses fixtures instead.
const server = await preview({ preview: { host: '127.0.0.1', port: 4175, strictPort: true } });
let browser;
try {
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const responses = [];
  const failures = [];
  const errors = [];
  page.on('response', (response) => {
    if (response.url().startsWith('https://data-api.binance.vision/'))
      responses.push({ endpoint: new URL(response.url()).pathname, status: response.status() });
  });
  page.on('requestfailed', (request) => {
    if (request.url().startsWith('https://data-api.binance.vision/'))
      failures.push({
        endpoint: new URL(request.url()).pathname,
        error: request.failure()?.errorText
      });
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('http://127.0.0.1:4175/markets/BTCUSDT');
  const feed = page.locator('.feed-status');
  let live = false;
  try {
    await page.waitForFunction(
      () => document.querySelector('.feed-status')?.getAttribute('data-status') === 'live',
      undefined,
      { timeout: 25_000 }
    );
    live = true;
  } catch {
    /* Record unavailable instead of claiming success. */
  }
  const chartHeading = page.locator('.chart-heading p');
  const report = {
    checkedAt: new Date().toISOString(),
    environment: 'Local Chromium production preview',
    pair: 'BTCUSDT',
    live,
    status: await feed.getAttribute('data-status'),
    message: await feed.innerText(),
    candleCount: (await chartHeading.count()) ? await chartHeading.textContent() : null,
    responses,
    failures,
    errors
  };
  await writeFile(
    new URL('../docs/market-smoke.json', import.meta.url),
    JSON.stringify(report, null, 2) + '\n'
  );
  await page.screenshot({
    path: fileURLToPath(new URL('../docs/screenshots/market-live-smoke.png', import.meta.url)),
    fullPage: true
  });
  console.log(JSON.stringify(report, null, 2));
  if (!live || errors.length) process.exitCode = 1;
} finally {
  await browser?.close();
  await new Promise((resolve, reject) =>
    server.httpServer.close((error) => (error ? reject(error) : resolve()))
  );
}
