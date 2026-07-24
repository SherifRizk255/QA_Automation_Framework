import { test } from '../../../../fixtures/frameworkFixtures';

test.describe('Internet Banking Portal - Smoke Tests', { tag: ['@portal', '@authentication', '@smoke', '@positive'] }, () => {
  test('IB-PORTAL-SMOKE-001 - Login page should load successfully', async ({ pom }) => {
    await pom.loginPage.goto();
    await pom.loginPage.expectLoginPageLoaded();
  });
});
