import { expect, test } from '@playwright/test';

const SITE = 'https://jvpts11.github.io';

test('serves robots.txt and points it at the sitemap', async ({ request }) => {
  const response = await request.get('/robots.txt');
  expect(response.status()).toBe(200);

  const body = await response.text();
  expect(body).toContain('User-agent: *');
  expect(body).toContain(`Sitemap: ${SITE}/sitemap-index.xml`);
});

test('serves a sitemap that lists every page', async ({ request }) => {
  const index = await request.get('/sitemap-index.xml');
  expect(index.status()).toBe(200);
  expect(await index.text()).toContain('sitemap-0.xml');

  const sitemap = await request.get('/sitemap-0.xml');
  expect(sitemap.status()).toBe(200);

  const body = await sitemap.text();
  for (const path of ['/', '/projects/', '/projects/polaron/', '/projects/agents/', '/projects/js-tech-series/']) {
    expect(body).toContain(`${SITE}${path}`);
  }
});
