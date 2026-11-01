import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const pages = ['/', '/fr/', '/foundations/colors/', '/fr/components/button/', '/does-not-exist/', '/fr/does-not-exist/'];

for (const path of pages) {
  for (const theme of ['light', 'dark']) {
    test(`${path} has no accessibility violation in the ${theme} theme`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme });
      await page.goto(path, { waitUntil: 'load' });
      // Examples have their own tests. The search button comes from Starlight: its label leaves out the "Ctrl K" hint.
      const { violations } = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .exclude('iframe')
        .exclude('site-search button[data-open-modal]')
        .analyze();
      expect(violations.map((violation) => `${violation.id}: ${violation.nodes[0].target}`)).toEqual([]);
    });
  }

  test(`${path} does not scroll sideways at 320 pixels`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto(path, { waitUntil: 'load' });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  });
}

test('the theme button switches the theme and remembers it', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Toggle theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('the mobile menu gives access to the theme and the language', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/foundations/colors/');
  await page.locator('button[popovertarget="starlight__sidebar"]').click();
  const menu = page.locator('#starlight__sidebar');
  await menu.getByRole('button', { name: 'Toggle theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await menu.getByRole('group', { name: 'Language' }).getByRole('link', { name: 'FR' }).click();
  await expect(page).toHaveURL(/\/fr\/foundations\/colors\/$/);
});

test('the language links lead to the same page in the other language', async ({ page }) => {
  await page.goto('/foundations/colors/');
  await page.getByRole('group', { name: 'Language' }).getByRole('link', { name: 'FR' }).click();
  await expect(page).toHaveURL(/\/fr\/foundations\/colors\/$/);
  await page.getByRole('group', { name: 'Langue' }).getByRole('link', { name: 'EN' }).click();
  await expect(page).toHaveURL(/\/foundations\/colors\/$/);
  expect(new URL(page.url()).pathname).toBe('/foundations/colors/');
});

test('the animation of the hero can be paused, and the choice is remembered', async ({ page }) => {
  await page.goto('/');
  const button = page.locator('[data-net-pause]');
  await expect(button).toHaveAttribute('aria-pressed', 'false');
  await button.click();
  await expect(button).toHaveAttribute('aria-pressed', 'true');
  await expect(button).toHaveAccessibleName('Resume animation');
  await page.reload();
  await expect(button).toHaveAttribute('aria-pressed', 'true');
});

test('the 404 page follows the language of the requested path', async ({ page }) => {
  await page.goto('/fr/does-not-exist/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Cette page');
  await expect(page.locator('.ds-404__path:visible')).toHaveText('/fr/does-not-exist/');
});
