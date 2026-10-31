import { expect, test } from '@playwright/test';
import { exampleUrl, fixtures } from './fixtures.mjs';

// WCAG reflow: nothing scrolls sideways at 320px, except a table inside its own scrolling area.
for (const fixture of fixtures) {
  test(`${fixture.component}/${fixture.id} fits in 320px`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto(exampleUrl(fixture, 'light'), { waitUntil: 'networkidle' });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test('a field stays inside the dialog that holds it', async ({ page }) => {
  await page.goto('/examples/confirm/with-reason/', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Withdraw' }).click();
  const dialog = await page.getByRole('dialog').boundingBox();
  const field = await page.getByLabel('Reason').boundingBox();
  expect(field.x + field.width).toBeLessThanOrEqual(dialog.x + dialog.width);
});
