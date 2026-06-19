import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/portal/LoginPage.js';
import { DashboardPage } from '../../pages/portal/DashboardPage.js';
import { handleFailureEvidence } from '../../utils/failureHandler.js';

test.describe('Internet Banking Portal - Credentials Login Tests', () => {
  test('SAIB-0209 - Valid username and valid password logs in on web', async ({ page }, testInfo) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    try {
      await loginPage.goto();
      const activeSessionDisplayed = await loginPage.login(
        process.env.PORTAL_USERNAME,
        process.env.PORTAL_PASSWORD,
        testInfo
      );

      console.log(`[SAIB-0209] Active session blocker displayed: ${activeSessionDisplayed}`);
      await dashboardPage.expectLoaded(testInfo);
    } catch (error) {
      await handleFailureEvidence(page, testInfo, 'SAIB-0209-valid-credentials-login');
      throw error;
    }
  });

  test.skip(
    'SAIB-0212 - Non-existing username with any password requires approved negative test data and audit evidence',
    async () => {}
  );

  test.skip(
    'SAIB-0214 - Valid username with invalid password requires approved negative test data and audit evidence',
    async () => {}
  );

  test('SAIB-0217 - Empty username with provided password remains on login page', async ({
    page,
  }, testInfo) => {
    const loginPage = new LoginPage(page);

    try {
      await loginPage.goto();
      await loginPage.attemptLogin('', process.env.PORTAL_PASSWORD);
      await loginPage.expectUsernameRequiredValidation();
    } catch (error) {
      await handleFailureEvidence(page, testInfo, 'SAIB-0217-empty-username-required-validation');
      throw error;
    }
  });

  test('SAIB-0218 - Empty username and password remain on login page', async ({ page }, testInfo) => {
    const loginPage = new LoginPage(page);

    try {
      await loginPage.goto();
      await loginPage.attemptLogin('', '');
      await loginPage.expectCredentialsRequiredValidation();
    } catch (error) {
      await handleFailureEvidence(page, testInfo, 'SAIB-0218-empty-credentials-required-validation');
      throw error;
    }
  });
});
