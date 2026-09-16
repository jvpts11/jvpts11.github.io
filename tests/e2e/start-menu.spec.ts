import { expect, test } from '@playwright/test';

test('toggles the start menu from the start button', async ({ page }) => {
  await page.goto('/');
  const startBtn = page.locator('#startbtn');
  const menu = page.locator('#startmenu');

  await expect(menu).toBeHidden();
  await expect(startBtn).toHaveAttribute('aria-expanded', 'false');

  await startBtn.click();
  await expect(menu).toBeVisible();
  await expect(startBtn).toHaveAttribute('aria-expanded', 'true');

  await startBtn.click();
  await expect(menu).toBeHidden();
  await expect(startBtn).toHaveAttribute('aria-expanded', 'false');
});

test('closes the start menu on Escape and returns focus to the button', async ({ page }) => {
  await page.goto('/');
  const startBtn = page.locator('#startbtn');

  await startBtn.click();
  await expect(page.locator('#startmenu')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(page.locator('#startmenu')).toBeHidden();
  await expect(startBtn).toBeFocused();
});

test('closes the start menu when clicking the desktop', async ({ page }) => {
  await page.goto('/');
  await page.locator('#startbtn').click();
  await expect(page.locator('#startmenu')).toBeVisible();

  // Bare wallpaper: right of the window opened on arrival, left of the
  // balloon, clear of the icon columns and above the taskbar.
  await page.locator('.wallpaper').click({ position: { x: 800, y: 600 } });
  await expect(page.locator('#startmenu')).toBeHidden();
});

test('launches a program from the start menu', async ({ page }) => {
  await page.goto('/');
  await page.locator('#startbtn').click();
  await page.locator('#startmenu .sm-item[data-launch="media"]').click();

  await expect(page.locator('#win-media')).toBeVisible();
  await expect(page.locator('#startmenu')).toBeHidden();
  await expect(page.locator('.task[data-program="media"]')).toBeVisible();
});

test('builds both start menu columns from the registry', async ({ page }) => {
  await page.goto('/');
  await page.locator('#startbtn').click();

  await expect(page.locator('#startmenu .sm-left .sm-item')).toHaveCount(7);
  await expect(page.locator('#startmenu .sm-right .sm-item[data-launch]')).toHaveCount(3);
  await expect(page.locator('#startmenu .sm-right a[href="https://github.com/jvpts11"]')).toBeVisible();
  await expect(page.locator('#startmenu .sm-head')).toContainText('jvpts11');
});

test('moves between start menu entries with the arrow keys', async ({ page }) => {
  await page.goto('/');
  await page.locator('#startbtn').click();

  const entries = page.locator('#startmenu .sm-item');
  await expect(entries.first()).toBeFocused();

  await page.keyboard.press('ArrowDown');
  await expect(entries.nth(1)).toBeFocused();

  await page.keyboard.press('ArrowUp');
  await expect(entries.first()).toBeFocused();
});

test('logs off by closing every open window', async ({ page }) => {
  await page.goto('/');
  await page.locator('a.icon[data-program="cmd"]').dblclick();
  await page.locator('a.icon[data-program="polaron"]').dblclick();
  await expect(page.locator('.task')).not.toHaveCount(0);

  await page.locator('#startbtn').click();
  await page.locator('#logoff').click();

  await expect(page.locator('.task')).toHaveCount(0);
  await expect(page.locator('#win-cmd')).toBeHidden();
  await expect(page.locator('#win-polaron')).toBeHidden();
  await expect(page.locator('#startmenu')).toBeHidden();
});

test('turns off and restarts', async ({ page }) => {
  await page.goto('/');
  await page.locator('#startbtn').click();
  await page.locator('#turnoff').click();

  const shutdown = page.locator('#shutdown');
  await expect(shutdown).toBeVisible();
  await expect(shutdown).toContainText('jvpts11 OS');

  await page.locator('#restart').click();
  await expect(shutdown).toBeHidden();
  await expect(page.locator('#startbtn')).toBeFocused();
});

test('ticks the taskbar clock', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#clock')).toHaveText(/\d{1,2}:\d{2}/);
});

test('shows a dismissible welcome balloon', async ({ page }) => {
  await page.goto('/');
  const balloon = page.locator('#balloon');
  await expect(balloon).toBeVisible();
  await expect(balloon).toContainText('jvpts11 OS');

  await page.locator('#balloon-x').click();
  await expect(balloon).toBeHidden();
});
