import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
  },
  // Explicit rather than Playwright's CPU-based default — keeps load on the
  // local dev server/DB predictable. CI overrides this via `--workers=`
  // (see .github/workflows/playwright.yaml), so this is only the local/default value.
  workers: process.env.CI ? 2 : 4,
  reporter: [
    ['list'],
    // 'always' only opens a browser tab on a local machine — the reporter
    // itself skips auto-launching in CI (process.env.CI), so this has no
    // effect on the GitHub Actions run.
    ['html', { open: 'always' }],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  projects: [
    // Authenticates once as the seeded admin and writes the token to
    // playwright/.auth/admin.json — see tests/auth.setup.ts. The
    // adminAccessToken fixture reads that file instead of re-authenticating
    // on every test (falls back to a live login if the cache is missing or
    // close to expiring).
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'api',
      testMatch: /.*\.spec\.ts/,
      dependencies: ['setup'],
    },
  ],
});
