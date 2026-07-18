import 'dotenv/config';
import { test } from '@playwright/test';
import { setupNtlmAuth } from '../../helpers/ntlm.js';
import { SmsLogsPage } from '../../../pages/crm/common-crm-entities/SmsLogsPage.js';
import * as allure from 'allure-js-commons';

// Browser mode (headless: false) and timeout (180_000) are set in the
// 'crm' project in playwright.config.ts — not repeated here.

test.afterEach(async ({ page }) => {
  await page.unrouteAll({ behavior: 'ignoreErrors' });
});

test('TC-CRM-001 | Active SMS Logs page loads', async ({ page }) => {
  await allure.feature('SMS Logs');
  await allure.story('CRM SMS Logs Grid');
  await allure.severity('normal');

  const smsLogs = new SmsLogsPage(page);
  await setupNtlmAuth(page);
  await smsLogs.navigateToSmsLogs();
  await smsLogs.assertActiveSmsLogsLoaded();
});

test('TC-CRM-002 | Open latest SMS Log record and validate Message Details section', async ({ page }) => {
  await allure.feature('SMS Logs');
  await allure.story('CRM SMS Log Record');
  await allure.severity('normal');

  const smsLogs = new SmsLogsPage(page);
  await setupNtlmAuth(page);
  await smsLogs.navigateToSmsLogs();
  await smsLogs.openLatestLogRecord();
  await smsLogs.assertMessageDetailsSectionVisible();
});
