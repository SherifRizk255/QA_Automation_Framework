import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  testDir: './tests',

  timeout: 60_000,

  // Default assertion timeout for every expect() — call sites stay clean and
  // only genuinely slower operations (D365 grids, transfer success dialog)
  // override it with a justifying comment (skill 23).
  expect: {
    timeout: 30_000,
  },

  fullyParallel: false,

  forbidOnly: !!process.env.CI,

  retries: process.env.CI ? 2 : 0,

  workers: 1,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
    // Skill 21 — machine-consumable results for the Final Report Agent.
    ['allure-playwright', { resultsDir: 'allure-results' }],
    // Skill 25 — Cubic-branded stakeholder HTML report, generated after every run.
    ['./utils/cubicHtmlReporter.ts']
  ],

  use: {
    baseURL: process.env.PORTAL_BASE_URL,

    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    actionTimeout: 20000,
    navigationTimeout: 60000,

    ignoreHTTPSErrors: true,

    // Maximize browser windows (skill 13, mandatory rule).
    // viewport: null disables Playwright's forced 1280×720 clamp so the page fills
    // the whole window. --start-maximized opens a maximized window in headed runs;
    // --window-size=1920,1080 is the headless/CI fallback (where --start-maximized is a
    // no-op) — it also stops the 800×600 default collapsing the portal navbar into a
    // hamburger menu, which hides the nav links. Any context a test opens must repeat
    // viewport: null so secondary windows (e.g. the CRM window) maximize too.
    viewport: null,
    launchOptions: {
      timeout: 30_000,
      args: ['--start-maximized', '--window-size=1920,1080'],
    },
  },

  projects: [
    {
      // Portal tests — headless, 60 s default timeout (from root config).
      // Explicitly excludes CRM specs so the browser never switches
      // headless mode mid-run, which would orphan the previous instance.
      name: 'chromium',
      testIgnore: 'crm/**',
      use: {
        browserName: 'chromium',
      },
    },
    {
      // CRM tests — non-headless (NTLM auth requires visible session),
      // isolated into their own project so the browser is launched once
      // in the correct mode and torn down cleanly after all CRM tests.
      name: 'crm',
      testMatch: 'crm/**',
      timeout: 180_000,
      use: {
        browserName: 'chromium',
        headless: false,
      },
    },
  ],
});
