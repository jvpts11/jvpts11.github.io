import { expect, test } from '@playwright/test';

test('names the taskbar strip with a role that allows a label', async ({ page }) => {
  await page.goto('/');
  const tasks = page.locator('#tasks');

  // A labelled div with no role is prohibited by ARIA. A strip of window
  // buttons is a toolbar.
  await expect(tasks).toHaveAttribute('role', 'toolbar');
  await expect(tasks).toHaveAttribute('aria-label', 'Open windows');
});

test('moves between taskbar buttons with the arrow keys', async ({ page }) => {
  await page.goto('/?open=cmd');
  await page.locator('a.icon[data-program="polaron"]').dblclick();

  const cmdTask = page.locator('.task[data-program="cmd"]');
  const polaronTask = page.locator('.task[data-program="polaron"]');
  await expect(cmdTask).toBeVisible();
  await expect(polaronTask).toBeVisible();

  await cmdTask.focus();
  await page.keyboard.press('ArrowRight');
  await expect(polaronTask).toBeFocused();

  await page.keyboard.press('ArrowLeft');
  await expect(cmdTask).toBeFocused();

  // The ends wrap, so the strip is a loop like any toolbar.
  await page.keyboard.press('ArrowLeft');
  await expect(polaronTask).toBeFocused();
});

test('keeps one stop in the tab order for the whole strip', async ({ page }) => {
  await page.goto('/?open=cmd');
  await page.locator('a.icon[data-program="polaron"]').dblclick();

  // Roving tabindex: the active button is the only tab stop.
  await expect(page.locator('.task[tabindex="0"]')).toHaveCount(1);
  await expect(page.locator('.task[data-program="polaron"]')).toHaveAttribute('tabindex', '0');
  await expect(page.locator('.task[data-program="cmd"]')).toHaveAttribute('tabindex', '-1');
});
