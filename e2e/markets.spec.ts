import { expect, test } from '@playwright/test';
import { installMarketFixtures } from './marketFixtures';

test('recent trades deduplicate bursts, isolate pairs and keep explicit fixture mode', async ({
  page
}) => {
  const fixtures = await installMarketFixtures(page, { sendTrades: false });
  await page.goto('/?mode=demo');
  await page.getByRole('link', { name: 'Explore markets', exact: true }).click();
  await expect(page).toHaveURL(/\/markets\/BTCUSDT\?mode=demo$/);
  await page.getByRole('link', { name: '← Back to home' }).click();
  await page.getByRole('link', { name: 'Markets', exact: true }).click();
  await expect(page).toHaveURL(/\/markets\/BTCUSDT$/);
  await expect(page.getByRole('status').filter({ hasText: 'Live · Binance Spot' })).toBeVisible();
  await expect(
    page.getByText('Waiting for new executions. No trade history is loaded.')
  ).toBeVisible();
  const socket = fixtures.sockets.at(-1)!;
  expect(new URL(socket.url()).searchParams.get('streams')).toContain('btcusdt@trade');
  const now = Date.now();
  for (let id = 1; id <= 200; id++)
    socket.send(
      JSON.stringify({
        e: 'trade',
        E: now,
        T: now,
        s: 'BTCUSDT',
        t: id,
        p: '60000',
        q: '0.002',
        m: id % 2 === 0
      })
    );
  socket.send(
    JSON.stringify({
      e: 'trade',
      E: now,
      T: now,
      s: 'BTCUSDT',
      t: 200,
      p: '60000',
      q: '999',
      m: true
    })
  );
  const rows = page.locator('.trade-table tbody tr');
  await expect(rows).toHaveCount(50);
  await expect(rows.first()).toHaveAttribute('data-trade-id', '200');
  await expect(rows.first()).toContainText('Sell');
  await expect(rows.first()).toContainText('0.002');
  await page.getByLabel('Trading pair').selectOption('ETHUSDT');
  await expect(page.getByRole('status').filter({ hasText: 'Live · Binance Spot' })).toBeVisible();
  await expect(rows).toHaveCount(0);
  await expect.poll(() => fixtures.closed.has(socket)).toBe(true);
  const time = Date.now();
  fixtures.sockets.at(-1)!.send(
    JSON.stringify({
      e: 'trade',
      E: time,
      T: time,
      s: 'ETHUSDT',
      t: 1,
      p: '3200',
      q: '0.3',
      m: false
    })
  );
  await expect(rows).toHaveCount(1);
  await expect(page.getByRole('columnheader', { name: 'Quantity · ETH' })).toBeVisible();
  await page.getByLabel('Market data').selectOption('demo');
  await expect(rows).toHaveCount(50);
  await expect(rows.first()).toHaveAttribute('data-trade-id', '1000');
  await expect.poll(() => fixtures.closed.size).toBe(fixtures.sockets.length);
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
    .toBe(true);
});

test('public markets, candles, pair switching and explicit fixture isolation', async ({
  page
}, testInfo) => {
  const fixtures = await installMarketFixtures(page);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'A clear view of Spot markets.' })).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'Live · Binance Spot' })).toBeVisible();
  await expect(page.getByText('Demo balance', { exact: true })).toHaveCount(0);
  await page.getByLabel('Search pairs').fill('ETH');
  await expect(page.getByRole('row')).toHaveCount(2);
  await page.getByRole('link', { name: 'ETH / USDT ↗', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'ETH / USDT', exact: true })).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'Live · Binance Spot' })).toBeVisible();
  await expect(page.getByRole('img', { name: /Interactive one-minute/ })).toBeVisible();
  await expect(page.getByText('1 minute · UTC · 300 candles')).toBeVisible();
  await page.getByLabel('Trading pair').selectOption('SOLUSDT');
  await page.getByLabel('Trading pair').selectOption('BTCUSDT');
  await expect(page.getByRole('heading', { name: 'BTC / USDT', exact: true })).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'Live · Binance Spot' })).toBeVisible();
  await page.getByRole('button', { name: 'Follow latest' }).click();
  await page.getByLabel('Market data').selectOption('demo');
  await expect(page.getByText(/Fixed demonstration data · 15 Jan 2026/)).toBeVisible();
  await expect.poll(() => fixtures.closed.size).toBe(fixtures.sockets.length);
  const connections = fixtures.sockets.length;
  await page.reload();
  await expect(page.getByText(/Fixed demonstration data · 15 Jan 2026/)).toBeVisible();
  expect(fixtures.sockets).toHaveLength(connections);
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
    .toBe(true);
  await page.screenshot({ path: testInfo.outputPath('market-detail.png'), fullPage: true });
  expect(errors).toEqual([]);
});

test('login dialog preserves public context, destination, focus, cancel and history', async ({
  page
}) => {
  await installMarketFixtures(page);
  await page.goto('/?mode=demo');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByLabel('Demo account')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('button', { name: 'Close sign in' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('button', { name: 'Enter demo' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(/\/?\?mode=demo$/);
  await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.reload();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByLabel('Passcode', { exact: true }).fill('demo123');
  await page.getByRole('button', { name: 'Enter demo' }).click();
  await expect(page).toHaveURL(/\/?\?mode=demo$/);
  await page.getByRole('link', { name: 'Wallet', exact: true }).click();
  await expect(page).toHaveURL(/\/wallet\/overview$/);
  await expect(page.getByText('128.40 USD')).toBeVisible();
  await page.getByRole('button', { name: 'Sign out' }).click();
  await page.goto('/activity?kind=debit');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.reload();
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(/\/$/);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.goBack();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.goForward();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByLabel('Passcode', { exact: true }).fill('demo123');
  await page.getByRole('button', { name: 'Enter demo' }).click();
  await expect(page).toHaveURL(/\/$/);
});

test('service shutdown resynchronizes, unsupported pairs and removed routes recover', async ({
  page
}) => {
  const fixtures = await installMarketFixtures(page);
  await page.goto('/markets/BTCUSDT');
  await expect(page.getByRole('status').filter({ hasText: 'Live · Binance Spot' })).toBeVisible();
  const count = fixtures.sockets.length;
  fixtures.sockets.at(-1)!.send(JSON.stringify({ e: 'serverShutdown', E: Date.now() }));
  await expect.poll(() => fixtures.sockets.length).toBeGreaterThan(count);
  await expect(page.getByRole('status').filter({ hasText: 'Live · Binance Spot' })).toBeVisible();
  await page.goto('/markets/BNBUSDT');
  await expect(page.getByRole('heading', { name: 'Unsupported trading pair' })).toBeVisible();
  await page.goto('/markets/invalid');
  await expect(page.getByRole('heading', { name: 'Unknown trading pair' })).toBeVisible();
  for (const path of ['/sign-in', '/overview']) {
    await page.goto(path);
    await expect(page.getByText('404 / Wrong turn')).toBeVisible();
  }
});

test('rate limits recover without early requests and suspended pairs do not subscribe', async ({
  page
}) => {
  const fixtures = await installMarketFixtures(page);
  let calls = 0;
  let limitedAt = 0;
  let retryAt = 0;
  await page.route('https://data-api.binance.vision/api/v3/exchangeInfo**', async (route) => {
    calls++;
    if (calls === 1) {
      limitedAt = Date.now();
      await route.fulfill({
        status: 429,
        headers: { 'Retry-After': '2', 'Access-Control-Expose-Headers': 'Retry-After' },
        json: { code: -1003, msg: 'Fixture rate limit' }
      });
    } else {
      retryAt = Date.now();
      await route.fallback();
    }
  });
  await page.goto('/markets/BTCUSDT');
  await expect(page.getByRole('status').filter({ hasText: /limited requests/ })).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'Live · Binance Spot' })).toBeVisible();
  expect(retryAt - limitedAt).toBeGreaterThanOrEqual(1900);
  expect(calls).toBe(2);
  const count = fixtures.sockets.length;
  await page.route('https://data-api.binance.vision/api/v3/exchangeInfo**', async (route) =>
    route.fulfill({
      json: {
        symbols: [
          {
            symbol: 'ETHUSDT',
            baseAsset: 'ETH',
            quoteAsset: 'USDT',
            status: 'BREAK',
            isSpotTradingAllowed: true,
            filters: [{ filterType: 'PRICE_FILTER', tickSize: '0.01' }]
          }
        ]
      }
    })
  );
  await page.goto('/markets/ETHUSDT');
  await expect(
    page.getByText('This pair is currently unavailable for Spot trading.')
  ).toBeVisible();
  expect(fixtures.sockets).toHaveLength(count);
});

test('public Home and chart apply saved dark theme and show empty search state', async ({
  page
}, testInfo) => {
  await installMarketFixtures(page);
  await page.goto('/preferences');
  await page.getByLabel('Passcode', { exact: true }).fill('demo123');
  await page.getByRole('button', { name: 'Enter demo' }).click();
  await page.getByRole('radio', { name: 'Dark', exact: true }).check();
  await page.goto('/?mode=demo');
  await expect(page.locator('.client-shell')).toHaveAttribute('data-theme', 'dark');
  await page.getByLabel('Search pairs').fill('unlisted');
  await expect(page.getByText('No supported pairs match your search.')).toBeVisible();
  await page.getByLabel('Search pairs').fill('');
  await page.screenshot({ path: testInfo.outputPath('market-home-dark.png'), fullPage: true });
  await page.getByRole('link', { name: 'BTC / USDT ↗', exact: true }).click();
  await expect(page.getByRole('img', { name: /Interactive one-minute/ })).toBeVisible();
  await expect(page.locator('.client-shell')).toHaveAttribute('data-theme', 'dark');
  await page.screenshot({ path: testInfo.outputPath('market-chart-dark.png'), fullPage: true });
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
    .toBe(true);
});
