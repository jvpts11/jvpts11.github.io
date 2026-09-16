import { expect, test, type Page } from '@playwright/test';

/** Opens a program the way a visitor does: double-clicking its desktop icon. */
async function openFromIcon(page: Page, id: string) {
  await page.locator(`a.icon[data-program="${id}"]`).dblclick();
  const win = page.locator(`#win-${id}`);
  await expect(win).toBeVisible();
  // A window opens with a short scale animation. Measuring while it runs
  // returns a transformed box, so wait for it to settle before any geometry
  // assertion.
  await win.evaluate(async (el) => {
    await Promise.all(el.getAnimations().map((animation) => animation.finished));
  });
}

test('opens a window from a desktop icon and adds a taskbar button', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#win-cmd')).toBeHidden();

  await openFromIcon(page, 'cmd');

  const task = page.locator('.task[data-program="cmd"]');
  await expect(task).toBeVisible();
  await expect(task).toContainText('Command Prompt');
  await expect(page.locator('#win-cmd')).toHaveClass(/active/);
});

test('drags a window by its title bar and keeps it inside the desktop', async ({ page }) => {
  await page.goto('/');
  await openFromIcon(page, 'cmd');

  const win = page.locator('#win-cmd');
  const bar = win.locator('.titlebar');
  const before = (await win.boundingBox())!;

  // Drag by a delta from the real grab point: the window has to follow the
  // pointer exactly, not jump to the coordinate the pointer lands on.
  const grab = (await bar.boundingBox())!;
  await page.mouse.move(grab.x + grab.width / 2, grab.y + grab.height / 2);
  await page.mouse.down();
  await page.mouse.move(grab.x + grab.width / 2 + 200, grab.y + grab.height / 2 + 140);
  await page.mouse.up();

  const moved = (await win.boundingBox())!;
  expect(Math.round(moved.x)).toBe(Math.round(before.x + 200));
  expect(Math.round(moved.y)).toBe(Math.round(before.y + 140));

  // Dragging far past the top left corner parks it at the edge, never outside.
  const grabAgain = (await bar.boundingBox())!;
  await page.mouse.move(grabAgain.x + grabAgain.width / 2, grabAgain.y + grabAgain.height / 2);
  await page.mouse.down();
  await page.mouse.move(-600, -600);
  await page.mouse.up();

  const clamped = (await win.boundingBox())!;
  expect(clamped.x).toBeGreaterThanOrEqual(0);
  expect(clamped.y).toBeGreaterThanOrEqual(0);
  expect(clamped.x).toBeLessThan(moved.x);
});

test('minimizes to the taskbar and restores from it', async ({ page }) => {
  await page.goto('/');
  await openFromIcon(page, 'polaron');

  const win = page.locator('#win-polaron');
  const task = page.locator('.task[data-program="polaron"]');

  await win.locator('.ctl.min').click();
  await expect(win).toBeHidden();
  await expect(task).toBeVisible();
  await expect(task).toHaveAttribute('aria-pressed', 'false');

  await task.click();
  await expect(win).toBeVisible();
  await expect(task).toHaveAttribute('aria-pressed', 'true');
});

test('maximizes from the control and restores by double-clicking the title bar', async ({ page }) => {
  await page.goto('/');
  await openFromIcon(page, 'agents');

  const win = page.locator('#win-agents');
  const layer = page.locator('#windows');
  const restored = (await win.boundingBox())!;

  const maxButton = win.locator('.ctl.max');
  await maxButton.click();
  await expect(win).toHaveClass(/max/);
  await expect(maxButton).toHaveAttribute('aria-label', 'Restore');

  const maximized = (await win.boundingBox())!;
  const desktop = (await layer.boundingBox())!;
  expect(Math.round(maximized.width)).toBe(Math.round(desktop.width));

  await win.locator('.titlebar').dblclick();
  await expect(win).not.toHaveClass(/max/);
  await expect(maxButton).toHaveAttribute('aria-label', 'Maximize');
  expect(Math.round((await win.boundingBox())!.width)).toBe(Math.round(restored.width));
});

test('closes a window and removes its taskbar button', async ({ page }) => {
  await page.goto('/');
  await openFromIcon(page, 'contact');

  await page.locator('#win-contact .ctl.close').click();
  await expect(page.locator('#win-contact')).toBeHidden();
  await expect(page.locator('.task[data-program="contact"]')).toHaveCount(0);
});

test('raises the window that gets clicked', async ({ page }) => {
  await page.goto('/');
  await openFromIcon(page, 'polaron');
  await openFromIcon(page, 'agents');

  await expect(page.locator('#win-agents')).toHaveClass(/active/);
  await expect(page.locator('#win-polaron')).not.toHaveClass(/active/);

  // Move the top window clear of the one underneath, so this test measures
  // focus rather than how two particular window sizes happen to stack.
  const top = page.locator('#win-agents .titlebar');
  const grab = (await top.boundingBox())!;
  await page.mouse.move(grab.x + grab.width / 2, grab.y + grab.height / 2);
  await page.mouse.down();
  await page.mouse.move(grab.x + grab.width / 2 + 60, grab.y + grab.height / 2 + 90);
  await page.mouse.up();

  await page.locator('#win-polaron .titlebar').click();
  await expect(page.locator('#win-polaron')).toHaveClass(/active/);
  await expect(page.locator('#win-agents')).not.toHaveClass(/active/);

  const zPolaron = await page.locator('#win-polaron').evaluate((el) => Number(getComputedStyle(el).zIndex));
  const zAgents = await page.locator('#win-agents').evaluate((el) => Number(getComputedStyle(el).zIndex));
  expect(zPolaron).toBeGreaterThan(zAgents);
});

test('opens a project from the explorer tiles', async ({ page }) => {
  await page.goto('/');
  await openFromIcon(page, 'projects');

  await page.locator('#win-projects .tile[data-program="js-tech-series"]').dblclick();
  await expect(page.locator('#win-js-tech-series')).toBeVisible();
});
