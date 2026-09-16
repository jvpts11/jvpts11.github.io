import { defineConfig, devices } from '@playwright/test';

// Node's globals are not typed here on purpose: @types/node is not a dependency
// of this project, and this config is the only file that needs `process`.
declare const process: { env: Record<string, string | undefined> };

const isCI = Boolean(process.env.CI);

// No `webServer` block here. Astro 7 detaches `astro preview` into a background
// process when it runs without a TTY, so the foreground command exits right away
// and Playwright reads that as "the server died". The `test:e2e` script starts the
// preview server with `astro preview --background` first and these tests just
// connect to it; `npm run preview:stop` shuts it down.
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4321/',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
