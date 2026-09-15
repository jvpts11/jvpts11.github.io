import { expect, test, type Locator } from '@playwright/test';

// A phone: no dragging, one window at a time, filling the screen above the
// taskbar. It should feel like a tiny desktop, not a broken one.
test.use({ viewport: { width: 375, height: 667 } });

/** Waits for the open animation so geometry assertions read a settled box. */
async function settle(win: Locator) {
  await expect(win).toBeVisible();
  await win.evaluate(async (el) => {
    await Promise.all(el.getAnimations().map((animation) => animation.finished));
  });
}

test('opens a window with a single tap', async ({ page }) => {
  await page.goto('/');
  await page.locator('a.icon[data-program="polaron"]').click();
  await expect(page.locator('#win-polaron')).toBeVisible();
});

test('fills the screen above the taskbar', async ({ page }) => {
  await page.goto('/');
  await page.locator('a.icon[data-program="polaron"]').click();

  const win = page.locator('#win-polaron');
  await settle(win);
  const box = (await win.boundingBox())!;
  const layer = (await page.locator('#windows').boundingBox())!;

  expect(Math.round(box.width)).toBe(Math.round(layer.width));
  expect(Math.round(box.height)).toBe(Math.round(layer.height));
  expect(Math.round(box.x)).toBe(0);
});

test('shows one window at a time', async ({ page }) => {
  await page.goto('/');
  await page.locator('a.icon[data-program="cmd"]').click();
  await expect(page.locator('#win-cmd')).toBeVisible();

  // A fullscreen window covers the icons, so a second program is reached the
  // way a phone visitor actually reaches it: from the taskbar.
  await page.locator('#startbtn').click();
  await page.locator('#startmenu .sm-item[data-launch="polaron"]').click();

  await expect(page.locator('#win-polaron')).toBeVisible();
  await expect(page.locator('#win-cmd')).toBeHidden();

  // The one that stepped aside is minimized, not closed, and its taskbar
  // button brings it back, pushing the other one aside in turn.
  const cmdTask = page.locator('.task[data-program="cmd"]');
  await expect(cmdTask).toBeVisible();
  await cmdTask.click();
  await expect(page.locator('#win-cmd')).toBeVisible();
  await expect(page.locator('#win-polaron')).toBeHidden();
});

test('hides the maximize control, since windows are already full screen', async ({ page }) => {
  await page.goto('/');
  await page.locator('a.icon[data-program="polaron"]').click();

  await expect(page.locator('#win-polaron .ctl.max')).toBeHidden();
  await expect(page.locator('#win-polaron .ctl.min')).toBeVisible();
  await expect(page.locator('#win-polaron .ctl.close')).toBeVisible();
});

test('keeps the taskbar at the bottom of the screen', async ({ page }) => {
  await page.goto('/');
  const taskbar = (await page.locator('.taskbar').boundingBox())!;
  expect(Math.round(taskbar.y + taskbar.height)).toBe(667);
  expect(Math.round(taskbar.width)).toBe(375);
});

test('never scrolls the page sideways', async ({ page }) => {
  await page.goto('/');
  await page.locator('a.icon[data-program="projects"]').click();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
