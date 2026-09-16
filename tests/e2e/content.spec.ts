import { expect, test } from '@playwright/test';

const PROGRAM_IDS = [
  'computer',
  'projects',
  'polaron',
  'forge-ide',
  'agents',
  'js-tech-series',
  'cmd',
  'media',
  'contact',
  'recycle-bin',
];

test('ships every window in the HTML', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('section.win')).toHaveCount(10);
  for (const id of PROGRAM_IDS) {
    const win = page.locator(`#win-${id}`);
    await expect(win).toHaveAttribute('role', 'dialog');
    await expect(win).toHaveAttribute('aria-labelledby', `wt-${id}`);
  }
});

test('gives every window the three chrome controls', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('section.win .ctl.min')).toHaveCount(10);
  await expect(page.locator('section.win .ctl.max')).toHaveCount(10);
  await expect(page.locator('section.win .ctl.close')).toHaveCount(10);
  await expect(page.locator('#win-cmd .ttext')).toHaveText('Command Prompt');
});

test('carries the confirmed project facts', async ({ page }) => {
  await page.goto('/');
  const html = await page.content();
  expect(html).toContain('https://github.com/jvpts11/Polaron');
  expect(html).toContain('https://github.com/jvpts11/Forge-IDE');
  expect(html).toContain('https://github.com/jvpts11/agents-exe');
  expect(html).toContain('https://github.com/jvpts11/js-tech-series');
  expect(html).toContain('mailto:jvptsyt11@gmail.com');
  expect(html).toContain('Minecraft 1.21.1, NeoForge');
});

test('lists the languages and tools the owner supplied', async ({ page }) => {
  await page.goto('/');
  const hardware = page.locator('#panel-hardware');
  for (const item of ['C/C++', 'C#', 'Java', 'Python']) {
    await expect(hardware).toContainText(item);
  }
  for (const tool of ['Visual Studio', 'IntelliJ', 'Rider', 'Unity', 'OpenGL']) {
    await expect(hardware).toContainText(tool);
  }
});

test('keeps the playlist intact and free of audio', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#win-media .track')).toHaveCount(9);
  await expect(page.locator('#win-media')).toContainText('Animal I Have Become');
  await expect(page.locator('#win-media')).toContainText('Dona do Meu Pensamento');
  await expect(page.locator('#win-media')).toContainText('Mr. Brightside');
  await expect(page.locator('audio')).toHaveCount(0);
});

test('leaves no placeholder behind, and marks any that returns', async ({ page }) => {
  await page.goto('/');
  // Every fact on the desktop is sourced now, so no window carries a
  // placeholder. If one ever comes back it has to use the agreed marker,
  // which is what the loop checks before the count.
  const boxes = page.locator('section.win .todo');
  const count = await boxes.count();
  for (let i = 0; i < count; i += 1) {
    await expect(boxes.nth(i)).toContainText('TODO(jvpts11)');
  }
  expect(count).toBe(0);
});
