import { test, expect } from '@playwright/test';
import { ENV } from '../../../config/resources';
import { LoginPage } from '../../../pages/portal/LoginPage.js';
import { DashboardPage } from '../../../pages/portal/DashboardPage.js';
import { handleFailureEvidence } from '../../../utils/failureHandler.js';

test.describe('Internet Banking Portal - Login Tests', () => {
  test('IB-LOGIN-001 - Login page opens successfully', async ({ page }, testInfo) => {
    const loginPage = new LoginPage(page);

    try {
      await loginPage.goto();
      await loginPage.expectLoginPageLoaded();
    } catch (error) {
      await handleFailureEvidence(page, testInfo, 'IB-LOGIN-001-login-page');
      throw error;
    }
  });

  test('IB-LOGIN-002 - Valid user login reaches dashboard after blocker handling', async ({ page }, testInfo) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    try {
      await loginPage.goto();
      const activeSessionDisplayed = await loginPage.login(
        ENV.portal.username,
        ENV.portal.password,
        testInfo
      );

      console.log(`[IB-LOGIN-002] Active session blocker displayed: ${activeSessionDisplayed}`);
      await dashboardPage.expectLoaded(testInfo);
    } catch (error) {
      await handleFailureEvidence(page, testInfo, 'IB-LOGIN-002-valid-login');
      throw error;
    }
  });
});
