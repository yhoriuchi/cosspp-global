import { defineConfig, devices } from '@playwright/test';
const basePath = process.env.PLAYWRIGHT_BASE_PATH || '/cosspp-global/';
const chromiumLaunchOptions = process.env.PLAYWRIGHT_CHROME_PATH
  ? { executablePath: process.env.PLAYWRIGHT_CHROME_PATH }
  : {};
export default defineConfig({
  testDir: './tests/browser',
  outputDir: process.env.PLAYWRIGHT_OUTPUT_DIR || 'test-results',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: `http://127.0.0.1:4173${basePath}`,
    trace: 'retain-on-failure',
  },
  webServer: {
    command:
      `node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4173 --strictPort --base ${basePath}`,
    url: `http://127.0.0.1:4173${basePath}`,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 1000 },
        launchOptions: chromiumLaunchOptions,
      },
    },
    {
      name: 'mobile',
      use: {
        ...devices['iPhone 13'],
        defaultBrowserType: 'chromium',
        launchOptions: chromiumLaunchOptions,
      },
    },
    { name: 'mobile-safari', use: { ...devices['iPhone 13'] } },
  ],
});
