import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration
 * Version: 1.0.0
 * Date: 2025-12-15
 */

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:4173/ValueScope/',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:4173/ValueScope/',
    reuseExistingServer: !process.env.CI,
  },
});
