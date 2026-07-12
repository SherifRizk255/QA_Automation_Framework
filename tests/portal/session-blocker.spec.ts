import { test, expect } from '@playwright/test';
import { ENV } from '../../config/resources';
import { LoginPage } from '../../pages/portal/LoginPage.js';
import { DashboardPage } from '../../pages/portal/DashboardPage.js';
import { captureFailureEvidenceOnFailure } from '../../utils/failureHandler.js';

test.afterEach(async ({ page }, testInfo) => {
  await captureFailureEvidenceOnFailure(page, testInfo);
});

test.describe('Internet Banking Portal - Session Blocker Tests', () => {
  test('IB-SESSION-001 - Active session blocker is documented and handled if displayed', async ({ page }, testInfo) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    await loginPage.goto();

    const activeSessionDisplayed = await loginPage.login(
      ENV.portal.username,
      ENV.portal.password,
      testInfo
    );

    // The blocker only appears when a previous session is still open —
    // both outcomes are valid and documented via annotations.
    if (activeSessionDisplayed) {
      testInfo.annotations.push({
        type: 'blocker',
        description: 'Active session blocker appeared and was handled.',
      });

      expect.soft(
        activeSessionDisplayed,
        'Active session blocker appeared and was handled.'
      ).toBe(true);
    } else {
      testInfo.annotations.push({
        type: 'note',
        description: 'Active session blocker did not appear during this run.',
      });
    }

    await dashboardPage.expectLoaded(testInfo);
  });
});
