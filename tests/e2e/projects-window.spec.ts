import { expect, test } from '@playwright/test';

// The explorer window and the static pages must come from the same place:
// src/content/projects. Anything hardcoded in the component drifts.
test('builds the explorer tiles from the content collection', async ({ page }) => {
  await page.goto('/?open=projects');
  const tiles = page.locator('#win-projects .tile');

  await expect(tiles).toHaveCount(3);
  await expect(page.locator('#win-projects .tile[data-program="polaron"]')).toBeVisible();
  await expect(page.locator('#win-projects .tile[data-program="agents"]')).toBeVisible();
  await expect(page.locator('#win-projects .tile[data-program="js-tech-series"]')).toBeVisible();
});

test('shows the tagline each project file declares', async ({ page }) => {
  await page.goto('/?open=projects');

  await expect(page.locator('#win-projects .tile[data-program="js-tech-series"]')).toContainText(
    'Computers that run the logistics',
  );
  await expect(page.locator('#win-projects .tile[data-program="polaron"]')).toContainText(
    'A systems language designed by jvpts11',
  );
});

test('points each tile at its static page', async ({ page }) => {
  await page.goto('/?open=projects');

  for (const id of ['polaron', 'agents', 'js-tech-series']) {
    await expect(page.locator(`#win-projects .tile[data-program="${id}"]`)).toHaveAttribute(
      'data-page',
      `/projects/${id}/`,
    );
  }
});

test('offers the project page from the details panel', async ({ page }) => {
  await page.goto('/?open=projects');
  await page.locator('#win-projects .tile[data-program="agents"]').click();

  const details = page.locator('#win-projects [data-details]');
  await expect(details).toContainText('agents.exe');
  await expect(details.locator('a[href="/projects/agents/"]')).toBeVisible();
});

test('counts the objects in the status bar from the collection', async ({ page }) => {
  await page.goto('/?open=projects');
  await expect(page.locator('#win-projects .statusbar')).toContainText('3 objects');
});
