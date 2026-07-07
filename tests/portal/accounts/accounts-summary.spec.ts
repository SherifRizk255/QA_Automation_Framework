import { test } from '@playwright/test';
import { ENV } from '../../../config/resources';
import { LoginPage } from '../../../pages/portal/LoginPage.js';
import { DashboardPage } from '../../../pages/portal/DashboardPage.js';
import { AccountsSummaryPage } from '../../../pages/portal/accounts/AccountsSummaryPage.ts';
import { handleFailureEvidence } from '../../../utils/failureHandler.js';

test.describe('Accounts Management - Account Summary', () => {
  test('AM-TC-001/002/003 - Accounts summary displays linked accounts with identifiers and balances', async ({ page }, testInfo) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    const accountsSummaryPage = new AccountsSummaryPage(page);

    try {
      await loginPage.goto();
      await loginPage.login(ENV.portal.username, ENV.portal.password, testInfo);
      await dashboardPage.expectLoaded(testInfo);
      await accountsSummaryPage.goto(testInfo);
      await accountsSummaryPage.expectSummaryControlsVisible();
      await accountsSummaryPage.expectVisibleAccountsHaveIdentifiersAndBalances();
      await accountsSummaryPage.expectLoadMoreIfPresent();
    } catch (error) {
      await handleFailureEvidence(page, testInfo, 'AM-TC-001-accounts-summary');
      throw error;
    }
  });
});
