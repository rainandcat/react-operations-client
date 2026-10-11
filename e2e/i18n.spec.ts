import { expect, test } from '@playwright/test';
import { installMarketFixtures } from './marketFixtures';

test('loads only the chosen language, preserves market context and restores direction', async ({
  page
}) => {
  await installMarketFixtures(page);
  const bundles: string[] = [];
  page.on('request', (request) => {
    if (/\/(en|zh-TW|zh-CN|ar)-[^/]+\.js/.test(request.url())) bundles.push(request.url());
  });
  await page.goto('/markets/BTCUSDT?mode=demo');
  await expect(page.locator('.client-shell')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByRole('heading', { name: 'Recent trades' })).toBeVisible();
  expect(bundles).toHaveLength(1);
  expect(bundles[0]).toMatch(/\/en-/);
  const height = await page.locator('.trade-viewport').evaluate((el) => el.clientHeight);
  const canvas = await page.locator('.candle-chart canvas').first().elementHandle();
  await page.locator('.language-control select').selectOption('zh-TW');
  await expect(page.getByRole('heading', { name: '最新成交' })).toBeVisible();
  await expect(page.getByRole('link', { name: '← 返回首頁' })).toBeVisible();
  await page.locator('.language-control select').selectOption('ar');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.getByRole('heading', { name: 'أحدث التداولات' })).toBeVisible();
  expect(await page.locator('.trade-viewport').evaluate((el) => el.clientHeight)).toBe(height);
  expect(await canvas?.evaluate((el) => el.isConnected)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  await expect(page.getByRole('heading', { name: 'أحدث التداولات' })).toBeVisible();
  await page.locator('.language-control select').selectOption('zh-CN');
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  await expect(page.getByRole('link', { name: '← 返回首页' })).toBeVisible();
  await expect(page).toHaveURL(/BTCUSDT\?mode=demo$/);
});

test('restores a saved locale without downloading English and translates account pages', async ({
  page
}) => {
  await installMarketFixtures(page);
  await page.addInitScript(() => {
    localStorage.setItem('operations-client-locale', 'zh-TW');
    localStorage.setItem(
      'operations-client-display-preferences',
      JSON.stringify({ state: { theme: 'light', density: 'compact' }, version: 0 })
    );
  });
  const bundles: string[] = [];
  page.on('request', (request) => {
    if (/\/(en|zh-TW|zh-CN|ar)-[^/]+\.js/.test(request.url())) bundles.push(request.url());
  });
  await page.goto('/wallet/overview');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByLabel('密碼', { exact: true }).fill('demo123');
  await page.getByRole('button', { name: '進入示範' }).click();
  await expect(page.getByRole('heading', { name: '帳戶一覽' })).toBeVisible();
  await expect(page.locator('.client-shell')).toHaveAttribute('data-theme', 'light');
  expect(bundles).toHaveLength(1);
  expect(bundles[0]).toMatch(/\/zh-TW-/);
  await page.goto('/notifications');
  await expect(page.getByText('活動已完成', { exact: true })).toBeVisible();
  await page.goto('/activity?demo=error');
  await expect(page.getByRole('alert')).toContainText('虛構資料服務無法使用');
  await page.locator('.language-control select').selectOption('zh-CN');
  await expect(page.getByRole('alert')).toContainText('虚构数据服务不可用');
  await expect(page).toHaveURL(/activity\?demo=error$/);
});

test('a failed language chunk keeps the current page and saved preference', async ({ page }) => {
  await installMarketFixtures(page);
  await page.route('**/zh-CN-*.js', (route) => route.abort());
  await page.goto('/?mode=demo');
  await page.locator('.language-control select').selectOption('zh-CN');
  await expect(page.getByRole('alert')).toContainText('Could not load the language');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  expect(await page.evaluate(() => localStorage.getItem('operations-client-locale'))).toBeNull();
  await expect(page.getByRole('heading', { name: 'A clear view of Spot markets.' })).toBeVisible();
});
