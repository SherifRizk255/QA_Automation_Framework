import 'dotenv/config';
import { test } from '@playwright/test';
import { setupNtlmAuth } from '../../helpers/ntlm.js';
import { SmsLogsPage } from '../../../pages/crm/SmsLogsPage';
import { ROUTES } from '../../../config/resources';

// URL comes from the central resource file — skill 24. Never inline CRM URLs.
const CRM_SMS_LOGS_URL = ROUTES.crm.smsLogs;

// Browser mode (headless: false) and timeout (180_000) are set in the
// 'crm' project in playwright.config.ts — not repeated here.

test.afterEach(async ({ page }) => {
  await page.unrouteAll({ behavior: 'ignoreErrors' });
});

test('TC-CRM-001 | Active SMS Logs page loads', async ({ page }) => {
  const smsLogs = new SmsLogsPage(page);
  await setupNtlmAuth(page);
  await page.goto(CRM_SMS_LOGS_URL, { waitUntil: 'domcontentloaded' });
  await smsLogs.expectActiveSmsLogsLoaded();
});

test('TC-CRM-002 | Open first SMS Log record and validate Message Details section', async ({ page }) => {
  const smsLogs = new SmsLogsPage(page);
  await setupNtlmAuth(page);
  await page.goto(CRM_SMS_LOGS_URL, { waitUntil: 'domcontentloaded' });
  await smsLogs.expectActiveSmsLogsLoaded();
  await smsLogs.openFirstRecord();
  await smsLogs.expectMessageDetailsSectionVisible();
});
