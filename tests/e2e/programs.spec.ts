import { expect, test } from '@playwright/test';

test.describe('Command Prompt', () => {
  test('answers whoami with what the owner does', async ({ page }) => {
    await page.goto('/?open=cmd');
    const out = page.locator('#win-cmd .cmd-out');
    await expect(out).toContainText('jvpts11 OS [Version 0.1]');

    const input = page.locator('#cmd-input');
    await input.fill('whoami');
    await input.press('Enter');

    await expect(out).toContainText('C:\\Users\\jvpts11>whoami');
    await expect(out).toContainText('AI engineer');
    await expect(input).toHaveValue('');
  });

  test('lists the projects', async ({ page }) => {
    await page.goto('/?open=cmd');
    const input = page.locator('#cmd-input');
    await input.fill('projects');
    await input.press('Enter');

    const out = page.locator('#win-cmd .cmd-out');
    await expect(out).toContainText('polaron');
    await expect(out).toContainText('agents');
    await expect(out).toContainText('js-tech-series');
  });

  test('opens another program with open', async ({ page }) => {
    await page.goto('/?open=cmd');
    const input = page.locator('#cmd-input');
    await input.fill('open polaron');
    await input.press('Enter');

    await expect(page.locator('#win-polaron')).toBeVisible();
    await expect(page.locator('.task[data-program="polaron"]')).toBeVisible();
  });

  test('accepts the aliases the help text advertises', async ({ page }) => {
    await page.goto('/?open=cmd');
    const input = page.locator('#cmd-input');
    await input.fill('help');
    await input.press('Enter');
    await expect(page.locator('#win-cmd .cmd-out')).toContainText('HELP');

    await input.fill('open jts');
    await input.press('Enter');
    await expect(page.locator('#win-js-tech-series')).toBeVisible();
  });

  test('refuses what it does not know', async ({ page }) => {
    await page.goto('/?open=cmd');
    const input = page.locator('#cmd-input');
    await input.fill('solitaire');
    await input.press('Enter');

    await expect(page.locator('#win-cmd .cmd-out')).toContainText(
      "'solitaire' is not recognized as an internal or external command",
    );
  });

  test('clears the screen with cls', async ({ page }) => {
    await page.goto('/?open=cmd');
    const input = page.locator('#cmd-input');
    await input.fill('whoami');
    await input.press('Enter');
    await expect(page.locator('#win-cmd .cmd-out')).toContainText('AI engineer');

    await input.fill('cls');
    await input.press('Enter');
    await expect(page.locator('#win-cmd .cmd-out')).toHaveText('');
  });
});

test.describe('Media Player', () => {
  test('selects a track from the playlist', async ({ page }) => {
    await page.goto('/?open=media');
    const win = page.locator('#win-media');

    await win.locator('.track').nth(4).click();
    await expect(win.locator('[data-title]')).toHaveText('Só Por Uma Noite');
    await expect(win.locator('[data-artist]')).toHaveText('Charlie Brown Jr.');
    await expect(win.locator('[data-idx]')).toHaveText('5');
    await expect(win.locator('.track').nth(4)).toHaveAttribute('aria-current', 'true');
  });

  test('walks the playlist with previous and next', async ({ page }) => {
    await page.goto('/?open=media');
    const win = page.locator('#win-media');

    await win.locator('[data-next]').click();
    await expect(win.locator('[data-title]')).toHaveText('The Diary of Jane');

    await win.locator('[data-prev]').click();
    await expect(win.locator('[data-title]')).toHaveText('Riot');

    // Previous from the first track wraps to the last one.
    await win.locator('[data-prev]').click();
    await expect(win.locator('[data-title]')).toHaveText('Everlong');
    await expect(win.locator('[data-artist]')).toHaveText('Foo Fighters');
  });

  test('toggles play without ever loading audio', async ({ page }) => {
    await page.goto('/?open=media');
    const win = page.locator('#win-media');
    const play = win.locator('[data-play]');

    await expect(play).toHaveAttribute('aria-pressed', 'false');
    await play.click();
    await expect(play).toHaveAttribute('aria-pressed', 'true');
    await expect(play).toHaveAttribute('aria-label', 'Pause');
    await expect(win).toHaveClass(/playing/);

    await play.click();
    await expect(play).toHaveAttribute('aria-pressed', 'false');
    await expect(play).toHaveAttribute('aria-label', 'Play');
    await expect(win).not.toHaveClass(/playing/);

    await expect(page.locator('audio, video, iframe')).toHaveCount(0);
  });
});
