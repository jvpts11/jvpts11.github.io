import { expect, test } from '@playwright/test';

test('renders the desktop shell', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.icons a.icon')).toHaveCount(10);
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

  // The rule is about what this interface calls itself. The word may appear as
  // a fact inside a program, such as a compilation target Polaron supports,
  // but never in the chrome and never as a claim about this desktop.
  await expect(page).toHaveTitle(/jvpts11 OS/);
  await expect(page.locator('#startbtn')).toHaveText(/start/i);

  const chrome = page.locator('.ttext, .icon .label, .taskbar, #startmenu');
  for (const text of await chrome.allTextContents()) {
    expect(text).not.toMatch(/Windows/);
  }

  const html = await page.content();
  expect(html).not.toMatch(/Microsoft|Windows\s?(XP|95|98|2000|7|10|11)/);
});
