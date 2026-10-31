import { expect, test } from '@playwright/test';

const go = (page, path) => page.goto(`/examples/${path}/`, { waitUntil: 'networkidle' });

test('a modal traps the focus, closes with Escape and gives the focus back', async ({ page }) => {
  await go(page, 'modal/trigger');
  const opener = page.getByRole('button', { name: 'Add a site' });
  const dialog = page.getByRole('dialog', { name: 'Add a site' });
  await opener.focus();
  await page.keyboard.press('Enter');
  await expect(dialog).toBeVisible();
  await expect(page.locator('dialog:focus-within')).toHaveCount(1);
  for (let index = 0; index < 6; index += 1) {
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => {
      const active = document.activeElement;
      return active === document.body || !!active.closest('dialog');
    })).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});

test('a close button closes a modal', async ({ page }) => {
  await go(page, 'modal/trigger');
  await page.getByRole('button', { name: 'Add a site' }).click();
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('a drawer opens beside the page and gives the focus back', async ({ page }) => {
  await go(page, 'drawer/trigger');
  const opener = page.getByRole('button', { name: 'Open the details' });
  await opener.click();
  const drawer = page.getByRole('dialog', { name: 'Alex Martin' });
  await expect(drawer).toBeVisible();
  const box = await drawer.boundingBox();
  expect(Math.round(box.x + box.width)).toBe(page.viewportSize().width);
  await page.keyboard.press('Escape');
  await expect(opener).toBeFocused();
});

test('a drawer loads its content, and says when it cannot', async ({ page }) => {
  await page.route('**/examples/alert/default/', (route) => route.fulfill({ contentType: 'text/html', body: '<p>Loaded report</p>' }));
  await go(page, 'drawer/loaded');
  await page.getByRole('button', { name: 'Open the report' }).click();
  await expect(page.getByText('Loaded report')).toBeVisible();
  await page.keyboard.press('Escape');

  await page.unroute('**/examples/alert/default/');
  await page.route('**/examples/alert/default/', (route) => route.fulfill({ status: 500 }));
  await page.getByRole('button', { name: 'Open the report' }).click();
  await expect(page.getByRole('alert')).toHaveText('The content could not be loaded');
});

test('a confirmation starts on the safe choice, and only submits when accepted', async ({ page }) => {
  await go(page, 'confirm/declarative');
  await page.evaluate(() => {
    window.submitted = 0;
    document.querySelector('form').addEventListener('submit', (event) => {
      window.submitted += 1;
      event.preventDefault();
    });
  });
  const trigger = page.getByRole('button', { name: 'Delete the site' });

  await trigger.click();
  await expect(page.getByRole('dialog', { name: 'Delete the site?' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cancel' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(await page.evaluate(() => window.submitted)).toBe(0);

  await trigger.click();
  await page.getByRole('button', { name: 'Confirm' }).click();
  await expect.poll(() => page.evaluate(() => window.submitted)).toBe(1);
});

test('a confirmation can require a reason, and sends it', async ({ page }) => {
  await go(page, 'confirm/with-reason');
  await page.evaluate(() => {
    document.querySelector('form').addEventListener('submit', (event) => {
      window.sent = new FormData(event.target).get('reason');
      event.preventDefault();
    });
  });
  await page.getByRole('button', { name: 'Withdraw' }).click();
  await page.getByRole('button', { name: 'Confirm' }).click();
  await expect(page.getByLabel('Reason')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByLabel('Reason').fill('Consent withdrawn');
  await page.getByRole('button', { name: 'Confirm' }).click();
  await expect.poll(() => page.evaluate(() => window.sent)).toBe('Consent withdrawn');
});

test('a toast is announced and closes', async ({ page }) => {
  await go(page, 'toast/trigger');
  await expect(page.locator('[data-si-toast-region]')).toHaveAttribute('aria-live', 'polite');
  await page.getByRole('button', { name: 'Save' }).click();
  const toast = page.locator('.si-toast');
  await expect(toast).toHaveText('The form was saved.');
  await toast.getByRole('button', { name: 'Close' }).click();
  await expect(toast).toHaveCount(0);
});

test('a toast leaves on its own, and an error stays', async ({ page }) => {
  await page.clock.install();
  await go(page, 'toast/trigger');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.locator('.si-toast')).toHaveCount(1);
  await page.mouse.move(0, 0);
  await page.clock.fastForward(7000);
  await expect(page.locator('.si-toast')).toHaveCount(0);

  await page.getByRole('button', { name: 'Save' }).evaluate((button) => {
    button.dataset.siToastTone = 'danger';
    button.click();
  });
  await expect(page.getByRole('alert')).toHaveText('The form was saved.');
  await page.clock.fastForward(60000);
  await expect(page.getByRole('alert')).toHaveCount(1);
});

test('tabs work with the arrow keys and show one panel', async ({ page }) => {
  await go(page, 'tabs/panels');
  const members = page.getByRole('tab', { name: /Members/ });
  const invitations = page.getByRole('tab', { name: 'Invitations' });
  const history = page.getByRole('tab', { name: 'History' });
  await members.focus();
  await page.keyboard.press('ArrowRight');
  await expect(invitations).toBeFocused();
  await expect(invitations).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel')).toHaveText('The invitations waiting for an answer.');
  await page.keyboard.press('End');
  await expect(history).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(members).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(history).toBeFocused();
  await expect(members).toHaveAttribute('tabindex', '-1');
});

test('a menu opens under its button, moves with the arrows, and Escape gives the focus back', async ({ page }) => {
  await go(page, 'menu/actions');
  const button = page.getByRole('button', { name: 'Actions' });
  await button.click();
  await expect(page.getByRole('link', { name: 'Edit' })).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('button', { name: 'Send again' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('.si-menu')).toBeHidden();
  await expect(button).toBeFocused();
});

test('the theme toggle switches the theme and its label', async ({ page }) => {
  await go(page, 'theme-toggle/default');
  await page.getByRole('button', { name: 'Switch to the dark theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByRole('button', { name: 'Switch to the light theme' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('synapse-theme'))).toBe('dark');
});

test('an alert can be dismissed', async ({ page }) => {
  await go(page, 'alert/dismissible');
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(page.locator('.si-alert')).toHaveCount(0);
});
