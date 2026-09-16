import { expect, test } from '@playwright/test';

// Every project also has a real page, crawlable and readable without the
// desktop. The slugs match the program ids the ?open= deep link uses.
const PROJECTS = [
  { slug: 'polaron', title: 'Polaron', repo: 'https://github.com/jvpts11/Polaron' },
  { slug: 'forge-ide', title: 'Forge', repo: 'https://github.com/jvpts11/Forge-IDE' },
  { slug: 'agents', title: 'agents.exe', repo: 'https://github.com/jvpts11/agents-exe' },
  {
    slug: 'js-tech-series',
    title: 'js-tech-series',
    repo: 'https://github.com/jvpts11/js-tech-series',
  },
];

for (const project of PROJECTS) {
  test(`serves a static page for ${project.slug}`, async ({ page }) => {
    const response = await page.goto(`/projects/${project.slug}/`);
    expect(response?.status()).toBe(200);

    await expect(page.locator('h1')).toContainText(project.title);
    await expect(page.locator(`a[href="${project.repo}"]`)).toBeVisible();
    await expect(page).toHaveTitle(new RegExp(project.title.replace('.', '\\.')));
  });

  test(`lets ${project.slug} walk back to the desktop`, async ({ page }) => {
    await page.goto(`/projects/${project.slug}/`);
    await page.locator(`a[href="/?open=${project.slug}"]`).click();
    await expect(page.locator(`#win-${project.slug}`)).toBeVisible();
  });
}

test('lists every project on an index page', async ({ page }) => {
  const response = await page.goto('/projects/');
  expect(response?.status()).toBe(200);

  for (const project of PROJECTS) {
    await expect(page.locator(`a[href="/projects/${project.slug}/"]`)).toBeVisible();
  }
});

test('reads without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/projects/polaron/');

  await expect(page.locator('h1')).toContainText('Polaron');
  await expect(page.locator('a[href="https://github.com/jvpts11/Polaron"]')).toBeVisible();
  await context.close();
});
