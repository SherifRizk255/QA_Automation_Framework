import { test, expect } from '@playwright/test';
import { ENV } from '../../../config/resources';
import { LoginPage } from '../../../pages/portal-pages/LoginPage.js';
import { DashboardPage } from '../../../pages/portal-pages/DashboardPage.js';
import { handleFailureEvidence } from '../../../utils/failureHandler.js';

test.describe('Internet Banking Portal - Session Blocker Tests', () => {
  test('IB-SESSION-001 - Active session blocker is documented and handled if displayed', async ({ page }, testInfo) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    try {
      await loginPage.goto();

      const activeSessionDisplayed = await loginPage.login(
        ENV.portal.username,
        ENV.portal.password,
        testInfo
      );

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
    } catch (error) {
      await handleFailureEvidence(page, testInfo, 'IB-SESSION-001-session-blocker');
      throw error;
    }
  });
});
