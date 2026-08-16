import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
  },
  workers: process.env.CI ? 2 : 4,
  outputDir: 'tests/test-results',
  reporter: [
    ['list'],
    ['html', { open: 'always', outputFolder: 'tests/playwright-report' }],
    ['json', { outputFile: 'tests/test-results/results.json' }],
  ],
  projects: [
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
