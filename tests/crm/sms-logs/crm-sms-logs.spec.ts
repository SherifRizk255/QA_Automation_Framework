import 'dotenv/config';
import { test } from '@playwright/test';
import { setupNtlmAuth } from '../../helpers/ntlm.js';
import { SmsLogsPage } from '../../../pages/crm/SmsLogsPage';

const CRM_SMS_LOGS_URL =
  'https://crm.cubicsystems.com/SaibUAT/main.aspx?appid=c6546de1-f7f5-f011-a74c-000c290f08a3&pagetype=entitylist&etn=cis_smslog&viewid=4111affe-b728-482e-b44f-540508c30c3b&viewType=1039';

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
