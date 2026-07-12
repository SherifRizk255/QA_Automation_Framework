import { test } from '@playwright/test';
import { ENV } from '../../config/resources';
import { LoginPage } from '../../pages/portal/LoginPage.js';
import { DashboardPage } from '../../pages/portal/DashboardPage.js';
import { captureFailureEvidenceOnFailure } from '../../utils/failureHandler.js';

test.afterEach(async ({ page }, testInfo) => {
  await captureFailureEvidenceOnFailure(page, testInfo);
});

test.describe('Internet Banking Portal - Login Tests', () => {
  test('IB-LOGIN-001 - Login page opens successfully', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.expectLoginPageLoaded();
  });

  test('IB-LOGIN-002 - Valid user login reaches dashboard after blocker handling', async ({ page }, testInfo) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    await loginPage.goto();
    const activeSessionDisplayed = await loginPage.login(
      ENV.portal.username,
      ENV.portal.password,
      testInfo
    );

    console.log(`[IB-LOGIN-002] Active session blocker displayed: ${activeSessionDisplayed}`);
    await dashboardPage.expectLoaded(testInfo);
  });
});
