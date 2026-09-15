import { expect, test } from '@playwright/test';

test('opens the focused desktop icon with Enter', async ({ page }) => {
  await page.goto('/');
  await page.locator('a.icon[data-program="media"]').focus();
  await page.keyboard.press('Enter');

  await expect(page.locator('#win-media')).toBeVisible();
  await expect(page.locator('.task[data-program="media"]')).toBeVisible();
});

test('reaches the desktop icons and the start button with Tab', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');

  const focusedProgram = await page.evaluate(
    () => (document.activeElement as HTMLElement | null)?.dataset.program ?? null,
  );
  expect(focusedProgram).toBe('computer');

  await page.locator('#startbtn').focus();
  await expect(page.locator('#startbtn')).toBeFocused();
});

test('closes a window from the keyboard', async ({ page }) => {
  await page.goto('/');
  await page.locator('a.icon[data-program="contact"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#win-contact')).toBeVisible();

  await page.locator('#win-contact .ctl.close').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#win-contact')).toBeHidden();
});

test('switches System Properties tabs with the arrow keys', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#win-computer')).toBeVisible();

  await page.locator('#tab-general').focus();
  await page.keyboard.press('ArrowRight');

  await expect(page.locator('#tab-hardware')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#panel-hardware')).toBeVisible();
  await expect(page.locator('#panel-general')).toBeHidden();
});
