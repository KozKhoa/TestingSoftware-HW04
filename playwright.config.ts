import { defineConfig, devices } from '@playwright/test';

const studentId = process.env.STUDENT_ID || '23120285';
const runTimestamp = process.env.RUN_TIMESTAMP || new Date().toISOString();
const reportDir = process.env.REPORT_DIR || 'reports/all-browsers';
const featureTag = process.env.REPORT_FEATURE || 'All Features (FR-01, FR-07, FR-18)';
const browserTag = process.env.REPORT_BROWSER || 'All Browsers (Chromium, Firefox, WebKit)';
const webkitWsEndpoint = process.env.WEBKIT_WS_ENDPOINT;

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  timeout: 20000,
  expect: {
    timeout: 2500,
  },
  metadata: {
    runBy: `Run by: ${studentId}`,
    studentId,
    timestamp: runTimestamp,
    feature: featureTag,
    browser: browserTag,
  },
  reporter: [
    ['list'],
    [
      'html',
      {
        outputFolder: reportDir,
        open: 'never',
        title: `HW04 Automation Report — Run by: ${studentId} (${runTimestamp})`,
      },
    ],
  ],
  use: {
    baseURL: process.env.WEB_BASE_URL || 'http://localhost:5173',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'off',
    viewport: { width: 1280, height: 800 },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        ...(webkitWsEndpoint
          ? {
              connectOptions: {
                wsEndpoint: webkitWsEndpoint,
              },
            }
          : {}),
      },
    },
  ],
});
