import 'dotenv/config';
import { test } from '@playwright/test';
import { setupNtlmAuth } from '../../helpers/ntlm.js';
import { ServiceRequestsPage } from '../../../pages/crm/ServiceRequestsPage';
import { ROUTES } from '../../../config/resources';

// Standalone — run in isolation with:
// npx playwright test servicerequest.spec.ts --project=crm

// URL comes from the central resource file — skill 24. Never inline CRM URLs.
const CRM_SERVICE_REQUESTS_URL = ROUTES.crm.serviceRequests;

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
