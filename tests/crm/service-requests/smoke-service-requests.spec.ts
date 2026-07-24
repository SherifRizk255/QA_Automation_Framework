import 'dotenv/config';
import { test } from '../../../fixtures/frameworkFixtures';
import { setupNtlmAuth } from '../../helpers/ntlm.js';
import { ROUTES } from '../../../config/resources';

// URL comes from the central resource file — skill 24. Never inline CRM URLs.
const CRM_SERVICE_REQUESTS_URL = ROUTES.crm.serviceRequests;

test.afterEach(async ({ page }) => {
  await page.unrouteAll({ behavior: 'ignoreErrors' });
});

test.describe('Service Requests', { tag: ['@crm', '@service-requests', '@smoke', '@positive'] }, () => {

  test('TC-CRM-004 | First service request record contains correct fields and Submitted status', async ({ pom, page }) => {
    await setupNtlmAuth(page);
    await page.goto(CRM_SERVICE_REQUESTS_URL, { waitUntil: 'domcontentloaded' });

    await pom.serviceRequestsPage.openFirstRecord();
    await pom.serviceRequestsPage.assertFirstRecordFields();
  });

});
