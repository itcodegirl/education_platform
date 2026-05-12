import { defineConfig, devices } from '@playwright/test';

const playwrightPort = process.env.PLAYWRIGHT_PORT || '4319';
const baseURL = process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${playwrightPort}`;
const useManagedDevServer = !process.env.PLAYWRIGHT_BASE_URL;
const publicProjectIgnore = [
  /.*authenticated\..*\.spec\.js/,
  /.*lesson-flow\.spec\.js/,
  /.*mobile-learning-smoke\.spec\.js/,
];

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : 2,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'setup-auth',
      testMatch: /.*authenticated\.setup\.spec\.js/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium',
      testIgnore: publicProjectIgnore,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      testIgnore: publicProjectIgnore,
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'authenticated-chromium',
      testMatch: [
        /.*authenticated\.(accessibility|smoke|visual)\.spec\.js/,
        /.*lesson-flow\.spec\.js/,
      ],
      dependencies: ['setup-auth'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
    },
    {
      name: 'authenticated-mobile-chrome',
      testMatch: /.*mobile-learning-smoke\.spec\.js/,
      dependencies: ['setup-auth'],
      use: {
        ...devices['Pixel 7'],
        storageState: 'playwright/.auth/user.json',
      },
    },
  ],
  webServer: useManagedDevServer
    ? {
      command: `npm run dev -- --host 127.0.0.1 --port ${playwrightPort}`,
      url: baseURL,
      // Always boot this repo's dev server for Playwright runs.
      // Reusing an existing process can attach to unrelated local apps
      // that happen to use the same port and cause false failures.
      reuseExistingServer: false,
      timeout: 120000,
      env: {
        ...process.env,
        VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321',
        VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || 'example-anon-key',
      },
    }
    : undefined,
});
