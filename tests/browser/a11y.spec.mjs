import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { exampleUrl, fixtures, themes } from './fixtures.mjs';

for (const fixture of fixtures) {
  for (const theme of themes) {
    test(`${fixture.component}/${fixture.id} (${theme}) has no accessibility violation`, async ({ page }) => {
      await page.goto(exampleUrl(fixture, theme), { waitUntil: 'networkidle' });
      const { violations } = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(violations.map((item) => `${item.id}: ${item.nodes[0].target} ${item.nodes[0].failureSummary}`)).toEqual([]);
    });
  }
}
