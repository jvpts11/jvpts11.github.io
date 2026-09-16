import { expect, test, type Locator } from '@playwright/test';

const STORAGE_KEY = 'jvpts11-os:v1';

/** Waits for the open animation so geometry assertions read a settled box. */
async function settle(win: Locator) {
  await expect(win).toBeVisible();
  await win.evaluate(async (el) => {
    await Promise.all(el.getAnimations().map((animation) => animation.finished));
  });
}

test('opens My Computer on a first visit', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#win-computer')).toBeVisible();
  await expect(page.locator('.task[data-program="computer"]')).toBeVisible();
});

test('restores the open windows and their position after a reload', async ({ page }) => {
  await page.goto('/');
  await page.locator('a.icon[data-program="cmd"]').dblclick();
  const win = page.locator('#win-cmd');
  await settle(win);

  const bar = win.locator('.titlebar');
  const grab = (await bar.boundingBox())!;
  await page.mouse.move(grab.x + grab.width / 2, grab.y + grab.height / 2);
  await page.mouse.down();
  await page.mouse.move(grab.x + grab.width / 2 + 120, grab.y + grab.height / 2 + 90);
  await page.mouse.up();
  const before = (await win.boundingBox())!;

  await page.reload();
  await settle(page.locator('#win-cmd'));

  const after = (await page.locator('#win-cmd').boundingBox())!;
  expect(Math.round(after.x)).toBe(Math.round(before.x));
  expect(Math.round(after.y)).toBe(Math.round(before.y));
  await expect(page.locator('.task[data-program="cmd"]')).toBeVisible();
});

test('keeps a closed window closed after a reload', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#win-computer')).toBeVisible();
  await page.locator('#win-computer .ctl.close').click();

  await page.reload();
  await expect(page.locator('#win-computer')).toBeHidden();
  await expect(page.locator('.task[data-program="computer"]')).toHaveCount(0);
});

test('remembers a minimized window', async ({ page }) => {
  await page.goto('/');
  await page.locator('a.icon[data-program="polaron"]').dblclick();
  await settle(page.locator('#win-polaron'));
  await page.locator('#win-polaron .ctl.min').click();

  await page.reload();
  await expect(page.locator('#win-polaron')).toBeHidden();
  const task = page.locator('.task[data-program="polaron"]');
  await expect(task).toBeVisible();

  await task.click();
  await expect(page.locator('#win-polaron')).toBeVisible();
});

test('opens a program straight from the URL', async ({ page }) => {
  await page.goto('/?open=js-tech-series');
  await expect(page.locator('#win-js-tech-series')).toBeVisible();
  await expect(page.locator('#win-js-tech-series')).toHaveClass(/active/);
});

test('lets the URL win over the saved state', async ({ page }) => {
  await page.goto('/');
  await page.locator('a.icon[data-program="cmd"]').dblclick();
  await settle(page.locator('#win-cmd'));

  await page.goto('/?open=polaron');
  await expect(page.locator('#win-polaron')).toBeVisible();
  await expect(page.locator('#win-polaron')).toHaveClass(/active/);
  await expect(page.locator('#win-cmd')).toBeVisible();
});

test('ignores an unknown program in the URL', async ({ page }) => {
  await page.goto('/?open=solitaire');
  await expect(page.locator('.icons a.icon')).not.toHaveCount(0);
  await expect(page.locator('#win-computer')).toBeVisible();
});

test('survives unusable stored state', async ({ page }) => {
  await page.addInitScript((key) => {
    try {
      localStorage.setItem(key, '{not json');
    } catch {
      // Storage may be blocked; the page has to work either way.
    }
  }, STORAGE_KEY);

  await page.goto('/');
  await expect(page.locator('.icons a.icon')).not.toHaveCount(0);
  await expect(page.locator('#win-computer')).toBeVisible();
});

test('writes a versioned payload', async ({ page }) => {
  await page.goto('/');
  await page.locator('a.icon[data-program="media"]').dblclick();
  await settle(page.locator('#win-media'));

  const payload = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
  expect(payload).not.toBeNull();
  const parsed = JSON.parse(payload!) as { v: number; windows: { id: string }[] };
  expect(parsed.v).toBe(1);
  expect(parsed.windows.map((w) => w.id)).toContain('media');
});
