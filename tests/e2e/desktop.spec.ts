import { expect, test } from '@playwright/test';

test('renders the desktop shell', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.icons a.icon')).toHaveCount(9);
  await expect(page.locator('.icons a.icon', { hasText: 'My Computer' })).toBeVisible();
  await expect(page.locator('#startbtn')).toHaveText(/start/i);
  await expect(page.locator('.taskbar')).toBeVisible();
  await expect(page.locator('.wallpaper')).toBeVisible();
});

test('points every icon at its window section', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('a.icon[data-program="polaron"]')).toHaveAttribute(
    'href',
    '#win-polaron',
  );
});

test('never calls itself Windows', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('body')).not.toContainText('Windows');
});
