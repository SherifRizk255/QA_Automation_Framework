import { test } from '../../../../fixtures/frameworkFixtures';
import { ENV } from '../../../../config/resources';
import { captureFailureEvidenceOnFailure } from '../../../../utils/failureHandler.js';

test.afterEach(async ({ page }, testInfo) => {
  await captureFailureEvidenceOnFailure(page, testInfo);
});

test.describe('Internet Banking Portal - Login Tests', { tag: ['@portal', '@authentication', '@regression'] }, () => {
  test('IB-LOGIN-001 - Login page opens successfully', { tag: ['@positive'] }, async ({ pom }) => {
    await pom.loginPage.goto();
    await pom.loginPage.expectLoginPageLoaded();
  });

  test('IB-LOGIN-002 - Valid user login reaches dashboard after blocker handling', { tag: ['@positive'] }, async ({ pom }, testInfo) => {
    await pom.loginPage.goto();
    const activeSessionDisplayed = await pom.loginPage.login(
      ENV.portal.username,
      ENV.portal.password,
      testInfo
    );

    console.log(`[IB-LOGIN-002] Active session blocker displayed: ${activeSessionDisplayed}`);
    await pom.dashboardPage.expectLoaded(testInfo);
  });
});
