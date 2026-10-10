import { test, expect, type Page } from '@playwright/test';
import { installMarketFixtures } from './marketFixtures';

test.beforeEach(async ({ page }) => {
  await installMarketFixtures(page);
});

async function signIn(page: Page) {
  await expect(page.getByRole('button', { name: 'Enter demo' })).toBeVisible();
  await page.getByLabel('Passcode', { exact: true }).fill('demo123');
  await page.getByRole('button', { name: 'Enter demo' }).click();
}

test('protected activity, out-of-range correction and detail return', async ({
  page
}, testInfo) => {
  await page.goto('/activity?kind=debit&sort=oldest&page=99');
  await expect(page).toHaveURL(/login=1/);
  await signIn(page);
  await expect(page.getByText('A-0006 · 2026-01-10')).toBeVisible();
  await expect(page).toHaveURL(/\/activity\?kind=debit&sort=oldest$/);
  const listUrl = page.url();
  await page.screenshot({ path: testInfo.outputPath('activity.png'), fullPage: true });
  await page.getByRole('link').filter({ hasText: 'A-0006' }).click();
  await expect(page.getByRole('heading', { name: 'debit activity' })).toBeVisible();
  await page.reload();
  await page.getByRole('link', { name: '← Back to activity' }).click();
  await expect(page).toHaveURL(listUrl);
  await expect(page.getByLabel('Activity type')).toHaveValue('debit');
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
    .toBe(true);
});

test('preferences survive reload and activity error recovers', async ({ page }) => {
  await page.goto('/preferences');
  await signIn(page);
  await expect
    .poll(() =>
      page
        .locator('.client-shell')
        .evaluate((element) => getComputedStyle(element).getPropertyValue('--accent').trim())
    )
    .toBe('#3446a5');
  await page.getByRole('radio', { name: 'Dark', exact: true }).check();
  await expect
    .poll(() =>
      page
        .locator('.client-shell')
        .evaluate((element) => getComputedStyle(element).getPropertyValue('--accent').trim())
    )
    .toBe('#b9c5ff');
  await page.getByRole('radio', { name: 'Compact', exact: true }).check();
  await page.reload();
  await expect(page.locator('.client-shell')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('.client-shell')).toHaveAttribute('data-density', 'compact');
  await page.goto('/activity?demo=error');
  await expect(page.getByRole('alert')).toBeVisible();
  await page.getByLabel('Demo state').selectOption('normal');
  await expect(page.getByText('A-0001 · 2026-01-15')).toBeVisible();
  await page.getByLabel('Demo state').selectOption('empty');
  await expect(page.getByRole('heading', { name: 'Nothing to show' })).toBeVisible();
});

test('missing detail, missing route and sign out recover safely', async ({ page }) => {
  await page.goto('/activity/A-missing');
  await signIn(page);
  await expect(page.getByRole('heading', { name: 'Activity not found' })).toBeVisible();
  await page.goto('/does-not-exist');
  await expect(page.getByText('404 / Wrong turn')).toBeVisible();
  await page.getByRole('link', { name: 'Go to markets' }).click();
  await page.getByRole('button', { name: 'Sign out' }).click();
  await page.goto('/activity');
  await expect(page).toHaveURL(/login=1/);
});
