import { test } from '@playwright/test';
import { ENV } from '../../config/resources';
import { LoginPage } from '../../pages/portal/LoginPage.js';
import { DashboardPage } from '../../pages/portal/DashboardPage.js';
import { captureFailureEvidenceOnFailure } from '../../utils/failureHandler.js';

test.afterEach(async ({ page }, testInfo) => {
  await captureFailureEvidenceOnFailure(page, testInfo);
});

test.describe('Internet Banking Portal - Credentials Login Tests', () => {
  test('SAIB-0209 - Valid username and valid password logs in on web', async ({ page }, testInfo) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    await loginPage.goto();
    const activeSessionDisplayed = await loginPage.login(
      ENV.portal.username,
      ENV.portal.password,
      testInfo
    );

    console.log(`[SAIB-0209] Active session blocker displayed: ${activeSessionDisplayed}`);
    await dashboardPage.expectLoaded(testInfo);
  });

  test.skip(
    'SAIB-0212 - Non-existing username with any password requires approved negative test data and audit evidence',
    async () => {}
  );

  test.skip(
    'SAIB-0214 - Valid username with invalid password requires approved negative test data and audit evidence',
    async () => {}
  );

  test('SAIB-0217 - Empty username with provided password remains on login page', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.attemptLogin('', ENV.portal.password);
    await loginPage.expectUsernameRequiredValidation();
  });

  test('SAIB-0218 - Empty username and password remain on login page', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.attemptLogin('', '');
    await loginPage.expectCredentialsRequiredValidation();
  });
});
