import 'dotenv/config';
import { test, expect } from '@playwright/test';
import { setupNtlmAuth } from './helpers/ntlm.js';

const CRM_SMS_LOGS_URL =
  'https://crm.cubicsystems.com/SaibUAT/main.aspx?appid=c6546de1-f7f5-f011-a74c-000c290f08a3&pagetype=entitylist&etn=cis_smslog&viewid=4111affe-b728-482e-b44f-540508c30c3b&viewType=1039';

test.use({ headless: false });

test('TC-CRM-001 | Active SMS Logs page loads', async ({ page }) => {
  test.setTimeout(120_000);
  await setupNtlmAuth(page);
  await page.goto(CRM_SMS_LOGS_URL, { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Active SMS Logs')).toBeVisible({ timeout: 60_000 });
});

test('TC-CRM-002 | Open first SMS Log record and validate Message Details section', async ({ page }) => {
  test.setTimeout(180_000);
  await setupNtlmAuth(page);
  await page.goto(CRM_SMS_LOGS_URL, { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Active SMS Logs')).toBeVisible({ timeout: 60_000 });

  await page.locator('[aria-label="Select row 2"]').dblclick();
  await expect(page.getByText('Message Details')).toBeVisible({ timeout: 90_000 });
});
