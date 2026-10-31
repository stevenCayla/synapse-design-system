import { expect, test } from '@playwright/test';
import { exampleUrl, fixtures, themes } from './fixtures.mjs';

for (const fixture of fixtures) {
  for (const theme of themes) {
    test(`${fixture.component}/${fixture.id} (${theme})`, async ({ page }) => {
      await page.setViewportSize({ width: 640, height: 400 });
      await page.goto(exampleUrl(fixture, theme), { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      await expect(page).toHaveScreenshot(`${fixture.component}-${fixture.id}-${theme}.png`, { fullPage: true, animations: 'disabled' });
    });
  }
}
