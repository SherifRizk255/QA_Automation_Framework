import { test } from '../../../../fixtures/frameworkFixtures';
import { ENV } from '../../../../config/resources';
import { captureFailureEvidenceOnFailure } from '../../../../utils/failureHandler.js';

test.afterEach(async ({ page }, testInfo) => {
  await captureFailureEvidenceOnFailure(page, testInfo);
});

test.describe('Internet Banking Portal - Credentials Login Tests', { tag: ['@portal', '@authentication', '@regression'] }, () => {
  test('SAIB-0209 - Valid username and valid password logs in on web', { tag: ['@positive'] }, async ({ pom }, testInfo) => {
    await pom.loginPage.goto();
    const activeSessionDisplayed = await pom.loginPage.login(
      ENV.portal.username,
      ENV.portal.password,
      testInfo
    );

    console.log(`[SAIB-0209] Active session blocker displayed: ${activeSessionDisplayed}`);
    await pom.dashboardPage.expectLoaded(testInfo);
  });

  test.skip(
    'SAIB-0212 - Non-existing username with any password requires approved negative test data and audit evidence',
    async () => {}
  );

  test.skip(
    'SAIB-0214 - Valid username with invalid password requires approved negative test data and audit evidence',
    async () => {}
  );

  test('SAIB-0217 - Empty username with provided password remains on login page', { tag: ['@negative'] }, async ({ pom }) => {
    await pom.loginPage.goto();
    await pom.loginPage.attemptLogin('', ENV.portal.password);
    await pom.loginPage.expectUsernameRequiredValidation();
  });

  test('SAIB-0218 - Empty username and password remain on login page', { tag: ['@negative'] }, async ({ pom }) => {
    await pom.loginPage.goto();
    await pom.loginPage.attemptLogin('', '');
    await pom.loginPage.expectCredentialsRequiredValidation();
  });
});
