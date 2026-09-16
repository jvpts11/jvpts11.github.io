import { expect, test } from '@playwright/test';

// Without JavaScript the desktop becomes a plain document: every program is
// readable, stacked, and every link still works.
test.use({ javaScriptEnabled: false });

test('shows every program as ordinary content', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('#win-polaron')).toBeVisible();
  await expect(page.locator('#win-media')).toBeVisible();
  await expect(page.locator('#win-recycle-bin')).toBeVisible();
  await expect(page.locator('section.win')).toHaveCount(9);
});

test('hides the shell chrome that needs scripting', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('.taskbar')).toBeHidden();
  await expect(page.locator('#startmenu')).toBeHidden();
  await expect(page.locator('#balloon')).toBeHidden();
  await expect(page.locator('#win-computer .controls')).toBeHidden();
});

test('explains the plain version', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.no-js-note')).toBeVisible();
});

test('keeps every link reachable', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('#win-contact a[href="mailto:jvptsyt11@gmail.com"]')).toBeVisible();
  await expect(page.locator('#win-polaron a[href="https://github.com/jvpts11/Polaron"]')).toBeVisible();
  await expect(
    page.locator('#win-js-tech-series a[href="https://github.com/jvpts11/js-tech-series"]'),
  ).toBeVisible();
});

test('lets an icon jump to its program', async ({ page }) => {
  await page.goto('/');
  await page.locator('a.icon[data-program="agents"]').click();
  await expect(page).toHaveURL(/#win-agents$/);
});
