import 'dotenv/config';
import { test } from '../../../fixtures/frameworkFixtures';
import { setupNtlmAuth } from '../../helpers/ntlm.js';
import { ROUTES } from '../../../config/resources';

// URL comes from the central resource file — skill 24. Never inline CRM URLs.
const CRM_SMS_LOGS_URL = ROUTES.crm.smsLogs;

// Browser mode (headless: false) and timeout (180_000) are set in the
// 'crm' project in playwright.config.ts — not repeated here.

test.afterEach(async ({ page }) => {
  await page.unrouteAll({ behavior: 'ignoreErrors' });
});

test.describe('SMS Logs', { tag: ['@crm', '@sms-logs', '@smoke', '@positive'] }, () => {
  test('TC-CRM-001 | Active SMS Logs page loads', async ({ pom, page }) => {
    await setupNtlmAuth(page);
    await page.goto(CRM_SMS_LOGS_URL, { waitUntil: 'domcontentloaded' });
    await pom.smsLogsPage.expectActiveSmsLogsLoaded();
  });

  test('TC-CRM-002 | Open first SMS Log record and validate Message Details section', async ({ pom, page }) => {
    await setupNtlmAuth(page);
    await page.goto(CRM_SMS_LOGS_URL, { waitUntil: 'domcontentloaded' });
    await pom.smsLogsPage.expectActiveSmsLogsLoaded();
    await pom.smsLogsPage.openFirstRecord();
    await pom.smsLogsPage.expectMessageDetailsSectionVisible();
  });
});
