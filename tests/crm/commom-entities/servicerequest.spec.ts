import 'dotenv/config';
import { test } from '@playwright/test';
import { setupNtlmAuth } from '../../helpers/ntlm.js';
import { ServiceRequestsPage } from '../../../pages/crm/common-crm-entities/ServiceRequestsPage.js';


// npx playwright test servicerequest.spec.ts --project=crm

const CRM_SERVICE_REQUESTS_URL =
  'https://crm.cubicsystems.com/SaibUAT/main.aspx?appid=c6546de1-f7f5-f011-a74c-000c290f08a3&pagetype=entitylist&etn=cis_servicerequest&viewType=1039';

test.afterEach(async ({ page }) => {
  await page.unrouteAll({ behavior: 'ignoreErrors' });
});

test.describe('Service Requests', () => {

  test('TC-CRM-004 | First service request record contains correct fields and Submitted status', async ({ page }) => {
    const serviceRequests = new ServiceRequestsPage(page);

    await setupNtlmAuth(page);
    await page.goto(CRM_SERVICE_REQUESTS_URL, { waitUntil: 'domcontentloaded' });

    await serviceRequests.openFirstRecord();
    await serviceRequests.assertFirstRecordFields();
  });

});
